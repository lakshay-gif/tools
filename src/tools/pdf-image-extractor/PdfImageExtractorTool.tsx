import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { extractPdfImages, ExtractedImage } from '../../lib/pdfRenderer';
import { downloadFile } from '../../lib/pdfUtils';
import JSZip from 'jszip';
import { ImageDown, Download, Archive, RefreshCw } from 'lucide-react';

export const PdfImageExtractorTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(15);
    setProgressMsg('Scanning PDF pages for graphics and figures...');

    try {
      const extracted = await extractPdfImages(files[0].file, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      if (extracted.length === 0) {
        setError('No raster images or diagrams found in this PDF document.');
      } else {
        setImages(extracted);
      }
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to extract images from PDF.');
    }
  };

  const handleDownloadSingle = (img: ExtractedImage) => {
    const baseName = files[0]?.name.replace(/\.pdf$/i, '') || 'document';
    downloadFile(img.dataUrl, `${baseName}_page_${img.pageNumber}_img.png`, 'image/png');
  };

  const handleDownloadAllZip = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Packaging images into ZIP...');

    try {
      const zip = new JSZip();
      const baseName = files[0]?.name.replace(/\.pdf$/i, '') || 'extracted_images';

      images.forEach((img, idx) => {
        const base64Data = img.dataUrl.split(',')[1];
        zip.file(`${baseName}_page_${img.pageNumber}_img_${idx + 1}.png`, base64Data, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, `${baseName}_all_images.zip`, 'application/zip');
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to create ZIP file.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setImages([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {images.length > 0 ? (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ImageDown className="w-5 h-5 text-emerald-400" />
                <span>Extracted {images.length} Image(s)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready to download individually or bundled in a single ZIP.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadAllZip}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md"
              >
                <Archive className="w-4 h-4" />
                <span>Download All as ZIP</span>
              </button>

              <button
                onClick={handleReset}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs cursor-pointer"
                title="Process another document"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grid of Extracted Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="p-3 rounded-2xl border border-slate-800 bg-slate-900 flex flex-col justify-between space-y-3"
              >
                <div className="h-44 bg-slate-950 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                  <img src={img.dataUrl} alt={`Extracted page ${img.pageNumber}`} className="max-h-full max-w-full object-contain" />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Page {img.pageNumber} ({img.width}×{img.height})</span>
                  <button
                    onClick={() => handleDownloadSingle(img)}
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save PNG</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={(newFiles) => {
              setFiles(newFiles.slice(0, 1));
              if (error) setError(null);
            }}
            multiple={false}
            maxFiles={1}
            title="Upload PDF to extract images and figures"
            subtitle="Scans all pages and extracts graphics at native display resolutions."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="flex justify-end">
              <button
                onClick={handleExtract}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
              >
                <ImageDown className="w-4 h-4" />
                <span>Scan & Extract Images</span>
              </button>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} message={progressMsg} />}
        </div>
      )}
    </div>
  );
};
