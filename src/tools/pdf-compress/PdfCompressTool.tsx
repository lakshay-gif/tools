import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { compressPdf } from '../../lib/pdfUtils';
import { Minimize2, ShieldCheck, Zap } from 'lucide-react';

export const PdfCompressTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [stats, setStats] = useState<{ origSize: number; compSize: number; percent: number } | null>(null);

  const handleCompress = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(15);
    setProgressMsg('Analyzing PDF streams and dictionaries...');

    try {
      const origSize = files[0].file.size;
      setTimeout(() => setProgress(50), 300);

      const compressed = await compressPdf(files[0].file, compressionLevel);
      setProgress(85);
      setProgressMsg('Cleaning unreferenced objects and repacking...');

      const compSize = compressed.byteLength;
      // calculate realistic reduction or minor expansion if already compressed
      const diff = origSize - compSize;
      const percent = diff > 0 ? Math.round((diff / origSize) * 100) : 0;

      setStats({ origSize, compSize, percent });
      setResultBytes(compressed);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to compress PDF file.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBytes(null);
    setStats(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {resultBytes && stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Original Size</span>
              <p className="text-lg font-bold text-slate-200 mt-0.5">{formatBytes(stats.origSize)}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Compressed Size</span>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatBytes(stats.compSize)}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Size Reduction</span>
              <p className="text-lg font-bold text-blue-400 mt-0.5">
                {stats.percent > 0 ? `-${stats.percent}%` : 'Already Optimized'}
              </p>
            </div>
          </div>

          <ResultCard
            title="PDF Compressed Successfully!"
            filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_compressed.pdf`}
            data={resultBytes}
            fileSizeStr={formatBytes(stats.compSize)}
            extraInfo={
              stats.percent > 0
                ? `Reduced file size by ${stats.percent}% without sending files to any server.`
                : 'Your document was already heavily optimized. Minor structural cleaning applied.'
            }
            onReset={handleReset}
          />
        </div>
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
            title="Select or drop PDF to compress"
            subtitle="Browser-side optimization. Zero cloud uploads."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Compression Level
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    level: 'low',
                    label: 'Low Compression',
                    desc: 'Best visual quality, minimal size reduction',
                  },
                  {
                    level: 'medium',
                    label: 'Medium (Recommended)',
                    desc: 'Balanced compression with sharp text',
                  },
                  {
                    level: 'high',
                    label: 'High Compression',
                    desc: 'Maximum size reduction for email & uploads',
                  },
                ].map((opt) => (
                  <div
                    key={opt.level}
                    onClick={() => setCompressionLevel(opt.level as any)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      compressionLevel === opt.level
                        ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold block">{opt.label}</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">{opt.desc}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Current size: <strong className="text-slate-200">{files[0]?.sizeStr}</strong>
                </span>

                <button
                  onClick={handleCompress}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Compress PDF Now</span>
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
