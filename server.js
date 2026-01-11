// server.js using CommonJS
const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

/**
 * Start the bulk import worker in-process
 * This starts the worker in the same Node.js process, so it's always available
 */
async function startBulkImportWorker() {
  try {
    // In development, TypeScript files aren't compiled to .js
    // So we need to use tsx to run the worker in a separate process
    // In production, Next.js compiles everything, but we need to use the correct import path
    if (process.env.NODE_ENV === "production") {
      // Production: Try to import the module directly first (without .js extension)
      // Node.js ESM will try to resolve it automatically
      let workerModule;
      let useTsx = false;
      
      try {
        // Try importing without extension - Node.js will try .js, .json, etc.
        workerModule = await import("./lib/workers/bulk-import-worker");
        console.log("[BULK IMPORT WORKER] Successfully imported worker module");
      } catch (importError) {
        // If direct import fails, use tsx as fallback
        console.warn("[BULK IMPORT WORKER] Direct import failed, using tsx fallback");
        console.warn("[BULK IMPORT WORKER] Import error:", importError.message);
        useTsx = true;
      }
      
      if (useTsx) {
        // Fallback: Use tsx to run TypeScript directly
        const { spawn } = require("child_process");
        // Use shell: false and pass executable and args separately to avoid security warning
        const workerProcess = spawn("npx", ["tsx", "scripts/bulk-import-worker.ts"], {
          stdio: "inherit",
          shell: false, // More secure - don't use shell
          env: { ...process.env },
        });
        
        workerProcess.on("error", (error) => {
          console.error("[BULK IMPORT WORKER] Worker process error:", error.message);
          console.warn("[BULK IMPORT WORKER] tsx may not be available in production. Consider moving tsx to dependencies.");
        });
        
        workerProcess.on("exit", (code) => {
          if (code !== 0 && code !== null) {
            console.error(`[BULK IMPORT WORKER] Worker exited with code ${code}, restarting in 5 seconds...`);
            // Restart worker after delay
            setTimeout(() => {
              console.log("[BULK IMPORT WORKER] Restarting worker...");
              startBulkImportWorker();
            }, 5000);
          }
        });
        
        console.log("[BULK IMPORT WORKER] Worker started in separate process (production mode with tsx)");
        return workerProcess;
      } else if (workerModule && workerModule.getBulkImportWorker) {
        // Successfully imported module, start worker in-process
        const worker = workerModule.getBulkImportWorker();
        console.log("[BULK IMPORT WORKER] Worker started in-process and ready to process jobs");
        
        // Handle graceful shutdown
        if (!process.listeners("SIGTERM").some(l => l.toString().includes("BULK IMPORT WORKER"))) {
          process.on("SIGTERM", async () => {
            console.log("[BULK IMPORT WORKER] Received SIGTERM, shutting down worker...");
            if (workerModule.closeBulkImportWorker) {
              await workerModule.closeBulkImportWorker();
            }
          });
          
          process.on("SIGINT", async () => {
            console.log("[BULK IMPORT WORKER] Received SIGINT, shutting down worker...");
            if (workerModule.closeBulkImportWorker) {
              await workerModule.closeBulkImportWorker();
            }
          });
        }
        
        return worker;
      } else {
        throw new Error("Worker module imported but getBulkImportWorker function not found");
      }
    } else {
      // Development: Try to import directly first, then fallback to tsx
      let workerModule;
      let useTsx = false;
      
      try {
        // Try importing the worker module directly (works if TypeScript is compiled or using ts-node/tsx)
        workerModule = await import("./lib/workers/bulk-import-worker");
        console.log("[BULK IMPORT WORKER] Successfully imported worker module (development)");
      } catch (importError) {
        // If direct import fails, use tsx as fallback
        console.warn("[BULK IMPORT WORKER] Direct import failed, using tsx fallback");
        console.warn("[BULK IMPORT WORKER] Import error:", importError.message);
        useTsx = true;
      }
      
      if (useTsx) {
        // Fallback: Use tsx to run TypeScript directly
        const { spawn } = require("child_process");
        // On Windows, try yarn first (since user is using yarn), then npx
        const isWindows = process.platform === "win32";
        const command = isWindows ? "yarn" : "npx";
        const args = isWindows ? ["tsx", "scripts/bulk-import-worker.ts"] : ["tsx", "scripts/bulk-import-worker.ts"];
        
        const workerProcess = spawn(command, args, {
          stdio: "inherit",
          shell: isWindows, // On Windows, shell: true may be needed to find yarn/npx in PATH
          env: { ...process.env },
        });
        
        workerProcess.on("error", (error) => {
          console.error("[BULK IMPORT WORKER] Worker process error:", error.message);
          console.warn("[BULK IMPORT WORKER] Make sure tsx is installed: yarn add -D tsx");
        });
      
        workerProcess.on("exit", (code) => {
          if (code !== 0 && code !== null) {
            console.error(`[BULK IMPORT WORKER] Worker exited with code ${code}`);
            // Don't restart automatically in development - let user restart manually
          }
        });
        
        console.log("[BULK IMPORT WORKER] Worker started in separate process (development mode with tsx)");
        return workerProcess;
      } else if (workerModule && workerModule.getBulkImportWorker) {
        // Successfully imported module, start worker in-process
        const worker = workerModule.getBulkImportWorker();
        console.log("[BULK IMPORT WORKER] Worker started in-process (development mode)");
        
        // Handle graceful shutdown
        if (!process.listeners("SIGTERM").some(l => l.toString().includes("BULK IMPORT WORKER"))) {
          process.on("SIGTERM", async () => {
            console.log("[BULK IMPORT WORKER] Received SIGTERM, shutting down worker...");
            if (workerModule.closeBulkImportWorker) {
              await workerModule.closeBulkImportWorker();
            }
          });
          
          process.on("SIGINT", async () => {
            console.log("[BULK IMPORT WORKER] Received SIGINT, shutting down worker...");
            if (workerModule.closeBulkImportWorker) {
              await workerModule.closeBulkImportWorker();
            }
          });
        }
        
        return worker;
      } else {
        throw new Error("Worker module imported but getBulkImportWorker function not found");
      }
    }
  } catch (error) {
    console.error("[BULK IMPORT WORKER] Failed to start worker:", error.message);
    console.warn("[BULK IMPORT WORKER] Worker will not be available. Jobs will queue but not process.");
    if (error.stack) {
      console.warn("[BULK IMPORT WORKER] Error details:", error.stack);
    }
  }
}

