import React, { useState } from 'react';
import { FileDropzone, FileItem } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { renderPdfToImages, RenderedPage } from '../../lib/pdfRenderer';
import { downloadFile } from '../../lib/pdfUtils';
import { usePlan } from '../../context/PlanContext';
import { Download, FileImage, Layers, Eye, Sparkles } from 'lucide-react';

export const PdfToImageTool: React.FC = () => {
  const { isPro, openUpgradeModal } = usePlan();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [scale, setScale] = useState<number>(1.75);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [activePreviewPage, setActivePreviewPage] = useState<RenderedPage | null>(null);

  const handleConvert = async () => {
    if (files.length === 0) {
      setError('Please upload a PDF document first.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(5);
    setProgressMsg('Initializing client-side canvas rendering engine...');

    try {
      const pages = await renderPdfToImages(files[0].file, format, scale, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      if (!isPro && pages.length > 10) {
        // Free tier allows up to 10 pages
        setRenderedPages(pages.slice(0, 10));
        openUpgradeModal('Documents with over 10 pages require ToolsHub Pro to extract all pages in bulk.');
      } else {
        setRenderedPages(pages);
      }
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to render PDF pages. File may be encrypted or corrupted.');
    }
  };

  const downloadSinglePage = (page: RenderedPage) => {
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const baseName = files[0]?.name.replace(/\.pdf$/i, '') || 'document';
    downloadFile(page.dataUrl, `${baseName}_page_${page.pageNumber}.${ext}`, `image/${format}`);
  };

  const downloadAllPages = () => {
    renderedPages.forEach((page, index) => {
      setTimeout(() => {
        downloadSinglePage(page);
      }, index * 250);
    });
  };

  const handleReset = () => {
    setFiles([]);
    setRenderedPages([]);
    setError(null);
    setProgress(0);
    setActivePreviewPage(null);
  };

  return (
    <div className="space-y-6">
      {renderedPages.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileImage className="w-5 h-5 text-emerald-400" />
                <span>Extracted {renderedPages.length} High-Definition Images</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Format: <span className="uppercase font-semibold text-slate-300">{format}</span> • 100% rendered locally
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={downloadAllPages}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All ({renderedPages.length})</span>
              </button>

              <button
                onClick={handleReset}
                className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:text-white cursor-pointer transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>

          {/* Grid of rendered page cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {renderedPages.map((page) => (
              <div
                key={page.pageNumber}
                className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col p-3 space-y-3"
              >
                <div
                  onClick={() => setActivePreviewPage(page)}
                  className="h-56 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer relative group"
                >
                  <img
                    src={page.dataUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="max-h-full max-w-full object-contain transition-transform group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Click to Zoom</span>
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-white font-mono">
                    Page {page.pageNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>
                    {page.width} × {page.height} px
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadSinglePage(page)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 font-semibold text-xs transition-colors cursor-pointer border border-blue-500/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal zoom preview */}
          {activePreviewPage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
              onClick={() => setActivePreviewPage(null)}
            >
              <div
                className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-sm font-semibold text-slate-200">
                  <span>Page {activePreviewPage.pageNumber} Preview</span>
                  <button
                    onClick={() => setActivePreviewPage(null)}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    Close [ESC]
                  </button>
                </div>
                <div className="flex-1 overflow-auto py-4 flex items-center justify-center">
                  <img
                    src={activePreviewPage.dataUrl}
                    alt={`Page ${activePreviewPage.pageNumber}`}
                    className="max-h-[75vh] w-auto object-contain rounded-lg"
                  />
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => downloadSinglePage(activePreviewPage)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download This Page ({format.toUpperCase()})</span>
                  </button>
                </div>
              </div>
            </div>
          )}
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
            title="Upload PDF to convert into image files"
            subtitle="Renders pages directly on your device's graphics processor."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Image Output Format
                  </label>
                  <select
                    value={format}
                    onChange={(e: any) => setFormat(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="png">PNG (Lossless & Razor Sharp - Best for text/diagrams)</option>
                    <option value="jpeg">JPG (Lightweight File Size - Best for photos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Render Resolution
                  </label>
                  <select
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value={1.5}>Standard Quality (1.5x display scale)</option>
                    <option value={2.0}>High Resolution (2.0x retina scale)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleConvert}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Convert PDF Pages to Images</span>
                </button>
              </div>
            </div>
          )}

          {isProcessing && (
            <ProgressBar progress={progress} message={progressMsg} />
          )}
        </div>
      )}
    </div>
  );
};
