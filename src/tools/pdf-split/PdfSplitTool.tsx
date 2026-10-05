import React, { useState, useEffect } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { loadPdfSafely, splitPdfByRange, splitPdfToZip, downloadFile } from '../../lib/pdfUtils';
import { usePlan } from '../../context/PlanContext';
import { Scissors, FileText, Download, Archive } from 'lucide-react';

export const PdfSplitTool: React.FC = () => {
  const { isPro, openUpgradeModal } = usePlan();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [rangeMode, setRangeMode] = useState<'custom' | 'all' | 'ranges'>('custom');
  const [customRange, setCustomRange] = useState('1');
  const [multipleRangesInput, setMultipleRangesInput] = useState('1-2\n3-4');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [resultZipBlob, setResultZipBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
  const [fileSizeStr, setFileSizeStr] = useState('');

  useEffect(() => {
    if (files.length === 0) {
      setTotalPages(null);
      setSelectedPages([]);
      return;
    }

    const inspectPdf = async () => {
      try {
        setError(null);
        const doc = await loadPdfSafely(files[0].file);
        const pages = doc.getPageCount();
        setTotalPages(pages);
        setCustomRange(pages > 1 ? `1-${Math.min(3, pages)}` : '1');
        setSelectedPages(Array.from({ length: Math.min(3, pages) }, (_, i) => i + 1));
        if (pages >= 4) {
          setMultipleRangesInput(`1-2\n3-${pages}`);
        } else {
          setMultipleRangesInput(`1\n${pages}`);
        }
      } catch (err: any) {
        setError(err?.message || 'Could not read PDF. It may be encrypted or corrupted.');
        setTotalPages(null);
      }
    };

    inspectPdf();
  }, [files]);

  const handleTogglePage = (pageNum: number) => {
    let next: number[];
    if (selectedPages.includes(pageNum)) {
      next = selectedPages.filter((p) => p !== pageNum);
    } else {
      next = [...selectedPages, pageNum].sort((a, b) => a - b);
    }
    setSelectedPages(next);
    setCustomRange(next.length === 0 ? '' : next.join(', '));
  };

  const handleSplit = async () => {
    if (files.length === 0) return;

    setError(null);
    setIsProcessing(true);
    setProgress(10);

    try {
      if (rangeMode === 'ranges') {
        const rangesList = multipleRangesInput
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean);

        if (rangesList.length === 0) {
          throw new Error('Please specify at least one valid range.');
        }

        setProgressMsg('Generating slices and bundling into ZIP...');
        const zipBlob = await splitPdfToZip(files[0].file, rangesList, (pct, msg) => {
          setProgress(pct);
          setProgressMsg(msg);
        });

        setResultZipBlob(zipBlob);
        setResultFilename(`${files[0].name.replace(/\.pdf$/i, '')}_split_ranges.zip`);
        setFileSizeStr(formatBytes(zipBlob.size));
      } else if (rangeMode === 'all') {
        if (!isPro && totalPages && totalPages > 15) {
          openUpgradeModal('Extracting more than 15 individual pages in bulk requires ToolsHub Pro.');
          setIsProcessing(false);
          return;
        }

        // Generate individual pages into ZIP
        const allRanges = Array.from({ length: totalPages || 1 }, (_, i) => `${i + 1}`);
        setProgressMsg('Splitting all pages into separate files...');
        const zipBlob = await splitPdfToZip(files[0].file, allRanges, (pct, msg) => {
          setProgress(pct);
          setProgressMsg(msg);
        });

        setResultZipBlob(zipBlob);
        setResultFilename(`${files[0].name.replace(/\.pdf$/i, '')}_all_pages.zip`);
        setFileSizeStr(formatBytes(zipBlob.size));
      } else {
        // Custom single range to single PDF
        if (!customRange.trim()) {
          throw new Error('Please specify at least one page to extract.');
        }

        setProgressMsg('Extracting requested page range...');
        const result = await splitPdfByRange(files[0].file, customRange, (pct, msg) => {
          setProgress(pct);
          setProgressMsg(msg);
        });

        setResultBytes(result.bytes);
        setResultFilename(result.filename);
        setFileSizeStr(formatBytes(result.bytes.byteLength));
      }

      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Error occurred while splitting the document.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setTotalPages(null);
    setResultBytes(null);
    setResultZipBlob(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {resultBytes || resultZipBlob ? (
        <ResultCard
          title={resultZipBlob ? 'Split ZIP Archive Ready!' : 'PDF Split Successfully!'}
          filename={resultFilename}
          data={resultZipBlob || resultBytes!}
          fileSizeStr={fileSizeStr}
          mimeType={resultZipBlob ? 'application/zip' : 'application/pdf'}
          extraInfo={
            resultZipBlob
              ? 'All split PDF files have been packaged into a downloadable ZIP archive.'
              : 'Extracted selected pages into a brand new clean PDF document.'
          }
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
            title="Drop the PDF file you wish to split"
            subtitle="Upload a single PDF to extract pages. Zero server uploads."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {totalPages !== null && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{files[0]?.name}</h4>
                    <p className="text-xs text-slate-400">
                      Total detected pages: <span className="font-semibold text-blue-400">{totalPages}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setRangeMode('custom')}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                      rangeMode === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Custom Range
                  </button>
                  <button
                    type="button"
                    onClick={() => setRangeMode('ranges')}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                      rangeMode === 'ranges' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Multiple Ranges (ZIP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRangeMode('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                      rangeMode === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Split Every Page (ZIP)
                  </button>
                </div>
              </div>

              {rangeMode === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Pages to extract (comma separated or ranges):
                    </label>
                    <input
                      type="text"
                      value={customRange}
                      onChange={(e) => setCustomRange(e.target.value)}
                      placeholder={`e.g. 1-2, 4, 5`}
                      className="w-full sm:max-w-md px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Example: "1-3, 5" extracts pages 1, 2, 3, and 5 into one new PDF document.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs text-slate-400 font-medium">Or click pages to toggle:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        const isSelected = selectedPages.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleTogglePage(p)}
                            className={`w-9 h-9 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {rangeMode === 'ranges' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Define Multiple Ranges (one per line, will be exported into a ZIP package):
                  </label>
                  <textarea
                    rows={4}
                    value={multipleRangesInput}
                    onChange={(e) => setMultipleRangesInput(e.target.value)}
                    placeholder="1-4&#10;5-8&#10;9-12"
                    className="w-full sm:max-w-md px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Example: Lines "1-4" and "5-8" will create two distinct PDF documents packaged in a ZIP.
                  </p>
                </div>
              )}

              {rangeMode === 'all' && (
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 text-xs text-blue-300">
                  Each of the {totalPages} pages will be saved as an individual PDF file and downloaded as a ZIP archive.
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleSplit}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  <span>
                    {rangeMode === 'custom' ? 'Extract & Split PDF' : 'Split & Download ZIP'}
                  </span>
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
