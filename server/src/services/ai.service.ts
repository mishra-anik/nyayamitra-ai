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
      `Answer the user's exact legal question directly and clearly.

      GENERAL RULE:
      - First identify what the user is actually asking.
      - Give the most appropriate legal answer supported by the available
        information.
      - Do not merely summarize retrieved documents.
      - Do not add unsupported legal provisions, sections, cases, facts,
        exceptions, or conclusions.
      - Do not invent facts.

      FOR GENERAL LEGAL OR CONSTITUTIONAL QUESTIONS:
      - Explain the legal concept itself before applying it to facts.
      - If the user asks about a constitutional concept, identify the relevant
        constitutional provision(s) where appropriate.
      - Do not narrow a broad constitutional concept to only one Article unless
        the user's question specifically asks about that Article.
      - For example, if the user asks "What is the Right to Freedom?", explain
        the broader constitutional right and identify its relevant Articles,
        rather than discussing only Article 19.
      - If the question concerns a Fundamental Right, explain its scope,
        important constitutional provisions, and major limitations only when
        relevant.
      - Use simple language where the user's question is simple.

      FOR FACT-SPECIFIC QUESTIONS:
      - Apply the relevant law or legal principle to the facts stated by the
        user.
      - Give a practical and appropriately qualified conclusion.
      - If an essential fact is missing, give the most useful qualified answer
        and briefly identify the missing issue.

      SOURCE MATERIAL:
      - When retrieved source material is available, use it as the primary
        authority for the answer.
      - Do not contradict the supplied source material.
      - Use relevant substantive information from retrieved documents,
        statutes, judgments, or user-provided legal documents.
      - Do not mention unrelated material merely because it appears in the
        source.
      - If the source material does not fully answer a general legal question,
        do not manufacture a conclusion from incomplete material.

      IMPORTANT:
      - Do not automatically declare the information insufficient when a
        reasonable legal explanation can be given.
      - Never ask the user to provide a document or image.
      - Keep the answer concise, direct, and legally precise.`,
    ),

  explanation: z
    .string()
    .trim()
    .min(20, "Please provide a clear explanation")
    .describe(
      `Explain the legal reasoning behind the direct answer.

      GENERAL LEGAL OR CONSTITUTIONAL QUESTIONS:
      - Explain the relevant legal concept in a logical order.
      - Identify the relevant Article, section, provision, or principle when
        appropriate.
      - If the concept is broader than a single provision, explain the broader
        framework instead of treating one provision as the entire concept.
      - For constitutional questions, distinguish between the constitutional
        right itself, the relevant Articles, and any constitutional
        restrictions or limitations.
      - Do not unnecessarily discuss unrelated provisions.

      FACT-SPECIFIC QUESTIONS:
      - Apply the relevant legal provisions and principles to the actual facts
        stated by the user.
      - Clearly explain why those facts lead to the stated conclusion.
      - If the answer depends on a condition or missing fact, identify that
        condition clearly.

      SOURCE MATERIAL:
      - When source material is available, rely primarily on the substantive
        legal information supported by the retrieved documents, user-provided
        document text, or user-provided images.
      - Do not merely reproduce or summarize the source.
      - Select only the portions relevant to the user's question.
      - Do not introduce unsupported sections, cases, exceptions, facts, or
        conclusions.
      - Do not automatically apply every exception or limitation mentioned in
        the source.
      - Apply an exception only when the facts or question make it relevant.

      LEGAL PRECISION:
      - Do not confuse an Article with the broader legal right or doctrine it
        forms part of.
      - Do not treat one subsection as the complete scope of a broader
        constitutional provision.
      - Where multiple Articles collectively govern a concept, explain that
        relationship briefly.
      - If a genuinely essential fact is missing, explain how its absence
        affects the legal conclusion.

      Keep the explanation focused, practical, and legally precise.`,
    ),
});


// Infer the TypeScript type from the schema
export type LegalResponse = z.infer<typeof LegalResponseSchema>;

