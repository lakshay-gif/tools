import React, { useState } from 'react';
import { Code, Download, Sparkles, Upload } from 'lucide-react';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { convertHtmlToPdf } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

const SAMPLE_HTML = `<div class="invoice">
  <h1>Official Invoice & Receipt</h1>
  <h2>ToolsHub Enterprise Services</h2>
  <p><strong>Invoice ID:</strong> #TH-2026-8841</p>
  <p><strong>Date:</strong> October 5, 2026</p>
  <hr>
  <h3>Items & Services</h3>
  <ul>
    <li>Client-side In-Browser Processing Engine (Lifetime License)</li>
    <li>Zero Cloud Telemetry & Data Encryption Sandbox</li>
    <li>High-Speed Format Conversion Pipeline (PDF, Excel, Word, PPT)</li>
  </ul>
  <p><em>Thank you for keeping your documents 100% private.</em></p>
</div>`;

export const HtmlToPdfTool: React.FC = () => {
  const [htmlCode, setHtmlCode] = useState<string>(SAMPLE_HTML);
  const [docTitle, setDocTitle] = useState('Web-Document');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [pdfResult, setPdfResult] = useState<{ data: Uint8Array; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useToolHistory();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      setHtmlCode((event.target?.result as string) || '');
      setPdfResult(null);
    };
    reader.readAsText(file);
  };

  const handleConvert = async () => {
    if (!htmlCode.trim()) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const pdfBytes = await convertHtmlToPdf(htmlCode, docTitle, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });

      const outName = `${docTitle || 'document'}.pdf`;
      setPdfResult({ data: pdfBytes, filename: outName });

      addLog({
        toolSlug: 'html-to-pdf',
        toolName: 'HTML to PDF',
        filename: `${docTitle}.html`,
        fileSize: new Blob([htmlCode]).size,
        status: 'success',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to convert HTML to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!pdfResult ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <label htmlFor="htmlDocTitle" className="text-xs font-semibold text-slate-400">Document Title:</label>
              <input
                id="htmlDocTitle"
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-48 font-mono"
              />
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Import .html File</span>
              <input type="file" accept=".html,.htm" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-slate-300">HTML Code & Markup</span>
              <span className="text-[11px] text-slate-400">Supports headings, paragraphs, lists, styled blocks</span>
            </div>
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              rows={14}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed resize-y"
              placeholder="Paste raw HTML here..."
            />
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
            disabled={isProcessing || !htmlCode.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Rendering HTML to PDF...' : 'Convert HTML to PDF Now'}</span>
          </button>
        </div>
      ) : (
        <ResultCard
          title="HTML Rendered to PDF!"
          filename={pdfResult.filename}
          fileSizeStr={formatBytes(pdfResult.data.byteLength)}
          data={pdfResult.data}
          mimeType="application/pdf"
          extraInfo="Parsed HTML hierarchy, headers, lists, and content formatted into clean PDF."
          onReset={() => setPdfResult(null)}
        />
      )}
    </div>
  );
};
