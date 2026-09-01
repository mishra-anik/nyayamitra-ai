import { WebSocket } from "ws";
import { vectorSearch } from "../rag/embeddings.js";
import { aiSearch } from "./ai.service.js";

/**
 * Handles incoming WebSocket connections and processes chat messages
 */
export const handleChatSocketConnection = (ws: WebSocket): void => {
  ws.on("message", async (rawMessage: Buffer) => {
    try {
      const payload = JSON.parse(rawMessage.toString());
      const { text } = payload;

      // Validate input
      if (!text || text.trim() === "") {
        return sendPayload(ws, {
          type: "ERROR",
          message: "Query text is required.",
        });
      }

      // 1. RAG Context Retrieval
      sendPayload(ws, { type: "STATUS", status: "SEARCHING_LEGAL_DOCS" });
      const context = await vectorSearch(text);

      if (!context || context.trim().length === 0) {
        return sendPayload(ws, {
          type: "ERROR",
          message: "No relevant legal context found.",
        });
      }

      // 2. Generate Response
      sendPayload(ws, { type: "STATUS", status: "GENERATING_RESPONSE" });
      const finalResponse = await aiSearch(context, text);

      // 3. Send Final Response
      sendPayload(ws, { type: "FINAL_RESPONSE", data: finalResponse });

      // 4. Complete Stage
      sendPayload(ws, { type: "DONE" });
    } catch (error: any) {
      console.error("[ChatSocket Service Error]:", error);
      if (ws.readyState === WebSocket.OPEN) {
        sendPayload(ws, {
          type: "ERROR",
          message: error.message || "An unexpected error occurred.",
        });
      }
    }
  });
};

/**
 * Sends a JSON payload to the WebSocket if the connection is open
 */
const sendPayload = (ws: WebSocket, payload: object): void => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};
