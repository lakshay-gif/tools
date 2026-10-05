import React, { useState, useEffect, useRef } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { realRedactPdf, renderSinglePage } from '../../lib/pdfRenderer';
import { loadPdfSafely } from '../../lib/pdfUtils';
import { ShieldAlert, Trash2, AlertTriangle, Check, Undo, Eye } from 'lucide-react';

interface RedactionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PdfRedactTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [redactionsByPage, setRedactionsByPage] = useState<Record<number, RedactionBox[]>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<RedactionBox | null>(null);
  const [pageCanvasDataUrl, setPageCanvasDataUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      setPageCanvasDataUrl(null);
      setRedactionsByPage({});
      return;
    }

    loadPdfSafely(files[0].file)
      .then((doc) => {
        setTotalPages(doc.getPageCount());
        setCurrentPage(1);
        loadCurrentPageCanvas(1);
      })
      .catch((err) => setError(err.message));
  }, [files]);

  const loadCurrentPageCanvas = async (pageNum: number) => {
    if (files.length === 0) return;
    try {
      const res = await renderSinglePage(files[0].file, pageNum, 1.5);
      setPageCanvasDataUrl(res.canvas.toDataURL());
    } catch (err: any) {
      setError(err?.message || 'Failed to render page.');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    loadCurrentPageCanvas(newPage);
  };

  // Mouse / Touch drawing of blackout rectangles
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = (e.clientX - rect.left) / rect.width;
    const curY = (e.clientY - rect.top) / rect.height;

    const x = Math.min(startPoint.x, curX);
    const y = Math.min(startPoint.y, curY);
    const width = Math.abs(curX - startPoint.x);
    const height = Math.abs(curY - startPoint.y);

    setCurrentBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox && currentBox.width > 0.01 && currentBox.height > 0.01) {
      setRedactionsByPage((prev) => ({
        ...prev,
        [currentPage]: [...(prev[currentPage] || []), currentBox],
      }));
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentBox(null);
  };

  const handleClearCurrentPage = () => {
    setRedactionsByPage((prev) => ({
      ...prev,
      [currentPage]: [],
    }));
  };

  const handleUndoLast = () => {
    setRedactionsByPage((prev) => {
      const list = prev[currentPage] || [];
      return {
        ...prev,
        [currentPage]: list.slice(0, list.length - 1),
      };
    });
  };

  const totalBoxesCount = Object.values(redactionsByPage).reduce(
    (acc, list) => acc + list.length,
    0
  );

  const handleApplyRealRedaction = async () => {
    if (files.length === 0) return;
    if (totalBoxesCount === 0) {
      setError('Please draw at least one redaction box over sensitive content.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(20);
    setProgressMsg('Permanently destroying underlying text streams and burning black pixels...');

    try {
      const redacted = await realRedactPdf(files[0].file, redactionsByPage, (pct, msg) => {
        setProgress(pct);
        setProgressMsg(msg);
      });

      setResultBytes(redacted);
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to redact PDF.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBytes(null);
    setRedactionsByPage({});
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="Document Redacted Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_redacted.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo="Permanent Real Redaction applied. Underlying text streams and vectors have been physically destroyed."
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
            title="Upload PDF to perform permanent redaction"
            subtitle="Draw solid blackout boxes over sensitive SSNs, names, and financial figures."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {/* Required Verification Guidance */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span className="font-semibold">
              Always verify the exported document before relying on it for sensitive information.
            </span>
          </div>

          {pageCanvasDataUrl && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              {/* Pagination & Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    Previous Page
                  </button>
                  <span className="font-bold text-slate-200">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    Next Page
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">
                    {(redactionsByPage[currentPage] || []).length} blackout box(es) on this page
                  </span>
                  <button
                    onClick={handleUndoLast}
                    disabled={(redactionsByPage[currentPage] || []).length === 0}
                    className="px-2.5 py-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer flex items-center gap-1"
                  >
                    <Undo className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                  <button
                    onClick={handleClearCurrentPage}
                    disabled={(redactionsByPage[currentPage] || []).length === 0}
                    className="px-2.5 py-1 rounded bg-slate-900 text-slate-400 hover:text-red-400 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Page</span>
                  </button>
                </div>
              </div>

              {/* Interactive Canvas Redaction Area */}
              <div className="flex justify-center p-4 bg-slate-900 rounded-xl overflow-auto select-none">
                <div
                  ref={containerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="relative cursor-crosshair border border-slate-700 shadow-2xl rounded max-w-full"
                >
                  <img
                    src={pageCanvasDataUrl}
                    alt={`Page ${currentPage}`}
                    className="max-h-[600px] w-auto pointer-events-none"
                    draggable={false}
                  />

                  {/* Render existing blackout boxes on current page */}
                  {(redactionsByPage[currentPage] || []).map((box, idx) => (
                    <div
                      key={idx}
                      className="absolute bg-black border border-red-500/80 pointer-events-none shadow"
                      style={{
                        left: `${box.x * 100}%`,
                        top: `${box.y * 100}%`,
                        width: `${box.width * 100}%`,
                        height: `${box.height * 100}%`,
                      }}
                    >
                      <span className="text-[9px] font-mono text-white/70 px-0.5 select-none">REDACTED</span>
                    </div>
                  ))}

                  {/* Current drawing box */}
                  {currentBox && (
                    <div
                      className="absolute bg-black/80 border-2 border-dashed border-red-400 pointer-events-none"
                      style={{
                        left: `${currentBox.x * 100}%`,
                        top: `${currentBox.y * 100}%`,
                        width: `${currentBox.width * 100}%`,
                        height: `${currentBox.height * 100}%`,
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Total redaction areas across document: <strong className="text-white">{totalBoxesCount}</strong>
                </span>

                <button
                  onClick={handleApplyRealRedaction}
                  disabled={totalBoxesCount === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Execute Permanent Redaction & Export</span>
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
