// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Set the port (for local network, consider using window.location.hostname on the client)
const PORT = 3001;

const app = express();
const httpServer = createServer(app);

// Allow all origins for local network testing. For production, restrict the origin.
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// When a client connects, log the connection and set up listeners.
io.on("connection", (socket) => {
  console.log("New client connected: " + socket.id);

  // Listen for incoming chat messages from clients.
  socket.on("chat message", (msg) => {
    // Append a timestamp to the message.
    msg.timestamp = new Date().toISOString();
    // Broadcast the message to all clients.
    io.emit("chat message", msg);
  });

  // Handle disconnections.
  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.id);
  });
});

// Start the server.
httpServer.listen(PORT, () => {
  console.log(`Chat server is running on port ${PORT}`);
});
