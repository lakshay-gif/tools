import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { increasePdfSize } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';
import { ArrowUpRight, Sparkles, Sliders, ShieldCheck, CheckCircle2, HelpCircle } from 'lucide-react';

export const PdfSizeGainerTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<{
    bytes: Uint8Array;
    originalSize: number;
    newSize: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { addLog } = useToolHistory();

  // Target size state
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');
  const [targetValue, setTargetValue] = useState<number>(500);

  const originalSizeBytes = files.length > 0 ? files[0].file.size : 0;
  const targetSizeBytes = targetValue * (targetUnit === 'MB' ? 1024 * 1024 : 1024);

  const isTargetSmaller = files.length > 0 && targetSizeBytes <= originalSizeBytes;

  const handlePreset = (val: number, unit: 'KB' | 'MB') => {
    setTargetValue(val);
    setTargetUnit(unit);
    setError(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError('Please select a PDF document first.');
      return;
    }

    if (targetSizeBytes <= originalSizeBytes) {
      setError(
        `Target size (${formatBytes(targetSizeBytes)}) must be larger than current file size (${formatBytes(originalSizeBytes)}).`
      );
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(15);
    setProgressMsg('Preparing compliant ISO 32000 PDF padding buffer...');

    try {
      const res = await increasePdfSize(files[0].file, targetSizeBytes, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      setResult(res);
      setIsProcessing(false);

      // Record to local audit history
      await addLog({
        toolSlug: 'pdf-size-gainer',
        toolTitle: 'PDF Size Gainer',
        fileName: files[0].name,
        fileSizeStr: formatBytes(res.newSize),
        fileSize: res.newSize,
        details: `Inflated from ${formatBytes(res.originalSize)} to ${formatBytes(res.newSize)} (+${formatBytes(res.newSize - res.originalSize)})`,
        status: 'success',
      });
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to increase PDF size.');

      await addLog({
        toolSlug: 'pdf-size-gainer',
        toolTitle: 'PDF Size Gainer',
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
            // Auto preset target size to be higher than original
            if (newFiles.length > 0) {
              const currentKb = Math.ceil(newFiles[0].file.size / 1024);
              if (currentKb < 500) {
                setTargetValue(500);
                setTargetUnit('KB');
              } else if (currentKb < 1024) {
                setTargetValue(1);
                setTargetUnit('MB');
              } else {
                setTargetValue(Math.ceil((currentKb * 1.5) / 1024));
                setTargetUnit('MB');
              }
            }
          }}
          title="Drop your PDF here to increase / gain file size"
          subtitle="Safely inflates PDF file size to satisfy minimum portal upload requirements"
          error={error}
          onErrorDismiss={() => setError(null)}
        />
      )}

      {/* Selected File & Target Size Selector */}
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

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Target File Size Settings
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Current Size: <strong className="text-slate-200">{files[0].sizeStr}</strong>
              </span>
            </div>

            {/* Explanatory callout */}
            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-300">
              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Many portal upload forms (e.g. government exams, college applications, visas) reject files that are too small (e.g. "File must be at least 500 KB"). This tool safely expands the file to your exact desired target without distorting visual contents or text readability.
              </span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Common Portal Presets:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '200 KB', val: 200, unit: 'KB' as const },
                  { label: '500 KB (Gov/Exam)', val: 500, unit: 'KB' as const },
                  { label: '1 MB (Visa/Passport)', val: 1, unit: 'MB' as const },
                  { label: '2 MB (Corporate)', val: 2, unit: 'MB' as const },
                  { label: '5 MB', val: 5, unit: 'MB' as const },
                ].map((p) => {
                  const pBytes = p.val * (p.unit === 'MB' ? 1024 * 1024 : 1024);
                  const isCurrent = targetValue === p.val && targetUnit === p.unit;
                  const isTooSmall = pBytes <= originalSizeBytes;

                  return (
                    <button
                      key={p.label}
                      type="button"
                      disabled={isTooSmall}
                      onClick={() => handlePreset(p.val, p.unit)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Or Enter Custom Desired Target Size:
              </label>
              <div className="flex items-center gap-3 max-w-sm">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Math.max(1, Number(e.target.value)))}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-mono focus:outline-none focus:border-blue-500"
                />
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTargetUnit('KB')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      targetUnit === 'KB' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    KB
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetUnit('MB')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      targetUnit === 'MB' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    MB
                  </button>
                </div>
              </div>

              {/* Status / Delta Preview */}
              <div className="pt-2">
                {isTargetSmaller ? (
                  <p className="text-xs text-amber-400 font-medium">
                    ⚠️ Selected target ({formatBytes(targetSizeBytes)}) is smaller than or equal to current size ({files[0].sizeStr}). Please pick a larger value to gain size.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Will add approximately +{formatBytes(targetSizeBytes - originalSizeBytes)} to reach exactly {formatBytes(targetSizeBytes)}.
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-3 flex justify-end">
              <button
                onClick={handleProcess}
                disabled={isProcessing || isTargetSmaller}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Gain Size & Expand PDF</span>
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
                <span>Size Expansion Complete</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950/80 text-blue-400 border border-blue-800/50">
                +{formatBytes(result.newSize - result.originalSize)} Added
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-[11px] text-slate-500">Initial Size</p>
                <p className="text-base font-bold text-slate-300 font-mono mt-0.5">
                  {formatBytes(result.originalSize)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-blue-900/40">
                <p className="text-[11px] text-blue-400">Target Size Reached</p>
                <p className="text-base font-bold text-blue-400 font-mono mt-0.5">
                  {formatBytes(result.newSize)}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-[11px] text-slate-500">Integrity Status</p>
                <p className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ISO 32000 Compliant</span>
                </p>
              </div>
            </div>
          </div>

          <ResultCard
            data={result.bytes}
            filename={`expanded-${files[0]?.name || 'document.pdf'}`}
            title="Your Expanded PDF is Ready"
            description={`Successfully increased file size from ${formatBytes(result.originalSize)} up to ${formatBytes(result.newSize)}.`}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
};
