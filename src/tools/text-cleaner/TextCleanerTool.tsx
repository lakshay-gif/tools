import React, { useState } from 'react';
import { Copy, Check, Download, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { downloadFile } from '../../lib/pdfUtils';

export const TextCleanerTool: React.FC = () => {
  const [text, setText] = useState<string>(
    `This   text     contains   accidental     double   spaces.\n\n\nIt   also   has   multiple   redundant   blank   lines   copied   from   a   PDF   column.\n\n   Leading and trailing spaces on lines.   `
  );
  const [copied, setCopied] = useState(false);

  // Cleaners
  const handleRemoveExtraSpaces = () => {
    setText((prev) => prev.replace(/[ \t]+/g, ' '));
  };

  const handleRemoveDuplicateLineBreaks = () => {
    setText((prev) => prev.replace(/\n\s*\n\s*\n+/g, '\n\n'));
  };

  const handleRemoveEmptyLines = () => {
    setText((prev) =>
      prev
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .join('\n')
    );
  };

  const handleTrimLines = () => {
    setText((prev) =>
      prev
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
    );
  };

  const handleNormalizeWhitespace = () => {
    setText((prev) =>
      prev
        .replace(/[ \t]+/g, ' ')
        .split('\n')
        .map((line) => line.trim())
        .filter((l) => l.length > 0)
        .join('\n\n')
    );
  };

  const handleCaseChange = (mode: 'upper' | 'lower' | 'title' | 'sentence') => {
    if (!text) return;
    if (mode === 'upper') {
      setText((prev) => prev.toUpperCase());
    } else if (mode === 'lower') {
      setText((prev) => prev.toLowerCase());
    } else if (mode === 'title') {
      setText((prev) =>
        prev.toLowerCase().replace(/(?:^|\s|-)\S/g, (char) => char.toUpperCase())
      );
    } else if (mode === 'sentence') {
      setText((prev) =>
        prev.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
      );
    }
  };

  const handleRemoveUnwantedCharacters = () => {
    // Strip non-printable control characters, stray symbols, weird unicode quotes
    setText((prev) =>
      prev
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[^\x20-\x7E\t\n\r\u00C0-\u024F]/g, '')
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadFile(text, 'cleaned_document.txt', 'text/plain');
  };

  return (
    <div className="space-y-6">
      {/* Editor & Hygiene Controls */}
      <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Text Cleaning & Formatting Actions</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-md"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Result'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>

            <button
              onClick={() => setText('')}
              className="p-1.5 rounded text-slate-400 hover:text-red-400 cursor-pointer"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cleaning Action Buttons */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={handleRemoveExtraSpaces}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium cursor-pointer"
          >
            Remove Extra Spaces
          </button>

          <button
            onClick={handleRemoveDuplicateLineBreaks}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium cursor-pointer"
          >
            Remove Duplicate Line Breaks
          </button>

          <button
            onClick={handleRemoveEmptyLines}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium cursor-pointer"
          >
            Remove Empty Lines
          </button>

          <button
            onClick={handleTrimLines}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium cursor-pointer"
          >
            Trim Line Whitespace
          </button>

          <button
            onClick={handleNormalizeWhitespace}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium cursor-pointer"
          >
            Normalize Whitespace
          </button>

          <button
            onClick={handleRemoveUnwantedCharacters}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium cursor-pointer"
          >
            Remove Unwanted / Control Characters
          </button>
        </div>

        {/* Case Converter Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Case:</span>
          <button
            onClick={() => handleCaseChange('upper')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold"
          >
            UPPERCASE
          </button>
          <button
            onClick={() => handleCaseChange('lower')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold"
          >
            lowercase
          </button>
          <button
            onClick={() => handleCaseChange('title')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold"
          >
            Title Case
          </button>
          <button
            onClick={() => handleCaseChange('sentence')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold"
          >
            Sentence case
          </button>
        </div>

        {/* Text Area */}
        <div className="pt-2">
          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type messy text here..."
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
          />
        </div>

        <div className="flex justify-between text-xs text-slate-500">
          <span>{text.length} characters • {text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
          <span>100% Client-side text hygiene</span>
        </div>
      </div>
    </div>
  );
};
