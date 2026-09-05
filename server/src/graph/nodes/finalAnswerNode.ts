import { LegalStateType } from "../state/legalState.js";
import { aiSearch } from "../../services/ai.service.js";

export const finalResponse = async (state: LegalStateType) => {
    const documentContext = state.documentText.trim()
        ? `=== USER-PROVIDED DOCUMENT ===\n${state.documentText}`
        : "=== USER-PROVIDED DOCUMENT ===\nNo document was provided.";

    const identifiedLaws = state.identifiedLaws?.identifiedLaws.join(", ") ||
        "No specific law was identified.";

    const context = [
        documentContext,
        `=== IDENTIFIED LAWS ===\n${identifiedLaws}`,
        `=== RETRIEVED LEGAL SECTIONS ===\n${state.retrievedSections || "No sections were retrieved."}`,
    ].join("\n\n");

    const response = await aiSearch(context, state.inputMessage);

    return { finalAnswer: JSON.stringify(response) };
};