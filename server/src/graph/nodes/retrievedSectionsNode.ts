import { vectorStore } from "../../rag/embeddings.js";
import { LegalStateType } from "../state/legalState.js";

const retriever = vectorStore.asRetriever({
  k: 3,
  searchType: "mmr",
  searchKwargs: {
    fetchK: 20,
    lambda: 0.7,
  },
});

export const retrievedSections = async (
  state: LegalStateType,
): Promise<{ retrievedSections: string }> => {
  const lawData = state.identifiedLaws;

  if (!lawData?.identifiedLaws?.length) {
    return { retrievedSections: "" };
  }

  const { identifiedLaws, searchQueries } = lawData;

  // Use focused legal queries instead of searching every keyword separately.
  const queries = identifiedLaws.length
    ? identifiedLaws.flatMap((law) =>
        searchQueries.map((query) => `${law} — ${query}`),
      )
    : searchQueries;

  const results = await Promise.all(
    queries.map((query) => retriever.invoke(query)),
  );

  const documents = results.flat();

  // Remove duplicate chunks.
  const uniqueDocuments = Array.from(
    new Map(
      documents.map((doc) => [
        `${doc.metadata.fileName ?? ""}:${doc.metadata.pageNumber ?? ""}:${doc.pageContent}`,
        doc,
      ]),
    ).values(),
  );

  const formattedDocuments = uniqueDocuments
    .map(
      (doc, index) =>
        `DOCUMENT ${index + 1}:
${doc.pageContent}`,
    )
    .join("\n---\n");

  return {
    retrievedSections: formattedDocuments,
  };
};
