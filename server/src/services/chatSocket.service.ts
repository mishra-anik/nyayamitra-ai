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
      const { inputMessage } = payload;

      // Validate input
      if (!inputMessage || inputMessage.trim() === "") {
        return sendPayload(ws, {
          type: "ERROR",
          message: "Query text is required.",
        });
      }

      sendPayload(ws, {
        type: "STATUS",
        status: "SEARCHING_LEGAL_DOCS",
        message: "Searching relevant legal documents...",
      });

      
      const context = await vectorSearch(inputMessage);

      sendPayload(ws, {
        type: "STATUS",
        status: "ANALYZING_CONTEXT",
        message: "Analyzing relevant information...",
      });

      sendPayload(ws, {
        type: "STATUS",
        status: "GENERATING_RESPONSE",
        message: "Preparing your answer...",
      });

      const finalResponse = await aiSearch(context, inputMessage);

      sendPayload(ws, {
        type: "FINAL_RESPONSE",
        data: finalResponse,
      });

      sendPayload(ws, {
        type: "STATUS",
        status: "COMPLETED",
        message: "Done",
      });
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
