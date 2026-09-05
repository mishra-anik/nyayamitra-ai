import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { Document } from "@langchain/core/documents";
import { LegalStateType } from "../state/legalState.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export const parseDocument = async (
  state: LegalStateType,
): Promise<{ documentText: string }> => {
  if (!state.document) {
    return { documentText: "" };
  }
  const { fileName, type, fileBuffer } = state.document;

  const documents: Document[] = [];

  switch (type) {
    case "pdf": {
      const data = new PDFParse({
        data: fileBuffer,
      });

      try {
        const result = await data.getText();

        for (const page of result.pages) {
          const cleanedText = cleanText(page.text);

          if (!cleanedText) {
            continue;
          }

          const chunks = await splitter.splitText(cleanedText);

          for (const chunk of chunks) {
            documents.push(
              new Document({
                pageContent: chunk,
                metadata: {
                  pageNumber: page.num,
                  fileName,
                  fileType: type,
                },
              }),
            );
          }
        }
      } finally {
        await data.destroy();
      }

      break;
    }

    case "docx": {
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(fileBuffer),
      });

      const cleanedText = cleanText(result.value);

      if (cleanedText) {
        const chunks = await splitter.splitText(cleanedText);

        for (const chunk of chunks) {
          documents.push(
            new Document({
              pageContent: chunk,
              metadata: {
                fileName,
                fileType: type,
              },
            }),
          );
        }
      }

      break;
    }

    case "doc": {
      throw new Error(
        "DOC files are not supported directly. Convert DOC to DOCX first.",
      );
    }

    default:
      throw new Error(`Unsupported document type: ${type}`);
  }

  const documentText = documents
    .map((doc, index) => `DOCUMENT ${index + 1}:\n${doc.pageContent}`)
    .join("\n---\n");

  return { documentText };
};

function cleanText(text: string): string {
  return text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}
