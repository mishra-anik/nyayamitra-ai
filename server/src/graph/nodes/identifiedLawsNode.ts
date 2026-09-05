import { LegalStateType } from "../state/legalState.js";
import { llm } from "../../llm/gemini.js";
import z from "zod";

const availableLaws = [
  "THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023",
  "THE BHARATIYA SAKSHYA ADHINIYAM, 2023",
  "THE BHARATIYA NYAYA SANHITA, 2023",
];

const LegalResponseSchema = z.object({
  identifiedLaws: z
    .array(z.enum(availableLaws))
    .describe("Relevant laws only."),

  searchQueries: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("Precise legal RAG queries."),

  legalKeywords: z
    .array(z.string())
    .min(5)
    .max(15)
    .describe("Important legal retrieval terms."),
});

export const identifiedLaws = async (state: LegalStateType) => {
  const prompt = `
You are a legal RAG query classifier.

AVAILABLE LAWS (use exact names only):
${availableLaws.map((law, i) => `${i + 1}. ${law}`).join("\n")}

TASK:
Analyze the USER REQUEST and DOCUMENT. Return:
- identifiedLaws: relevant laws only
- searchQueries: 3-5 precise RAG queries
- legalKeywords: 5-15 retrieval keywords

LAW CLASSIFICATION:
- BNSS = criminal PROCEDURE: arrest, FIR, investigation, search/seizure, remand, custody, bail procedure, warrants, summons, cognizance, trial procedure.
- BSA = EVIDENCE: admissibility, relevance, burden of proof, confession, admission, witnesses, documents, electronic/digital evidence, expert evidence, presumptions.
- BNS = substantive CRIMINAL OFFENCES: murder, rape, theft, cheating, assault, kidnapping, abetment, conspiracy, attempt, organised crime, terrorism, ingredients and punishment.

IMPORTANT:
- Use only the exact laws listed above.
- Classify by the PRIMARY legal issue, not merely words appearing in the document.
- Do not add unrelated laws.
- A procedure question about an offence = BNSS, not automatically BNS.
- An evidence/admissibility question = BSA.
- An offence/ingredients/punishment question = BNS.
- Multiple laws only when the request genuinely requires multiple laws.
- Do not invent section numbers. Use a section number only if explicitly provided.
- Queries must target the identified law and specific legal issue.
- If no available law is relevant, identifiedLaws must be [].
- Return only structured output.

USER REQUEST:
${state.inputMessage?.trim() || "None"}

DOCUMENT:
${state.documentText?.trim() || "None"}
`;

  const structuredLlm = llm.withStructuredOutput(LegalResponseSchema);

  const res = await structuredLlm.invoke(prompt);

  return { identifiedLaws: res };
};
