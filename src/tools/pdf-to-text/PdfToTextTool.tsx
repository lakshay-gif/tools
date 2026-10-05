import React, { useState } from 'react';
import { FileText, Download, Sparkles, Copy, Check } from 'lucide-react';
import { FileDropzone } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { convertPdfToText } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

export const PdfToTextTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'txt' | 'md'>('txt');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [extracted, setExtracted] = useState<{ text: string; markdown: string; filename: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useToolHistory();

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setExtracted(null);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const res = await convertPdfToText(file, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setExtracted({
        text: res.text,
        markdown: res.markdown,
        filename: `${baseName}.${format}`,
      });

      addLog({
        toolSlug: 'pdf-to-text',
        toolName: `PDF to ${format.toUpperCase()}`,
        filename: file.name,
        fileSize: file.size,
        status: 'success',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to extract text from PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!extracted) return;
    const content = format === 'md' ? extracted.markdown : extracted.text;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeContent = extracted ? (format === 'md' ? extracted.markdown : extracted.text) : '';

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          accept={{ 'application/pdf': ['.pdf'] }}
          title="Drop your PDF here to extract plain text / Markdown"
          subtitle="Exports clean text stream with page delimiters, word wrap, and heading tags"
        />
      ) : !extracted ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(file.size)} • Text extraction</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Change File
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Output Format</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('txt')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  format === 'txt'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-sm">Plain Text (.txt)</div>
                <div className="text-[11px] text-slate-400 mt-1">Universal raw text file with page markers</div>
              </button>
              <button
                type="button"
                onClick={() => setFormat('md')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  format === 'md'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-sm">Markdown (.md)</div>
                <div className="text-[11px] text-slate-400 mt-1">Formatted with heading # and structured blocks</div>
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
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Extracting Text...' : `Export as ${format.toUpperCase()} Now`}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Extracted Text Stream</h3>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Text!' : 'Copy to Clipboard'}</span>
            </button>
          </div>

          <textarea
            readOnly
            value={activeContent}
            rows={10}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 focus:outline-none"
          />

          <ResultCard
            title="Text File Ready!"
            filename={extracted.filename}
            fileSizeStr={formatBytes(new TextEncoder().encode(activeContent).byteLength)}
            data={activeContent}
            mimeType={format === 'md' ? 'text/markdown' : 'text/plain'}
            extraInfo="Text stream extracted from PDF. Cleaned without telemetry."
            onReset={() => {
              setFile(null);
              setExtracted(null);
            }}
          />
        </div>
      )}
    </div>
  );
};
