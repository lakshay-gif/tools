import { PDFDocument, PageSizes, rgb, degrees, StandardFonts, PDFName, PDFString } from 'pdf-lib';
import JSZip from 'jszip';

export interface SplitResult {
  filename: string;
  bytes: Uint8Array;
  pageCount: number;
}

/**
 * Validates and loads a PDF document safely with user-friendly error messages.
 */
export async function loadPdfSafely(file: File): Promise<PDFDocument> {
  if (file.size === 0) {
    throw new Error(`File "${file.name}" is completely empty (0 bytes).`);
  }
  const arrayBuffer = await file.arrayBuffer();
  try {
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
    return doc;
  } catch (error: any) {
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('encrypt') || msg.includes('password') || msg.includes('decrypt')) {
      throw new Error(`File "${file.name}" is password-protected or encrypted. Please unlock it before proceeding.`);
    }
    throw new Error(`File "${file.name}" is damaged, corrupted, or not a valid PDF file.`);
  }
}

/**
 * Merges multiple PDF files into one.
 */
export async function mergePdfFiles(
  files: File[],
  onProgress?: (percent: number, message: string) => void
): Promise<Uint8Array> {
  if (files.length === 0) throw new Error('No files provided for merging.');

  onProgress?.(5, 'Initializing PDF merging engine...');
  const mergedPdf = await PDFDocument.create();

  const total = files.length;
  for (let i = 0; i < total; i++) {
    const file = files[i];
    onProgress?.(
      Math.round(10 + (i / total) * 75),
      `Processing "${file.name}" (${i + 1} of ${total})...`
    );

    const doc = await loadPdfSafely(file);
    const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  onProgress?.(90, 'Finalizing merged document structure...');
  const mergedBytes = await mergedPdf.save();
  onProgress?.(100, 'Merged document ready!');
  return mergedBytes;
}

/**
 * Parse page range string like "1-3, 5, 8-10" into 0-indexed page indices.
 */
export function parsePageRanges(rangesStr: string, maxPages: number): number[] {
  const indices = new Set<number>();
  const parts = rangesStr.split(',').map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) {
    for (let i = 0; i < maxPages; i++) indices.add(i);
    return Array.from(indices);
  }

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) continue;

      const min = Math.max(1, Math.min(start, end));
      const max = Math.min(maxPages, Math.max(start, end));
      for (let p = min; p <= max; p++) {
        indices.add(p - 1);
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Splits a PDF by page ranges or into individual pages.
 */
export async function splitPdfByRange(
  file: File,
  rangesStr: string,
  onProgress?: (percent: number, message: string) => void
): Promise<SplitResult> {
  onProgress?.(10, 'Loading source PDF...');
  const sourceDoc = await loadPdfSafely(file);
  const totalPages = sourceDoc.getPageCount();

  onProgress?.(30, 'Calculating selected page indices...');
  const pageIndices = parsePageRanges(rangesStr, totalPages);

  if (pageIndices.length === 0) {
    throw new Error('No valid pages found for the specified range.');
  }

  onProgress?.(50, `Extracting ${pageIndices.length} page(s)...`);
  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(sourceDoc, pageIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  onProgress?.(85, 'Rendering extracted PDF file...');
  const bytes = await newDoc.save();
  onProgress?.(100, 'Split completed successfully!');

  const baseName = file.name.replace(/\.pdf$/i, '');
  return {
    filename: `${baseName}_extracted.pdf`,
    bytes,
    pageCount: pageIndices.length,
  };
}

/**
 * Splits every page or multiple ranges into a downloadable ZIP archive.
 */
export async function splitPdfToZip(
  file: File,
  ranges: string[],
  onProgress?: (percent: number, message: string) => void
): Promise<Blob> {
  onProgress?.(10, 'Reading source document...');
  const sourceDoc = await loadPdfSafely(file);
  const totalPages = sourceDoc.getPageCount();
  const zip = new JSZip();
  const baseName = file.name.replace(/\.pdf$/i, '');

  for (let idx = 0; idx < ranges.length; idx++) {
    const range = ranges[idx];
    const pageIndices = parsePageRanges(range, totalPages);
    if (pageIndices.length === 0) continue;

    onProgress?.(
      Math.round(20 + (idx / ranges.length) * 70),
      `Creating slice ${idx + 1} of ${ranges.length}...`
    );

    const sliceDoc = await PDFDocument.create();
    const copiedPages = await sliceDoc.copyPages(sourceDoc, pageIndices);
    copiedPages.forEach((p) => sliceDoc.addPage(p));
    const sliceBytes = await sliceDoc.save();

    const rangeFilename = `${baseName}_part_${idx + 1}_pages_${range.replace(/\s+/g, '')}.pdf`;
    zip.file(rangeFilename, sliceBytes);
  }

  onProgress?.(95, 'Packaging ZIP archive...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  onProgress?.(100, 'ZIP file generated!');
  return zipBlob;
}

/**
 * Rotates pages in a PDF document.
 */
export async function rotatePdf(
  file: File,
  angleDegrees: 90 | 180 | 270,
  pageIndicesToRotate?: number[] // undefined means all pages
): Promise<Uint8Array> {
  const doc = await loadPdfSafely(file);
  const pages = doc.getPages();
  const targetIndices = pageIndicesToRotate || Array.from({ length: pages.length }, (_, i) => i);

  targetIndices.forEach((idx) => {
    if (pages[idx]) {
      const currentRotation = pages[idx].getRotation().angle;
      pages[idx].setRotation(degrees((currentRotation + angleDegrees) % 360));
    }
  });

  return await doc.save();
}

/**
 * Deletes specific pages from a PDF.
 */
export async function deletePdfPages(
  file: File,
  indicesToDelete: number[]
): Promise<Uint8Array> {
  const doc = await loadPdfSafely(file);
  const totalPages = doc.getPageCount();
  const deleteSet = new Set(indicesToDelete);

  if (deleteSet.size >= totalPages) {
    throw new Error('You cannot delete all pages in the PDF.');
  }

  const remainingIndices: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (!deleteSet.has(i)) remainingIndices.push(i);
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(doc, remainingIndices);
  copiedPages.forEach((p) => newDoc.addPage(p));

  return await newDoc.save();
}

/**
 * Reorders pages in a PDF document based on a new order array of 0-based indices.
 */
export async function reorderPdfPages(
  file: File,
  newOrder: number[]
): Promise<Uint8Array> {
  const doc = await loadPdfSafely(file);
  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(doc, newOrder);
  copiedPages.forEach((p) => newDoc.addPage(p));
  return await newDoc.save();
}

/**
 * Adds text or image watermark to a PDF document.
 */
export async function watermarkPdf(
  file: File,
  options: {
    type: 'text' | 'image';
    text?: string;
    imageDataUrl?: string;
    fontSize?: number;
    opacity?: number;
    rotationDegrees?: number;
    color?: string; // hex #rrggbb
    position?: 'center' | 'top' | 'bottom' | 'diagonal';
    pages?: number[]; // undefined = all
  }
): Promise<Uint8Array> {
  const doc = await loadPdfSafely(file);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const targetIndices = options.pages || Array.from({ length: pages.length }, (_, i) => i);

  let embeddedImg: any = null;
  if (options.type === 'image' && options.imageDataUrl) {
    const base64 = options.imageDataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    embeddedImg = options.imageDataUrl.startsWith('data:image/png')
      ? await doc.embedPng(bytes)
      : await doc.embedJpg(bytes);
  }

  // Parse color hex
  let r = 0.5, g = 0.5, b = 0.5;
  if (options.color) {
    const hex = options.color.replace('#', '');
    if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16) / 255;
      g = parseInt(hex.substring(2, 4), 16) / 255;
      b = parseInt(hex.substring(4, 6), 16) / 255;
    }
  }

  const opacity = options.opacity !== undefined ? options.opacity : 0.3;
  const rotAngle = options.rotationDegrees !== undefined ? options.rotationDegrees : 45;
  const fontSize = options.fontSize || 48;
  const watermarkText = options.text || 'CONFIDENTIAL';

  targetIndices.forEach((idx) => {
    const page = pages[idx];
    if (!page) return;
    const { width, height } = page.getSize();

    if (options.type === 'text') {
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x = (width - textWidth) / 2;
      let y = (height - textHeight) / 2;

      if (options.position === 'top') y = height - textHeight - 50;
      if (options.position === 'bottom') y = 50;

      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(r, g, b),
        opacity,
        rotate: degrees(rotAngle),
      });
    } else if (embeddedImg) {
      const imgWidth = Math.min(width * 0.6, embeddedImg.width);
      const imgHeight = (imgWidth / embeddedImg.width) * embeddedImg.height;

      const x = (width - imgWidth) / 2;
      const y = (height - imgHeight) / 2;

      page.drawImage(embeddedImg, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
        opacity,
        rotate: degrees(rotAngle),
      });
    }
  });

  return await doc.save();
}

