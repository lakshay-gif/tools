import React, { useState } from 'react';
import { FileText, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { FileDropzone } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { convertWordToPdf } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

export const WordToPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [pdfResult, setPdfResult] = useState<{ data: Uint8Array; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useToolHistory();

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPdfResult(null);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const pdfBytes = await convertWordToPdf(file, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });

      const outName = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
      setPdfResult({ data: pdfBytes, filename: outName });

      addLog({
        toolSlug: 'word-to-pdf',
        toolName: 'Word to PDF',
        filename: file.name,
        fileSize: file.size,
        status: 'success',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to convert document to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          accept={{
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
            'text/plain': ['.txt'],
          }}
          title="Drop your Word (.docx, .doc, .txt) file here"
          subtitle="Converts Word documents and rich text into clean publication-ready PDF"
        />
      ) : !pdfResult ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(file.size)} • Converts to PDF</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Change File
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Conversion Engine</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Automatic A4 pagination & margins</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>High-resolution vector typography</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Standard PDF/A compatible output</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No file upload to cloud servers</span>
              </div>
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
            <span>{isProcessing ? 'Converting to PDF...' : 'Convert to PDF Now'}</span>
          </button>
        </div>
      ) : (
        <ResultCard
          title="PDF Document Created!"
          filename={pdfResult.filename}
          fileSizeStr={formatBytes(pdfResult.data.byteLength)}
          data={pdfResult.data}
          mimeType="application/pdf"
          extraInfo="Document successfully converted to standard PDF. Ready for print and digital signing."
          onReset={() => {
            setFile(null);
            setPdfResult(null);
          }}
        />
      )}
    </div>
  );
};
