import React, { useState } from 'react';
import { Moon, Download, Sparkles, Sun, Eye } from 'lucide-react';
import { FileDropzone } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { convertPdfDarkMode } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

export const PdfDarkModeTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'dark' | 'sepia' | 'inverted'>('dark');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [darkResult, setDarkResult] = useState<{ data: Uint8Array; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useToolHistory();

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setDarkResult(null);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const pdfBytes = await convertPdfDarkMode(file, mode, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });

      const outName = `${file.name.replace(/\.[^/.]+$/, '')}-${mode}.pdf`;
      setDarkResult({ data: pdfBytes, filename: outName });

      addLog({
        toolSlug: 'pdf-dark-mode',
        toolName: `PDF ${mode.toUpperCase()} Mode`,
        filename: file.name,
        fileSize: file.size,
        status: 'success',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to invert PDF colors.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          accept={{ 'application/pdf': ['.pdf'] }}
          title="Drop your PDF here for Dark Mode / Color Invert"
          subtitle="Reduces eye fatigue for nighttime reading by converting glaring white backgrounds"
        />
      ) : !darkResult ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(file.size)} • Reading contrast filter</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Change File
            </button>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Select Reading Theme</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMode('dark')}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  mode === 'dark'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Night Dark Slate</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Soft dark slate background with crisp light text</div>
              </button>

              <button
                type="button"
                onClick={() => setMode('sepia')}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  mode === 'sepia'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Warm Sepia</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Kindle-style warm parchment reading tone</div>
              </button>

              <button
                type="button"
                onClick={() => setMode('inverted')}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  mode === 'inverted'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>High Contrast</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Pure mathematical color inverse (black / white)</div>
              </button>
            </div>
          </div>

          {isProcessing && (
            <ProgressBar progress={progress} message={progressMsg} />
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
              {error}
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Converting Colors...' : `Apply ${mode.toUpperCase()} Theme Now`}</span>
          </button>
        </div>
      ) : (
        <ResultCard
          title="Dark Mode PDF Ready!"
          filename={darkResult.filename}
          fileSizeStr={formatBytes(darkResult.data.byteLength)}
          data={darkResult.data}
          mimeType="application/pdf"
          extraInfo="Document rendered with eye-protective dark mode color matrix."
          onReset={() => {
            setFile(null);
            setDarkResult(null);
          }}
        />
      )}
    </div>
  );
};
