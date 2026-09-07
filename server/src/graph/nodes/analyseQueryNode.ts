import { LegalStateType } from "../state/legalState.js";
import { llm } from "../../llm/gemini.js";
import z from "zod";

const QueryAnalysisSchema = z.object({
  isRelatedToTask: z
    .boolean()
    .describe(
      "Whether the query is related to Indian law, including the Constitution of India, criminal law, criminal procedure, evidence law, or legal document analysis.",
    ),

  isImageLegal: z
    .boolean()
    .describe(
      "Whether the attached image visibly contains legal content such as the Constitution, statute, Act, section, court document, FIR, notice, judgment, order, legal text, or other legal material. Return false for random or non-legal images.",
    ),

  queryType: z
    .enum([
      "constitutional_law",
      "criminal_procedure",
      "evidence",
      "substantive_crime",
      "mixed",
      "general_legal",
      "irrelevant",
    ])
    .describe("The primary type of Indian legal query."),

  mainIssues: z
    .array(z.string())
    .describe("Key legal issues identified in the query."),

  hasDocument: z
    .boolean()
    .describe("Whether the user is asking about a specific uploaded document."),

  analysisRequired: z
    .string()
    .describe("What kind of legal analysis is needed."),

  reason: z
    .string()
    .describe("Explanation of why the query is or is not within scope."),
});

const availableLaws = [
  "THE CONSTITUTION OF INDIA",
  "THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023",
  "THE BHARATIYA SAKSHYA ADHINIYAM, 2023",
  "THE BHARATIYA NYAYA SANHITA, 2023",
];

const generateGeneralResponse = async (inputMessage: string) => {
  const response = await llm.invoke(`
You are Nyayamitra AI, a friendly Indian legal information assistant.

Respond naturally and briefly to the user's message. If it is a greeting,
small-talk message, or request unrelated to Indian law, answer helpfully in
one or two sentences. If it appears to ask for legal information, explain
that you can help with the Constitution of India, Indian criminal law,
criminal procedure, evidence law, and Indian legal document analysis.

Do not invent legal advice, claim to have analyzed a document that was not
provided, or mention this classification process.

USER MESSAGE:
${inputMessage}
`);

  if (typeof response.content === "string") {
    return response.content;
  }

  return response.content
    .map((part) =>
      typeof part === "string" ? part : "text" in part ? part.text : "",
    )
    .join("");
};

