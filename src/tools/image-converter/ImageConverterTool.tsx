import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { downloadFile } from '../../lib/pdfUtils';
import JSZip from 'jszip';
import { Repeat, Download, Archive, RefreshCw } from 'lucide-react';

interface ConvertedImageItem {
  id: string;
  name: string;
  originalSize: number;
  newSize: number;
  targetFormat: 'png' | 'jpeg' | 'webp';
  dataUrl: string;
}

export const ImageConverterTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(90);
  const [results, setResults] = useState<ConvertedImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(15);
    setProgressMsg('Converting images in browser canvas...');

    try {
      const converted: ConvertedImageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setProgress(Math.round(20 + (i / files.length) * 70));
        setProgressMsg(`Converting "${item.name}" to ${targetFormat.toUpperCase()}...`);

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

        // If converting to JPEG, composite on white background to prevent black alpha
        if (targetFormat === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const mime = `image/${targetFormat}`;
        const qVal = targetFormat === 'png' ? undefined : quality / 100;
        const outDataUrl = canvas.toDataURL(mime, qVal);
        const newBytes = atob(outDataUrl.split(',')[1]).length;

        const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;

        converted.push({
          id: item.id,
          name: `${baseName}.${ext}`,
          originalSize: item.file.size,
          newSize: newBytes,
          targetFormat,
          dataUrl: outDataUrl,
        });
      }

      setResults(converted);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to convert images.');
    }
  };

  const handleDownloadSingle = (item: ConvertedImageItem) => {
    downloadFile(item.dataUrl, item.name, `image/${item.targetFormat}`);
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Packaging converted files into ZIP...');

    try {
      const zip = new JSZip();
      results.forEach((it) => {
        const base64 = it.dataUrl.split(',')[1];
        zip.file(it.name, base64, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, `converted_${targetFormat}_images.zip`, 'application/zip');
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to generate ZIP archive.');
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
                <Repeat className="w-5 h-5 text-emerald-400" />
                <span>Converted {results.length} Image(s) to {targetFormat.toUpperCase()}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready to download individually or bundled in a single ZIP.
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
                    <span className="text-blue-400 font-mono uppercase">{r.targetFormat}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{formatBytes(r.originalSize)} → {formatBytes(r.newSize)}</span>
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
            title="Upload images to convert format"
            subtitle="Cross-convert JPG, PNG, and WebP. Batch processing supported."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Format</label>
                  <select
                    value={targetFormat}
                    onChange={(e: any) => setTargetFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="png">PNG (Lossless, Transparency)</option>
                    <option value="jpeg">JPG (Standard Photo)</option>
                    <option value="webp">WebP (Modern Lightweight Web Format)</option>
                  </select>
                </div>

                {targetFormat !== 'png' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Quality: {quality}%</label>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleConvert}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Repeat className="w-4 h-4" />
                  <span>Convert {files.length} Image(s) to {targetFormat.toUpperCase()}</span>
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
