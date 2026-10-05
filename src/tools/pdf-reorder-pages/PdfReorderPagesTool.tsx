import React, { useState, useEffect } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { reorderPdfPages, rotatePdf } from '../../lib/pdfUtils';
import { renderPdfToImages, RenderedPage } from '../../lib/pdfRenderer';
import { ArrowUpDown, ArrowLeft, ArrowRight, RotateCw, Trash2, Check } from 'lucide-react';

interface OrderedPageItem {
  id: string;
  originalIndex: number; // 0-based
  pageNumber: number;
  dataUrl: string;
  rotation: number;
}

export const PdfReorderPagesTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [items, setItems] = useState<OrderedPageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      setItems([]);
      return;
    }

    const loadPages = async () => {
      setIsProcessing(true);
      setProgress(25);
      setProgressMsg('Rendering visual page grid...');
      try {
        const rendered = await renderPdfToImages(files[0].file, 'png', 0.8);
        const mapped: OrderedPageItem[] = rendered.map((p, idx) => ({
          id: `page-${idx}-${Date.now()}`,
          originalIndex: idx,
          pageNumber: p.pageNumber,
          dataUrl: p.dataUrl,
          rotation: 0,
        }));
        setItems(mapped);
        setIsProcessing(false);
      } catch (err: any) {
        setIsProcessing(false);
        setError(err?.message || 'Failed to render PDF.');
      }
    };

    loadPages();
  }, [files]);

  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const next = [...items];
    const item = next.splice(fromIndex, 1)[0];
    next.splice(toIndex, 0, item);
    setItems(next);
  };

  const rotatePage = (index: number) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, rotation: (it.rotation + 90) % 360 } : it))
    );
  };

  const deletePage = (index: number) => {
    if (items.length <= 1) {
      setError('A PDF must contain at least one page.');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleExport = async () => {
    if (files.length === 0 || items.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Rebuilding document in new sequence...');

    try {
      const order = items.map((it) => it.originalIndex);
      let outputBytes = await reorderPdfPages(files[0].file, order);

      // Check if any pages have custom rotations
      const rotatedIndices = items
        .map((it, idx) => ({ idx, rot: it.rotation }))
        .filter((it) => it.rot > 0);

      if (rotatedIndices.length > 0) {
        let workingFile = new File([outputBytes as any], 'reordered.pdf', { type: 'application/pdf' });
        for (const rItem of rotatedIndices) {
          const delta = (rItem.rot % 360) as 90 | 180 | 270;
          outputBytes = await rotatePdf(workingFile, delta, [rItem.idx]);
          workingFile = new File([outputBytes as any], 'reordered.pdf', { type: 'application/pdf' });
        }
      }

      setResultBytes(outputBytes);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to export reordered PDF.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setItems([]);
    setResultBytes(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="PDF Reordered Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_reordered.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo="Document pages have been rearranged according to your custom order."
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
            title="Upload PDF to rearrange page order"
            subtitle="Drag & drop or use Move Left/Right buttons. Rotations and deletions supported."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {items.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>
                  Total pages: <strong className="text-white">{items.length}</strong>
                </span>
                <span>Drag to rearrange or use arrow buttons for accessibility</span>
              </div>

              {/* Grid of reorderable cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[480px] overflow-y-auto p-1">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    draggable
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedIndex !== null && draggedIndex !== idx) {
                        movePage(draggedIndex, idx);
                        setDraggedIndex(null);
                      }
                    }}
                    className="relative rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 flex flex-col justify-between shadow-md cursor-grab active:cursor-grabbing hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-blue-400">Position #{idx + 1}</span>
                      <span className="text-slate-500 text-[10px]">Orig #{it.originalIndex + 1}</span>
                    </div>

                    <div className="h-32 w-full bg-slate-950 rounded flex items-center justify-center overflow-hidden my-1">
                      <img
                        src={it.dataUrl}
                        alt={`Page ${it.pageNumber}`}
                        className="max-h-full max-w-full object-contain transition-transform duration-200"
                        style={{ transform: `rotate(${it.rotation}deg)` }}
                      />
                    </div>

                    {/* Accessible Button Toolbar */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => movePage(idx, idx - 1)}
                          disabled={idx === 0}
                          className="p-1 hover:text-white text-slate-400 disabled:opacity-20 cursor-pointer"
                          title="Move Left"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePage(idx, idx + 1)}
                          disabled={idx === items.length - 1}
                          className="p-1 hover:text-white text-slate-400 disabled:opacity-20 cursor-pointer"
                          title="Move Right"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => rotatePage(idx)}
                          className="p-1 hover:text-blue-400 text-slate-400 cursor-pointer"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePage(idx)}
                          className="p-1 hover:text-red-400 text-slate-400 cursor-pointer"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Save Reordered PDF</span>
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
