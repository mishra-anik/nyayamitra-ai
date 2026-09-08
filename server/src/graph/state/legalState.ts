import { Annotation } from "@langchain/langgraph";

export interface LegalDocument {
  fileName: string;
  size: number;
  type: "pdf" | "doc" | "docx";
  fileBuffer: Uint8Array;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: string;
  documentName?: string;
  documentText?: string;
}

export const formatChatHistory = (chatHistory: ChatMessage[]): string => {
  if (chatHistory.length === 0) {
    return "No previous conversation.";
  }

  return chatHistory
    .map((message) => {
      const attachmentContext = [
        message.image ? "IMAGE ATTACHED" : "",
        message.documentName ? `DOCUMENT: ${message.documentName}` : "",
        message.documentText ? `DOCUMENT TEXT:\n${message.documentText}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      return [
        `${message.role.toUpperCase()}: ${message.content}`,
        attachmentContext,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
};

export const chatHistoryInstructions = (chatHistory: ChatMessage[]): string => `
  === PREVIOUS CONVERSATION ===
  The conversation below contains previous user messages and assistant answers.
  Use it as context when the current request refers to earlier messages, a
  previous answer, chat history, or the user's first question. Do not claim that
  chat history is unavailable when previous messages are present.

  ${formatChatHistory(chatHistory)}
  `;

interface IdentifiedLawType {
  identifiedLaws: string[];
  searchQueries: string[];
  legalKeywords: string[];
}
interface FinalAnswer {
  directAnswer?: string;
  explanation?: string;
}

interface QueryAnalysisState {
  isRelatedToTask: boolean;
  isImageLegal: boolean;
  queryType:
    | "criminal_procedure"
    | "evidence"
    | "substantive_crime"
    | "constitutional"
    | "mixed"
    | "general_legal"
    | "irrelevant";
  mainIssues: string[];
  hasDocument: boolean;
  analysisRequired: string;
  reason: string;
}

export const LegalState = Annotation.Root({
  inputMessage: Annotation<string>({
    reducer: (_current, update) => update,
    default: () => "",
  }),

  chatHistory: Annotation<ChatMessage[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),

  image: Annotation<string | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),

  document: Annotation<LegalDocument | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),

  documentText: Annotation<string>({
    reducer: (_current, update) => update,
    default: () => "",
  }),
  analyseSection: Annotation<QueryAnalysisState>({
    reducer: (_current, update) => update,
    default: () => ({
      isRelatedToTask: false,
      isImageLegal: false,
      queryType: "irrelevant",
      mainIssues: [],
      hasDocument: false,
      analysisRequired: "",
      reason: "",
    }),
  }),

  identifiedLaws: Annotation<IdentifiedLawType | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),

  retrievedSections: Annotation<string>({
    reducer: (_current, update) => update,
    default: () => "",
  }),

  finalAnswer: Annotation<FinalAnswer>({
    reducer: (_current, update) => update,
    default: () => ({}),
  }),
});

export type LegalStateType = typeof LegalState.State;
