import "dotenv/config";
import app from "./src/app.js";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { handleChatSocketConnection } from "./src/services/chatSocket.service.js";

const PORT = Number(process.env.PORT) || 8080;
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/chat" });

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("New WebSocket connection established");
  handleChatSocketConnection(ws);

  ws.on("close", () => {
    console.log("[WS Disconnected]");
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`💬 IPv4 WS URL: ws://127.0.0.1:${PORT}/ws/chat`);
});
