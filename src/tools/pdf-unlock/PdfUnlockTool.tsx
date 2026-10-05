import React, { useState } from 'react';
import { Unlock, Download, Sparkles, KeyRound, ShieldAlert } from 'lucide-react';
import { FileDropzone } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { unlockPdf } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

export const PdfUnlockTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [unlockedResult, setUnlockedResult] = useState<{ data: Uint8Array; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useToolHistory();

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setUnlockedResult(null);
      setError(null);
    }
  };

  const handleUnlock = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const pdfBytes = await unlockPdf(file, password, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });

      const outName = `${file.name.replace(/\.[^/.]+$/, '')}-unlocked.pdf`;
      setUnlockedResult({ data: pdfBytes, filename: outName });

      addLog({
        toolSlug: 'pdf-unlock',
        toolName: 'Unlock PDF (Remove Password)',
        filename: file.name,
        fileSize: file.size,
        status: 'success',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to unlock PDF. Please verify password if required.');
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
          title="Drop your locked / protected PDF here"
          subtitle="Removes viewing and editing password restrictions to export clean PDF"
        />
      ) : !unlockedResult ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(file.size)} • Password removal</p>
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
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Current Document Password (If Prompted)</span>
            </h4>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (optional if only editing is restricted)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Ensure you have legal authorization to decrypt and remove protection from this document.</span>
            </p>
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
            onClick={handleUnlock}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>{isProcessing ? 'Removing Restrictions...' : 'Unlock PDF Now'}</span>
          </button>
        </div>
      ) : (
        <ResultCard
          title="PDF Password Removed!"
          filename={unlockedResult.filename}
          fileSizeStr={formatBytes(unlockedResult.data.byteLength)}
          data={unlockedResult.data}
          mimeType="application/pdf"
          extraInfo="Security encryption removed. The resulting file can be opened and edited without entering credentials."
          onReset={() => {
            setFile(null);
            setPassword('');
            setUnlockedResult(null);
          }}
        />
      )}
    </div>
  );
};
