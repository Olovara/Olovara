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
    // Set request timeout (30 seconds - reduced from 60 to prevent client timeouts)
    req.setTimeout(30000, () => {
      if (!res.headersSent) {
        res.statusCode = 408;
        res.end('Request Timeout');
      }
      req.destroy();
    });

    // Set response timeout to prevent hanging connections
    res.setTimeout(30000, () => {
      if (!res.headersSent) {
        res.statusCode = 504;
        res.end('Gateway Timeout');
      }
    });

    // Handle connection errors - these are SYMPTOMS of underlying issues
    // Log them to track when they occur (they indicate server action failures or slow responses)
    req.on('error', (error) => {
      // Log connection errors that indicate problems (not just normal disconnects)
      if (error.code === 'ERR_HTTP_REQUEST_TIMEOUT') {
        console.warn(`[TIMEOUT] Request to ${req.url} timed out - server too slow`);
      } else if (error.code === 'HPE_INVALID_EOF_STATE') {
        // This often happens when server actions fail and client disconnects
        console.warn(`[PARSE_ERROR] Parse error on ${req.url} - possible server action failure`);
      } else if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE') {
        // ECONNRESET/EPIPE are normal client disconnects, but log others
        console.error('Request error:', error);
      }
    });

    res.on('error', (error) => {
      // Log response errors that indicate problems
      if (error.code === 'ERR_HTTP_REQUEST_TIMEOUT') {
        console.warn(`[TIMEOUT] Response for ${req.url} timed out - server too slow`);
      } else if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE') {
        console.error('Response error:', error);
      }
    });

    // Handle client disconnect gracefully
    req.on('close', () => {
      if (!res.headersSent && !res.writableEnded) {
        res.destroy();
      }
    });

    try {
      // CRITICAL: Server actions MUST be handled by Next.js handler directly
      // They use routes like /_next/server-actions/[actionId] and need proper routing
      // Don't interfere with Next.js internal routes - let Next.js handle everything
      await handler(req, res);
    } catch (error) {
      // These errors are SYMPTOMS - they happen when:
      // 1. Server actions fail (causing clients to disconnect)
      // 2. Server is too slow (causing timeouts)
      // 3. Build ID mismatch (causing server action registry errors)
      
      if (error?.code === 'ERR_HTTP_REQUEST_TIMEOUT') {
        console.error(`[CRITICAL] Request to ${req.url} timed out - server performance issue`);
        if (!res.headersSent) {
          res.statusCode = 504;
          res.end('Gateway Timeout');
        }
        return;
      }
      
      // HPE_INVALID_EOF_STATE often indicates server action failure
      if (error?.code === 'HPE_INVALID_EOF_STATE') {
        console.error(`[CRITICAL] Parse error on ${req.url} - likely server action failure or build mismatch`);
        // Don't return silently - this indicates a real problem
      }
      
      // Log all errors except normal client disconnects
      if (error?.code !== 'ECONNRESET' && error?.code !== 'EPIPE') {
        console.error(`[ERROR] Error handling request to ${req.url}:`, error);
      }
      
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  });

  // Handle server-level connection errors
  httpServer.on('clientError', (err, socket) => {
    // Log errors that indicate problems (not just normal disconnects)
    if (err.code === 'HPE_INVALID_EOF_STATE') {
      console.error('[CRITICAL] Client parse error - possible server action/build mismatch');
    } else if (err.code !== 'ECONNRESET' && err.code !== 'EPIPE') {
      console.error('Client error:', err);
    }
    
    // Only send error response if socket is still writable
    if (!socket.destroyed && socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
  });

  httpServer
    .once("error", (err) => {
      // Only exit on critical errors, not connection resets
      if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
        return;
      }
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on ${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${hostname}:${port}`);
      console.log(`> Socket.IO server is running on the same port`);
    });
});
