// server.js using CommonJS
const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

let onlineUsers = [];
const prisma = new PrismaClient();

const addUser = (username, socketId) => {
  console.log("Adding user:", { username, socketId });
  const isExist = onlineUsers.find((user) => user.socketId === socketId);
  if (!isExist) {
    onlineUsers.push({ username, socketId });
    console.log("User added successfully. Current online users:", onlineUsers);
  } else {
    console.log("User already exists:", username);
  }
};

const removeUser = (socketId) => {
  console.log("Removing user with socketId:", socketId);
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
  console.log("User removed. Remaining online users:", onlineUsers);
};

const getUser = (username) => {
  return onlineUsers.find((user) => user.username === username);
};

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("newUser", (username) => {
      console.log("Received newUser event:", { username, socketId: socket.id });
      addUser(username, socket.id);
      console.log("Broadcasting updated online users:", onlineUsers);
      io.emit("getOnlineUsers", onlineUsers);
    });

    socket.on("sendMessage", async ({ senderId, recipientId, text }) => {
      console.log("Received message:", { senderId, recipientId, text });
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
            text,
            senderId: sender.id,
            recipientId: recipientId, // Store the email directly
          },
        });

        console.log("Created message:", message);

        // Find recipient's socket ID from onlineUsers
        const recipientSocket = onlineUsers.find(user => user.username === recipientId);
        console.log("Recipient socket:", recipientSocket);
        
        if (recipientSocket) {
          // Send message to specific recipient
          io.to(recipientSocket.socketId).emit("getMessage", {
            id: message.id,
            text: message.text,
            sender: sender.email,
            receiver: recipientId,
            createdAt: message.created,
          });
        }

        // Also send to sender for their own UI
        socket.emit("getMessage", {
          id: message.id,
          text: message.text,
          sender: sender.email,
          receiver: recipientId,
          createdAt: message.created,
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      removeUser(socket.id);
      console.log("Broadcasting updated online users after disconnect:", onlineUsers);
      io.emit("getOnlineUsers", onlineUsers);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
