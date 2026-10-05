import React, { useState } from 'react';
import { Download, CheckCircle, RotateCcw, Share2, Copy, Check, FileCheck, ArrowDownToLine } from 'lucide-react';
import { downloadFile } from '../../lib/pdfUtils';

interface ResultCardProps {
  title?: string;
  filename: string;
  data: Uint8Array | Blob | string;
  fileSizeStr?: string;
  mimeType?: string;
  onReset: () => void;
  previewUrl?: string;
  extraInfo?: string;
  description?: string;
  className?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title = 'Your File is Ready!',
  filename,
  data,
  fileSizeStr,
  mimeType = 'application/pdf',
  onReset,
  previewUrl,
  extraInfo,
  description,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const infoText = description || extraInfo;

  const handleDownload = () => {
    downloadFile(data, filename, mimeType);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20 p-6 shadow-xl ${className}`}
      role="region"
      aria-label="Result file download"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span className="font-mono text-slate-300 font-medium truncate max-w-[260px] sm:max-w-md">
                {filename}
              </span>
              {fileSizeStr && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{fileSizeStr}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors border border-slate-700/60 cursor-pointer"
            title="Process another document"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Over</span>
          </button>
        </div>
      </div>

      {previewUrl && (
        <div className="my-5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center max-h-[300px]">
          <img
            src={previewUrl}
            alt="Generated output preview"
            className="max-h-[300px] w-auto object-contain"
          />
        </div>
      )}

      {infoText && (
        <div className="my-4 p-3 rounded-xl bg-blue-950/30 border border-blue-900/50 text-xs text-blue-300 flex items-center gap-2">
          <FileCheck className="w-4 h-4 shrink-0 text-blue-400" />
          <span>{infoText}</span>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={handleDownload}
          className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/60 transition-all cursor-pointer transform active:scale-[0.99]"
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Download File (Always Free)</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Link Copied!' : 'Share Tool'}</span>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Zero server uploads • 100% Client-side export
        </span>
        <span className="text-slate-400">Ready to save</span>
      </div>
    </div>
  );
};
