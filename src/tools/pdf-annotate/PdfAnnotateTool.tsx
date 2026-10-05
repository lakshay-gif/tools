import React, { useState, useEffect, useRef } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { renderSinglePage } from '../../lib/pdfRenderer';
import { PDFDocument } from 'pdf-lib';
import { Pen, Highlighter, Type, Square, Circle, ArrowRight, Undo, RotateCcw, Trash2, Download } from 'lucide-react';

type ToolMode = 'pen' | 'highlighter' | 'text' | 'rect' | 'circle' | 'arrow';

interface AnnotationAction {
  type: ToolMode;
  color: string;
  size: number;
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
}

export const PdfAnnotateTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>('highlighter');
  const [color, setColor] = useState('#facc15'); // default yellow highlight
  const [size, setSize] = useState(14);
  const [textInput, setTextInput] = useState('Reviewed');
  const [annotations, setAnnotations] = useState<AnnotationAction[]>([]);
  const [history, setHistory] = useState<AnnotationAction[][]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      setAnnotations([]);
      setHistory([]);
      return;
    }

    renderSinglePage(files[0].file, 1, 1.5)
      .then((res) => {
        const img = new Image();
        img.onload = () => {
          baseImgRef.current = img;
          if (canvasRef.current) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            redraw();
          }
        };
        img.src = res.canvas.toDataURL();
      })
      .catch((err) => setError(err.message));
  }, [files]);

  useEffect(() => {
    redraw();
  }, [annotations]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImgRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImgRef.current, 0, 0);

    annotations.forEach((ann) => {
      ctx.save();
      if (ann.type === 'highlighter') {
        ctx.strokeStyle = ann.color;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = ann.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (ann.points && ann.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x, ann.points[i].y);
          }
          ctx.stroke();
        }
      } else if (ann.type === 'pen') {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (ann.points && ann.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x, ann.points[i].y);
          }
          ctx.stroke();
        }
      } else if (ann.type === 'rect' && ann.start && ann.end) {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.size;
        ctx.strokeRect(
          ann.start.x,
          ann.start.y,
          ann.end.x - ann.start.x,
          ann.end.y - ann.start.y
        );
      } else if (ann.type === 'circle' && ann.start && ann.end) {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.size;
        const radius = Math.sqrt(
          Math.pow(ann.end.x - ann.start.x, 2) + Math.pow(ann.end.y - ann.start.y, 2)
        );
        ctx.beginPath();
        ctx.arc(ann.start.x, ann.start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (ann.type === 'arrow' && ann.start && ann.end) {
        ctx.strokeStyle = ann.color;
        ctx.fillStyle = ann.color;
        ctx.lineWidth = ann.size;
        ctx.beginPath();
        ctx.moveTo(ann.start.x, ann.start.y);
        ctx.lineTo(ann.end.x, ann.end.y);
        ctx.stroke();
        // Arrow head
        const headlen = 16;
        const angle = Math.atan2(ann.end.y - ann.start.y, ann.end.x - ann.start.x);
        ctx.beginPath();
        ctx.moveTo(ann.end.x, ann.end.y);
        ctx.lineTo(ann.end.x - headlen * Math.cos(angle - Math.PI / 6), ann.end.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(ann.end.x - headlen * Math.cos(angle + Math.PI / 6), ann.end.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.fill();
      } else if (ann.type === 'text' && ann.start && ann.text) {
        ctx.fillStyle = ann.color;
        ctx.font = `bold ${ann.size * 2}px Inter, sans-serif`;
        ctx.fillText(ann.text, ann.start.x, ann.start.y);
      }
      ctx.restore();
    });
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    setIsDrawing(true);
    setStartPos({ x, y });

    if (toolMode === 'text') {
      const newAnn: AnnotationAction = {
        type: 'text',
        color,
        size,
        start: { x, y },
        text: textInput,
      };
      setHistory((prev) => [...prev, annotations]);
      setAnnotations((prev) => [...prev, newAnn]);
      setIsDrawing(false);
      return;
    }

    if (toolMode === 'pen' || toolMode === 'highlighter') {
      const newAnn: AnnotationAction = {
        type: toolMode,
        color,
        size: toolMode === 'highlighter' ? 22 : 4,
        points: [{ x, y }],
      };
      setHistory((prev) => [...prev, annotations]);
      setAnnotations((prev) => [...prev, newAnn]);
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (toolMode === 'pen' || toolMode === 'highlighter') {
      setAnnotations((prev) => {
        const last = prev[prev.length - 1];
        if (!last || !last.points) return prev;
        const updatedLast = {
          ...last,
          points: [...last.points, { x, y }],
        };
        return [...prev.slice(0, prev.length - 1), updatedLast];
      });
    }
  };

  const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (['rect', 'circle', 'arrow'].includes(toolMode)) {
      const newAnn: AnnotationAction = {
        type: toolMode,
        color,
        size: 4,
        start: startPos,
        end: { x, y },
      };
      setHistory((prev) => [...prev, annotations]);
      setAnnotations((prev) => [...prev, newAnn]);
    }

    setIsDrawing(false);
    setStartPos(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setAnnotations(last);
  };

  const handleClear = () => {
    if (annotations.length === 0) return;
    setHistory((prev) => [...prev, annotations]);
    setAnnotations([]);
  };

  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas || files.length === 0) return;

    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Compiling annotated PDF...');

    try {
      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const imgBytes = Uint8Array.from(atob(imgDataUrl.split(',')[1]), (c) => c.charCodeAt(0));

      const newPdf = await PDFDocument.create();
      const embeddedImg = await newPdf.embedJpg(imgBytes);
      const page = newPdf.addPage([canvas.width, canvas.height]);
      page.drawImage(embeddedImg, { x: 0, y: 0, width: canvas.width, height: canvas.height });

      const pdfBytes = await newPdf.save();
      setResultBytes(pdfBytes);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to export annotated PDF.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setAnnotations([]);
    setResultBytes(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="Annotated PDF Ready!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_annotated.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo="Document markups, highlights, and annotations saved."
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
            title="Upload PDF to annotate and highlight"
            subtitle="Freehand pen, text notes, highlights, arrows, and shapes."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              {/* Annotation Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { id: 'highlighter', label: 'Highlight', icon: Highlighter },
                    { id: 'pen', label: 'Pen', icon: Pen },
                    { id: 'text', label: 'Text', icon: Type },
                    { id: 'rect', label: 'Box', icon: Square },
                    { id: 'circle', label: 'Circle', icon: Circle },
                    { id: 'arrow', label: 'Arrow', icon: ArrowRight },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setToolMode(t.id as any);
                          if (t.id === 'highlighter') setColor('#facc15');
                          if (t.id === 'pen') setColor('#2563eb');
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                          toolMode === t.id
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Color:</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded bg-transparent cursor-pointer border border-slate-700"
                    />
                  </div>

                  <button
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="p-1.5 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Undo"
                  >
                    <Undo className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={annotations.length === 0}
                    className="p-1.5 rounded bg-slate-900 text-slate-400 hover:text-red-400 disabled:opacity-30 cursor-pointer"
                    title="Clear All"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {toolMode === 'text' && (
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-slate-400">Text to Stamp:</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                  <span className="text-[11px] text-slate-500">Click anywhere on document to place</span>
                </div>
              )}

              {/* Canvas Markup Viewport */}
              <div className="flex justify-center p-4 bg-slate-900 rounded-xl overflow-auto select-none">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  className="max-h-[600px] w-auto border border-slate-700 shadow-2xl rounded cursor-crosshair touch-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Annotated PDF</span>
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
