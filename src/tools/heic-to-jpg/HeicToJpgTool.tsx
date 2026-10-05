import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { downloadFile } from '../../lib/pdfUtils';
import JSZip from 'jszip';
import { Smartphone, Download, Archive, RefreshCw, AlertTriangle } from 'lucide-react';

interface HeicConvertedItem {
  id: string;
  name: string;
  originalSize: number;
  newSize: number;
  blob: Blob;
  previewUrl: string;
}

export const HeicToJpgTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(90);
  const [results, setResults] = useState<HeicConvertedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(15);
    setProgressMsg('Loading browser-compatible HEIC WASM decoder...');

    try {
      // Lazy load heavy heic2any dependency per prompt requirement
      const heic2anyModule = await import('heic2any');
      const heic2any = heic2anyModule.default || heic2anyModule;

      const convertedList: HeicConvertedItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setProgress(Math.round(20 + (i / files.length) * 70));
        setProgressMsg(`Decoding HEIC image "${item.name}"...`);

        try {
          const conversionResult = await heic2any({
            blob: item.file,
            toType: 'image/jpeg',
            quality: quality / 100,
          });

          const blob: Blob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
          const previewUrl = URL.createObjectURL(blob);
          const baseName = item.name.replace(/\.(heic|heif)$/i, '');

          convertedList.push({
            id: item.id,
            name: `${baseName}.jpg`,
            originalSize: item.file.size,
            newSize: blob.size,
            blob,
            previewUrl,
          });
        } catch (subErr: any) {
          throw new Error(
            `Failed to decode "${item.name}". Please ensure it is a valid Apple iPhone HEIC/HEIF photo.`
          );
        }
      }

      setResults(convertedList);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(
        err?.message ||
          'Your browser could not decode this HEIC file. The file may be corrupt or encoded in an unsupported codec.'
      );
    }
  };

  const handleDownloadSingle = (item: HeicConvertedItem) => {
    downloadFile(item.blob, item.name, 'image/jpeg');
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Packaging converted JPEGs into ZIP...');

    try {
      const zip = new JSZip();
      for (const item of results) {
        zip.file(item.name, item.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, 'converted_heic_photos.zip', 'application/zip');
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to generate ZIP archive.');
    }
  };

  const handleReset = () => {
    results.forEach((r) => URL.revokeObjectURL(r.previewUrl));
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
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>Converted {results.length} HEIC Image(s) to JPG</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready to view and open on any Windows PC, Android, or web browser.
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
                  <img src={r.previewUrl} alt={r.name} className="max-h-full max-w-full object-contain" />
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300 font-semibold truncate">
                    <span className="truncate max-w-[160px]">{r.name}</span>
                    <span className="text-emerald-400 font-mono">JPG</span>
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
            accept=".heic,.heif,image/heic,image/heif"
            multiple={true}
            maxFiles={10}
            title="Upload iPhone HEIC or HEIF photos"
            subtitle="Decodes locally using in-browser WebAssembly. No cloud uploads."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Output JPEG Quality</span>
                  <span className="font-bold text-blue-400">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleConvert}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Convert {files.length} HEIC Photo(s) to JPG</span>
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
