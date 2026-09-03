import { WebSocket } from "ws";
import { vectorSearch } from "../rag/embeddings.js";
import { aiSearch } from "./ai.service.js";

/**
 * Handles incoming WebSocket connections and processes chat messages
 */

interface DocumentPayload {
  name: string;
  size: number;
  type: "pdf" | "doc" | "docx";
  data: string;
}

interface PayloadType {
  inputMessage?: string;
  image?: string | null;
  document?: DocumentPayload | null;
}

export const handleChatSocketConnection = (ws: WebSocket): void => {
  ws.on("message", async (rawMessage: Buffer) => {
    try {
      const payload: PayloadType = JSON.parse(rawMessage.toString());
      const { inputMessage, image, document } = payload;

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
        role: "assistant",
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

const getDataUrlByteLength = (dataUrl: string): number => {
  const base64Data = dataUrl.split(",", 2)[1];

  if (!base64Data) {
    return 0;
  }

  return Math.floor((base64Data.replace(/=+$/, "").length * 3) / 4);
};

/**
 * Sends a JSON payload to the WebSocket if the connection is open
 */
const sendPayload = (ws: WebSocket, payload: object): void => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};
