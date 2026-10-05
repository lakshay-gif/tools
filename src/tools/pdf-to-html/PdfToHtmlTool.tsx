import React, { useState } from 'react';
import { Code, Download, Sparkles, Copy, Check } from 'lucide-react';
import { FileDropzone } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { convertPdfToHtml } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

export const PdfToHtmlTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [htmlResult, setHtmlResult] = useState<{ content: string; filename: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useToolHistory();

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setHtmlResult(null);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const htmlString = await convertPdfToHtml(file, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });

      const outName = `${file.name.replace(/\.[^/.]+$/, '')}.html`;
      setHtmlResult({ content: htmlString, filename: outName });

      addLog({
        toolSlug: 'pdf-to-html',
        toolName: 'PDF to HTML',
        filename: file.name,
        fileSize: file.size,
        status: 'success',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to convert PDF to HTML.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!htmlResult) return;
    navigator.clipboard.writeText(htmlResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          accept={{ 'application/pdf': ['.pdf'] }}
          title="Drop your PDF here to convert to HTML"
          subtitle="Generates standalone, mobile-responsive HTML web pages with clean CSS"
        />
      ) : !htmlResult ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(file.size)} • Converts to HTML document</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Change File
            </button>
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
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Generating HTML...' : 'Convert to HTML Web Page Now'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Generated HTML Preview & Code</h3>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied HTML!' : 'Copy Code'}</span>
            </button>
          </div>

          <textarea
            readOnly
            value={htmlResult.content}
            rows={10}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 focus:outline-none"
          />

          <ResultCard
            title="HTML Web Page Ready!"
            filename={htmlResult.filename}
            fileSizeStr={formatBytes(new TextEncoder().encode(htmlResult.content).byteLength)}
            data={htmlResult.content}
            mimeType="text/html"
            extraInfo="Standalone, responsive HTML document. Open in any browser or embed directly into web apps."
            onReset={() => {
              setFile(null);
              setHtmlResult(null);
            }}
          />
        </div>
      )}
    </div>
  );
};
