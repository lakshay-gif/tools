import React, { useState } from 'react';
import { Braces, Download, Sparkles, Upload } from 'lucide-react';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { convertJsonToPdf } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

const SAMPLE_JSON = `{
  "system": "ToolsHub Client Sandbox",
  "version": "4.2.0",
  "auditDate": "2026-10-05T06:58:00Z",
  "securityConfig": {
    "serverUploads": false,
    "encryptionEngine": "WebAssembly-Native",
    "zeroTelemetry": true
  },
  "supportedFormats": [
    "PDF",
    "DOCX",
    "XLSX",
    "PPTX",
    "CSV",
    "HTML",
    "JSON"
  ],
  "verifiedMetrics": {
    "speedMs": 142,
    "integrityScore": 99.9,
    "status": "Production-Certified"
  }
}`;

export const JsonToPdfTool: React.FC = () => {
  const [jsonText, setJsonText] = useState<string>(SAMPLE_JSON);
  const [docTitle, setDocTitle] = useState('Data-Report');
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
      setJsonText((event.target?.result as string) || '');
      setPdfResult(null);
    };
    reader.readAsText(file);
  };

  const handleConvert = async () => {
    if (!jsonText.trim()) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const pdfBytes = await convertJsonToPdf(jsonText, docTitle, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });

      const outName = `${docTitle || 'json-export'}.pdf`;
      setPdfResult({ data: pdfBytes, filename: outName });

      addLog({
        toolSlug: 'json-to-pdf',
        toolName: 'JSON to PDF',
        filename: `${docTitle}.json`,
        fileSize: new Blob([jsonText]).size,
        status: 'success',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to convert JSON to PDF.');
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
              <label htmlFor="jsonDocTitle" className="text-xs font-semibold text-slate-400">Report Title:</label>
              <input
                id="jsonDocTitle"
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-48 font-mono"
              />
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Import .json File</span>
              <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-slate-300">JSON Data Input</span>
              <span className="text-[11px] text-slate-400">Validated with monospace syntax highlighting in PDF</span>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed resize-y"
              placeholder="Paste JSON object or array here..."
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
            disabled={isProcessing || !jsonText.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Generating JSON PDF...' : 'Convert JSON to PDF Now'}</span>
          </button>
        </div>
      ) : (
        <ResultCard
          title="JSON PDF Export Ready!"
          filename={pdfResult.filename}
          fileSizeStr={formatBytes(pdfResult.data.byteLength)}
          data={pdfResult.data}
          mimeType="application/pdf"
          extraInfo="Structured JSON hierarchy formatted with clean indentation into PDF document."
          onReset={() => setPdfResult(null)}
        />
      )}
    </div>
  );
};
