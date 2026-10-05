import React, { useState, useRef } from 'react';
import { UploadCloud, Image, Trash2, ArrowUp, ArrowDown, Settings2, FileText, Check, Plus } from 'lucide-react';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { convertImagesToPdf } from '../../lib/pdfUtils';
import { formatBytes } from '../../components/common/FileDropzone';
import { usePlan } from '../../context/PlanContext';

interface ImageItem {
  id: string;
  name: string;
  sizeStr: string;
  dataUrl: string;
  width: number;
  height: number;
}

export const ImageToPdfTool: React.FC = () => {
  const { limits, isPro, openUpgradeModal } = usePlan();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Fit'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('portrait');
  const [margins, setMargins] = useState<number>(15); // points
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const maxAllowed = isPro ? 999 : limits.pdfMergeMaxFiles;

    if (!isPro && images.length + filesArray.length > maxAllowed) {
      openUpgradeModal(`Free plan converts up to ${maxAllowed} images at once. Upgrade to Pro for unlimited batch conversion.`);
    }

    const availableSlots = Math.max(0, maxAllowed - images.length);
    const toProcess = isPro ? filesArray : filesArray.slice(0, availableSlots);

    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          setImages((prev) => [
            ...prev,
            {
              id: `${file.name}-${Date.now()}-${Math.random()}`,
              name: file.name,
              sizeStr: (file.size / 1024).toFixed(1) + ' KB',
              dataUrl,
              width: img.width,
              height: img.height,
            },
          ]);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    const reordered = [...images];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;
    setImages(reordered);
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError('Please add at least one image to convert.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(10);
    setProgressMsg('Rendering images into vector PDF pages...');

    try {
      const pdfBytes = await convertImagesToPdf(
        images,
        { pageSize, orientation, margins },
        (pct, msg) => {
          setProgress(pct);
          setProgressMsg(msg);
        }
      );

      setResultBytes(pdfBytes);
      setFileSizeStr((pdfBytes.byteLength / 1024).toFixed(1) + ' KB');
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to convert images to PDF.');
    }
  };

  const handleReset = () => {
    setImages([]);
    setResultBytes(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="PDF Created Successfully!"
          filename="images_converted.pdf"
          data={resultBytes}
          fileSizeStr={fileSizeStr}
          mimeType="application/pdf"
          extraInfo={`Combined ${images.length} images into a structured PDF document.`}
          onReset={handleReset}
        />
      ) : (
        <div className="space-y-6">
          {/* Drop area */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/80 rounded-2xl p-8 text-center cursor-pointer transition-all"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-100">
                  Select or drag & drop images
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Supports JPG, PNG, and WebP. Processed locally in your browser.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Configuration Settings */}
          {images.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Settings2 className="w-4 h-4 text-blue-400" />
                <span>Page Layout & Sizing Options</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Page Size */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e: any) => setPageSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="A4">A4 (Standard International)</option>
                    <option value="Letter">US Letter (North America)</option>
                    <option value="Fit">Fit to Image Dimensions</option>
                  </select>
                </div>

                {/* Orientation */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Page Orientation
                  </label>
                  <select
                    value={orientation}
                    onChange={(e: any) => setOrientation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                    <option value="auto">Auto (Match Image Ratio)</option>
                  </select>
                </div>

                {/* Margins */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Page Margins
                  </label>
                  <select
                    value={margins}
                    onChange={(e) => setMargins(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value={0}>No Margins (Full Bleed)</option>
                    <option value={15}>Small (15 pt)</option>
                    <option value={30}>Normal (30 pt)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Image Previews & Sequence */}
          {images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Selected Images ({images.length})</span>
                <span className="text-[11px] text-slate-500">Arrange order for PDF pages</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="group relative rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col p-2 space-y-2"
                  >
                    <div className="h-28 w-full bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center relative">
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="max-h-full max-w-full object-contain"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white font-mono">
                        Page {idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate max-w-[90px]">{img.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 'down')}
                          disabled={idx === images.length - 1}
                          className="p-1 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="p-1 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add More Images</span>
                </button>

                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate PDF Document</span>
                </button>
              </div>
            </div>
          )}

          {isProcessing && (
            <ProgressBar progress={progress} message={progressMsg} />
          )}
        </div>
      )}
    </div>
  );
};
