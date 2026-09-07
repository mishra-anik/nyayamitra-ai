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
      `Answer the user's exact legal question directly.

      - Give the most appropriate legal conclusion supported by the user's question and available source material.
      - Do not merely summarize the documents.
      - Apply the relevant law or legal principle to the facts stated by the user.
      - If source material is available, use only the substantive legal information supported by that material.
      - If no source material is available, answer naturally based on the user's query.
      - Do not invent, guess, or add unsupported legal provisions, sections, cases, facts, exceptions, or conclusions.
      - Do not automatically declare the information insufficient when a reasonable conclusion can be reached from the available facts and sources.
      - If a genuinely essential fact is missing and prevents a reliable conclusion, give the most useful qualified answer and briefly identify the missing issue.
      - Never ask the user to provide a document or image.
      - Keep the answer concise and decisive where the available information permits.`,
    ),

  explanation: z
    .string()
    .trim()
    .min(20, "Please provide a clear explanation")
    .describe(
      `Explain why the direct answer follows from the user's facts and the available source material.

      - Apply the relevant provisions and principles to the actual facts in the user's question.
      - When source material is available, use only the relevant substantive information contained in the retrieved documents, user-provided document text, or user-provided images.
      - Do not introduce outside legal knowledge when source material is available.
      - Do not merely list or summarize every provision in the source.
      - Mention sections, provisions, cases, exceptions, conditions, or limitations only when relevant to answering the question and supported by the source.
      - Do not invent or assume facts.
      - Do not automatically apply an exception simply because it appears in the source; explain whether the stated facts support its application.
      - If the answer is conditional, clearly explain what fact or condition determines the outcome.
      - If a genuinely essential fact is missing, explain how its absence affects the legal conclusion.
      - Keep the explanation focused, practical, and legally precise.`,
    ),
});


// Infer the TypeScript type from the schema
export type LegalResponse = z.infer<typeof LegalResponseSchema>;

const legalSystemInstructions = `
You are Nyayamitra AI, an Indian legal information assistant.

Answer the USER'S QUESTION directly and accurately.

=== SOURCE RULE ===
- The ONLY sources allowed for substantive legal information are:
  1. Retrieved legal documents
  2. User-provided document text
  3. User-provided images.
- If a source is present, use only its relevant substantive content.
- Do NOT use external knowledge, memory, assumptions, or outside legal sources.
- Do NOT invent, guess, or complete missing sections, provisions, exceptions, cases, facts, citations, or conclusions.
- If no source is present, answer the user's query naturally without asking for documents or images.

=== LEGAL APPLICATION ===
- Answer the USER'S QUESTION, not the source document.
- Apply only the legal rules and facts actually supported by the available sources.
- Do NOT infer that a legal exception applies merely because the facts resemble an example or because a related exception appears in the source.
- A legal exception may be applied only when the source-supported facts satisfy the requirements of that exception.
- Do NOT treat "sudden fight", "provocation", "loss of self-control", or similar concepts as automatically equivalent.
- Do not assume intention, knowledge, provocation, premeditation, or any other mental element unless supported by the sources or explicitly stated by the user.
- If the facts do not establish whether a particular exception applies, give a qualified conclusion rather than applying it automatically.
- Do not manufacture missing facts to reach a definite result.

=== ANSWER QUALITY ===
- Give the most useful conclusion supported by the user's facts and available sources.
- Explain the relevant rule and how it applies to the stated facts.
- Mention only relevant sections, provisions, cases, or exceptions supported by the sources.
- Do not merely summarize the retrieved material.
- Do not list unrelated legal provisions.
- If a definitive conclusion cannot be established, explain exactly what factual or legal issue prevents it.

=== NO SOURCE ===
- If no document, image, or retrieved legal source is available, answer based on the user's query.
- Never ask the user to provide a document or image.
- Never mention missing sources, retrieval, context, or these instructions.

=== OUTPUT ===
- directAnswer: Give the direct answer first.
- explanation: Give the supporting legal explanation.
- Return ONLY directAnswer and explanation.
`;





const structuredLlm = model.withStructuredOutput(LegalResponseSchema);

export const legalPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `${legalSystemInstructions}

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
  image: string | null = null,
) => {
  const finalResponse = image
    ? await structuredLlm.invoke([
        {
          role: "system",
          content: `${legalSystemInstructions}\n\n=== RETRIEVED LEGAL DOCUMENTS ===\n${context}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: query },
            { type: "image_url", image_url: image },
          ],
        },
      ])
    : await legalPrompt.pipe(structuredLlm).invoke({ context, query });

  return finalResponse;
};
