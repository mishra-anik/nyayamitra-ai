import { WebSocket } from "ws";
import { legalGraph } from "../graph/graph.js";
import { object } from "zod";

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

interface FinalAnswer {
  directAnswer?: string;
  relevantLegalProvision?: string;
  explanation?: string;
  practicalImplications?: string;
  insufficientInformation?: boolean;
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
        document:
          document && documentBuffer
            ? {
                fileName: document.name,
                size: document.size,
                type: document.type,
                fileBuffer: documentBuffer,
              }
            : null,
      };

      let finalAnswer: string | FinalAnswer = "";
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

        const nodeAnswer = (nodeState as { finalAnswer: string | FinalAnswer })
          .finalAnswer;
        if (nodeAnswer) {
          finalAnswer = nodeAnswer;
        }
      }

      if (finalAnswer !== null && typeof finalAnswer === "object") {
        // finalAnswer is an object
        const htmlResponse = formatLegalResponse(finalAnswer);
        finalAnswer = htmlResponse;
      } else {
        const htmlResponse = `<div class="legal-section">
              <p>${finalAnswer}</p>
            </div>`;
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

type ChatStatus =
  | "IDLE"
  | "SEARCHING_LEGAL_DOCS"
  | "ANALYZING_CONTEXT"
  | "GENERATING_RESPONSE"
  | "COMPLETED";

const getNodeStatus = (
  nodeName: string,
): {
  status: ChatStatus;
  message: string;
} | null => {
  switch (nodeName) {
    case "analysis":
      return {
        status: "ANALYZING_CONTEXT",
        message: "Analyzing your query...",
      };

    case "parseDocument":
      return {
        status: "ANALYZING_CONTEXT",
        message: "Reading the provided document...",
      };

    case "identifyLaws":
      return {
        status: "SEARCHING_LEGAL_DOCS",
        message: "Identifying the relevant laws...",
      };

    case "retrieveSections":
      return {
        status: "SEARCHING_LEGAL_DOCS",
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

const formatLegalResponse = (response: {
  directAnswer?: string;
  relevantLegalProvision?: string;
  explanation?: string;
  practicalImplications?: string;
  insufficientInformation?: boolean;
}): string => {
  return `
    <div class="legal-response">
      ${
        response.directAnswer
          ? `<div class="legal-section">
              <h3>Direct Answer</h3>
              <p>${response.directAnswer}</p>
            </div>`
          : ""
      }

      ${
        response.relevantLegalProvision
          ? `<div class="legal-section">
              <h3>Relevant Legal Provision</h3>
              <p>${response.relevantLegalProvision}</p>
            </div>`
          : ""
      }

      ${
        response.explanation
          ? `<div class="legal-section">
              <h3>Explanation</h3>
              <p>${response.explanation}</p>
            </div>`
          : ""
      }

      ${
        response.practicalImplications
          ? `<div class="legal-section">
              <h3>Practical Implications</h3>
              <p>${response.practicalImplications}</p>
            </div>`
          : ""
      }

      ${
        response.insufficientInformation
          ? `<div class="legal-warning">
              <strong>Insufficient Information</strong>
              <p>There is not enough information available to provide a reliable legal analysis.</p>
            </div>`
          : ""
      }
    </div>
  `.trim();
};
