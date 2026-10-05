import React, { useState, useEffect } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { cropPdf, parsePageRanges } from '../../lib/pdfUtils';
import { renderSinglePage } from '../../lib/pdfRenderer';
import { Crop, Settings2 } from 'lucide-react';

export const PdfCropTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [cropMargins, setCropMargins] = useState({ top: 10, bottom: 10, left: 10, right: 10 });
  const [targetPagesStr, setTargetPagesStr] = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      setPreviewDataUrl(null);
      return;
    }

    renderSinglePage(files[0].file, 1, 1.0)
      .then((res) => setPreviewDataUrl(res.canvas.toDataURL()))
      .catch(() => {});
  }, [files]);

  const handleCrop = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Applying crop boundaries to PDF pages...');

    try {
      let pageIndices: number[] | undefined = undefined;
      if (targetPagesStr.trim()) {
        pageIndices = parsePageRanges(targetPagesStr, 9999);
      }

      const croppedBytes = await cropPdf(files[0].file, cropMargins, pageIndices);
      setResultBytes(croppedBytes);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to crop PDF.');
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
          title="PDF Cropped Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_cropped.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo="Page boundaries and margins trimmed cleanly."
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
            title="Upload PDF to crop margins"
            subtitle="Trim excess white space or crop page boundaries. 100% Client-side."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Crop className="w-4 h-4 text-blue-400" />
                <span>Visual Crop Boundaries (Percentage Margin Trim)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Preview Box with shaded margin overlay */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 mb-2 font-medium">Page 1 Live Crop Preview</span>
                  {previewDataUrl ? (
                    <div className="relative border border-slate-700 rounded overflow-hidden max-h-[320px]">
                      <img src={previewDataUrl} alt="Preview" className="max-h-[300px] w-auto object-contain" />
                      {/* Crop overlay overlays */}
                      <div
                        className="absolute inset-0 border-2 border-dashed border-blue-400 pointer-events-none"
                        style={{
                          top: `${cropMargins.top}%`,
                          bottom: `${cropMargins.bottom}%`,
                          left: `${cropMargins.left}%`,
                          right: `${cropMargins.right}%`,
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                      Loading preview...
                    </div>
                  )}
                </div>

                {/* Crop Margin Sliders */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Top Margin Trim</span>
                      <span className="font-mono text-blue-400 font-bold">{cropMargins.top}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={cropMargins.top}
                      onChange={(e) => setCropMargins({ ...cropMargins, top: parseInt(e.target.value, 10) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Bottom Margin Trim</span>
                      <span className="font-mono text-blue-400 font-bold">{cropMargins.bottom}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={cropMargins.bottom}
                      onChange={(e) => setCropMargins({ ...cropMargins, bottom: parseInt(e.target.value, 10) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Left Margin Trim</span>
                      <span className="font-mono text-blue-400 font-bold">{cropMargins.left}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={cropMargins.left}
                      onChange={(e) => setCropMargins({ ...cropMargins, left: parseInt(e.target.value, 10) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Right Margin Trim</span>
                      <span className="font-mono text-blue-400 font-bold">{cropMargins.right}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={cropMargins.right}
                      onChange={(e) => setCropMargins({ ...cropMargins, right: parseInt(e.target.value, 10) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Apply to Pages (e.g. 1-5, or blank for all)
                    </label>
                    <input
                      type="text"
                      value={targetPagesStr}
                      onChange={(e) => setTargetPagesStr(e.target.value)}
                      placeholder="Leave blank for all pages"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleCrop}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Crop className="w-4 h-4" />
                  <span>Apply Crop & Download PDF</span>
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
