import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { removePdfSize } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';
import { ShieldCheck, Sparkles, Sliders, CheckSquare, Square, Trash2, ArrowDownRight, Layers } from 'lucide-react';

export const PdfSizeRemoverTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<{
    bytes: Uint8Array;
    originalSize: number;
    newSize: number;
    reductionPercentage: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { addLog } = useToolHistory();

  // Optimization Toggles
  const [stripMetadata, setStripMetadata] = useState(true);
  const [cleanUnusedObjects, setCleanUnusedObjects] = useState(true);
  const [stripThumbnails, setStripThumbnails] = useState(true);
  const [recompressStreams, setRecompressStreams] = useState(true);

  const handleProcess = async () => {
    if (files.length === 0) {
      setError('Please select a PDF document first.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(10);
    setProgressMsg('Analyzing PDF streams and structure...');

    try {
      const res = await removePdfSize(
        files[0].file,
        {
          stripMetadata,
          cleanUnusedObjects,
          stripThumbnails,
          recompressStreams,
        },
        (pct, msg) => {
          setProgress(pct);
          setProgressMsg(msg);
        }
      );

      setResult(res);
      setIsProcessing(false);

      // Record to local audit history
      await addLog({
        toolSlug: 'pdf-size-remover',
        toolTitle: 'PDF Size Remover',
        fileName: files[0].name,
        fileSizeStr: formatBytes(res.newSize),
        fileSize: res.newSize,
        details: `Removed ${formatBytes(Math.max(0, res.originalSize - res.newSize))} (${res.reductionPercentage}% reduction)`,
        status: 'success',
      });
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to remove PDF size bloat.');

      await addLog({
        toolSlug: 'pdf-size-remover',
        toolTitle: 'PDF Size Remover',
        fileName: files[0]?.name || 'unknown.pdf',
        status: 'failed',
        details: err?.message,
      });
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      {files.length === 0 && (
        <FileDropzone
          multiple={false}
          maxFiles={1}
          files={files}
          onFilesChange={(newFiles) => {
            setFiles(newFiles);
            setError(null);
            setResult(null);
          }}
          title="Drop your bloated PDF here to remove extra size"
          subtitle="Removes hidden metadata, orphaned object streams, thumbnails, and bloated dictionaries"
          error={error}
          onErrorDismiss={() => setError(null)}
        />
      )}

      {/* Selected File & Optimization Options */}
      {files.length > 0 && !result && (
        <div className="space-y-6">
          <FileDropzone
            multiple={false}
            maxFiles={1}
            files={files}
            onFilesChange={setFiles}
            error={error}
            onErrorDismiss={() => setError(null)}
          />

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Bloat Removal Settings
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Original Size: <strong className="text-slate-200">{files[0].sizeStr}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                onClick={() => setStripMetadata(!stripMetadata)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="mt-0.5 text-blue-400">
                  {stripMetadata ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Strip Metadata & XML</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Removes author, producer, creation timestamps, and Adobe XMP piece info.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setCleanUnusedObjects(!cleanUnusedObjects)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="mt-0.5 text-blue-400">
                  {cleanUnusedObjects ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Purge Orphaned Object Streams</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Discards detached fonts, deleted page remnants, and unused form states.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setStripThumbnails(!stripThumbnails)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="mt-0.5 text-blue-400">
                  {stripThumbnails ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Remove Embedded Thumbnails</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Strips pre-rendered page preview images embedded by scanners.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setRecompressStreams(!recompressStreams)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="mt-0.5 text-blue-400">
                  {recompressStreams ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Recompress Object Streams</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Packs cross-reference tables and vector contents with FlateDecode.
                  </p>
                </div>
              </label>
            </div>

            {/* Action Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Remove Bloat & Trim PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isProcessing && (
        <ProgressBar progress={progress} message={progressMsg} />
      )}

      {/* Result Card */}
      {result && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Size Removal Complete</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                Saved {formatBytes(Math.max(0, result.originalSize - result.newSize))} ({result.reductionPercentage}%)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-[11px] text-slate-500">Original Size</p>
                <p className="text-base font-bold text-slate-300 font-mono mt-0.5">
                  {formatBytes(result.originalSize)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-emerald-900/40">
                <p className="text-[11px] text-emerald-400">Trimmed Size</p>
                <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                  {formatBytes(result.newSize)}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-[11px] text-slate-500">Reduction</p>
                <p className="text-base font-bold text-blue-400 font-mono mt-0.5 flex items-center gap-1">
                  <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                  <span>{result.reductionPercentage}%</span>
                </p>
              </div>
            </div>
          </div>

          <ResultCard
            data={result.bytes}
            filename={`trimmed-${files[0]?.name || 'document.pdf'}`}
            title="Your Trimmed PDF is Ready"
            description={`Successfully removed bloat from ${formatBytes(result.originalSize)} down to ${formatBytes(result.newSize)}.`}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
};
