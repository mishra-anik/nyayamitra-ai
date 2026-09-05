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
  .min(10, "Please provide a clear answer")
  .describe(
    "Give a clear, direct answer to the legal question in simple language. Keep it concise and answer the question first."
  ),

relevantLegalProvision: z
  .string()
  .trim()
  .describe(
    "Mention the relevant law, Act, section, rule, or legal provision that applies to the answer. Include the section number when available."
  ),

explanation: z
  .string()
  .trim()
  .min(20, "Please provide a clear explanation")
  .describe(
    "Explain the answer in simple, lawyer-friendly language. Use only the information available in the provided documents. Do not add unsupported legal information."
  ),

practicalImplications: z
  .string()
  .trim()
  .default("No specific practical implications noted in the provided context.")
  .describe(
    "Explain what this means in practical legal practice, such as how a lawyer may use the provision, what to check, or what issue may arise in a case."
  ),

insufficientInformation: z
  .boolean()
  .default(false)
  .describe(
    "Set to true when the provided documents do not contain enough information to answer the question reliably. Set to false when the documents provide sufficient information."
  ),

});

// Infer the TypeScript type from the schema
export type LegalResponse = z.infer<typeof LegalResponseSchema>;

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
export const aiSearch = async (
  context: string,
  query: string,
): Promise<LegalResponse> => {
  console.log("Context length:", context.length ,context);


  const chain = legalPrompt.pipe(structuredLlm);
  const finalResponse = await chain.invoke({ context, query });

  return {
    ...finalResponse,
    practicalImplications:
      finalResponse?.practicalImplications ||
      "No specific practical implications noted in context.",
    insufficientInformation: finalResponse?.insufficientInformation ?? false,
  } as LegalResponse;
};
