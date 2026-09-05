import { WebSocket } from "ws";
import { legalGraph } from "../graph/graph.js";

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

      let documentBuffer: Uint8Array | null = null;
      if (document?.data) {
        documentBuffer = dataUrlToBuffer(document?.data);
      }
      // Validate input
      if (!inputMessage || inputMessage.trim() === "") {
        return sendPayload(ws, {
          type: "ERROR",
          message: "Query text is required.",
        });
      }

      const graphInput = {
        inputMessage,
        image: image ?? null,
        document: document && documentBuffer
          ? {
              fileName: document.name,
              size: document.size,
              type: document.type,
              fileBuffer: documentBuffer,
            }
          : null,
      };

      let finalAnswer = "";
      const graphStream = await legalGraph.stream(graphInput, {
        streamMode: "updates",
      });

      for await (const update of graphStream) {
        const [nodeName, nodeState] = Object.entries(update)[0] ?? [];
        if (!nodeName || !nodeState) {
          continue;
        }

        const status = getNodeStatus(nodeName);
        if (status) {
          sendPayload(ws, {
            type: "STATUS",
            status: status.status,
            message: status.message,
          });
        }

        if (nodeName === "finalResponse") {
          finalAnswer = (nodeState as { finalAnswer?: string }).finalAnswer ?? "";
        }
      }

      sendPayload(ws, {
        type: "FINAL_RESPONSE",
        data: finalAnswer,
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

/**
 * Sends a JSON payload to the WebSocket if the connection is open
 */
const sendPayload = (ws: WebSocket, payload: object): void => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

const getNodeStatus = (
  nodeName: string,
): { status: "SEARCHING_LEGAL_DOCS" | "ANALYZING_CONTEXT" | "GENERATING_RESPONSE"; message: string } | null => {
  switch (nodeName) {
    case "parseDocument":
      return {
        status: "SEARCHING_LEGAL_DOCS",
        message: "Reading the provided document...",
      };
    case "identifyLaws":
      return {
        status: "SEARCHING_LEGAL_DOCS",
        message: "Identifying the relevant laws...",
      };
    case "retrieveSections":
      return {
        status: "ANALYZING_CONTEXT",
        message: "Retrieving relevant legal sections...",
      };
    case "finalResponse":
      return {
        status: "GENERATING_RESPONSE",
        message: "Preparing your answer...",
      };
    default:
      return null;
  }
};

const dataUrlToBuffer = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.split(",", 2)[1];

  if (!base64) {
    throw new Error("Invalid PDF data");
  }

  return Buffer.from(base64, "base64");
};
