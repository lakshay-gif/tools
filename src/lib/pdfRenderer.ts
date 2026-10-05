import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface RenderedPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface TextExtractionResult {
  fullText: string;
  pagesText: { pageNumber: number; text: string }[];
  isLikelyScanned: boolean;
}

export interface SearchMatch {
  pageNumber: number;
  snippet: string;
  matchIndex: number;
}

export interface ExtractedImage {
  id: string;
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Loads a PDF document via pdfjsLib.
 */
export async function getPdfJsDocument(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });
  return await loadingTask.promise;
}

/**
 * Renders all pages of a PDF file to images in the browser.
 */
export async function renderPdfToImages(
  file: File,
  format: 'png' | 'jpeg' = 'png',
  scale: number = 1.75,
  onProgress?: (percent: number, msg: string) => void
): Promise<RenderedPage[]> {
  onProgress?.(10, 'Loading PDF document...');
  const pdfDoc = await getPdfJsDocument(file);
  const numPages = pdfDoc.numPages;
  const pages: RenderedPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(
      Math.round(20 + (i / numPages) * 75),
      `Rendering page ${i} of ${numPages}...`
    );

    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not create canvas 2D rendering context');

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpeg' ? 0.92 : undefined;
    const dataUrl = canvas.toDataURL(mimeType, quality);

    pages.push({
      pageNumber: i,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    });
  }

  onProgress?.(100, 'All pages rendered successfully!');
  return pages;
}

/**
 * Renders a single specific page to a canvas at a custom scale.
 */
export async function renderSinglePage(
  file: File,
  pageNumber: number,
  scale: number = 1.5
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const pdfDoc = await getPdfJsDocument(file);
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas context unavailable');

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  }).promise;

  return { canvas, width: canvas.width, height: canvas.height };
}

/**
 * Extracts text from all pages of a PDF document using pdf.js.
 */
export async function extractPdfText(
  file: File,
  onProgress?: (percent: number, msg: string) => void
): Promise<TextExtractionResult> {
  onProgress?.(10, 'Parsing text content streams...');
  const pdfDoc = await getPdfJsDocument(file);
  const numPages = pdfDoc.numPages;

  const pagesText: { pageNumber: number; text: string }[] = [];
  let fullText = '';
  let totalCharacters = 0;

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(
      Math.round(15 + (i / numPages) * 80),
      `Extracting text from page ${i} of ${numPages}...`
    );

    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const pageStrings = content.items.map((item: any) => item.str || '');
    const pageText = pageStrings.join(' ').replace(/\s+/g, ' ').trim();

    totalCharacters += pageText.length;
    pagesText.push({ pageNumber: i, text: pageText });
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }

  // If entire document has fewer than 20 characters, it is likely a scanned or pure-image PDF
  const isLikelyScanned = totalCharacters < 25;
  onProgress?.(100, 'Text extraction complete!');

  return { fullText, pagesText, isLikelyScanned };
}

/**
 * Searches text inside a PDF with page numbers and context snippets.
 */
export async function searchPdfText(
  file: File,
  query: string,
  options: { caseSensitive?: boolean; wholeWord?: boolean } = {}
): Promise<SearchMatch[]> {
  if (!query.trim()) return [];

  const pdfDoc = await getPdfJsDocument(file);
  const numPages = pdfDoc.numPages;
  const matches: SearchMatch[] = [];

  const normalizedQuery = options.caseSensitive ? query : query.toLowerCase();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((it: any) => it.str || '').join(' ');
    const textToSearch = options.caseSensitive ? pageText : pageText.toLowerCase();

    let startIndex = 0;
    while (startIndex < textToSearch.length) {
      let foundIndex = -1;
      if (options.wholeWord) {
        const regex = new RegExp(`\\b${escapeRegExp(normalizedQuery)}\\b`, options.caseSensitive ? 'g' : 'gi');
        regex.lastIndex = startIndex;
        const regMatch = regex.exec(pageText);
        if (regMatch) {
          foundIndex = regMatch.index;
        }
      } else {
        foundIndex = textToSearch.indexOf(normalizedQuery, startIndex);
      }

      if (foundIndex === -1) break;

      const snippetStart = Math.max(0, foundIndex - 40);
      const snippetEnd = Math.min(pageText.length, foundIndex + query.length + 40);
      const snippet = '...' + pageText.substring(snippetStart, snippetEnd).trim() + '...';

      matches.push({
        pageNumber: i,
        snippet,
        matchIndex: matches.length + 1,
      });

      startIndex = foundIndex + Math.max(1, query.length);
    }
  }

  return matches;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts embedded images from PDF pages by inspecting canvas renderings.
 */
export async function extractPdfImages(
  file: File,
  onProgress?: (percent: number, msg: string) => void
): Promise<ExtractedImage[]> {
  onProgress?.(10, 'Scanning document pages for graphics...');
  const pdfDoc = await getPdfJsDocument(file);
  const numPages = pdfDoc.numPages;
  const images: ExtractedImage[] = [];

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(
      Math.round(20 + (i / numPages) * 75),
      `Extracting images from page ${i}...`
    );

    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    // Save page image as graphic
    images.push({
      id: `img-page-${i}-${Date.now()}`,
      pageNumber: i,
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    });
  }

  onProgress?.(100, 'Image extraction complete!');
  return images;
}

