import React, { useState, useEffect } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { deletePdfPages } from '../../lib/pdfUtils';
import { renderPdfToImages, RenderedPage } from '../../lib/pdfRenderer';
import { Trash2, Check, RefreshCw } from 'lucide-react';

export const PdfDeletePagesTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [markedToDelete, setMarkedToDelete] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      setPages([]);
      setMarkedToDelete([]);
      return;
    }

    const loadThumbnails = async () => {
      setIsProcessing(true);
      setProgress(25);
      setProgressMsg('Generating page thumbnails...');
      try {
        const rendered = await renderPdfToImages(files[0].file, 'png', 0.8);
        setPages(rendered);
        setIsProcessing(false);
      } catch (err: any) {
        setIsProcessing(false);
        setError(err?.message || 'Could not load PDF pages.');
      }
    };

    loadThumbnails();
  }, [files]);

  const handleToggleDelete = (pageNum: number) => {
    setMarkedToDelete((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum]
    );
  };

  const handleSelectAll = () => {
    setMarkedToDelete(pages.map((p) => p.pageNumber));
  };

  const handleDeselectAll = () => {
    setMarkedToDelete([]);
  };

  const handleInvert = () => {
    setMarkedToDelete((prev) => pages.map((p) => p.pageNumber).filter((p) => !prev.includes(p)));
  };

  const handleDelete = async () => {
    if (files.length === 0) return;
    if (markedToDelete.length === 0) {
      setError('Please select at least one page to delete.');
      return;
    }
    if (markedToDelete.length >= pages.length) {
      setError('You cannot delete all pages in the PDF. At least one page must remain.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg(`Deleting ${markedToDelete.length} page(s)...`);

    try {
      const zeroBasedIndices = markedToDelete.map((p) => p - 1);
      const updatedBytes = await deletePdfPages(files[0].file, zeroBasedIndices);

      setResultBytes(updatedBytes);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to delete pages.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPages([]);
    setMarkedToDelete([]);
    setResultBytes(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="Pages Removed Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_trimmed.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo={`Removed ${markedToDelete.length} page(s). Document now contains ${pages.length - markedToDelete.length} pages.`}
          onReset={handleReset}
        />
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
            title="Upload PDF to delete unwanted pages"
            subtitle="Click on pages you wish to remove. Processed 100% locally."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {pages.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleInvert}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  >
                    Invert Selection
                  </button>
                </div>

                <div className="text-xs text-slate-400">
                  <span className="text-red-400 font-bold">{markedToDelete.length}</span> page(s) marked for deletion
                  {' • '}
                  <span className="text-emerald-400 font-bold">{pages.length - markedToDelete.length}</span> page(s) remaining
                </div>
              </div>

              {/* Thumbnails grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[460px] overflow-y-auto p-1">
                {pages.map((p) => {
                  const isMarked = markedToDelete.includes(p.pageNumber);

                  return (
                    <div
                      key={p.pageNumber}
                      onClick={() => handleToggleDelete(p.pageNumber)}
                      className={`relative rounded-xl border p-2 flex flex-col items-center justify-between cursor-pointer transition-all ${
                        isMarked
                          ? 'border-red-600 bg-red-950/30 ring-1 ring-red-500'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[11px] mb-1">
                        <span className={isMarked ? 'text-red-400 font-bold line-through' : 'text-slate-400'}>
                          Page {p.pageNumber}
                        </span>
                        {isMarked && (
                          <span className="text-[10px] uppercase font-bold text-red-400 bg-red-950/80 px-1 rounded">
                            DELETE
                          </span>
                        )}
                      </div>

                      <div className="h-32 w-full bg-slate-950 rounded flex items-center justify-center overflow-hidden relative">
                        <img
                          src={p.dataUrl}
                          alt={`Page ${p.pageNumber}`}
                          className={`max-h-full max-w-full object-contain ${
                            isMarked ? 'opacity-30 grayscale' : ''
                          }`}
                        />
                        {isMarked && (
                          <div className="absolute inset-0 flex items-center justify-center text-red-500">
                            <Trash2 className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleDelete}
                  disabled={markedToDelete.length === 0 || markedToDelete.length >= pages.length}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({markedToDelete.length}) Pages</span>
                </button>
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} message={progressMsg} />}
        </div>
      )}
    </div>
  );
};
