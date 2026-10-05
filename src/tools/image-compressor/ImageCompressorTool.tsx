import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { downloadFile } from '../../lib/pdfUtils';
import JSZip from 'jszip';
import { FileArchive, Download, Archive, RefreshCw } from 'lucide-react';

interface CompressedImageItem {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  percent: number;
  dataUrl: string;
}

export const ImageCompressorTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(75); // 1..100
  const [results, setResults] = useState<CompressedImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCompress = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(15);
    setProgressMsg('Compressing images using browser canvas...');

    try {
      const outputItems: CompressedImageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setProgress(Math.round(20 + (i / files.length) * 70));
        setProgressMsg(`Optimizing "${item.name}"...`);

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

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.drawImage(img, 0, 0);

        // Determine mime
        const isPng = item.file.type === 'image/png';
        const mime = isPng ? 'image/png' : 'image/jpeg';
        const qVal = quality / 100;

        const compDataUrl = canvas.toDataURL(mime, qVal);
        const compBytes = atob(compDataUrl.split(',')[1]).length;
        const diff = item.file.size - compBytes;
        const percent = diff > 0 ? Math.round((diff / item.file.size) * 100) : 0;

        outputItems.push({
          id: item.id,
          name: item.name,
          originalSize: item.file.size,
          compressedSize: compBytes,
          percent,
          dataUrl: compDataUrl,
        });
      }

      setResults(outputItems);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to compress images.');
    }
  };

  const handleDownloadSingle = (item: CompressedImageItem) => {
    downloadFile(item.dataUrl, `compressed_${item.name}`, 'image/jpeg');
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Packaging compressed images into ZIP...');

    try {
      const zip = new JSZip();
      results.forEach((it) => {
        const base64 = it.dataUrl.split(',')[1];
        zip.file(`compressed_${it.name}`, base64, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, 'compressed_images.zip', 'application/zip');
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to create ZIP archive.');
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
                <FileArchive className="w-5 h-5 text-emerald-400" />
                <span>Compressed {results.length} Image(s)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved total space: <strong className="text-emerald-400">
                  {formatBytes(results.reduce((acc, r) => acc + (r.originalSize - r.compressedSize), 0))}
                </strong>
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
                    <span className="text-emerald-400 font-mono">-{r.percent}%</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{formatBytes(r.originalSize)} → {formatBytes(r.compressedSize)}</span>
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
            onFilesChange={(newFiles) => {
              setFiles(newFiles);
              if (error) setError(null);
            }}
            accept="image/png,image/jpeg,image/webp,image/jpg"
            multiple={true}
            maxFiles={20}
            title="Upload JPG, PNG, or WebP images to compress"
            subtitle="Browser-side compression. Supports batch optimization."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="font-semibold">Compression Quality: {quality}%</span>
                  <span className="text-slate-400">
                    {quality > 80 ? 'High Quality' : quality > 50 ? 'Recommended (Balanced)' : 'Aggressive Reduction'}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleCompress}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <FileArchive className="w-4 h-4" />
                  <span>Compress {files.length} Image(s)</span>
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
