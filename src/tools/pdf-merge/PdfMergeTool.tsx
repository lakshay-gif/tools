import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { mergePdfFiles } from '../../lib/pdfUtils';
import { usePlan } from '../../context/PlanContext';
import { Combine, Sparkles, AlertCircle } from 'lucide-react';

export const PdfMergeTool: React.FC = () => {
  const { limits, isPro, openUpgradeModal } = usePlan();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [outputFilename, setOutputFilename] = useState('merged_document.pdf');
  const [fileSizeStr, setFileSizeStr] = useState('');

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF documents to merge.');
      return;
    }

    if (!isPro && files.length > limits.pdfMergeMaxFiles) {
      openUpgradeModal(
        `The Free plan merges up to ${limits.pdfMergeMaxFiles} files at once. Upgrade to Pro for unlimited files.`
      );
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(5);
    setProgressMsg('Reading PDF files in browser memory...');

    try {
      const rawFiles = files.map((f) => f.file);
      const merged = await mergePdfFiles(rawFiles, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      setResultBytes(merged);
      setFileSizeStr(formatBytes(merged.byteLength));
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to merge PDF files. Please ensure files are not encrypted.');
    }
  };

  const handleReset = () => {
    setResultBytes(null);
    setFiles([]);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="PDF Documents Merged Successfully!"
          filename={outputFilename}
          data={resultBytes}
          fileSizeStr={fileSizeStr}
          mimeType="application/pdf"
          extraInfo={`Consolidated ${files.length} documents into one clean PDF.`}
          onReset={handleReset}
        />
      ) : (
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={(newFiles) => {
              setFiles(newFiles);
              if (error) setError(null);
            }}
            multiple={true}
            maxFiles={limits.pdfMergeMaxFiles}
            title="Drag and drop PDF files to combine"
            subtitle="Order files using the up/down arrows. Merging happens 100% locally."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Output Filename:
                </label>
                <input
                  type="text"
                  value={outputFilename}
                  onChange={(e) => setOutputFilename(e.target.value)}
                  className="w-full sm:max-w-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="merged_document.pdf"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleMerge}
                  disabled={files.length < 2}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Combine className="w-4 h-4" />
                  <span>Merge {files.length} PDFs Now</span>
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