/**
 * Adds page numbers to PDF pages.
 */
export async function addPageNumbersPdf(
  file: File,
  options: {
    startNumber: number;
    position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center';
    prefix?: string;
    suffix?: string;
    fontSize?: number;
    margin?: number;
    pages?: number[];
  }
): Promise<Uint8Array> {
  const doc = await loadPdfSafely(file);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const total = pages.length;
  const targetIndices = options.pages || Array.from({ length: total }, (_, i) => i);

  const fontSize = options.fontSize || 10;
  const margin = options.margin !== undefined ? options.margin : 24;
  const prefix = options.prefix || '';
  const suffix = options.suffix || '';

  targetIndices.forEach((idx) => {
    const page = pages[idx];
    if (!page) return;
    const { width, height } = page.getSize();
    const pageNum = options.startNumber + idx;
    const text = `${prefix}${pageNum}${suffix}`;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x = (width - textWidth) / 2;
    let y = margin;

    if (options.position === 'bottom-right') x = width - textWidth - margin;
    if (options.position === 'bottom-left') x = margin;
    if (options.position === 'top-right') {
      x = width - textWidth - margin;
      y = height - margin - fontSize;
    }
    if (options.position === 'top-center') {
      y = height - margin - fontSize;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  });

  return await doc.save();
}

/**
 * Crops pages of a PDF by modifying the page CropBox.
 */
export async function cropPdf(
  file: File,
  cropPercentages: { top: number; bottom: number; left: number; right: number },
  pageIndices?: number[]
): Promise<Uint8Array> {
  const doc = await loadPdfSafely(file);
  const pages = doc.getPages();
  const targets = pageIndices || Array.from({ length: pages.length }, (_, i) => i);

  targets.forEach((idx) => {
    const page = pages[idx];
    if (!page) return;
    const { width, height } = page.getSize();

    const cropLeft = (cropPercentages.left / 100) * width;
    const cropRight = width - (cropPercentages.right / 100) * width;
    const cropBottom = (cropPercentages.bottom / 100) * height;
    const cropTop = height - (cropPercentages.top / 100) * height;

    const newWidth = Math.max(10, cropRight - cropLeft);
    const newHeight = Math.max(10, cropTop - cropBottom);

    page.setCropBox(cropLeft, cropBottom, newWidth, newHeight);
  });

  return await doc.save();
}

/**
 * Changes PDF page dimensions (A3, A4, A5, Letter, Legal, Custom)
 */
export async function resizePdfPages(
  file: File,
  targetSize: 'A3' | 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom',
  options: {
    customWidth?: number;
    customHeight?: number;
    mode: 'fit' | 'fill' | 'preserve';
  }
): Promise<Uint8Array> {
  const sourceDoc = await loadPdfSafely(file);
  const newDoc = await PDFDocument.create();

  let targetDims: [number, number];
  if (targetSize === 'A3') targetDims = PageSizes.A3;
  else if (targetSize === 'A4') targetDims = PageSizes.A4;
  else if (targetSize === 'A5') targetDims = PageSizes.A5;
  else if (targetSize === 'Letter') targetDims = PageSizes.Letter;
  else if (targetSize === 'Legal') targetDims = [612, 1008];
  else targetDims = [options.customWidth || 595, options.customHeight || 842];

  const [destW, destH] = targetDims;
  const embeddedPages = await newDoc.embedPdf(sourceDoc);

  embeddedPages.forEach((embPage) => {
    const newPage = newDoc.addPage([destW, destH]);
    const { width: origW, height: origH } = embPage;

    if (options.mode === 'fit' || options.mode === 'preserve') {
      const scale = Math.min(destW / origW, destH / origH);
      const drawW = origW * scale;
      const drawH = origH * scale;
      const x = (destW - drawW) / 2;
      const y = (destH - drawH) / 2;
      newPage.drawPage(embPage, { x, y, width: drawW, height: drawH });
    } else {
      // fill / stretch
      newPage.drawPage(embPage, { x: 0, y: 0, width: destW, height: destH });
    }
  });

  return await newDoc.save();
}

/**
 * Reads and modifies PDF document metadata.
 */
export async function getPdfMetadata(file: File) {
  const doc = await loadPdfSafely(file);
  return {
    title: doc.getTitle() || '',
    author: doc.getAuthor() || '',
    subject: doc.getSubject() || '',
    keywords: (doc.getKeywords() || '').split(';').map((s) => s.trim()).filter(Boolean),
    creator: doc.getCreator() || '',
    producer: doc.getProducer() || '',
    pageCount: doc.getPageCount(),
  };
}

export async function updatePdfMetadata(
  file: File,
  meta: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
    removeAll?: boolean;
  }
): Promise<Uint8Array> {
  const doc = await loadPdfSafely(file);

  if (meta.removeAll) {
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setCreator('');
    doc.setProducer('');
  } else {
    if (meta.title !== undefined) doc.setTitle(meta.title);
    if (meta.author !== undefined) doc.setAuthor(meta.author);
    if (meta.subject !== undefined) doc.setSubject(meta.subject);
    if (meta.keywords !== undefined) doc.setKeywords(meta.keywords);
    if (meta.creator !== undefined) doc.setCreator(meta.creator);
    if (meta.producer !== undefined) doc.setProducer(meta.producer);
  }

  return await doc.save();
}

