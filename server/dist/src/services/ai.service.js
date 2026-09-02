import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
// Initialize the LLM model
const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0,
});
export const LegalResponseSchema = z.object({
    directAnswer: z
        .string()
        .trim()
        .min(10, "Direct answer must be detailed")
        .describe("Clear and concise 1-20 sentence direct answer to the question"),
    relevantLegalProvision: z
        .string()
        .trim()
        .describe("The specific Act, Section, or Rule applicable"),
    explanation: z
        .string()
        .trim()
        .min(20, "Explanation must provide sufficient context")
        .describe("Detailed explanation strictly based on the provided documents"),
    practicalImplications: z
        .string()
        .trim()
        .default("No specific practical implications noted in context.")
        .describe("Practical summary or operational context"),
    insufficientInformation: z
        .boolean()
        .default(false)
        .describe("Set to true if the context does not contain enough information to answer"),
});
// Define the template ONCE outside your function
// Bind the Zod schema to the model
const structuredLlm = model.withStructuredOutput(LegalResponseSchema);
// Define the prompt template
export const legalPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are Nyayamitra AI, an Indian legal information assistant covering all domains of Indian Law (Civil, Criminal, Constitutional, Corporate, Tax, Labor, Family, IP, etc.).

=== INSTRUCTIONS ===
1. Primary Source: Base your response primarily on the provided "RETRIEVED LEGAL DOCUMENTS".
2. Hybrid Knowledge: If retrieved documents are partial or missing, supplement using your general knowledge of Indian statutes, rules, and judicial precedents.
3. Transparency: State explicitly in the "explanation" field if general legal knowledge was used to fill gaps.
4. Accuracy: Preserve exact legal titles, sections, and rules. Never invent provisions.

=== RETRIEVED LEGAL DOCUMENTS ===
{context}`,
    ],
    ["human", "{query}"],
]);
/**
 * Searches for legal information using AI and RAG context
 */
export const aiSearch = async (context, query) => {
    console.log("Context length:", context.length, context);
    const chain = legalPrompt.pipe(structuredLlm);
    const finalResponse = await chain.invoke({ context, query });
    return {
        ...finalResponse,
        practicalImplications: finalResponse?.practicalImplications ||
            "No specific practical implications noted in context.",
        insufficientInformation: finalResponse?.insufficientInformation ?? false,
    };
};
