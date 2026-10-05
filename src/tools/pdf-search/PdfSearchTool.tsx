import React, { useState } from 'react';
import { FileDropzone, FileItem } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { searchPdfText, SearchMatch } from '../../lib/pdfRenderer';
import { Search, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';

export const PdfSearchTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (files.length === 0 || !query.trim()) return;
    setError(null);
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Searching across all document pages...');

    try {
      const results = await searchPdfText(files[0].file, query, { caseSensitive, wholeWord });
      setMatches(results);
      setActiveMatchIndex(0);
      setHasSearched(true);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to search PDF text.');
    }
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    setActiveMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        files={files}
        onFilesChange={(newFiles) => {
          setFiles(newFiles.slice(0, 1));
          setMatches([]);
          setHasSearched(false);
          if (error) setError(null);
        }}
        multiple={false}
        maxFiles={1}
        title="Upload PDF to search text"
        subtitle="Search phrases with exact page locations and next/prev navigation."
        error={error}
        onErrorDismiss={() => setError(null)}
        disabled={isProcessing}
      />

      {files.length > 0 && !isProcessing && (
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Type keyword or phrase to search..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Document</span>
            </button>
          </div>

          {/* Search options checkboxes */}
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-blue-600"
              />
              <span>Case Sensitive</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-blue-600"
              />
              <span>Whole Word Only</span>
            </label>
          </div>

          {/* Search Results Display */}
          {hasSearched && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  {matches.length > 0 ? (
                    <>
                      Found <strong className="text-blue-400">{matches.length}</strong> occurrence(s)
                      {matches.length > 1 && ` (Showing #${activeMatchIndex + 1})`}
                    </>
                  ) : (
                    <span className="text-slate-500">No matches found for "{query}".</span>
                  )}
                </span>

                {matches.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrevMatch}
                      className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <button
                      onClick={handleNextMatch}
                      className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Match Cards */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto">
                {matches.map((m, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveMatchIndex(idx)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      idx === activeMatchIndex
                        ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-bold text-blue-400">Page {m.pageNumber}</span>
                      <span>Match #{idx + 1}</span>
                    </div>
                    <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                      {m.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isProcessing && <ProgressBar progress={progress} message={progressMsg} />}
    </div>
  );
};
