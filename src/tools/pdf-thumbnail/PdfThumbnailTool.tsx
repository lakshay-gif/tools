import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { renderSinglePage, renderPdfToImages, RenderedPage } from '../../lib/pdfRenderer';
import { downloadFile } from '../../lib/pdfUtils';
import JSZip from 'jszip';
import { Image, Download, Archive, RefreshCw } from 'lucide-react';

export const PdfThumbnailTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [scope, setScope] = useState<'first' | 'all'>('first');
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [targetWidth, setTargetWidth] = useState<number>(600);
  const [generatedThumbs, setGeneratedThumbs] = useState<RenderedPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(20);
    setProgressMsg('Rendering thumbnails...');

    try {
      const scale = targetWidth / 595; // 595 is default pt width of A4

      if (scope === 'first') {
        const single = await renderSinglePage(files[0].file, 1, scale);
        const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        setGeneratedThumbs([
          {
            pageNumber: 1,
            dataUrl: single.canvas.toDataURL(mime, 0.92),
            width: single.width,
            height: single.height,
          },
        ]);
      } else {
        const all = await renderPdfToImages(files[0].file, format, scale, (pct, msg) => {
          setProgress(pct);
          setProgressMsg(msg);
        });
        setGeneratedThumbs(all);
      }
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to generate thumbnails.');
    }
  };

  const handleDownloadSingle = (thumb: RenderedPage) => {
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const baseName = files[0]?.name.replace(/\.pdf$/i, '') || 'document';
    downloadFile(thumb.dataUrl, `${baseName}_cover_thumb.${ext}`, `image/${format}`);
  };

  const handleDownloadAllZip = async () => {
    if (generatedThumbs.length === 0) return;
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg('Packaging thumbnails into ZIP...');

    try {
      const zip = new JSZip();
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const baseName = files[0]?.name.replace(/\.pdf$/i, '') || 'thumbnails';

      generatedThumbs.forEach((t) => {
        const base64 = t.dataUrl.split(',')[1];
        zip.file(`${baseName}_page_${t.pageNumber}.${ext}`, base64, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, `${baseName}_all_thumbnails.zip`, 'application/zip');
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to create ZIP package.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setGeneratedThumbs([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {generatedThumbs.length > 0 ? (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Image className="w-5 h-5 text-blue-400" />
                <span>Generated {generatedThumbs.length} Thumbnail(s)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Format: <strong className="text-slate-200 uppercase">{format}</strong> • Width: {targetWidth}px
              </p>
            </div>

            <div className="flex items-center gap-2">
              {generatedThumbs.length === 1 ? (
                <button
                  onClick={() => handleDownloadSingle(generatedThumbs[0])}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Thumbnail</span>
                </button>
              ) : (
                <button
                  onClick={handleDownloadAllZip}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  <Archive className="w-4 h-4" />
                  <span>Download All as ZIP</span>
                </button>
              )}

              <button
                onClick={handleReset}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs cursor-pointer"
                title="Start over"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {generatedThumbs.map((t) => (
              <div key={t.pageNumber} className="p-3 rounded-2xl border border-slate-800 bg-slate-900 flex flex-col justify-between space-y-3">
                <div className="h-48 bg-slate-950 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                  <img src={t.dataUrl} alt={`Thumbnail page ${t.pageNumber}`} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Page {t.pageNumber} ({t.width}×{t.height})</span>
                  <button
                    onClick={() => handleDownloadSingle(t)}
                    className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
            title="Upload PDF to generate thumbnails"
            subtitle="Create single cover previews or thumbnails for every page."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Thumbnail Scope</label>
                  <select
                    value={scope}
                    onChange={(e: any) => setScope(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="first">First Page (Cover Preview Only)</option>
                    <option value="all">All Pages in Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Image Format</label>
                  <select
                    value={format}
                    onChange={(e: any) => setFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="png">PNG (Sharp text & vector clarity)</option>
                    <option value="jpeg">JPG (Lightweight photo format)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Width Preset</label>
                  <select
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value={300}>300px (Compact Card Preview)</option>
                    <option value={600}>600px (Standard Web Preview)</option>
                    <option value={1200}>1200px (Retina / High Definition)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Image className="w-4 h-4" />
                  <span>Generate Thumbnails</span>
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