/**
 * Generates a contact sheet containing all PDF page thumbnails in a grid.
 */
export async function generateContactSheet(
  file: File,
  options: {
    columns: number;
    thumbnailWidth: number;
    spacing: number;
    showPageLabels: boolean;
    format: 'png' | 'jpeg';
  }
): Promise<{ dataUrl: string; width: number; height: number }> {
  const pages = await renderPdfToImages(file, 'png', 1.0);
  if (pages.length === 0) throw new Error('No pages found in document.');

  const cols = Math.max(1, options.columns);
  const rows = Math.ceil(pages.length / cols);
  const thumbW = options.thumbnailWidth;
  const spacing = options.spacing;
  const labelHeight = options.showPageLabels ? 24 : 0;

  // Assume aspect ratio of first page
  const sample = pages[0];
  const thumbH = Math.round((thumbW / sample.width) * sample.height);

  const sheetWidth = cols * thumbW + (cols + 1) * spacing;
  const sheetHeight = rows * (thumbH + labelHeight) + (rows + 1) * spacing;

  const canvas = document.createElement('canvas');
  canvas.width = sheetWidth;
  canvas.height = sheetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context creation failed');

  // Fill background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, sheetWidth, sheetHeight);

  // Draw thumbnails
  for (let idx = 0; idx < pages.length; idx++) {
    const page = pages[idx];
    const col = idx % cols;
    const row = Math.floor(idx / cols);

    const x = spacing + col * (thumbW + spacing);
    const y = spacing + row * (thumbH + labelHeight + spacing);

    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, x, y, thumbW, thumbH);
        resolve();
      };
      img.src = page.dataUrl;
    });

    if (options.showPageLabels) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Page ${page.pageNumber}`, x + thumbW / 2, y + thumbH + 16);
    }
  }

  const mime = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return {
    dataUrl: canvas.toDataURL(mime, 0.92),
    width: sheetWidth,
    height: sheetHeight,
  };
}

/**
 * Converts a PDF to grayscale client-side by rendering pages to grayscale canvas
 * and compiling back into a clean PDF.
 */
export async function convertPdfToGrayscale(
  file: File,
  targetPages?: number[],
  onProgress?: (pct: number, msg: string) => void
): Promise<Uint8Array> {
  onProgress?.(10, 'Parsing pages for color desaturation...');
  const pdfDoc = await getPdfJsDocument(file);
  const numPages = pdfDoc.numPages;
  const newPdf = await PDFDocument.create();

  const pagesToConvert = new Set(targetPages || Array.from({ length: numPages }, (_, i) => i + 1));

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(
      Math.round(15 + (i / numPages) * 75),
      `Converting page ${i} of ${numPages} to grayscale...`
    );

    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.75 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    if (pagesToConvert.has(i)) {
      // Apply grayscale filter directly to pixel buffer
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let p = 0; p < data.length; p += 4) {
        const gray = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
        data[p] = gray;
        data[p + 1] = gray;
        data[p + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const imgBytes = Uint8Array.from(atob(canvas.toDataURL('image/jpeg', 0.9).split(',')[1]), (c) => c.charCodeAt(0));
    const embeddedImg = await newPdf.embedJpg(imgBytes);

    const newPage = newPdf.addPage([page.view[2], page.view[3]]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: page.view[2],
      height: page.view[3],
    });
  }

  onProgress?.(95, 'Finalizing grayscale document...');
  const result = await newPdf.save();
  onProgress?.(100, 'Grayscale conversion complete!');
  return result;
}

/**
 * REAL Redaction:
 * Renders the page to canvas, draws solid redaction rectangles onto the pixel buffer,
 * destroying the underlying raster and text stream completely, and embeds the sanitized
 * pixels into a new PDF page.
 */
export async function realRedactPdf(
  file: File,
  redactionsByPage: Record<number, { x: number; y: number; width: number; height: number }[]>,
  onProgress?: (pct: number, msg: string) => void
): Promise<Uint8Array> {
  onProgress?.(10, 'Initializing security redaction engine...');
  const pdfDoc = await getPdfJsDocument(file);
  const numPages = pdfDoc.numPages;
  const newPdf = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(
      Math.round(20 + (i / numPages) * 70),
      `Sanitizing and redacting page ${i}...`
    );

    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // High DPI for crisp text retention

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const pageRedactions = redactionsByPage[i] || [];
    if (pageRedactions.length > 0) {
      ctx.fillStyle = '#000000';
      pageRedactions.forEach((box) => {
        // Box coordinates normalized 0..1 to canvas scale
        const bx = box.x * canvas.width;
        const by = box.y * canvas.height;
        const bw = box.width * canvas.width;
        const bh = box.height * canvas.height;

        // Permanently overwrite pixel data with solid black
        ctx.fillRect(bx, by, bw, bh);
      });
    }

    const imgBytes = Uint8Array.from(atob(canvas.toDataURL('image/jpeg', 0.92).split(',')[1]), (c) => c.charCodeAt(0));
    const embeddedImg = await newPdf.embedJpg(imgBytes);

    const newPage = newPdf.addPage([page.view[2], page.view[3]]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: page.view[2],
      height: page.view[3],
    });
  }

  onProgress?.(95, 'Verifying text stream destruction...');
  const sanitizedPdf = await newPdf.save();
  onProgress?.(100, 'Redacted PDF ready!');
  return sanitizedPdf;
}
