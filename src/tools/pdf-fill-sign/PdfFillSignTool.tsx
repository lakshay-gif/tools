import React, { useState, useEffect, useRef } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { renderSinglePage } from '../../lib/pdfRenderer';
import { getAllSignatures } from '../../lib/db';
import { SavedSignature } from '../../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PenLine, Type, Calendar, CheckSquare, Trash2, Download, Plus, Stamp } from 'lucide-react';

interface PlacedElement {
  id: string;
  type: 'text' | 'date' | 'checkbox' | 'signature';
  content: string; // text or signature dataUrl
  x: number; // percentage 0..1
  y: number; // percentage 0..1
  fontSize?: number;
}

export const PdfFillSignTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCanvasDataUrl, setPageCanvasDataUrl] = useState<string | null>(null);
  const [pageDims, setPageDims] = useState<{ width: number; height: number }>({ width: 600, height: 800 });
  const [elements, setElements] = useState<PlacedElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [activeTextPrompt, setActiveTextPrompt] = useState('Johnathan Doe');
  const containerRef = useRef<HTMLDivElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    getAllSignatures().then(setSavedSignatures).catch(() => {});
  }, []);

  useEffect(() => {
    if (files.length === 0) {
      setPageCanvasDataUrl(null);
      setElements([]);
      return;
    }

    renderSinglePage(files[0].file, currentPage, 1.5)
      .then((res) => {
        setPageCanvasDataUrl(res.canvas.toDataURL());
        setPageDims({ width: res.width, height: res.height });
      })
      .catch((err) => setError(err.message));
  }, [files, currentPage]);

  const addElement = (type: PlacedElement['type'], customContent?: string) => {
    let content = customContent || '';
    if (type === 'date') content = new Date().toLocaleDateString('en-US');
    if (type === 'checkbox') content = '✓';
    if (type === 'text' && !content) content = activeTextPrompt;

    const newEl: PlacedElement = {
      id: `el-${Date.now()}-${Math.random()}`,
      type,
      content,
      x: 0.35,
      y: 0.45,
      fontSize: type === 'checkbox' ? 18 : 14,
    };

    setElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  };

  const handleDragElement = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const handleMouseMove = (moveEv: MouseEvent) => {
      const curX = Math.max(0, Math.min(1, (moveEv.clientX - rect.left) / rect.width));
      const curY = Math.max(0, Math.min(1, (moveEv.clientY - rect.top) / rect.height));

      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, x: curX, y: curY } : el))
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const removeElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleExport = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Burning text, dates, and signatures into PDF...');

    try {
      const arrayBuffer = await files[0].file.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const page = doc.getPages()[currentPage - 1];
      const { width: pWidth, height: pHeight } = page.getSize();

      for (const el of elements) {
        const xPt = el.x * pWidth;
        const yPt = pHeight - el.y * pHeight - (el.fontSize || 14);

        if (el.type === 'signature' && el.content.startsWith('data:image')) {
          const base64 = el.content.split(',')[1];
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          const embedded = await doc.embedPng(bytes);
          const sigW = 120;
          const sigH = (sigW / embedded.width) * embedded.height;
          page.drawImage(embedded, {
            x: xPt,
            y: yPt - sigH / 2,
            width: sigW,
            height: sigH,
          });
        } else {
          page.drawText(el.content, {
            x: xPt,
            y: yPt,
            size: el.fontSize || 14,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
      }

      const outputBytes = await doc.save();
      setResultBytes(outputBytes);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to export signed PDF.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setElements([]);
    setResultBytes(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="Signed PDF Document Ready!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_signed.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo="Document filled and signed with digital overlays."
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
            title="Upload PDF to fill & sign"
            subtitle="Add text, dates, checkmarks, and transparent signatures freely."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {pageCanvasDataUrl && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              {/* Form Tools Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => addElement('text')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Add Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addElement('date')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Today's Date</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addElement('checkbox')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Checkmark (✓)</span>
                  </button>

                  {/* Saved Signature Selector */}
                  {savedSignatures.length > 0 && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <Stamp className="w-3.5 h-3.5 text-blue-400" />
                      <select
                        onChange={(e) => {
                          const sig = savedSignatures.find((s) => s.id === e.target.value);
                          if (sig) addElement('signature', sig.dataUrl);
                        }}
                        defaultValue=""
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                      >
                        <option value="" disabled>Insert Saved Signature...</option>
                        {savedSignatures.map((s) => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  Drag items to position them onto the document
                </div>
              </div>

              {/* Viewport Canvas with draggable overlays */}
              <div className="flex justify-center p-4 bg-slate-900 rounded-xl overflow-auto select-none">
                <div
                  ref={containerRef}
                  className="relative border border-slate-700 shadow-2xl rounded max-w-full"
                >
                  <img
                    src={pageCanvasDataUrl}
                    alt="Page to sign"
                    className="max-h-[620px] w-auto pointer-events-none"
                    draggable={false}
                  />

                  {/* Placed Elements Overlay */}
                  {elements.map((el) => {
                    const isSelected = el.id === selectedElementId;

                    return (
                      <div
                        key={el.id}
                        onMouseDown={(e) => {
                          setSelectedElementId(el.id);
                          handleDragElement(el.id, e);
                        }}
                        className={`absolute cursor-move px-2 py-0.5 rounded font-sans transition-shadow ${
                          isSelected
                            ? 'ring-2 ring-blue-500 bg-blue-500/20 text-blue-900'
                            : 'hover:ring-1 hover:ring-slate-400 bg-white/70 text-slate-900'
                        }`}
                        style={{
                          left: `${el.x * 100}%`,
                          top: `${el.y * 100}%`,
                          fontSize: `${el.fontSize || 14}px`,
                        }}
                      >
                        {el.type === 'signature' ? (
                          <div className="relative group">
                            <img src={el.content} alt="Signature" className="h-10 w-auto" />
                            <button
                              onClick={(ev) => {
                                ev.stopPropagation();
                                removeElement(el.id);
                              }}
                              className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full text-[9px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{el.content}</span>
                            <button
                              onClick={(ev) => {
                                ev.stopPropagation();
                                removeElement(el.id);
                              }}
                              className="text-red-500 hover:text-red-700 text-[10px] font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Signed PDF</span>
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
