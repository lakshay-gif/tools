import React, { useState, useRef } from 'react';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { convertImagesToPdf, formatBytes } from '../../lib/pdfUtils';
import { Camera, Upload, Trash2, ArrowUp, ArrowDown, Plus, Sliders, Check, FileText } from 'lucide-react';

interface ScannedPageItem {
  id: string;
  originalDataUrl: string;
  enhancedDataUrl: string;
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  grayscale: boolean;
}

export const DocumentScannerTool: React.FC = () => {
  const [pages, setPages] = useState<ScannedPageItem[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setError('Unable to access device camera. Please grant camera permission or upload photos.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    addScannedPage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        addScannedPage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const addScannedPage = (dataUrl: string) => {
    const newPage: ScannedPageItem = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      originalDataUrl: dataUrl,
      enhancedDataUrl: dataUrl,
      brightness: 0,
      contrast: 20, // default slight contrast boost for text
      grayscale: false,
    };

    setPages((prev) => {
      const next = [...prev, newPage];
      setActivePageIndex(next.length - 1);
      return next;
    });

    applyEnhancements(newPage);
  };

  const applyEnhancements = (page: ScannedPageItem) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      // Contrast & Brightness filter
      const bFactor = 1 + page.brightness / 100;
      const cFactor = (259 * (page.contrast + 255)) / (255 * (259 - page.contrast));

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        // Brightness
        r = r * bFactor;
        g = g * bFactor;
        b = b * bFactor;

        // Contrast
        r = cFactor * (r - 128) + 128;
        g = cFactor * (g - 128) + 128;
        b = cFactor * (b - 128) + 128;

        if (page.grayscale) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray;
          g = gray;
          b = gray;
        }

        d[i] = Math.max(0, Math.min(255, r));
        d[i + 1] = Math.max(0, Math.min(255, g));
        d[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imgData, 0, 0);
      const enhanced = canvas.toDataURL('image/jpeg', 0.92);

      setPages((prev) =>
        prev.map((p) => (p.id === page.id ? { ...p, enhancedDataUrl: enhanced } : p))
      );
    };
    img.src = page.originalDataUrl;
  };

  const updateActivePageFilters = (brightness: number, contrast: number, grayscale: boolean) => {
    const current = pages[activePageIndex];
    if (!current) return;
    const updated = { ...current, brightness, contrast, grayscale };
    setPages((prev) =>
      prev.map((p, idx) => (idx === activePageIndex ? updated : p))
    );
    applyEnhancements(updated);
  };

  const movePage = (from: number, to: number) => {
    if (to < 0 || to >= pages.length) return;
    const next = [...pages];
    const item = next.splice(from, 1)[0];
    next.splice(to, 0, item);
    setPages(next);
    setActivePageIndex(to);
  };

  const removePage = (index: number) => {
    setPages((prev) => prev.filter((_, idx) => idx !== index));
    if (activePageIndex >= index && activePageIndex > 0) {
      setActivePageIndex(activePageIndex - 1);
    }
  };

  const handleCompilePdf = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Compiling scanned pages into standardized PDF document...');

    try {
      const imagePayload = pages.map((p, idx) => ({
        dataUrl: p.enhancedDataUrl,
        name: `scanned_page_${idx + 1}.jpg`,
      }));

      const pdfBytes = await convertImagesToPdf(
        imagePayload,
        {
          pageSize: 'A4',
          orientation: 'auto',
          margins: 0,
        },
        (pct, msg) => {
          setProgress(pct);
          setProgressMsg(msg);
        }
      );

      setResultBytes(pdfBytes);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to compile scanned PDF.');
    }
  };

  const handleReset = () => {
    stopCamera();
    setPages([]);
    setResultBytes(null);
    setError(null);
  };

  const activePage = pages[activePageIndex];

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="Scanned PDF Document Ready!"
          filename="scanned_document.pdf"
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo={`Consolidated ${pages.length} scanned page(s) with local contrast enhancement.`}
          onReset={handleReset}
        />
      ) : (
        <div className="space-y-6">
          {/* Live Camera Viewport Modal / Box */}
          {cameraActive ? (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1.5 text-blue-400">
                  <Camera className="w-4 h-4" />
                  <span>Align document in camera frame</span>
                </span>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel Camera
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[460px]">
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto max-h-[460px] object-contain" />
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-950/60 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Scanned Page</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Scan Documents or Receipts to PDF</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Capture pages via your device camera or upload photos from your gallery. Processed 100% locally.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Use Device Camera</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Photos / Scans</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Scanned Pages Workspace */}
          {pages.length > 0 && !isProcessing && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Page {activePageIndex + 1} of {pages.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePage(activePageIndex)}
                      className="text-xs text-red-400 hover:text-red-300 ml-2"
                    >
                      Delete Page
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Snap Next Page</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload More</span>
                    </button>
                  </div>
                </div>

                {/* Main page inspection and filters */}
                {activePage && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Preview (7 cols) */}
                    <div className="md:col-span-7 bg-slate-900 rounded-xl p-3 flex items-center justify-center max-h-[460px] overflow-hidden">
                      <img
                        src={activePage.enhancedDataUrl}
                        alt={`Scan ${activePageIndex + 1}`}
                        className="max-h-[440px] w-auto object-contain rounded"
                      />
                    </div>

                    {/* Filter controls (5 cols) */}
                    <div className="md:col-span-5 space-y-4 text-xs">
                      <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-blue-400" />
                        <span>Photocopy Enhancement Filters</span>
                      </h4>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Contrast Boost</span>
                          <span className="font-mono text-blue-400">{activePage.contrast}%</span>
                        </div>
                        <input
                          type="range"
                          min="-20"
                          max="80"
                          value={activePage.contrast}
                          onChange={(e) =>
                            updateActivePageFilters(
                              activePage.brightness,
                              parseInt(e.target.value, 10),
                              activePage.grayscale
                            )
                          }
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Brightness</span>
                          <span className="font-mono text-blue-400">{activePage.brightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="-40"
                          max="40"
                          value={activePage.brightness}
                          onChange={(e) =>
                            updateActivePageFilters(
                              parseInt(e.target.value, 10),
                              activePage.contrast,
                              activePage.grayscale
                            )
                          }
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                          <input
                            type="checkbox"
                            checked={activePage.grayscale}
                            onChange={(e) =>
                              updateActivePageFilters(
                                activePage.brightness,
                                activePage.contrast,
                                e.target.checked
                              )
                            }
                            className="rounded bg-slate-900 border-slate-700 text-blue-600"
                          />
                          <span>Convert to Black & White Photocopy Mode</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Page strip selector */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {pages.map((p, idx) => (
                      <div
                        key={p.id}
                        onClick={() => setActivePageIndex(idx)}
                        className={`w-20 shrink-0 p-1 rounded-lg border cursor-pointer transition-all ${
                          idx === activePageIndex
                            ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-950/20'
                            : 'border-slate-800 bg-slate-900/60 opacity-60'
                        }`}
                      >
                        <div className="h-16 bg-slate-950 rounded flex items-center justify-center overflow-hidden">
                          <img src={p.enhancedDataUrl} alt={`Thumb ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                        </div>
                        <span className="text-[10px] text-center block text-slate-400 mt-1 font-mono">
                          Page {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleCompilePdf}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Compile {pages.length} Scanned Page(s) to PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {isProcessing && <ProgressBar progress={progress} message={progressMsg} />}
        </div>
      )}
    </div>
  );
};
