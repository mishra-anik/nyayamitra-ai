import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
// Initialize embeddings model
export const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    modelName: "gemini-embedding-2",
});
// Initialize vector store
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
const BATCH_SIZE = 10;
/**
 * Embeds documents into the vector store in batches
 */
export const vectorEmbed = async (documents) => {
    console.log("Embedding documents...");
    console.log(`Total documents to process: ${documents.length}`);
    // Filter out invalid documents
    const validDocuments = documents.filter((doc) => doc &&
        typeof doc.pageContent === "string" &&
        doc.pageContent.trim() !== "");
    // Process documents in batches
    for (let i = 940; i < validDocuments.length; i += BATCH_SIZE) {
        const batch = validDocuments.slice(i, i + BATCH_SIZE);
        console.log(`Processing documents ${i} - ${i + batch.length - 1}`);
        await vectorStore.addDocuments(batch);
    }
    console.log("Documents embedded successfully");
};
/**
 * Searches for relevant legal documents based on a query
 */
export const vectorSearch = async (query) => {
    const retriever = vectorStore.asRetriever({
        k: 5,
        searchType: "similarity",
    });
    const results = await retriever.invoke(query);
    const retrievedData = results
        .map((doc, index) => `DOCUMENT ${index + 1}:\n${doc.pageContent}`)
        .join("\n---\n");
    return retrievedData;
};
