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
  handleChatSocketConnection(ws);

  ws.on("close", () => {
  });
});

// Start server
server.listen(PORT, () => {
});
