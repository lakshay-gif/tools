import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Type, Upload, Download, Trash2, RotateCcw, Copy, Check, Sparkles, FolderHeart, Save } from 'lucide-react';
import { downloadFile } from '../../lib/pdfUtils';
import { getAllSignatures, saveSignatureToDB, deleteSignatureFromDB } from '../../lib/db';
import { SavedSignature } from '../../types';
import { usePlan } from '../../context/PlanContext';

export const SignatureMakerTool: React.FC = () => {
  const { isPro, limits, openUpgradeModal } = usePlan();
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');

  // Draw mode state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#0f172a'); // default deep dark ink
  const [penWidth, setPenWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Type mode state
  const [typedName, setTypedName] = useState('Johnathan Doe');
  const [typedFont, setTypedFont] = useState<'font-caveat' | 'font-dancing' | 'font-sacramento' | 'font-greatvibes'>('font-dancing');
  const [typedColor, setTypedColor] = useState('#0f172a');

  // Upload mode state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(180);

  // Saved signatures from IndexedDB
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [saveTitle, setSaveTitle] = useState('');
  const [copied, setCopied] = useState(false);

  // Load saved signatures on mount
  useEffect(() => {
    loadSavedSignatures();
  }, []);

  const loadSavedSignatures = async () => {
    const list = await getAllSignatures();
    setSavedSignatures(list);
  };

  // Setup canvas
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // save current canvas to history for undo
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), currentData]);

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineWidth = penWidth;
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
    }

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previous = history[history.length - 1];
    ctx.putImageData(previous, 0, 0);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  // Convert Typed signature to DataURL via offscreen canvas
  const getTypedSignatureDataUrl = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Determine font family
    let fontName = 'Dancing Script';
    if (typedFont === 'font-caveat') fontName = 'Caveat';
    if (typedFont === 'font-sacramento') fontName = 'Sacramento';
    if (typedFont === 'font-greatvibes') fontName = 'Great Vibes';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = typedColor;
    ctx.font = `64px '${fontName}', cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  // Process uploaded image with transparent background cleanup
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        // Convert white/light paper background to transparent
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

          if (brightness > threshold) {
            d[i + 3] = 0; // Transparent
          } else {
            // Darken ink
            d[i] = 15;
            d[i + 1] = 23;
            d[i + 2] = 42;
            d[i + 3] = 255;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        setUploadedImage(canvas.toDataURL('image/png'));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Export current signature
  const getCurrentSignatureDataUrl = (): string | null => {
    if (activeTab === 'draw') {
      return canvasRef.current?.toDataURL('image/png') || null;
    } else if (activeTab === 'type') {
      return getTypedSignatureDataUrl();
    } else {
      return uploadedImage;
    }
  };

  const handleDownload = (format: 'png' | 'jpg') => {
    const dataUrl = getCurrentSignatureDataUrl();
    if (!dataUrl) return;

    if (format === 'png') {
      downloadFile(dataUrl, `signature_${Date.now()}.png`, 'image/png');
    } else {
      // Create white background JPG
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        downloadFile(canvas.toDataURL('image/jpeg', 0.95), `signature_${Date.now()}.jpg`, 'image/jpeg');
      };
      img.src = dataUrl;
    }
  };

  // Save to IndexedDB
  const handleSaveToVault = async () => {
    const dataUrl = getCurrentSignatureDataUrl();
    if (!dataUrl) return;

    if (!isPro && savedSignatures.length >= limits.maxSavedSignatures) {
      openUpgradeModal('Free plan allows saving 1 signature in local storage. Upgrade to Pro for an unlimited signature vault.');
      return;
    }

    const title = saveTitle.trim() || `Signature #${savedSignatures.length + 1}`;
    const sigType: 'drawn' | 'typed' | 'uploaded' =
      activeTab === 'draw' ? 'drawn' : activeTab === 'type' ? 'typed' : 'uploaded';

    const newSig: SavedSignature = {
      id: `sig-${Date.now()}`,
      title,
      dataUrl,
      type: sigType,
      createdAt: Date.now(),
    };

    await saveSignatureToDB(newSig);
    await loadSavedSignatures();
    setSaveTitle('');
  };

  const handleDeleteSaved = async (id: string) => {
    await deleteSignatureFromDB(id);
    await loadSavedSignatures();
  };

  return (
    <div className="space-y-6">
      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
        <button
          onClick={() => setActiveTab('draw')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'draw'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Draw Signature</span>
        </button>

        <button
          onClick={() => setActiveTab('type')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'type'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Type Handwriting</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload & Clean</span>
        </button>
      </div>

      {/* Tab 1: Draw Canvas */}
      {activeTab === 'draw' && (
        <div className="space-y-4">
          {/* Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Ink:</span>
              {[
                { name: 'Dark Ink', color: '#0f172a' },
                { name: 'Classic Blue', color: '#1d4ed8' },
                { name: 'Legal Red', color: '#b91c1c' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => {
                    setPenColor(c.color);
                    setIsEraser(false);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    penColor === c.color && !isEraser
                      ? 'scale-115 border-white ring-2 ring-blue-500/40'
                      : 'border-slate-700 opacity-80'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <span className="text-slate-400 font-medium ml-1">Width:</span>
              {[2, 3, 5].map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    setPenWidth(w);
                    setIsEraser(false);
                  }}
                  className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
                    penWidth === w && !isEraser
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {w}px
                </button>
              ))}

              <button
                onClick={() => setIsEraser(!isEraser)}
                className={`ml-2 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  isEraser
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Eraser
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="px-2.5 py-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer flex items-center gap-1"
                title="Undo last stroke"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
              <button
                onClick={handleClearCanvas}
                className="px-2.5 py-1 rounded bg-slate-900 text-slate-400 hover:text-red-400 cursor-pointer flex items-center gap-1"
                title="Clear canvas"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Interactive Drawing Pad */}
          <div className="relative border-2 border-dashed border-slate-700 rounded-2xl bg-white shadow-inner overflow-hidden flex items-center justify-center min-h-[220px]">
            <canvas
              ref={canvasRef}
              width={750}
              height={260}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-auto max-h-[260px] cursor-crosshair touch-none"
            />
            {!hasDrawn && (
              <div className="absolute pointer-events-none text-slate-400 text-xs font-medium tracking-wide">
                Draw your signature here with mouse or finger
              </div>
            )}
            <div className="absolute bottom-6 left-12 right-12 border-b border-slate-300 pointer-events-none flex justify-end">
              <span className="text-[10px] text-slate-400 font-mono pr-2">Sign on line ✕</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Type Handwriting */}
      {activeTab === 'type' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Type Your Name or Initials
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 font-medium"
                  placeholder="Johnathan Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Signature Ink Color
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {[
                    { color: '#0f172a', name: 'Dark Ink' },
                    { color: '#1d4ed8', name: 'Blue Ink' },
                    { color: '#047857', name: 'Green Ink' },
                    { color: '#b91c1c', name: 'Red Ink' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setTypedColor(c.color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        typedColor === c.color
                          ? 'scale-115 border-white ring-2 ring-blue-500/50'
                          : 'border-slate-700 opacity-80'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Typography Font Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'font-dancing', name: 'Dancing Script', class: 'font-dancing' },
              { id: 'font-caveat', name: 'Caveat Elegant', class: 'font-caveat' },
              { id: 'font-sacramento', name: 'Sacramento Formal', class: 'font-sacramento' },
              { id: 'font-greatvibes', name: 'Great Vibes Calligraphy', class: 'font-greatvibes' },
            ].map((f) => (
              <div
                key={f.id}
                onClick={() => setTypedFont(f.id as any)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all bg-white text-slate-900 flex flex-col justify-between h-36 ${
                  typedFont === f.id
                    ? 'border-blue-500 ring-2 ring-blue-500 shadow-lg'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {f.name}
                </span>
                <p
                  className={`text-3xl text-center truncate ${f.class}`}
                  style={{ color: typedColor }}
                >
                  {typedName || 'Your Signature'}
                </p>
                <div className="border-b border-slate-200 mt-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Upload & Clean */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="sig-upload-input"
            />
            <label
              htmlFor="sig-upload-input"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-md transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Choose Photo of Signature</span>
            </label>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Snap a clear photo of your paper signature. Our contrast filter automatically strips the white paper and outputs a transparent PNG.
            </p>
          </div>

          {uploadedImage && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Background Transparency Threshold</span>
                <span className="font-mono text-blue-400 font-bold">{threshold}</span>
              </div>
              <input
                type="range"
                min="100"
                max="240"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="p-4 rounded-xl bg-white flex items-center justify-center min-h-[160px]">
                <img
                  src={uploadedImage}
                  alt="Processed transparent signature"
                  className="max-h-36 max-w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Bar: Download & Save */}
      <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload('png')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Transparent PNG</span>
            </button>

            <button
              onClick={() => handleDownload('jpg')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              <span>Download JPG</span>
            </button>
          </div>

          {/* Save to Local Vault */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Name signature (e.g. Work Stamp)..."
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none max-w-[180px]"
            />
            <button
              onClick={handleSaveToVault}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save to Vault</span>
            </button>
          </div>
        </div>
      </div>

      {/* Local IndexedDB Signature Vault */}
      <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <FolderHeart className="w-4 h-4 text-pink-400" />
            <span>Local Signature Vault ({savedSignatures.length}{!isPro ? ` / ${limits.maxSavedSignatures}` : ' - Unlimited'})</span>
          </div>

          {!isPro && (
            <button
              onClick={() => openUpgradeModal('Save unlimited signatures & company stamps in your private vault with Pro.')}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Unlock Unlimited Vault</span>
            </button>
          )}
        </div>

        {savedSignatures.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No saved signatures in your browser storage yet. Click "Save to Vault" above to store your signature for 1-click reuse across visits.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {savedSignatures.map((sig) => (
              <div
                key={sig.id}
                className="p-3 rounded-xl border border-slate-800 bg-slate-900/90 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 truncate">{sig.title}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{sig.type}</span>
                </div>

                <div className="h-20 bg-white rounded-lg p-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={sig.dataUrl}
                    alt={sig.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    onClick={() => downloadFile(sig.dataUrl, `${sig.title}.png`, 'image/png')}
                    className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSaved(sig.id)}
                    className="text-slate-500 hover:text-red-400 cursor-pointer"
                    title="Delete saved signature"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
