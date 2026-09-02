import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
const standardFontDataUrl = new URL("../../node_modules/pdfjs-dist/standard_fonts/", import.meta.url).pathname;
export const documentParse = async (fileBuffer, fileName) => {
    const data = new PDFParse({
        data: fileBuffer,
        standardFontDataUrl,
    });
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const documentText = await data.getText();
    const rawDocumentsPromises = documentText.pages.map(async (page) => {
        const cleanedText = page.text
            .replace(/\n/g, " ")
            .replace(/[^a-zA-Z0-9 .,?"]/g, "")
            .replace(/ {2,}/g, " ")
            .trim();
        const chunks = await splitter.splitText(cleanedText);
        return chunks.map((chunk) => new Document({
            pageContent: chunk,
            metadata: {
                pageNumber: page.num,
                fileName,
            },
        }));
    });
    const rawDocuments = (await Promise.all(rawDocumentsPromises)).flat();
    return rawDocuments;
};