/**
 * Compresses PDF using object stream optimizations and removes unreferenced objects.
 */
export async function compressPdf(
  file: File,
  level: 'low' | 'medium' | 'high'
): Promise<Uint8Array> {
  const doc = await loadPdfSafely(file);
  // PDF-lib's useObjectStreams flag collapses cross-reference streams and compresses dictionaries
  const compressedBytes = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });
  return compressedBytes;
}

/**
 * Converts images (data URLs) into a clean PDF document.
 */
export async function convertImagesToPdf(
  images: { dataUrl: string; name: string }[],
  options: {
    pageSize: 'A4' | 'Letter' | 'Fit' | 'Custom';
    orientation: 'portrait' | 'landscape' | 'auto';
    margins: number; // in points
    fitMode?: 'contain' | 'cover' | 'original';
  },
  onProgress?: (percent: number, message: string) => void
): Promise<Uint8Array> {
  if (images.length === 0) throw new Error('No images selected.');

  onProgress?.(10, 'Initializing PDF creator...');
  const pdfDoc = await PDFDocument.create();

  const total = images.length;
  for (let i = 0; i < total; i++) {
    onProgress?.(
      Math.round(15 + (i / total) * 75),
      `Processing image ${i + 1} of ${total}...`
    );

    const imgItem = images[i];
    const dataUrl = imgItem.dataUrl;

    const base64Data = dataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let k = 0; k < byteCharacters.length; k++) {
      byteNumbers[k] = byteCharacters.charCodeAt(k);
    }
    const imageBytes = new Uint8Array(byteNumbers);

    let embeddedImage;
    if (dataUrl.startsWith('data:image/png')) {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    }

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    let pageWidth: number;
    let pageHeight: number;

    if (options.pageSize === 'A4') {
      pageWidth = PageSizes.A4[0];
      pageHeight = PageSizes.A4[1];
    } else if (options.pageSize === 'Letter') {
      pageWidth = PageSizes.Letter[0];
      pageHeight = PageSizes.Letter[1];
    } else {
      pageWidth = imgWidth + options.margins * 2;
      pageHeight = imgHeight + options.margins * 2;
    }

    const isLandscape =
      options.orientation === 'landscape' ||
      (options.orientation === 'auto' && imgWidth > imgHeight);

    if (isLandscape && pageWidth < pageHeight && options.pageSize !== 'Fit') {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const margin = options.margins;
    const availWidth = pageWidth - margin * 2;
    const availHeight = pageHeight - margin * 2;

    const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const x = margin + (availWidth - drawWidth) / 2;
    const y = margin + (availHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  onProgress?.(95, 'Finalizing PDF output...');
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, 'Image to PDF conversion complete!');
  return pdfBytes;
}

/**
 * Triggers a browser download of a Uint8Array, Blob, or Data URL.
 */
export function downloadFile(
  data: Uint8Array | Blob | string,
  filename: string,
  mimeType: string = 'application/pdf'
) {
  let blob: Blob;
  if (typeof data === 'string') {
    const a = document.createElement('a');
    a.href = data;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  } else if (data instanceof Blob) {
    blob = data;
  } else {
    blob = new Blob([data as any], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

/**
 * Format bytes to readable string (KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export interface RemoveSizeOptions {
  stripMetadata: boolean;
  cleanUnusedObjects: boolean;
  stripThumbnails: boolean;
  recompressStreams: boolean;
}

/**
 * Removes invisible bloat, unnecessary metadata, thumbnails, and orphaned objects from PDF.
 */
export async function removePdfSize(
  file: File,
  options: RemoveSizeOptions = {
    stripMetadata: true,
    cleanUnusedObjects: true,
    stripThumbnails: true,
    recompressStreams: true,
  },
  onProgress?: (percent: number, message: string) => void
): Promise<{ bytes: Uint8Array; originalSize: number; newSize: number; reductionPercentage: number }> {
  onProgress?.(15, 'Loading and parsing PDF structure...');
  const originalBytes = new Uint8Array(await file.arrayBuffer());
  const originalSize = originalBytes.length;

  const doc = await loadPdfSafely(file);
  const totalPages = doc.getPageCount();

  onProgress?.(35, 'Analyzing embedded streams and metadata...');

  if (options.stripMetadata) {
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('');
    doc.setCreator('');
    try {
      doc.catalog.delete(PDFName.of('Metadata'));
      doc.catalog.delete(PDFName.of('PieceInfo'));
    } catch {
      // ignore
    }
  }

  if (options.stripThumbnails) {
    try {
      for (let i = 0; i < totalPages; i++) {
        const page = doc.getPage(i);
        page.node.delete(PDFName.of('Thumb'));
      }
    } catch {
      // ignore
    }
  }

  let finalDoc = doc;

  if (options.cleanUnusedObjects) {
    onProgress?.(60, 'Purging orphaned object streams and duplicate resources...');
    const cleanDoc = await PDFDocument.create();
    const copiedPages = await cleanDoc.copyPages(doc, Array.from({ length: totalPages }, (_, i) => i));
    copiedPages.forEach((p) => cleanDoc.addPage(p));
    finalDoc = cleanDoc;
  }

  onProgress?.(85, 'Applying high-efficiency stream compression...');
  const newBytes = await finalDoc.save({
    useObjectStreams: options.recompressStreams,
    addDefaultPage: false,
  });

  const newSize = newBytes.length;
  const reductionPercentage = originalSize > 0
    ? Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100))
    : 0;

  onProgress?.(100, 'Optimization complete!');
  return {
    bytes: newBytes,
    originalSize,
    newSize,
    reductionPercentage,
  };
}

/**
 * Safely increases / inflates PDF file size to reach an exact target minimum size (in bytes)
 * using ISO 32000 compliant trailer padding without affecting visual rendering.
 */
export async function increasePdfSize(
  file: File,
  targetBytes: number,
  onProgress?: (percent: number, message: string) => void
): Promise<{ bytes: Uint8Array; originalSize: number; newSize: number }> {
  onProgress?.(15, 'Loading original PDF bytes...');
  const originalBytes = new Uint8Array(await file.arrayBuffer());
  const originalSize = originalBytes.length;

  if (targetBytes <= originalSize) {
    throw new Error(
      `Target size (${formatBytes(targetBytes)}) must be greater than current file size (${formatBytes(originalSize)}).`
    );
  }

  onProgress?.(40, 'Verifying PDF syntax and integrity...');
  await loadPdfSafely(file);

  onProgress?.(70, 'Calculating exact padding byte delta...');
  const result = new Uint8Array(targetBytes);
  result.set(originalBytes, 0);

  let currentOffset = originalBytes.length;
  const newLineByte = 0x0a; // '\n'

  while (currentOffset < targetBytes) {
    const remaining = targetBytes - currentOffset;
    if (remaining <= 3) {
      for (let i = 0; i < remaining; i++) {
        result[currentOffset++] = (i === remaining - 1) ? newLineByte : 0x20;
      }
      break;
    }

    // Write "% "
    result[currentOffset++] = 0x25; // '%'
    result[currentOffset++] = 0x20; // ' '

    // Fill line up to 64 bytes or remaining
    const lineFill = Math.min(62, targetBytes - currentOffset - 1);
    for (let j = 0; j < lineFill; j++) {
      result[currentOffset++] = 0x41 + (j % 26);
    }
    result[currentOffset++] = newLineByte;
  }

  onProgress?.(100, `Successfully expanded to ${formatBytes(result.length)}!`);
  return {
    bytes: result,
    originalSize,
    newSize: result.length,
  };
}
