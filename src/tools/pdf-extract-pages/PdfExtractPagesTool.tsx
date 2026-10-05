import React, { useState, useEffect } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { splitPdfByRange, parsePageRanges } from '../../lib/pdfUtils';
import { renderPdfToImages, RenderedPage } from '../../lib/pdfRenderer';
import { FileOutput, Check, CheckSquare } from 'lucide-react';

export const PdfExtractPagesTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [rangeInput, setRangeInput] = useState('1-3');
  const [selectedPages, setSelectedPages] = useState<number[]>([1, 2, 3]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      setPages([]);
      setSelectedPages([]);
      return;
    }

    const loadThumbnails = async () => {
      setIsProcessing(true);
      setProgress(20);
      setProgressMsg('Loading page previews...');
      try {
        const rendered = await renderPdfToImages(files[0].file, 'png', 0.8);
        setPages(rendered);
        const initial = rendered.slice(0, Math.min(3, rendered.length)).map((p) => p.pageNumber);
        setSelectedPages(initial);
        setRangeInput(initial.length > 1 ? `1-${initial.length}` : '1');
        setIsProcessing(false);
      } catch (err: any) {
        setIsProcessing(false);
        setError(err?.message || 'Failed to read PDF document.');
      }
    };

    loadThumbnails();
  }, [files]);

  const handleTogglePage = (pageNum: number) => {
    let next: number[];
    if (selectedPages.includes(pageNum)) {
      next = selectedPages.filter((p) => p !== pageNum);
    } else {
      next = [...selectedPages, pageNum].sort((a, b) => a - b);
    }
    setSelectedPages(next);
    setRangeInput(next.join(', '));
  };

  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRangeInput(val);
    if (pages.length > 0) {
      const parsed = parsePageRanges(val, pages.length).map((idx) => idx + 1);
      setSelectedPages(parsed);
    }
  };

  const handleExtract = async () => {
    if (files.length === 0) return;
    if (selectedPages.length === 0) {
      setError('Please select at least one page to extract.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg(`Extracting ${selectedPages.length} page(s)...`);

    try {
      const result = await splitPdfByRange(files[0].file, rangeInput, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      setResultBytes(result.bytes);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to extract selected pages.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPages([]);
    setSelectedPages([]);
    setResultBytes(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="Pages Extracted Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_extracted.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo={`Successfully extracted ${selectedPages.length} pages into a new standalone PDF.`}
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
            title="Upload PDF to extract pages"
            subtitle="Type a custom range (e.g. 1-5, 8, 11-14) or click on thumbnails below."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {pages.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Page Range Input:
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={handleRangeInputChange}
                  placeholder="e.g. 1-5, 8, 11-14"
                  className="w-full sm:max-w-md px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400">
                  {selectedPages.length} of {pages.length} pages currently selected for extraction.
                </p>
              </div>

              {/* Page selection grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[460px] overflow-y-auto p-1">
                {pages.map((p) => {
                  const isSelected = selectedPages.includes(p.pageNumber);

                  return (
                    <div
                      key={p.pageNumber}
                      onClick={() => handleTogglePage(p.pageNumber)}
                      className={`relative rounded-xl border p-2 flex flex-col items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500'
                          : 'border-slate-800 bg-slate-900/60 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[11px] mb-1">
                        <span className={isSelected ? 'text-blue-400 font-bold' : 'text-slate-400'}>
                          Page {p.pageNumber}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>

                      <div className="h-32 w-full bg-slate-950 rounded flex items-center justify-center overflow-hidden">
                        <img
                          src={p.dataUrl}
                          alt={`Page ${p.pageNumber}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleExtract}
                  disabled={selectedPages.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <FileOutput className="w-4 h-4" />
                  <span>Extract {selectedPages.length} Pages</span>
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
