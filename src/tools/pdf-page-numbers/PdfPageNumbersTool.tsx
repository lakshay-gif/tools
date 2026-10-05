import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { addPageNumbersPdf, parsePageRanges } from '../../lib/pdfUtils';
import { Hash, Settings2 } from 'lucide-react';

export const PdfPageNumbersTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [startNumber, setStartNumber] = useState(1);
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center'>('bottom-center');
  const [prefix, setPrefix] = useState('Page ');
  const [suffix, setSuffix] = useState('');
  const [fontSize, setFontSize] = useState(10);
  const [margin, setMargin] = useState(24);
  const [targetPagesStr, setTargetPagesStr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const handleApplyNumbers = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Inserting page numbers into PDF...');

    try {
      let pagesToTarget: number[] | undefined = undefined;
      if (targetPagesStr.trim()) {
        pagesToTarget = parsePageRanges(targetPagesStr, 9999);
      }

      const numbered = await addPageNumbersPdf(files[0].file, {
        startNumber,
        position,
        prefix,
        suffix,
        fontSize,
        margin,
        pages: pagesToTarget,
      });

      setResultBytes(numbered);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to number pages.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBytes(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="Page Numbers Added Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_numbered.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo="Document pagination applied with customized positioning."
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
            title="Upload PDF to add page numbers"
            subtitle="Configure numbering format, position, and target pages."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Hash className="w-4 h-4 text-blue-400" />
                <span>Pagination Settings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Position</label>
                  <select
                    value={position}
                    onChange={(e: any) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="bottom-center">Bottom Center (Standard)</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right (Header)</option>
                    <option value="top-center">Top Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Starting Number</label>
                  <input
                    type="number"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Text Prefix</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="Page "
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Font Size ({fontSize}pt)</label>
                  <input
                    type="range"
                    min="8"
                    max="20"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Margin Distance ({margin}pt)</label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={margin}
                    onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Pages (e.g. 2-10 to skip cover)
                  </label>
                  <input
                    type="text"
                    value={targetPagesStr}
                    onChange={(e) => setTargetPagesStr(e.target.value)}
                    placeholder="All pages (or e.g. 2-20)"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleApplyNumbers}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Hash className="w-4 h-4" />
                  <span>Insert Page Numbers</span>
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
