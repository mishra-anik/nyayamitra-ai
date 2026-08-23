import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY!,
  modelName: "gemini-embedding-2",
});

const vectorStore = await PGVectorStore.initialize(embeddings, {
  postgresConnectionOptions: {
    connectionString: process.env.DATABASE_URL,
  },
  tableName: "legal_documents_rag",
  columns: {
    idColumnName: "id",
    vectorColumnName: "vector",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
});

export const vectorEmbed = async (documents: Document[]) => {
  console.log("Embedding documents...");

  const BATCH_SIZE = 10;
  console.log(documents.length);
  documents = documents.filter(
    (doc) =>
      doc &&
      typeof doc.pageContent === "string" &&
      doc.pageContent.trim() !== "",
  );

  for (let i =  952; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    console.log(`Processing documents ${i} - ${i + batch.length - 1}`);
    await vectorStore.addDocuments(batch);
    console.log(i);
  }

  console.log("Documents embedded successfully");
};

export const vectorSearch = async (query: string) => {
  const retriever = vectorStore.asRetriever({
    k: 3,
    searchType: "similarity",
  });

  const results = await retriever.invoke(query);
console.log("rag query" , results)
  const retrievedData = results
    .map((doc, index) => {
      return `
     DOCUMENT ${index + 1}:
     ${doc.pageContent}
     `;
    })
    .join("\n---\n");

  return retrievedData;
};
