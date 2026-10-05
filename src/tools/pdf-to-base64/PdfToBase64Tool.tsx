import React, { useState } from 'react';
import { Binary, Download, Sparkles, Copy, Check, FileCheck, ArrowLeftRight } from 'lucide-react';
import { FileDropzone } from '../../components/common/FileDropzone';
import { ResultCard } from '../../components/common/ResultCard';
import { convertPdfToBase64, convertBase64ToPdf } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

export const PdfToBase64Tool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');
  const [file, setFile] = useState<File | null>(null);
  const [base64Output, setBase64Output] = useState<string>('');
  const [base64Input, setBase64Input] = useState<string>('');
  const [decodedPdf, setDecodedPdf] = useState<Uint8Array | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useToolHistory();

  const handleFileSelect = async (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setError(null);
      try {
        const b64 = await convertPdfToBase64(f);
        setBase64Output(b64);
        addLog({
          toolSlug: 'pdf-to-base64',
          toolName: 'PDF to Base64',
          filename: f.name,
          fileSize: f.size,
          status: 'success',
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to encode PDF to Base64.');
      }
    }
  };

  const handleDecode = () => {
    if (!base64Input.trim()) {
      setError('Please provide a Base64 string to decode.');
      return;
    }
    setError(null);
    try {
      const pdfBytes = convertBase64ToPdf(base64Input);
      setDecodedPdf(pdfBytes);
      addLog({
        toolSlug: 'pdf-to-base64',
        toolName: 'Base64 to PDF',
        filename: 'decoded-document.pdf',
        fileSize: pdfBytes.byteLength,
        status: 'success',
      });
    } catch (err: any) {
      setError('Invalid Base64 data URI format. Ensure the string is standard Base64.');
    }
  };

  const handleCopy = () => {
    if (!base64Output) return;
    navigator.clipboard.writeText(base64Output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab('encode');
            setError(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'encode'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Binary className="w-4 h-4" />
          <span>Encode PDF to Base64</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('decode');
            setError(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'decode'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Decode Base64 to PDF</span>
        </button>
      </div>

      {activeTab === 'encode' ? (
        !file ? (
          <FileDropzone
            onFilesSelected={handleFileSelect}
            accept={{ 'application/pdf': ['.pdf'] }}
            title="Drop your PDF here to encode to Base64"
            subtitle="Converts binary PDF to data:application/pdf;base64 string for APIs and JSON payloads"
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">File: <span className="font-mono text-slate-200">{file.name}</span> ({formatBytes(file.size)})</p>
                <p className="text-[11px] text-slate-400">Output string length: {base64Output.length.toLocaleString()} characters</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied URI!' : 'Copy Base64'}</span>
                </button>
                <button
                  onClick={() => {
                    setFile(null);
                    setBase64Output('');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                >
                  Start Over
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={base64Output}
              rows={12}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 focus:outline-none select-all"
            />
          </div>
        )
      ) : (
        !decodedPdf ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="b64Input" className="text-xs font-semibold text-slate-300 block mb-2">Paste Base64 PDF String or Data URI</label>
              <textarea
                id="b64Input"
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                rows={12}
                placeholder="data:application/pdf;base64,JVBERi0xLjQK..."
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 select-all"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
                {error}
              </div>
            )}

            <button
              onClick={handleDecode}
              disabled={!base64Input.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Decode & Rebuild PDF Document</span>
            </button>
          </div>
        ) : (
          <ResultCard
            title="PDF Decoded Successfully!"
            filename="decoded-document.pdf"
            fileSizeStr={formatBytes(decodedPdf.byteLength)}
            data={decodedPdf}
            mimeType="application/pdf"
            extraInfo="Base64 stream reconstituted into binary PDF. Ready for download."
            onReset={() => {
              setBase64Input('');
              setDecodedPdf(null);
            }}
          />
        )
      )}
    </div>
  );
};
