import React, { useState } from 'react';
import { FileDropzone, FileItem } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { extractPdfText, TextExtractionResult } from '../../lib/pdfRenderer';
import { downloadFile } from '../../lib/pdfUtils';
import { FileText, Copy, Check, Download, Search, AlertCircle, RefreshCw } from 'lucide-react';

export const PdfTextExtractorTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [result, setResult] = useState<TextExtractionResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(15);
    setProgressMsg('Extracting text streams via pdf.js...');

    try {
      const data = await extractPdfText(files[0].file, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });
      setResult(data);
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to extract text from PDF.');
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!result || files.length === 0) return;
    const baseName = files[0].name.replace(/\.pdf$/i, '');
    downloadFile(result.fullText, `${baseName}_extracted.txt`, 'text/plain');
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setSearchQuery('');
    setError(null);
  };

  const filteredPages = result?.pagesText.filter((p) => {
    if (!searchQuery.trim()) return true;
    return p.text.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <div className="space-y-6">
      {result ? (
        <div className="space-y-5">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Text Extracted ({result.pagesText.length} Pages)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total length: <strong className="text-slate-200">{result.fullText.length.toLocaleString()}</strong> characters
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-md"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy All Text'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>

              <button
                onClick={handleReset}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs cursor-pointer"
                title="Start over"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scanned/Image Notice */}
          {result.isLikelyScanned && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold">This PDF may require OCR.</p>
                <p className="text-[11px] text-amber-400/90 mt-0.5">
                  Little or no selectable text was found. If this is a scanned document or photograph, text cannot be copied without Optical Character Recognition.
                </p>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search through extracted text across all pages..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Page-by-page display */}
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredPages.map((page) => (
              <div key={page.pageNumber} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/60 text-slate-400 font-semibold">
                  <span>Page {page.pageNumber}</span>
                  <span className="text-[11px] font-normal font-mono">{page.text.length} chars</span>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                  {page.text || <em className="text-slate-500">(No text detected on this page)</em>}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <FileDropzone
            files={files}
            onFilesChange={(newFiles) => {
              setFiles(newFiles.slice(0, 1));
              if (error) setError(null);
            }}
            multiple={false}
            maxFiles={1}
            title="Upload PDF to extract text"
            subtitle="Extracts text page-by-page. Scanned PDF detection included."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="flex justify-end">
              <button
                onClick={handleExtract}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Extract All Text</span>
              </button>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} message={progressMsg} />}
        </div>
      )}
    </div>
  );
};
