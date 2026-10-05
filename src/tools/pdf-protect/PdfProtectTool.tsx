import React, { useState } from 'react';
import { Lock, Download, Sparkles, KeyRound, ShieldCheck } from 'lucide-react';
import { FileDropzone } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { protectPdf } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

export const PdfProtectTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [protectedResult, setProtectedResult] = useState<{ data: Uint8Array; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useToolHistory();

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setProtectedResult(null);
      setError(null);
    }
  };

  const handleProtect = async () => {
    if (!file) return;
    if (!password) {
      setError('Please provide a password to protect your PDF.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const pdfBytes = await protectPdf(file, password, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });

      const outName = `${file.name.replace(/\.[^/.]+$/, '')}-protected.pdf`;
      setProtectedResult({ data: pdfBytes, filename: outName });

      addLog({
        toolSlug: 'pdf-protect',
        toolName: 'Protect PDF (Password)',
        filename: file.name,
        fileSize: file.size,
        status: 'success',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to encrypt PDF.');
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
          title="Drop your PDF here to encrypt & protect with password"
          subtitle="Client-side encryption. Prevents unauthorized viewing, printing, or extracting"
        />
      ) : !protectedResult ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(file.size)} • Security encryption</p>
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
              <KeyRound className="w-4 h-4 text-purple-400" />
              <span>Set Document Password</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">User Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter strong password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Password is verified in local browser memory. Never transmitted or logged.</span>
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
            onClick={handleProtect}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{isProcessing ? 'Securing PDF...' : 'Protect PDF Now'}</span>
          </button>
        </div>
      ) : (
        <ResultCard
          title="PDF Password Protected!"
          filename={protectedResult.filename}
          fileSizeStr={formatBytes(protectedResult.data.byteLength)}
          data={protectedResult.data}
          mimeType="application/pdf"
          extraInfo="Document encrypted with password protection. Remember your password to open the file."
          onReset={() => {
            setFile(null);
            setPassword('');
            setConfirmPassword('');
            setProtectedResult(null);
          }}
        />
      )}
    </div>
  );
};
