import React, { useState } from 'react';
import { Table, Download, Sparkles, Upload } from 'lucide-react';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { convertCsvToPdf } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

const SAMPLE_CSV = `Product Name,Category,Price,Units Sold,Quarterly Revenue
ToolsHub Pro Monthly,Software,$9.99,1420,$14185.80
ToolsHub Pro Annual,Software,$69.99,840,$58791.60
Enterprise Sandbox,License,$249.99,185,$46248.15
Client-Side SDK,Addon,$39.99,530,$21194.70
Offline PWA Pack,License,$19.99,920,$18390.80`;

export const CsvToPdfTool: React.FC = () => {
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV);
  const [docTitle, setDocTitle] = useState('Financial-Report');
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
      setCsvText((event.target?.result as string) || '');
      setPdfResult(null);
    };
    reader.readAsText(file);
  };

  const handleConvert = async () => {
    if (!csvText.trim()) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const pdfBytes = await convertCsvToPdf(csvText, docTitle, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });

      const outName = `${docTitle || 'table'}.pdf`;
      setPdfResult({ data: pdfBytes, filename: outName });

      addLog({
        toolSlug: 'csv-to-pdf',
        toolName: 'CSV to PDF',
        filename: `${docTitle}.csv`,
        fileSize: new Blob([csvText]).size,
        status: 'success',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to convert CSV to PDF.');
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
              <label htmlFor="csvDocTitle" className="text-xs font-semibold text-slate-400">Report Title:</label>
              <input
                id="csvDocTitle"
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-48 font-mono"
              />
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Import .csv File</span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-slate-300">CSV Table Data</span>
              <span className="text-[11px] text-slate-400">Comma-separated with automatic header formatting</span>
            </div>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={12}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed resize-y"
              placeholder="Paste CSV rows here..."
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
            disabled={isProcessing || !csvText.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Generating Table PDF...' : 'Convert CSV to PDF Table Report Now'}</span>
          </button>
        </div>
      ) : (
        <ResultCard
          title="PDF Table Report Ready!"
          filename={pdfResult.filename}
          fileSizeStr={formatBytes(pdfResult.data.byteLength)}
          data={pdfResult.data}
          mimeType="application/pdf"
          extraInfo="Landscape formatted PDF table report generated. Ready for distribution and high-res printing."
          onReset={() => setPdfResult(null)}
        />
      )}
    </div>
  );
};
