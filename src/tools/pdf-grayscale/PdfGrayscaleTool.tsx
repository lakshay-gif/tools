import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { convertPdfToGrayscale } from '../../lib/pdfRenderer';
import { parsePageRanges } from '../../lib/pdfUtils';
import { Contrast, Check } from 'lucide-react';

export const PdfGrayscaleTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [targetPagesStr, setTargetPagesStr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(15);
    setProgressMsg('Desaturating color channels...');

    try {
      let targetPages: number[] | undefined = undefined;
      if (targetPagesStr.trim()) {
        targetPages = parsePageRanges(targetPagesStr, 9999).map((idx) => idx + 1);
      }

      const grayscaleBytes = await convertPdfToGrayscale(files[0].file, targetPages, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      setResultBytes(grayscaleBytes);
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to convert PDF to grayscale.');
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
          title="Converted to Grayscale Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_grayscale.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo="Document color streams converted to high-contrast monochrome grayscale."
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
            title="Upload PDF to convert to black & white"
            subtitle="Desaturates color channels into clean, ink-saving grayscale."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Pages to Convert (Leave blank for Entire Document):
                </label>
                <input
                  type="text"
                  value={targetPagesStr}
                  onChange={(e) => setTargetPagesStr(e.target.value)}
                  placeholder="e.g. 1-4, 7 (or blank for all)"
                  className="w-full sm:max-w-md px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Converting to grayscale preserves high contrast for monochrome laser printing and lowers toner consumption.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleConvert}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Contrast className="w-4 h-4" />
                  <span>Convert to Grayscale</span>
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
