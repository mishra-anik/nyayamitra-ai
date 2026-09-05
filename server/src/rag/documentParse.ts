import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

const LAW_METADATA = {
  BNSS: {
    code: "BNSS",
    name: "THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023",
    domain: "criminal",
  },
  BNS: {
    code: "BNS",
    name: "THE BHARATIYA NYAYA SANHITA, 2023",
    domain: "criminal",
  },
  BSA: {
    code: "BSA",
    name: "THE BHARATIYA SAKSHYA ADHINIYAM, 2023",
    domain: "evidence",
  },
} as const;

type LegalSection = {
  section?: string;
  sectionTitle?: string;
  text: string;
  pageNumber?: number;
};

function detectLaw(fileName?: string) {
  const name = (fileName ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  if (
    name.includes("bnss") ||
    name.includes("bharatiya nagarik suraksha sanhita")
  ) {
    return LAW_METADATA.BNSS;
  }

  if (
    name.includes("bns") ||
    name.includes("bharatiya nyaya sanhita")
  ) {
    return LAW_METADATA.BNS;
  }

  if (
    name.includes("bsa") ||
    name.includes("bharatiya sakshya adhiniyam")
  ) {
    return LAW_METADATA.BSA;
  }

  return null;
}


function cleanText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, " ")
    .trim();
}

function extractSections(
  pages: { text: string; num: number }[],
): LegalSection[] {
  const sections: LegalSection[] = [];

  let currentSection: LegalSection | null = null;

  for (const page of pages) {
    const text = page.text.replace(/\r/g, "\n").trim();

    if (!text) continue;

    /*
     * Only match section numbers at the
     * beginning of a line.
     *
     * Example:
     * 35. When police may arrest...
     */
    const regex = /(?:^|\n)\s*(\d{1,3})\.\s+([^\n]*)/gm;

    const matches = [...text.matchAll(regex)];

    /*
     * No new section on this page.
     * Add it to the previous section.
     */
    if (!matches.length) {
      if (currentSection) {
        currentSection.text += " " + cleanText(text);
      }

      continue;
    }

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];

      const sectionNumber = match[1];

      if (!sectionNumber) continue;

      const start = match.index ?? 0;

      const end =
        i + 1 < matches.length
          ? (matches[i + 1].index ?? text.length)
          : text.length;

      const sectionText = cleanText(text.slice(start, end));

      /*
       * Save previous section.
       */
      if (currentSection) {
        currentSection.text = cleanText(currentSection.text);

        sections.push(currentSection);
      }

      /*
       * Extract title.
       */
      const titleMatch = sectionText.match(
        new RegExp(`^${sectionNumber}\\.\\s+(.+?)(?:\\.|—|–|-|\\(1\\)|$)`),
      );

      currentSection = {
        section: sectionNumber,

        sectionTitle: titleMatch?.[1]?.trim(),

        text: sectionText,

        pageNumber: page.num,
      };
    }
  }

  /*
   * Save last section.
   */
  if (currentSection) {
    currentSection.text = cleanText(currentSection.text);

    sections.push(currentSection);
  }

  return sections;
}

export const documentParse = async (
  fileBuffer: Uint8Array,
  fileName?: string,
): Promise<Document[]> => {
  /*
   * Detect law.
   */
  const law = detectLaw(fileName);

  if (!law) {
    throw new Error(`Could not detect law from filename: ${fileName}`);
  }

  /*
   * Check PDF.
   */
  if (!fileBuffer.length) {
    throw new Error("PDF buffer is empty");
  }

  /*
   * Parse PDF.
   */
  const parser = new PDFParse({
    data: Buffer.from(fileBuffer),
  });

  const result = await parser.getText();

  /*
   * Get pages.
   */
  const pages = Array.isArray(result.pages) ? result.pages : [];

  /*
   * Extract legal sections.
   */
  let sections = extractSections(pages);

  /*
   * Fallback if sections aren't detected.
   */
  if (!sections.length) {
    const text = cleanText(result.text ?? "");

    if (text) {
      sections = [
        {
          text,
        },
      ];
    }
  }

  /*
   * Text splitter.
   */
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1200,
    chunkOverlap: 200,

    separators: ["\n\n", "\n", ". ", "; ", ", ", " ", ""],
  });

  /*
   * Create LangChain documents.
   */
  const documents: Document[] = [];

  for (const section of sections) {
    const chunks = await splitter.splitText(section.text);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      documents.push(
        new Document({
          pageContent: chunks[chunkIndex],

          metadata: {
            law: law.code,
            section: section.section ?? null,
            sectionTitle: section.sectionTitle ?? null,
            pageNumber: section.pageNumber ?? null,
            fileName: fileName ?? null,
          },
        }),
      );
    }
  }

  /*
   * Clean up parser.
   */
  if (typeof (parser as any).destroy === "function") {
    await (parser as any).destroy();
  }

  return documents;
};
