import React, { useState, useEffect } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { rotatePdf } from '../../lib/pdfUtils';
import { renderPdfToImages, RenderedPage } from '../../lib/pdfRenderer';
import { RotateCw, Check, CheckSquare, Square } from 'lucide-react';

export const PdfRotateTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      setPages([]);
      setSelectedPages([]);
      setRotations({});
      return;
    }

    const loadThumbnails = async () => {
      setIsProcessing(true);
      setProgress(20);
      setProgressMsg('Rendering page previews...');
      try {
        const rendered = await renderPdfToImages(files[0].file, 'png', 0.8);
        setPages(rendered);
        setSelectedPages(rendered.map((p) => p.pageNumber));
        setIsProcessing(false);
      } catch (err: any) {
        setIsProcessing(false);
        setError(err?.message || 'Failed to render PDF pages.');
      }
    };

    loadThumbnails();
  }, [files]);

  const handleToggleSelectPage = (pageNum: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum]
    );
  };

  const handleSelectAll = () => {
    setSelectedPages(pages.map((p) => p.pageNumber));
  };

  const handleDeselectAll = () => {
    setSelectedPages([]);
  };

  const handleRotateSelected = (deltaAngle: 90 | 180 | 270) => {
    setRotations((prev) => {
      const next = { ...prev };
      selectedPages.forEach((p) => {
        next[p] = ((next[p] || 0) + deltaAngle) % 360;
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Applying page rotations permanently...');

    try {
      // Find pages rotated by 90, 180, or 270
      const netAngles: Record<number, 90 | 180 | 270> = {};
      Object.entries(rotations).forEach(([pStr, angle]) => {
        const net = angle % 360;
        if (net === 90 || net === 180 || net === 270) {
          netAngles[parseInt(pStr, 10)] = net;
        }
      });

      // Group by angle
      const byAngle: Record<number, number[]> = { 90: [], 180: [], 270: [] };
      Object.entries(netAngles).forEach(([pStr, angle]) => {
        byAngle[angle].push(parseInt(pStr, 10) - 1); // 0-indexed
      });

      let currentFileBytes: Uint8Array | null = null;
      let workingFile: File = files[0].file;

      for (const angle of [90, 180, 270] as (90 | 180 | 270)[]) {
        if (byAngle[angle].length > 0) {
          currentFileBytes = await rotatePdf(workingFile, angle, byAngle[angle]);
          workingFile = new File([currentFileBytes as any], files[0].name, { type: 'application/pdf' });
        }
      }

      if (!currentFileBytes) {
        // default rotate all selected by 90 if no rotation was clicked
        currentFileBytes = await rotatePdf(
          files[0].file,
          90,
          selectedPages.map((p) => p - 1)
        );
      }

      setResultBytes(currentFileBytes);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to save rotated PDF.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPages([]);
    setResultBytes(null);
    setRotations({});
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="PDF Rotated Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_rotated.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo="Permanent page rotations applied and saved to document."
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
            title="Upload PDF to rotate pages"
            subtitle="Rotate selected pages or all pages by 90°, 180°, or 270°."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {pages.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              {/* Rotation Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white cursor-pointer"
                  >
                    Select All ({pages.length})
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Deselect
                  </button>
                  <span className="text-xs text-slate-400 ml-2">
                    {selectedPages.length} pages selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRotateSelected(90)}
                    disabled={selectedPages.length === 0}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold cursor-pointer disabled:opacity-40"
                  >
                    +90° Clockwise
                  </button>
                  <button
                    onClick={() => handleRotateSelected(180)}
                    disabled={selectedPages.length === 0}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer disabled:opacity-40"
                  >
                    180° Invert
                  </button>
                  <button
                    onClick={() => handleRotateSelected(270)}
                    disabled={selectedPages.length === 0}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer disabled:opacity-40"
                  >
                    270° Counter-CW
                  </button>
                </div>
              </div>

              {/* Thumbnails Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[460px] overflow-y-auto p-1">
                {pages.map((p) => {
                  const isSelected = selectedPages.includes(p.pageNumber);
                  const angle = rotations[p.pageNumber] || 0;

                  return (
                    <div
                      key={p.pageNumber}
                      onClick={() => handleToggleSelectPage(p.pageNumber)}
                      className={`relative rounded-xl border p-2 flex flex-col items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/20 ring-1 ring-blue-500/50'
                          : 'border-slate-800 bg-slate-900/60 opacity-60'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>Page {p.pageNumber}</span>
                        {angle > 0 && (
                          <span className="text-blue-400 font-bold font-mono">+{angle}°</span>
                        )}
                      </div>

                      <div className="h-32 w-full bg-slate-950 rounded flex items-center justify-center overflow-hidden">
                        <img
                          src={p.dataUrl}
                          alt={`Page ${p.pageNumber}`}
                          className="max-h-full max-w-full object-contain transition-transform duration-300"
                          style={{ transform: `rotate(${angle}deg)` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Save Rotations Permanently</span>
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
