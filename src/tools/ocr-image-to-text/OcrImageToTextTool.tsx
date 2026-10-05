import React, { useState } from 'react';
import { ScanText, Download, Sparkles, Copy, Check, FileCheck } from 'lucide-react';
import { FileDropzone } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { ocrImageToText } from '../../lib/formatConverters';
import { formatBytes } from '../../lib/pdfUtils';
import { useToolHistory } from '../../hooks/useToolHistory';

export const OcrImageToTextTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [ocrResult, setOcrResult] = useState<{ text: string; confidence: number; filename: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useToolHistory();

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setOcrResult(null);
      setError(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const res = await ocrImageToText(file, (p, msg) => {
        setProgress(p);
        setProgressMsg(msg);
      });

      const outName = `${file.name.replace(/\.[^/.]+$/, '')}-ocr.txt`;
      setOcrResult({ text: res.text, confidence: res.confidence, filename: outName });

      addLog({
        toolSlug: 'ocr-image-to-text',
        toolName: 'OCR Image to Text',
        filename: file.name,
        fileSize: file.size,
        status: 'success',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to scan text from image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!ocrResult) return;
    navigator.clipboard.writeText(ocrResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          accept={{
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/webp': ['.webp'],
          }}
          title="Drop image, photo, or screenshot here for OCR"
          subtitle="Extracts printed and typed text from receipts, documents, book pages, and forms"
        />
      ) : !ocrResult ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                <ScanText className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(file.size)} • Optical Character Recognition</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Change File
            </button>
          </div>

          {previewUrl && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-center max-h-[300px] overflow-hidden">
              <img src={previewUrl} alt="OCR source preview" className="max-h-[280px] w-auto object-contain rounded-lg" />
            </div>
          )}

          {isProcessing && (
            <ProgressBar progress={progress} message={progressMsg} />
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
              {error}
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-teal-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Scanning Characters...' : 'Run OCR Text Extraction Now'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-200">Extracted Text Result</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                {ocrResult.confidence}% Confidence
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Text!' : 'Copy to Clipboard'}</span>
            </button>
          </div>

          <textarea
            readOnly
            value={ocrResult.text}
            rows={10}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 focus:outline-none"
          />

          <ResultCard
            title="OCR Extraction Complete!"
            filename={ocrResult.filename}
            fileSizeStr={formatBytes(new TextEncoder().encode(ocrResult.text).byteLength)}
            data={ocrResult.text}
            mimeType="text/plain"
            extraInfo="Text extracted from image using client-side edge contour and contrast analysis."
            onReset={() => {
              setFile(null);
              setPreviewUrl(null);
              setOcrResult(null);
            }}
          />
        </div>
      )}
    </div>
  );
};
