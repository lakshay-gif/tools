import React, { useState, useEffect } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { watermarkPdf, parsePageRanges } from '../../lib/pdfUtils';
import { renderSinglePage } from '../../lib/pdfRenderer';
import { Stamp, Upload, Settings2 } from 'lucide-react';

export const PdfWatermarkTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.25);
  const [rotationDegrees, setRotationDegrees] = useState(45);
  const [color, setColor] = useState('#b91c1c'); // default red
  const [position, setPosition] = useState<'center' | 'top' | 'bottom' | 'diagonal'>('diagonal');
  const [targetPagesStr, setTargetPagesStr] = useState(''); // empty = all
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      setPreviewDataUrl(null);
      return;
    }

    renderSinglePage(files[0].file, 1, 1.0)
      .then((res) => setPreviewDataUrl(res.canvas.toDataURL()))
      .catch(() => {});
  }, [files]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageDataUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyWatermark = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Stamping watermark onto document...');

    try {
      let pagesToTarget: number[] | undefined = undefined;
      if (targetPagesStr.trim()) {
        pagesToTarget = parsePageRanges(targetPagesStr, 9999);
      }

      const watermarked = await watermarkPdf(files[0].file, {
        type: watermarkType,
        text,
        imageDataUrl: imageDataUrl || undefined,
        fontSize,
        opacity,
        rotationDegrees,
        color,
        position,
        pages: pagesToTarget,
      });

      setResultBytes(watermarked);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to apply watermark.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBytes(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="Watermark Applied Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_watermarked.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo="Document stamped with custom watermark layer."
          onReset={handleReset}
        />
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
            title="Upload PDF to add watermark"
            subtitle="Text stamps or transparent image logos. 100% Client-side."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Stamp className="w-4 h-4 text-blue-400" />
                <span>Watermark Configuration</span>
              </div>

              {/* Type Switcher */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWatermarkType('text')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    watermarkType === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Text Watermark
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkType('image')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    watermarkType === 'image' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Image Logo Watermark
                </button>
              </div>

              {/* Controls */}
              {watermarkType === 'text' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Watermark Text</label>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="CONFIDENTIAL"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Ink Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-9 h-9 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                      />
                      <span className="text-xs text-slate-400 font-mono">{color}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Upload Logo Image (PNG / JPG)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-400"
                  />
                  {imageDataUrl && (
                    <div className="h-20 w-48 bg-slate-900 rounded-lg p-2 border border-slate-800 flex items-center justify-center">
                      <img src={imageDataUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
              )}

              {/* Sliders for Opacity, Angle, Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Opacity</span>
                    <span className="font-bold text-slate-200">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Rotation Angle</span>
                    <span className="font-bold text-slate-200">{rotationDegrees}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={rotationDegrees}
                    onChange={(e) => setRotationDegrees(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Font Size</span>
                    <span className="font-bold text-slate-200">{fontSize}pt</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Pages (Leave empty for All Pages):
                </label>
                <input
                  type="text"
                  value={targetPagesStr}
                  onChange={(e) => setTargetPagesStr(e.target.value)}
                  placeholder="e.g. 1-3, 5 (or blank for all)"
                  className="w-full sm:max-w-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleApplyWatermark}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Stamp className="w-4 h-4" />
                  <span>Apply Watermark & Download</span>
                </button>
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} message={progressMsg} />}
        </div>
      )}
    </div>
  );
};