const legalSystemInstructions = `
You are Nyayamitra AI, an Indian legal information assistant.

Answer the USER'S QUESTION directly, accurately, and in a way that matches the
scope of the question.

=== SOURCE RULE ===
- The ONLY sources allowed for substantive legal information when source
  material is available are:
  1. Retrieved legal documents
  2. User-provided document text
  3. User-provided images
- If a source is present, use only its relevant substantive content.
- Retrieved sources are supporting material, NOT a list of provisions that
  must be mentioned.
- Select only the provisions that directly answer the USER'S QUESTION.
- Ignore source material that is unrelated or unnecessary to the question.
- Do NOT use external knowledge, memory, assumptions, or outside legal sources
  when source material is available.
- Do NOT invent, guess, or complete missing sections, provisions, exceptions,
  cases, facts, citations, or conclusions.
- If no source is present, answer the user's query naturally.
- Never ask the user to provide documents or images.

=== QUESTION SCOPE ===
- First determine exactly what the USER is asking.
- Answer the question at the same level of scope as the user's question.
- Do NOT narrow a broad legal concept to one provision unless the user asks
  specifically about that provision.
- Do NOT broaden a specific question into unrelated legal provisions.

=== CONSTITUTIONAL QUESTIONS ===
- Questions about the Constitution of India, Fundamental Rights, Directive
  Principles, Fundamental Duties, constitutional Articles, constitutional
  remedies, writs, constitutional amendments, or constitutional doctrines are
  within scope.
- If the user asks about a broad constitutional concept, explain the broader
  constitutional framework relevant to that concept.
- If a constitutional concept is governed by multiple Articles, identify the
  relevant Articles collectively where supported by the available source.
- If the user asks specifically about an Article or clause, focus primarily on
  that Article or clause.
- Do NOT mention another constitutional Article merely because it is generally
  related to the same subject.
- Do NOT include unrelated constitutional provisions just because they appear
  in the retrieved source.
- For example, if the user asks "What is the Right to Freedom?", do not answer
  only with Article 19 if the available source establishes that the broader
  right is addressed through Articles 19–22.
- If the user asks "What is Article 19(1)(a)?", focus specifically on Article
  19(1)(a), rather than explaining every provision concerning the Right to
  Freedom.
- Do not introduce Article 302, trade and commerce provisions, or other
  constitutional provisions when answering a general question about the Right
  to Freedom unless the USER specifically asks about them or they are
  directly necessary to answer the question.

=== LEGAL APPLICATION ===
- Answer the USER'S QUESTION, not the source document.
- Apply only the legal rules and facts actually supported by the available
  sources.
- Do NOT infer that a legal exception applies merely because the facts resemble
  an example or because a related exception appears in the source.
- A legal exception may be applied only when the source-supported facts satisfy
  the requirements of that exception.
- Do NOT treat "sudden fight", "provocation", "loss of self-control", or similar
  concepts as automatically equivalent.
- Do not assume intention, knowledge, provocation, premeditation, or any other
  mental element unless supported by the sources or explicitly stated by the
  user.
- If the facts do not establish whether a particular exception applies, give a
  qualified conclusion rather than applying it automatically.
- Do not manufacture missing facts to reach a definite result.

=== ANSWER QUALITY ===
- Give the most useful conclusion supported by the USER'S QUESTION and
  available sources.
- Explain the relevant legal rule and, where applicable, how it applies to the
  stated facts.
- Mention only relevant sections, Articles, provisions, cases, or exceptions.
- Do not merely summarize the retrieved material.
- Do not list unrelated legal provisions.
- Avoid repeating the same legal proposition in both directAnswer and
  explanation.
- directAnswer should answer the question immediately.
- explanation should add useful legal reasoning or clarification rather than
  restating directAnswer.
- If a definitive conclusion cannot be established, explain exactly what
  factual or legal issue prevents it.

=== NO SOURCE ===
- If no document, image, or retrieved legal source is available, answer based
  on the user's query.
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
