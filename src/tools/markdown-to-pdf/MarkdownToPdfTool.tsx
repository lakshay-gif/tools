import React, { useState } from 'react';
import { FileCode, Download, Sparkles, Upload, Eye } from 'lucide-react';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { convertMarkdownToPdf } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

const SAMPLE_MD = `# Project Specification & Proposal

## Executive Summary
This document provides an in-depth breakdown of the project milestones, deliverables, and architecture.

### Key Objectives
- **Zero Server Uploads**: Process all files locally inside browser client memory.
- **Speed & Security**: Maximum data isolation for sensitive enterprise documents.
- **Universal Compatibility**: Works across desktop and mobile browsers seamlessly.

### Architecture Highlights
\`\`\`typescript
interface ClientEngine {
  encryption: 'AES-256';
  sandbox: 'WebAssembly';
  cloudUploads: false;
}
\`\`\`

## Timeline & Deliverables
- Milestone 1: Core pipeline validation
- Milestone 2: Multi-format converters integration
- Milestone 3: Security & privacy compliance auditing
`;

export const MarkdownToPdfTool: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>(SAMPLE_MD);
  const [docTitle, setDocTitle] = useState('My-Document');
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
      setMarkdown((event.target?.result as string) || '');
      setPdfResult(null);
    };
    reader.readAsText(file);
  };

  const handleConvert = async () => {
    if (!markdown.trim()) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const pdfBytes = await convertMarkdownToPdf(markdown, docTitle, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });

      const outName = `${docTitle || 'document'}.pdf`;
      setPdfResult({ data: pdfBytes, filename: outName });

      addLog({
        toolSlug: 'markdown-to-pdf',
        toolName: 'Markdown to PDF',
        filename: `${docTitle}.md`,
        fileSize: new Blob([markdown]).size,
        status: 'success',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to convert Markdown to PDF.');
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
              <label htmlFor="docTitle" className="text-xs font-semibold text-slate-400">Document Title:</label>
              <input
                id="docTitle"
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-48 font-mono"
              />
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Import .md File</span>
              <input type="file" accept=".md,.markdown,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-slate-300">Live Markdown Editor</span>
              <span className="text-[11px] text-slate-400">Supports Headings, Lists, Code Blocks, Quotes</span>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              rows={14}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed resize-y"
              placeholder="Type or paste markdown here..."
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
            disabled={isProcessing || !markdown.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Generating PDF Document...' : 'Compile Markdown to PDF Now'}</span>
          </button>
        </div>
      ) : (
        <ResultCard
          title="Markdown PDF Generated!"
          filename={pdfResult.filename}
          fileSizeStr={formatBytes(pdfResult.data.byteLength)}
          data={pdfResult.data}
          mimeType="application/pdf"
          extraInfo="Styled typography, code blocks, and formatted layout compiled into clean PDF."
          onReset={() => setPdfResult(null)}
        />
      )}
    </div>
  );
};
