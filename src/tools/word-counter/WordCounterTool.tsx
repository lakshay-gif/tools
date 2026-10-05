import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, Trash2, Clock, Mic, AlignLeft, Sparkles, FileText } from 'lucide-react';
import { downloadFile } from '../../lib/pdfUtils';

export const WordCounterTool: React.FC = () => {
  const [text, setText] = useState<string>(
    `Welcome to ToolsHub! This all-in-one Word Counter & Text Cleaner runs completely inside your browser. No data is ever transmitted to an external server.\n\nYou can use the hygiene buttons below to strip extra spaces, collapse line breaks, convert cases, or analyze keyword densities in real time.`
  );
  const [copied, setCopied] = useState(false);

  // Real-time calculation metrics
  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        words: 0,
        charsWithSpaces: 0,
        charsNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        readingTimeMin: 0,
        speakingTimeMin: 0,
        density: [] as { word: string; count: number; percent: number }[],
      };
    }

    const wordsArray = trimmed.match(/\b[a-zA-Z0-9_\u00C0-\u017F'-]+\b/g) || [];
    const wordsCount = wordsArray.length;
    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s+/g, '').length;

    // Sentences
    const sentences = (text.match(/[^.!?]+[.!?]+/g) || []).length || (wordsCount > 0 ? 1 : 0);

    // Paragraphs
    const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0).length;

    // Reading time: average 225 words/min
    const readingTimeMin = (wordsCount / 225).toFixed(1);
    // Speaking time: average 130 words/min
    const speakingTimeMin = (wordsCount / 130).toFixed(1);

    // Keyword density (top 5 words >= 3 chars, ignoring common stop words)
    const stopWords = new Set(['the', 'and', 'for', 'that', 'this', 'with', 'you', 'are', 'was', 'not', 'can', 'has', 'have']);
    const frequencyMap: Record<string, number> = {};
    wordsArray.forEach((w) => {
      const lower = w.toLowerCase();
      if (lower.length > 2 && !stopWords.has(lower)) {
        frequencyMap[lower] = (frequencyMap[lower] || 0) + 1;
      }
    });

    const density = Object.entries(frequencyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({
        word,
        count,
        percent: Math.round((count / Math.max(1, wordsCount)) * 100),
      }));

    return {
      words: wordsCount,
      charsWithSpaces,
      charsNoSpaces,
      sentences,
      paragraphs,
      readingTimeMin,
      speakingTimeMin,
      density,
    };
  }, [text]);

  // Cleaners
  const handleRemoveExtraSpaces = () => {
    setText((prev) => prev.replace(/[ \t]+/g, ' ').replace(/^\s+|\s+$/gm, ''));
  };

  const handleRemoveBlankLines = () => {
    setText((prev) =>
      prev
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .join('\n')
    );
  };

  const handleStripHtml = () => {
    setText((prev) => prev.replace(/<\/?[^>]+(>|$)/g, ''));
  };

  // Case Converters
  const handleCaseChange = (mode: 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'kebab') => {
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
    } else if (mode === 'camel') {
      setText((prev) =>
        prev
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      );
    } else if (mode === 'kebab') {
      setText((prev) =>
        prev
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    downloadFile(text, 'cleaned_text.txt', 'text/plain');
  };

  return (
    <div className="space-y-6">
      {/* Real-time Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Words
          </span>
          <p className="text-2xl font-black text-blue-400 mt-0.5">{stats.words}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Characters
          </span>
          <p className="text-2xl font-black text-indigo-400 mt-0.5">{stats.charsWithSpaces}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            No Spaces
          </span>
          <p className="text-2xl font-black text-cyan-400 mt-0.5">{stats.charsNoSpaces}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Sentences
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-0.5">{stats.sentences}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Reading Time
          </span>
          <p className="text-xl font-bold text-amber-400 mt-1 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>~{stats.readingTimeMin}m</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Speaking Time
          </span>
          <p className="text-xl font-bold text-purple-400 mt-1 flex items-center justify-center gap-1">
            <Mic className="w-3.5 h-3.5" />
            <span>~{stats.speakingTimeMin}m</span>
          </p>
        </div>
      </div>

      {/* Main Text Editor Area */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-inner">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your text here to analyze and clean..."
          rows={10}
          className="w-full p-4 sm:p-5 bg-transparent text-slate-100 text-sm focus:outline-none resize-y leading-relaxed font-sans"
        />

        <div className="border-t border-slate-800/80 bg-slate-900/60 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1">Case:</span>
            <button
              onClick={() => handleCaseChange('upper')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              UPPERCASE
            </button>
            <button
              onClick={() => handleCaseChange('lower')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              lowercase
            </button>
            <button
              onClick={() => handleCaseChange('title')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              Title Case
            </button>
            <button
              onClick={() => handleCaseChange('sentence')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              Sentence case
            </button>
            <button
              onClick={() => handleCaseChange('camel')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              camelCase
            </button>
            <button
              onClick={() => handleCaseChange('kebab')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              kebab-case
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              title="Download as text file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>

            <button
              onClick={() => setText('')}
              className="p-1.5 text-slate-400 hover:text-red-400 cursor-pointer"
              title="Clear all text"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hygiene Actions & Keyword Density */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hygiene Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Text Cleaning & Formatting</span>
          </h4>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleRemoveExtraSpaces}
              className="px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-medium cursor-pointer transition-colors"
            >
              Remove Extra Spaces
            </button>
            <button
              onClick={handleRemoveBlankLines}
              className="px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-medium cursor-pointer transition-colors"
            >
              Remove Blank Lines
            </button>
            <button
              onClick={handleStripHtml}
              className="px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-medium cursor-pointer transition-colors"
            >
              Strip HTML Tags
            </button>
          </div>
        </div>

        {/* Top Keyword Density */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <AlignLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Top Keywords Density</span>
          </h4>
          {stats.density.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Type more words to calculate keyword frequency.</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {stats.density.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono"
                >
                  <span className="font-semibold text-white">{item.word}</span>
                  <span className="text-slate-500 text-[10px]">({item.count}× • {item.percent}%)</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
