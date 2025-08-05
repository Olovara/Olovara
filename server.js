// server.js using CommonJS
const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

let onlineUsers = [];
const prisma = new PrismaClient();

const addUser = (userId, socketId) => {
  console.log("Adding user:", { userId, socketId });
  const isExist = onlineUsers.find((user) => user.socketId === socketId);
  if (!isExist) {
    onlineUsers.push({ userId, socketId });
    console.log("User added successfully. Current online users:", onlineUsers);
  } else {
    console.log("User already exists:", userId);
  }
};

const removeUser = (socketId) => {
  console.log("Removing user with socketId:", socketId);
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
  console.log("User removed. Remaining online users:", onlineUsers);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

// Function to emit session update to a specific user
const emitSessionUpdate = (userId, updatedBy, reason) => {
  const userSocket = getUser(userId);
  if (userSocket) {
    io.to(userSocket.socketId).emit("sessionUpdated", {
      message: "Your session has been updated. Please refresh to see changes.",
      updatedBy,
      reason,
      timestamp: new Date().toISOString()
    });
    console.log(`Session update sent to user ${userId}`);
    return true;
  } else {
    console.log(`User ${userId} is not currently online`);
    return false;
  }
};

// Make the function available globally for other parts of the app
global.emitSessionUpdate = emitSessionUpdate;

app.prepare().then(() => {
  const httpServer = createServer();
  
  // Configure Socket.IO with CORS and secure options
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? `https://${process.env.HOSTNAME}`
        : "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  // Handle Socket.IO connections
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("newUser", (userId) => {
      console.log("Received newUser event:", { userId, socketId: socket.id });
      addUser(userId, socket.id);
      console.log("Broadcasting updated online users:", onlineUsers);
      io.emit("getOnlineUsers", onlineUsers);
    });

    socket.on("sendMessage", async ({ senderId, conversationId, content }) => {
      console.log("Received message:", { senderId, conversationId, content });
      try {
        // Get sender details
        const sender = await prisma.user.findUnique({
          where: { id: senderId },
          select: { id: true, email: true, username: true },
        });

        if (!sender) {
          console.error("Sender not found");
          return;
        }

        // Create message in database first
        const message = await prisma.message.create({
          data: {
            content,
            conversation: {
              connect: {
                id: conversationId
              }
            },
            sender: {
              connect: {
                id: senderId
              }
            }
          },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          }
        });

        console.log("Created message:", message);

        // Update conversation's updatedAt timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        });

        // Get all users in the conversation
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            users: {
              select: {
                userId: true
              }
            }
          }
        });

        if (!conversation) {
          console.error("Conversation not found");
          return;
        }

        // Send message to all users in the conversation
        conversation.users.forEach(user => {
          const userSocket = onlineUsers.find(u => u.userId === user.userId);
          if (userSocket) {
            io.to(userSocket.socketId).emit("newMessage", {
              id: message.id,
              content: message.content,
              sender: message.sender.username || message.sender.email || "Unknown User",
              senderId: message.sender.id,
              createdAt: message.createdAt,
              conversationId: conversationId
            });
          }
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    // Handle session updates for role/permission changes
    socket.on("sessionUpdate", async ({ userId, updatedBy, reason }) => {
      console.log("Session update requested:", { userId, updatedBy, reason });
      
      try {
        // Find the user's socket connection
        const userSocket = onlineUsers.find(u => u.userId === userId);
        
        if (userSocket) {
          // Send session update notification to the specific user
          io.to(userSocket.socketId).emit("sessionUpdated", {
            message: "Your session has been updated. Please refresh to see changes.",
            updatedBy,
            reason,
            timestamp: new Date().toISOString()
          });
          
          console.log(`Session update sent to user ${userId}`);
        } else {
          console.log(`User ${userId} is not currently online`);
        }
      } catch (error) {
        console.error("Error sending session update:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      removeUser(socket.id);
      io.emit("getOnlineUsers", onlineUsers);
    });
  });

  // Handle all other requests with Next.js
  httpServer.on('request', async (req, res) => {
    try {
      // Ensure proper handling of static files in development
      if (dev && req.url && req.url.startsWith('/_next/static/')) {
        // Let Next.js handle static files directly
        await handler(req, res);
        return;
      }
      
      await handler(req, res);
    } catch (error) {
      console.error('Error handling request:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on ${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${hostname}:${port}`);
      console.log(`> Socket.IO server is running on the same port`);
    });
});
