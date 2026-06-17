import type { SourceType } from "../types";

/**
 * Local, in-browser ingestion. Nothing is uploaded to a server.
 *
 * - Plain text / Markdown / CSV: read directly.
 * - PDF: text extracted with pdf.js (runs in a Web Worker).
 * - Images: OCR with tesseract.js.
 *
 * pdf.js and tesseract.js are imported dynamically so they only load when a
 * user actually ingests a file — keeping the initial app bundle small.
 *
 * Note: tesseract.js downloads its OCR engine + language data on first use,
 * so OCR requires a network connection the first time. PDF and text parsing
 * are fully offline.
 */

export type IngestKind = "text" | "pdf" | "image";

export interface IngestResult {
  text: string;
  kind: IngestKind;
  /** A reasonable default SourceType for the imported content. */
  suggestedType: SourceType;
}

export type ProgressFn = (stage: string, pct?: number) => void;

const TEXT_EXT = ["txt", "md", "markdown", "csv", "tsv", "text", "json"];
const IMAGE_EXT = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff"];

function ext(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function isIngestable(file: File): boolean {
  const e = ext(file.name);
  return (
    file.type.startsWith("text/") ||
    file.type === "application/pdf" ||
    file.type.startsWith("image/") ||
    e === "pdf" ||
    TEXT_EXT.includes(e) ||
    IMAGE_EXT.includes(e)
  );
}

export async function extractTextFromFile(file: File, onProgress?: ProgressFn): Promise<IngestResult> {
  const e = ext(file.name);
  const isPdf = file.type === "application/pdf" || e === "pdf";
  const isImage = file.type.startsWith("image/") || IMAGE_EXT.includes(e);

  if (isPdf) {
    onProgress?.("Loading PDF engine…");
    const text = await extractPdf(file, onProgress);
    return { text, kind: "pdf", suggestedType: "lecture-notes" };
  }

  if (isImage) {
    onProgress?.("Loading OCR engine…");
    const text = await extractImage(file, onProgress);
    return { text, kind: "image", suggestedType: "graph-image" };
  }

  // Default: treat as plain text.
  onProgress?.("Reading file…");
  const text = await file.text();
  return { text, kind: "text", suggestedType: "lecture-notes" };
}

async function extractPdf(file: File, onProgress?: ProgressFn): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Vite resolves this to a hashed URL string for the worker bundle.
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    onProgress?.(`Extracting page ${p}/${doc.numPages}…`, p / doc.numPages);
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (line) pages.push(`[Page ${p}]\n${line}`);
  }

  await doc.cleanup();
  const out = pages.join("\n\n").trim();
  if (!out) {
    throw new Error("No selectable text found — this PDF may be scanned. Export the page as an image to OCR it instead.");
  }
  return out;
}

async function extractImage(file: File, onProgress?: ProgressFn): Promise<string> {
  const Tesseract = (await import("tesseract.js")).default;
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: (m: { status?: string; progress?: number }) => {
      if (m.status === "recognizing text") onProgress?.("Recognizing text…", m.progress);
      else if (m.status) onProgress?.(m.status);
    },
  });
  const text = (data.text || "").trim();
  if (!text) throw new Error("No text detected in the image.");
  return text;
}