// CRITICAL: Handle uncaught exceptions and unhandled rejections
// These prevent the server from crashing on connection resets and other errors
process.on("uncaughtException", (error) => {
  // ECONNRESET, EPIPE, and "aborted" errors are normal client disconnects - don't log or crash
  const errorMessage = error?.message || "";
  const errorCode = error?.code || "";
  const errorStack = error?.stack || "";

  const isNormalDisconnect =
    errorCode === "ECONNRESET" ||
    errorCode === "EPIPE" ||
    errorMessage === "aborted" ||
    errorMessage.includes("aborted") ||
    errorStack.includes("abortIncoming") ||
    errorStack.includes("socketOnClose");

  if (isNormalDisconnect) {
    // Silently ignore - these are normal when clients disconnect
    return;
  }

  // Log other uncaught exceptions but don't crash
  console.error("[UNCAUGHT_EXCEPTION]", {
    error: errorMessage,
    code: errorCode,
    stack: errorStack,
    timestamp: new Date().toISOString(),
  });

  // Don't exit - let the server continue running
  // process.exit(1) would crash the entire server
});

process.on("unhandledRejection", (reason, promise) => {
  // Log unhandled promise rejections but don't crash
  console.error("[UNHANDLED_REJECTION]", {
    reason: reason instanceof Error ? reason.message : String(reason),
    code: reason?.code,
    stack: reason instanceof Error ? reason.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  // Don't exit - let the server continue running
});

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
      timestamp: new Date().toISOString(),
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

let appReady = false;

app
  .prepare()
  .then(() => {
    appReady = true;
    console.log("[SERVER] Next.js app prepared and ready");

    const httpServer = createServer();

    // Configure Socket.IO with CORS and secure options
    const io = new Server(httpServer, {
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? `https://${process.env.HOSTNAME}`
            : "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      allowEIO3: true,
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

      socket.on(
        "sendMessage",
        async ({ senderId, conversationId, content }) => {
          console.log("Received message:", {
            senderId,
            conversationId,
            content,
          });
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
                    id: conversationId,
                  },
                },
                sender: {
                  connect: {
                    id: senderId,
                  },
                },
              },
              include: {
                sender: {
                  select: {
                    id: true,
                    email: true,
                    username: true,
                  },
                },
              },
            });

            console.log("Created message:", message);

            // Update conversation's updatedAt timestamp
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });

            // Get all users in the conversation
            const conversation = await prisma.conversation.findUnique({
              where: { id: conversationId },
              include: {
                users: {
                  select: {
                    userId: true,
                  },
                },
              },
            });

            if (!conversation) {
              console.error("Conversation not found");
              return;
            }

            // Send message to all users in the conversation
            conversation.users.forEach((user) => {
              const userSocket = onlineUsers.find(
                (u) => u.userId === user.userId
              );
              if (userSocket) {
                io.to(userSocket.socketId).emit("newMessage", {
                  id: message.id,
                  content: message.content,
                  sender:
                    message.sender.username ||
                    message.sender.email ||
                    "Unknown User",
                  senderId: message.sender.id,
                  createdAt: message.createdAt,
                  conversationId: conversationId,
                });
              }
            });
          } catch (error) {
            console.error("Error sending message:", error);
          }
        }
      );

      // Handle session updates for role/permission changes
      socket.on("sessionUpdate", async ({ userId, updatedBy, reason }) => {
        console.log("Session update requested:", { userId, updatedBy, reason });

        try {
          // Find the user's socket connection
          const userSocket = onlineUsers.find((u) => u.userId === userId);

          if (userSocket) {
            // Send session update notification to the specific user
            io.to(userSocket.socketId).emit("sessionUpdated", {
              message:
                "Your session has been updated. Please refresh to see changes.",
              updatedBy,
              reason,
              timestamp: new Date().toISOString(),
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
    httpServer.on("request", async (req, res) => {
      // Check if app is ready before handling requests
      if (!appReady) {
        console.error(
          `[ERROR] Request to ${req.url} received before app is ready`
        );
        if (!res.headersSent) {
          res.statusCode = 503;
          res.end("Service Unavailable - App is still initializing");
        }
        return;
      }

      const requestStart = Date.now();
      const url = req.url || "unknown";
      const method = req.method || "UNKNOWN";

      // Extract route information for better error logging
      // For server actions, try to extract the action ID from the URL
      let routeInfo = {
        method,
        url,
        path: url.split("?")[0], // Remove query params for cleaner path
        isServerAction: false,
        actionId: null,
      };

      // Check if this is a server action and extract action ID
      if (url.includes("/_next/server-actions")) {
        routeInfo.isServerAction = true;
        // Server action URLs look like: /_next/server-actions/[actionId]
        const actionMatch = url.match(/\/_next\/server-actions\/([^?]+)/);
        if (actionMatch) {
          routeInfo.actionId = actionMatch[1];
        }
      }

      // Extract API route path if it's an API call
      if (url.startsWith("/api/")) {
        routeInfo.apiRoute = url.split("?")[0];
      }

      // Don't log requests - only log errors to reduce noise

      // Set request timeout - longer for server actions that make external API calls
      // Server actions may need to call Stripe, database, etc. - give them more time
      const isServerAction = url.includes("/_next/server-actions");
      const timeoutDuration = isServerAction ? 120000 : 60000; // 2 min for server actions, 1 min for others

      req.setTimeout(timeoutDuration, () => {
        if (!res.headersSent && !res.writableEnded) {
          console.warn(
            `[TIMEOUT] ${method} ${routeInfo.path} timed out after ${timeoutDuration / 1000}s`,
            {
              method,
              url,
              path: routeInfo.path,
              isServerAction: routeInfo.isServerAction,
              actionId: routeInfo.actionId,
              apiRoute: routeInfo.apiRoute,
              duration: `${timeoutDuration / 1000}s`,
            }
          );
          try {
            res.statusCode = 408;
            res.end("Request Timeout");
          } catch (e) {
            // Response might be destroyed - ignore
          }
        }
      });

      // Set response timeout to prevent hanging connections
      // CRITICAL: Don't interfere with Next.js response handling
      res.setTimeout(timeoutDuration, () => {
        if (!res.headersSent && !res.writableEnded) {
          console.warn(
            `[TIMEOUT] Response for ${method} ${routeInfo.path} timed out after ${timeoutDuration / 1000}s`,
            {
              method,
              url,
              path: routeInfo.path,
              isServerAction: routeInfo.isServerAction,
              actionId: routeInfo.actionId,
              apiRoute: routeInfo.apiRoute,
              duration: `${timeoutDuration / 1000}s`,
            }
          );
          try {
            res.statusCode = 504;
            res.end("Gateway Timeout");
          } catch (e) {
            // Response might be destroyed - ignore
          }
        }
      });

      // Handle connection errors - these are SYMPTOMS of underlying issues
      // Log them to track when they occur (they indicate server action failures or slow responses)
      req.on("error", (error) => {
        // Log connection errors that indicate problems (not just normal disconnects)
        if (error.code === "ERR_HTTP_REQUEST_TIMEOUT") {
          // Log all timeouts with full context - even server actions need visibility
          console.warn(
            `[TIMEOUT] ${method} ${routeInfo.path} request timed out`,
            {
              method,
              url,
              path: routeInfo.path,
              isServerAction: routeInfo.isServerAction,
              actionId: routeInfo.actionId,
              apiRoute: routeInfo.apiRoute,
              errorCode: error.code,
              message: "Request timeout - server too slow",
            }
          );
        } else if (error.code === "HPE_INVALID_EOF_STATE") {
          // This often happens when server actions fail and client disconnects
          console.warn(
            `[PARSE_ERROR] Parse error on ${method} ${routeInfo.path} - possible server action failure`,
            {
              method,
              url,
              path: routeInfo.path,
              isServerAction: routeInfo.isServerAction,
              actionId: routeInfo.actionId,
              apiRoute: routeInfo.apiRoute,
              errorCode: error.code,
            }
          );
        } else if (error.code !== "ECONNRESET" && error.code !== "EPIPE") {
          // ECONNRESET/EPIPE are normal client disconnects, but log others
          console.error(
            `[REQUEST_ERROR] Error on ${method} ${routeInfo.path}`,
            {
              method,
              url,
              path: routeInfo.path,
              isServerAction: routeInfo.isServerAction,
              actionId: routeInfo.actionId,
              apiRoute: routeInfo.apiRoute,
              errorCode: error.code,
              errorMessage: error.message,
            }
          );
        }
      });

      res.on("error", (error) => {
        // Log response errors that indicate problems
        if (error.code === "ERR_HTTP_REQUEST_TIMEOUT") {
          console.warn(
            `[TIMEOUT] Response for ${method} ${routeInfo.path} timed out`,
            {
              method,
              url,
              path: routeInfo.path,
              isServerAction: routeInfo.isServerAction,
              actionId: routeInfo.actionId,
              apiRoute: routeInfo.apiRoute,
              errorCode: error.code,
              message: "Response timeout - server too slow",
            }
          );
        } else if (error.code !== "ECONNRESET" && error.code !== "EPIPE") {
          console.error(
            `[RESPONSE_ERROR] Error on ${method} ${routeInfo.path}`,
            {
              method,
              url,
              path: routeInfo.path,
              isServerAction: routeInfo.isServerAction,
              actionId: routeInfo.actionId,
              apiRoute: routeInfo.apiRoute,
              errorCode: error.code,
              errorMessage: error.message,
            }
          );
        }
      });

      // Handle client disconnect gracefully
      // CRITICAL: Don't destroy response - let Next.js handle it completely
      // Destroying the response prevents server actions from sending their responses
      req.on("close", () => {
        // Don't destroy the response - Next.js needs to send it
        // Even if client disconnects, the server action should complete
        // The response will be cleaned up automatically by Node.js
      });

      try {
        // CRITICAL: Server actions MUST be handled by Next.js handler directly
        // They use routes like /_next/server-actions/[actionId] and need proper routing
        // Don't interfere with Next.js internal routes - let Next.js handle everything

        // Call Next.js handler - this handles all routes including server actions
        // CRITICAL: Properly await the handler but don't interfere with response
        try {
          await handler(req, res);

          // For server actions, give Next.js time to send the response
          if (
            url.includes("/_next/server-actions") ||
            (req.method === "POST" && !url.startsWith("/api/"))
          ) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        } catch (handlerError) {
          // NEXT_REDIRECT is expected behavior in Next.js - don't treat as error
          if (
            handlerError?.digest?.startsWith("NEXT_REDIRECT") ||
            handlerError?.message === "NEXT_REDIRECT" ||
            handlerError?.digest?.startsWith("515638683") // Common NEXT_REDIRECT digest
          ) {
            // This is a redirect - let it propagate normally
            return;
          }

          // Only handle errors if response hasn't been sent
          if (!res.headersSent && !res.writableEnded && !res.destroyed) {
            console.error(
              `[HANDLER_ERROR] Error in Next.js handler for ${method} ${routeInfo.path}`,
              {
                method,
                url,
                path: routeInfo.path,
                isServerAction: routeInfo.isServerAction,
                actionId: routeInfo.actionId,
                apiRoute: routeInfo.apiRoute,
                errorMessage: handlerError?.message,
                errorCode: handlerError?.code,
                errorStack: handlerError?.stack,
              }
            );
            // Try to send error response if possible
            try {
              res.statusCode = 500;
              res.end("Internal Server Error");
            } catch (e) {
              // Response might be destroyed - ignore
            }
          }
          // Re-throw to be caught by outer catch block for logging
          throw handlerError;
        }
      } catch (error) {
        // NEXT_REDIRECT is expected behavior - don't log as error
        if (
          error?.digest?.startsWith("NEXT_REDIRECT") ||
          error?.message === "NEXT_REDIRECT" ||
          error?.digest?.startsWith("515638683")
        ) {
          return; // Let redirect complete normally
        }

        // Only log actual errors (not normal disconnects or timeouts)
        if (
          error?.code !== "ECONNRESET" &&
          error?.code !== "EPIPE" &&
          error?.code !== "ETIMEDOUT" &&
          error?.code !== "ERR_HTTP_REQUEST_TIMEOUT"
        ) {
          // Filter out noise from static assets and images
          const isStaticAsset =
            url.includes("/_next/static") ||
            url.includes("/_next/image") ||
            url.includes("/favicon.ico");

          if (!isStaticAsset) {
            console.error(
              `[ERROR] Error handling ${method} ${routeInfo.path}`,
              {
                method,
                url,
                path: routeInfo.path,
                isServerAction: routeInfo.isServerAction,
                actionId: routeInfo.actionId,
                apiRoute: routeInfo.apiRoute,
                errorMessage: error?.message,
                errorCode: error?.code,
                errorStack: error?.stack,
              }
            );
          }
        }

        // Check if response was already sent or connection closed
        if (res.headersSent || res.destroyed || res.writableEnded) {
          return;
        }

        // Try to send error response if possible
        try {
          if (!res.destroyed) {
            if (error?.code === "ERR_HTTP_REQUEST_TIMEOUT") {
              res.statusCode = 504;
              res.end("Gateway Timeout");
            } else {
              res.statusCode = 500;
              res.end("Internal Server Error");
            }
          }
        } catch (e) {
          // Response might be destroyed - ignore
        }
      }
    });

    // Handle server-level connection errors
    // NOTE: This fires BEFORE the request is fully parsed, so URL/method may not be available
    // We'll try multiple methods to extract request info from the socket buffer
    httpServer.on("clientError", (err, socket) => {
      // Try multiple methods to extract request info
      let requestInfo = {
        method: "UNKNOWN",
        url: "unknown",
        path: "unknown",
        rawFirstLine: null,
        remoteAddress: socket?.remoteAddress || "unknown",
        remotePort: socket?.remotePort || "unknown",
      };

      // Method 1: Try to get from _httpMessage (might not exist yet if error during parsing)
      if (socket?._httpMessage) {
        requestInfo.method = socket._httpMessage.method || "UNKNOWN";
        requestInfo.url = socket._httpMessage.url || "unknown";
        requestInfo.path = requestInfo.url.split("?")[0];
      }

      // Method 2: Try to read from socket's readable buffer
      // The socket might have the raw HTTP request line in its buffer before parsing fails
      if (socket && socket.readable) {
        try {
          // Check if there's buffered data we can peek at
          const readableState = socket._readableState;
          if (
            readableState &&
            readableState.buffer &&
            readableState.buffer.length > 0
          ) {
            // Try to get the first chunk
            let firstChunk = null;
            if (readableState.buffer.head) {
              firstChunk = readableState.buffer.head.data;
            } else if (readableState.buffer.length > 0) {
              // Try alternative buffer access
              const chunks = Array.from(readableState.buffer);
              if (chunks.length > 0) {
                firstChunk = chunks[0];
              }
            }

            if (firstChunk && Buffer.isBuffer(firstChunk)) {
              // Extract first line: "METHOD /path HTTP/1.1"
              const text = firstChunk.toString(
                "utf8",
                0,
                Math.min(300, firstChunk.length)
              );
              const lineMatch = text.match(/^([A-Z]+)\s+([^\s]+)\s+HTTP/);
              if (lineMatch) {
                requestInfo.method = lineMatch[1];
                requestInfo.url = lineMatch[2];
                requestInfo.path = requestInfo.url.split("?")[0];
                requestInfo.rawFirstLine = text.split("\n")[0].trim();
              }
            }
          }
        } catch (e) {
          // Failed to read from buffer - that's okay, we'll use defaults
        }
      }

      // Build context object for logging
      const errorContext = {
        method: requestInfo.method,
        url: requestInfo.url,
        path: requestInfo.path,
        remoteAddress: requestInfo.remoteAddress,
        remotePort: requestInfo.remotePort,
        errorCode: err.code,
        errorMessage: err.message,
        hasHttpMessage: !!socket?._httpMessage,
        note:
          requestInfo.method === "UNKNOWN"
            ? "Request not fully parsed yet - error occurred during HTTP parsing. This usually means the client sent malformed data or disconnected mid-request."
            : "Request info extracted from socket buffer",
        ...(requestInfo.rawFirstLine && {
          rawFirstLine: requestInfo.rawFirstLine,
        }),
      };

      // Log errors that indicate problems (not just normal disconnects)
      if (err.code === "HPE_INVALID_EOF_STATE") {
        console.error(
          `[CRITICAL] Client parse error - possible server action/build mismatch`,
          errorContext
        );
      } else if (err.code !== "ECONNRESET" && err.code !== "EPIPE") {
        console.error(
          `[CLIENT_ERROR] Client error on ${requestInfo.method} ${requestInfo.path}`,
          errorContext
        );
      }

      // Only send error response if socket is still writable
      if (!socket.destroyed && socket.writable) {
        socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      }
    });

    httpServer
      .once("error", (err) => {
        // Only exit on critical errors, not connection resets
        if (err.code === "ECONNRESET" || err.code === "EPIPE") {
          return;
        }
        console.error("Server error:", err);
        process.exit(1);
      })
      .listen(port, async () => {
        console.log(
          `> Ready on ${process.env.NODE_ENV === "production" ? "https" : "http"}://${hostname}:${port}`
        );
        console.log(`> Socket.IO server is running on the same port`);
        
        // Start bulk import worker in-process
        // This makes the worker always available without needing a separate process
        if (process.env.NODE_ENV === "production" || process.env.START_WORKER !== "false") {
          await startBulkImportWorker();
        } else {
          console.log("[BULK IMPORT WORKER] Worker disabled (START_WORKER=false)");
          console.log("[BULK IMPORT WORKER] To enable, set START_WORKER=true or remove the env var");
        }
      });
  })
  .catch((error) => {
    console.error("[CRITICAL] Failed to prepare Next.js app:", error);
    process.exit(1);
  });
