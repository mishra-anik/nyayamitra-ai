import { END, START, StateGraph } from "@langchain/langgraph";
import { identifiedLaws } from "./nodes/identifiedLawsNode.js";
import { finalResponse } from "./nodes/finalAnswerNode.js";
import { parseDocument } from "./nodes/parseDocumentNode.js";
import { retrievedSections } from "./nodes/retrievedSectionsNode.js";
import { LegalState, LegalStateType } from "./state/legalState.js";
import { analyseQuery } from "./nodes/analyseQueryNode.js";

export const legalGraph = new StateGraph(LegalState)
  .addNode("analysis", analyseQuery)
  .addNode("parseDocument", parseDocument)
  .addNode("identifyLaws", identifiedLaws)
  .addNode("retrieveSections", retrievedSections)
  .addNode("finalResponse", finalResponse)

  .addEdge(START, "analysis")

  .addConditionalEdges("analysis", routerQuery, {
    legalWithDocument: "parseDocument",
    legalWithoutDocument: "identifyLaws",
    end: END,
  })

  .addEdge("parseDocument", "identifyLaws")
  .addEdge("identifyLaws", "retrieveSections")
  .addEdge("retrieveSections", "finalResponse")
  .addEdge("finalResponse", END)

  .compile();

function routerQuery(state: LegalStateType) {
  if (!state.analyseSection.isRelatedToTask) {
    return "end";
  }

  if (state.document) {
    return "legalWithDocument";
  }

  return "legalWithoutDocument";
}
