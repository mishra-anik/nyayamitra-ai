import { LegalStateType } from "../state/legalState.js";
import { llm } from "../../llm/gemini.js";
import z from "zod";

const QueryAnalysisSchema = z.object({
  isRelatedToTask: z
    .boolean()
    .describe(
      "Whether the query is related to legal analysis/Indian legal matters",
    ),
  isImageLegal: z
    .boolean()
    .describe(
      "Whether the attached image visibly contains legal content such as a law, act, section, court document, FIR, notice, judgment, or legal text. Return false for random or non-legal images.",
    ),
  queryType: z
    .enum([
      "criminal_procedure",
      "evidence",
      "substantive_crime",
      "mixed",
      "general_legal",
      "irrelevant",
    ])
    .describe("The primary type of legal query"),
  mainIssues: z
    .array(z.string())
    .describe("Key legal issues identified in the query"),
  hasDocument: z
    .boolean()
    .describe("Whether the user is asking about a specific document"),
  analysisRequired: z
    .string()
    .describe("What kind of legal analysis is needed"),
  reason: z
    .string()
    .describe("Explanation of whether query is related to task"),
});

const availableLaws = [
  "THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023",
  "THE BHARATIYA SAKSHYA ADHINIYAM, 2023",
  "THE BHARATIYA NYAYA SANHITA, 2023",
];

export const analyseQuery = async (state: LegalStateType) => {
  const normalizedInput = state.inputMessage.trim().toLowerCase();
  const isGreeting =
    /^(hi|hello|hey|hii|good morning|good afternoon|good evening)[!.?]*$/.test(
      normalizedInput,
    );

  if (isGreeting && !state.document) {
    return {
      analyseSection: {
        isRelatedToTask: false,
        isImageLegal: false,
        queryType: "irrelevant" as const,
        mainIssues: [],
        hasDocument: false,
        analysisRequired: "",
        reason: "The user sent a greeting rather than a legal question.",
      },
      finalAnswer:
        "Hello! I am Nyayamitra AI, your Indian legal information assistant. How can I assist you with Indian law today?",
    };
  }

  const documentInfo = state.document
    ? `
A document is attached:
- File name: ${state.document.fileName}
- File type: ${state.document.type}
- File size: ${state.document.size}

IMPORTANT:
The user's query may be vague or may not explicitly mention the document.
You MUST inspect/analyze the document content when it is available.

If the user says things such as:
- "explain this"
- "explain me"
- "what is this?"
- "tell me about this"
- "summarize this"
- "analyze this"
- "what does this mean?"
- "help me understand this"

then treat the request as referring to the uploaded document and determine
whether the document contains legal content.

Do NOT classify the request based only on the user's text.
`
    : state.image
      ? `
An image is attached.

IMPORTANT:
You MUST inspect the image itself before deciding whether the request is
related to the chatbot's legal scope.

The user may use a vague query such as:
- "explain this"
- "what is this?"
- "tell me about this"
- "analyze this"
- "what does this mean?"

In these cases, determine what is shown in the image and whether it contains
legal content such as an FIR, notice, court document, legal order, statute,
section, complaint, agreement, police document, summons, charge sheet, or
other legal material.

Do NOT assume an image is legal merely because the user's wording contains
legal terms.
`
      : "No document or image provided by user.";

  const prompt = `
You are an Indian legal query classifier.

Determine whether the user's request is within the chatbot's scope:
- Indian criminal law
- Criminal procedure
- Indian evidence law
- Legal document analysis
- Indian legal statutes and interpretations

DECISION ORDER:
1. First decide whether the request is actually asking about Indian law or a
  legal document.
2. A greeting, farewell, thanks, introduction, small talk, or general
  non-legal question is OUT OF SCOPE.
3. Do not treat the words "law", "case", "section", or "document" alone as
  proof that the request is legal. Judge the complete meaning of the request.
4. If an uploaded document is present and the user asks to analyze, explain,
  summarize, or review it, classify the request as legal document analysis.
5. If an image is provided, inspect it before deciding. If the user asks
  which law, section, act, notice, or legal text is shown or mentioned in the
  image, classify the request as legal document analysis.
6. Set isImageLegal to true only when the image itself contains identifiable
  legal content. A user's legal wording does not make a random image legal.
  Set isImageLegal to false for ordinary photos, people, animals, scenery,
  food, screenshots without legal content, or unclear images.

OUT-OF-SCOPE EXAMPLES:
- "hi", "hello", "hey", "good morning"
- "how are you?", "thanks", "bye"
- cooking, weather, sports, coding, mathematics, or general trivia

For an out-of-scope request, set isRelatedToTask to false, queryType to
"irrelevant", mainIssues to [], hasDocument to false unless a document is
actually provided, and explain the decision in reason. Never classify a simple
greeting as a legal query.

Available laws:
${availableLaws.map((law) => `- ${law}`).join("\n")}

Classify the query and identify the relevant law(s).

Rules:
- BNS → substantive criminal offences and punishments
- BNSS → criminal procedure, FIR, arrest, bail, investigation, trial, etc.
- BSA → evidence, witnesses, documents, electronic evidence, burden of proof, etc.
- Select multiple laws when necessary.
- Do not invent or add laws.
- Mark unrelated questions as "irrelevant".
- Do not answer the legal question; only analyze it.

Document:
${documentInfo}

Image:
${state.image ? "An image is attached and must be inspected." : "No image uploaded."}

User query:
"${state.inputMessage}"

Return the structured result according to the schema.
`;

  const structuredLlm = llm.withStructuredOutput(QueryAnalysisSchema);
  const content = state.image
    ? [
        { type: "text" as const, text: prompt },
        { type: "image_url" as const, image_url: state.image },
      ]
    : prompt;
  const response = await structuredLlm.invoke([{ role: "user", content }]);

  if (!response.isRelatedToTask) {
    return {
      analyseSection: response,
      finalAnswer:
        "I can only help with Constitution of India Indian criminal law, evidence law, legal procedures, and legal document analysis.",
    };
  }

  return { analyseSection: response };
};
