import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { resizePdfPages } from '../../lib/pdfUtils';
import { Maximize2, Settings2 } from 'lucide-react';

export const PdfPageSizeTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [targetSize, setTargetSize] = useState<'A3' | 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom'>('A4');
  const [mode, setMode] = useState<'fit' | 'fill' | 'preserve'>('fit');
  const [customWidth, setCustomWidth] = useState(595);
  const [customHeight, setCustomHeight] = useState(842);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const handleResize = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg(`Converting page dimensions to ${targetSize}...`);

    try {
      const resized = await resizePdfPages(files[0].file, targetSize, {
        customWidth,
        customHeight,
        mode,
      });

      setResultBytes(resized);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to convert PDF page size.');
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
          title="PDF Dimensions Converted Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_${targetSize.toLowerCase()}.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo={`All pages standardized to ${targetSize} format (${mode} mode).`}
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
            title="Upload PDF to convert paper size"
            subtitle="Resize between A3, A4, A5, US Letter, US Legal, or custom sizes."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Maximize2 className="w-4 h-4 text-blue-400" />
                <span>Paper Size & Aspect Scaling Options</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Paper Size</label>
                  <select
                    value={targetSize}
                    onChange={(e: any) => setTargetSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="A4">A4 (210 × 297 mm) - Global Standard</option>
                    <option value="Letter">US Letter (8.5 × 11 in) - North America</option>
                    <option value="Legal">US Legal (8.5 × 14 in)</option>
                    <option value="A3">A3 (297 × 420 mm) - Large Format</option>
                    <option value="A5">A5 (148 × 210 mm) - Booklet</option>
                    <option value="Custom">Custom Dimensions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Scaling Behavior</label>
                  <select
                    value={mode}
                    onChange={(e: any) => setMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="fit">Fit & Center (Preserve Aspect Ratio - Best)</option>
                    <option value="fill">Fill Entire Page (Stretch if needed)</option>
                    <option value="preserve">Preserve Original Geometry</option>
                  </select>
                </div>
              </div>

              {targetSize === 'Custom' && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Width (pt / 72 per inch)</label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Height (pt / 72 per inch)</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleResize}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Resize PDF Pages</span>
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
