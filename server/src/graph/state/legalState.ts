import { Annotation } from "@langchain/langgraph";
import { Document } from "@langchain/core/documents";

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

  identifiedLaws: Annotation<IdentifiedLawType | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),

  retrievedSections: Annotation<string>({
    reducer: (_current, update) => update,
    default: () => "",
  }),

  finalAnswer: Annotation<string>({
    reducer: (_current, update) => update,
    default: () => "",
  }),
});

export type LegalStateType = typeof LegalState.State;
