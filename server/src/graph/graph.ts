import { END, START, StateGraph } from "@langchain/langgraph";
import { identifiedLaws } from "./nodes/identifiedLawsNode.js";
import { finalResponse } from "./nodes/finalAnswerNode.js";
import { parseDocument } from "./nodes/parseDocumentNode.js";
import { retrievedSections } from "./nodes/retrievedSectionsNode.js";
import { LegalState } from "./state/legalState.js";

export const legalGraph = new StateGraph(LegalState)
  .addNode("parseDocument", parseDocument)
  .addNode("identifyLaws", identifiedLaws)
  .addNode("retrieveSections", retrievedSections)
  .addNode("finalResponse", finalResponse)
  .addEdge(START, "parseDocument")
  .addEdge("parseDocument", "identifyLaws")
  .addEdge("identifyLaws", "retrieveSections")
  .addEdge("retrieveSections", "finalResponse")
  .addEdge("finalResponse", END)
  .compile();