export const analyseQuery = async (state: LegalStateType) => {
  const normalizedInput = state.inputMessage.trim().toLowerCase();

  const isGreeting =
    /^(hi|hello|hey|hii|good morning|good afternoon|good evening)[!.?]*$/.test(
      normalizedInput,
    );

  if (isGreeting && !state.document && !state.image) {
    const finalAnswer = await generateGeneralResponse(state.inputMessage);

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

      finalAnswer,
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

If the user says:
- "explain this"
- "explain me"
- "what is this?"
- "tell me about this"
- "summarize this"
- "analyze this"
- "what does this mean?"
- "help me understand this"

then treat the request as referring to the uploaded document.

Determine whether the document contains Indian legal content, including:
- Constitution of India
- Constitutional Articles
- Acts and statutes
- Criminal law
- Criminal procedure
- Evidence law
- Court orders or judgments
- FIRs
- Police documents
- Notices
- Summons
- Charge sheets
- Complaints
- Legal agreements
- Other legal documents
`
    : state.image
      ? `
An image is attached.

IMPORTANT:
You MUST inspect the image itself before deciding whether the request is
related to the chatbot's legal scope.

Determine whether the image contains identifiable legal content such as:
- Constitution of India
- Constitutional Article
- Act or statute
- Legal section
- Court document
- Judgment
- Court order
- FIR
- Police document
- Legal notice
- Summons
- Charge sheet
- Complaint
- Agreement
- Other legal material

Do NOT assume an image is legal merely because the user's wording contains
legal terminology.

Set isImageLegal to false for:
- Ordinary photographs
- People
- Animals
- Food
- Scenery
- Random screenshots
- Non-legal documents
- Unclear images without identifiable legal content
`
      : "No document or image provided by user.";

  const prompt = `
You are an Indian legal query classifier for a legal-information chatbot.

The chatbot's scope includes:

1. Constitution of India
2. Indian criminal law
3. Indian criminal procedure
4. Indian evidence law
5. Indian legal statutes
6. Indian legal document analysis

Determine whether the user's request is within this scope.

==================================================
CONSTITUTION OF INDIA
==================================================

Questions relating to the Constitution of India MUST be treated as
constitutional_law.

Examples include questions about:

- Fundamental Rights
- Right to Equality
- Right to Freedom
- Right against Exploitation
- Right to Freedom of Religion
- Cultural and Educational Rights
- Right to Constitutional Remedies
- Article 12
- Article 13
- Article 14
- Article 15
- Article 16
- Article 17
- Article 18
- Article 19
- Article 20
- Article 21
- Article 21A
- Article 22
- Article 23
- Article 24
- Article 25
- Article 26
- Article 27
- Article 28
- Article 29
- Article 30
- Article 32
- Article 226
- Directive Principles of State Policy
- Fundamental Duties
- Constitutional amendments
- Basic Structure Doctrine
- Judicial review
- Separation of powers
- Federalism
- Parliamentary system
- President and Governor
- Parliament and State Legislatures
- Supreme Court and High Courts
- Constitutional writs
- Habeas Corpus
- Mandamus
- Prohibition
- Certiorari
- Quo Warranto
- Emergency provisions
- Citizenship provisions
- Constitutional interpretation
- Constitutional validity of laws

Examples:

"What is Article 21?"
"What is right to freedom?"
"What are Fundamental Rights?"
"Explain Article 19."
"What is the Right to Equality?"
"Can the government restrict my fundamental rights?"
"What is habeas corpus?"
"Which article provides constitutional remedies?"
"What is basic structure doctrine?"

These should be classified as:

queryType = "constitutional_law"

==================================================
CRIMINAL LAW
==================================================

BNS → substantive criminal offences, definitions, punishments, liability,
criminal acts, offences, exceptions, etc.

BNSS → criminal procedure, FIR, arrest, bail, investigation, remand,
search, seizure, charge sheet, trial, summons, warrants, etc.

BSA → evidence, witnesses, documents, electronic evidence, admissibility,
relevancy, burden of proof, presumptions, confessions, etc.

==================================================
QUERY CLASSIFICATION
==================================================

Use these query types:

constitutional_law
- Constitution of India and constitutional provisions.

criminal_procedure
- BNSS and criminal procedural matters.

evidence
- BSA and Indian evidence-law matters.

substantive_crime
- BNS and substantive criminal offences.

mixed
- The query materially involves two or more legal areas.

general_legal
- Indian legal matters within the chatbot's general legal scope that
  do not clearly belong to the specific categories above.

irrelevant
- Non-legal or out-of-scope requests.

==================================================
DECISION RULES
==================================================

1. First determine whether the user is asking about Indian law or a legal
   document.

2. Questions about the Constitution of India are ALWAYS within scope.

3. If the user uses informal wording, infer the likely legal meaning.

For example:
- "what freedom of right"
- "freedom right"
- "right of freedom"
- "what is freedom in constitution"
- "freedom fundamental right"

These should be understood as likely referring to the
"Right to Freedom" under the Constitution of India and classified as
constitutional_law.

4. Do not require the user to provide an Article number.

5. If the user asks about a Fundamental Right without specifying an Article,
   classify it as constitutional_law.

6. If the user asks about an Article of the Constitution, classify it as
   constitutional_law unless the question clearly concerns another legal
   issue.

7. If the query involves both constitutional rights and criminal law,
   procedure, or evidence, use "mixed" when both areas are materially
   relevant.

8. Do not classify a query as legal merely because it contains words such as
   "law", "case", "section", "right", or "document". Judge the complete
   meaning.

9. A greeting, farewell, thanks, introduction, small talk, coding question,
   mathematics question, cooking question, sports question, weather
   question, or other unrelated question is out of scope.

10. If an uploaded legal document is being explained, summarized, analyzed,
    or reviewed, classify it as a legal query.

11. If an image contains legal material, set isImageLegal to true.

12. If an image is unrelated to law, set isImageLegal to false.

13. Do not answer the user's legal question. Only classify and analyze it.

==================================================
AVAILABLE LAWS
==================================================

${availableLaws.map((law) => `- ${law}`).join("\n")}

==================================================
DOCUMENT
==================================================

${documentInfo}

==================================================
IMAGE
==================================================

${
  state.image
    ? "An image is attached and must be inspected."
    : "No image uploaded."
}

==================================================
USER QUERY
==================================================

"${state.inputMessage}"

Return the structured result according to the provided schema.
`;

  const structuredLlm = llm.withStructuredOutput(QueryAnalysisSchema);

  const content = state.image
    ? [
        { type: "text" as const, text: prompt },
        { type: "image_url" as const, image_url: state.image },
      ]
    : prompt;

  const response = await structuredLlm.invoke([
    {
      role: "user",
      content,
    },
  ]);

  if (!response.isRelatedToTask) {
    const finalAnswer = await generateGeneralResponse(state.inputMessage);

    return {
      analyseSection: response,
      finalAnswer,
    };
  }

  return {
    analyseSection: response,
  };
};
