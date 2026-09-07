import { Annotation } from "@langchain/langgraph";

export interface LegalDocument {
  fileName: string;
  size: number;
  type: "pdf" | "doc" | "docx";
  fileBuffer: Uint8Array;
}

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
