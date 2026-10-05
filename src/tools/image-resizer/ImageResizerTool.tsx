import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { downloadFile } from '../../lib/pdfUtils';
import JSZip from 'jszip';
import { Scaling, Download, Archive, RefreshCw, Lock, Unlock } from 'lucide-react';

interface ResizedImageItem {
  id: string;
  name: string;
  origDims: string;
  newDims: string;
  dataUrl: string;
}

export const ImageResizerTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [mode, setMode] = useState<'dimensions' | 'percentage'>('dimensions');
  const [targetWidth, setTargetWidth] = useState(1200);
  const [targetHeight, setTargetHeight] = useState(800);
  const [percentage, setPercentage] = useState(50);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const [results, setResults] = useState<ResizedImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFilesChange = (newFiles: FileItem[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          setTargetWidth(img.width);
          setTargetHeight(img.height);
          setAspectRatio(img.width / img.height);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(newFiles[0].file);
    }
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (maintainAspect && aspectRatio) {
      setTargetHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (maintainAspect && aspectRatio) {
      setTargetWidth(Math.round(val * aspectRatio));
    }
  };

  const applyPreset = (w: number, h: number) => {
    setMode('dimensions');
    setTargetWidth(w);
    setTargetHeight(h);
    setMaintainAspect(false);
  };

  const handleResize = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(15);
    setProgressMsg('Resizing images in browser canvas...');

    try {
      const resized: ResizedImageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setProgress(Math.round(20 + (i / files.length) * 70));
        setProgressMsg(`Resizing "${item.name}"...`);

        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(item.file);
        });

        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = dataUrl;
        });

        let finalW = targetWidth;
        let finalH = targetHeight;

        if (mode === 'percentage') {
          finalW = Math.max(1, Math.round(img.width * (percentage / 100)));
          finalH = Math.max(1, Math.round(img.height * (percentage / 100)));
        } else if (maintainAspect) {
          const ratio = img.width / img.height;
          finalH = Math.max(1, Math.round(finalW / ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = finalW;
        canvas.height = finalH;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.drawImage(img, 0, 0, finalW, finalH);

        const mime = item.file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const outDataUrl = canvas.toDataURL(mime, 0.92);

        resized.push({
          id: item.id,
          name: item.name,
          origDims: `${img.width}×${img.height}`,
          newDims: `${finalW}×${finalH}`,
          dataUrl: outDataUrl,
        });
      }

      setResults(resized);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to resize images.');
    }
  };

  const handleDownloadSingle = (item: ResizedImageItem) => {
    downloadFile(item.dataUrl, `resized_${item.name}`, 'image/jpeg');
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Packaging resized images into ZIP...');

    try {
      const zip = new JSZip();
      results.forEach((it) => {
        const base64 = it.dataUrl.split(',')[1];
        zip.file(`resized_${it.name}`, base64, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, 'resized_images.zip', 'application/zip');
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to create ZIP package.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {results.length > 0 ? (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Scaling className="w-5 h-5 text-emerald-400" />
                <span>Resized {results.length} Image(s)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target resolution: <strong className="text-white">{results[0]?.newDims} px</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadZip}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md"
              >
                <Archive className="w-4 h-4" />
                <span>Download All as ZIP</span>
              </button>

              <button
                onClick={handleReset}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs cursor-pointer"
                title="Start over"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((r) => (
              <div key={r.id} className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900 flex flex-col justify-between space-y-3">
                <div className="h-44 bg-slate-950 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                  <img src={r.dataUrl} alt={r.name} className="max-h-full max-w-full object-contain" />
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300 font-semibold truncate">
                    <span className="truncate max-w-[160px]">{r.name}</span>
                    <span className="text-blue-400 font-mono">{r.newDims}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Orig: {r.origDims}</span>
                    <button
                      onClick={() => handleDownloadSingle(r)}
                      className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={handleFilesChange}
            accept="image/png,image/jpeg,image/webp,image/jpg"
            multiple={true}
            maxFiles={20}
            title="Upload images to resize"
            subtitle="Resize by pixels or percentage scale. Batch processing supported."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              {/* Mode switch */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode('dimensions')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    mode === 'dimensions' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  By Exact Dimensions (Pixels)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('percentage')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    mode === 'percentage' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  By Percentage Scale
                </button>
              </div>

              {mode === 'dimensions' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={targetWidth}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={targetHeight}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <button
                      type="button"
                      onClick={() => setMaintainAspect(!maintainAspect)}
                      className="inline-flex items-center gap-1.5 cursor-pointer text-blue-400 font-semibold"
                    >
                      {maintainAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{maintainAspect ? 'Maintain Aspect Ratio (Locked)' : 'Custom Aspect Ratio (Unlocked)'}</span>
                    </button>
                  </div>

                  {/* Preset Buttons */}
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">Common Presets:</span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => applyPreset(1920, 1080)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                      >
                        1080p Full HD (1920×1080)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset(1080, 1080)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                      >
                        Instagram Square (1080×1080)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset(800, 600)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                      >
                        Web Standard (800×600)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Scale Percentage: {percentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={percentage}
                    onChange={(e) => setPercentage(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex gap-2 text-xs pt-1">
                    {[25, 50, 75, 125, 150].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPercentage(p)}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleResize}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Scaling className="w-4 h-4" />
                  <span>Resize {files.length} Image(s)</span>
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
