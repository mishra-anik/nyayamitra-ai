import { WebSocket } from "ws";
import { vectorSearch } from "../rag/embeddings.js";
import { aiSearch } from "./ai.service.js";
/**
 * Handles incoming WebSocket connections and processes chat messages
 */
export const handleChatSocketConnection = (ws) => {
    ws.on("message", async (rawMessage) => {
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
            // 1. RAG Context Retrieval
            sendPayload(ws, { type: "STATUS", status: "SEARCHING_LEGAL_DOCS" });
            const context = await vectorSearch(inputMessage);
            if (context.trim().length === 0) {
                sendPayload(ws, {
                    type: "STATUS",
                    status: "NO_RELEVANT_DOCS_FOUND",
                });
            }
            // 2. Generate Response
            sendPayload(ws, { type: "STATUS", status: "GENERATING_RESPONSE" });
            const finalResponse = await aiSearch(context, inputMessage);
            // 3. Send Final Response
            sendPayload(ws, { type: "FINAL_RESPONSE", data: finalResponse });
            // 4. Complete Stage
            sendPayload(ws, { type: "DONE" });
        }
        catch (error) {
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
const sendPayload = (ws, payload) => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
    }
};
