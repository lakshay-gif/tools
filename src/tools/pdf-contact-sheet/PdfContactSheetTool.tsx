import React, { useState } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { generateContactSheet } from '../../lib/pdfRenderer';
import { PDFDocument } from 'pdf-lib';
import { LayoutGrid, Download, Settings2 } from 'lucide-react';

export const PdfContactSheetTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [columns, setColumns] = useState(3);
  const [thumbnailWidth, setThumbnailWidth] = useState(240);
  const [spacing, setSpacing] = useState(16);
  const [showPageLabels, setShowPageLabels] = useState(true);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'pdf'>('png');
  const [resultData, setResultData] = useState<{ data: Uint8Array | string; mimeType: string; filename: string } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSheet = async () => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(20);
    setProgressMsg('Rendering pages into storyboard grid...');

    try {
      const sheet = await generateContactSheet(files[0].file, {
        columns,
        thumbnailWidth,
        spacing,
        showPageLabels,
        format: format === 'pdf' ? 'jpeg' : format,
      });

      const baseName = files[0].name.replace(/\.pdf$/i, '');

      if (format === 'pdf') {
        setProgress(85);
        setProgressMsg('Compiling contact sheet into single-page PDF...');
        const newPdf = await PDFDocument.create();
        const base64 = sheet.dataUrl.split(',')[1];
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const embeddedImg = await newPdf.embedJpg(bytes);
        const page = newPdf.addPage([sheet.width, sheet.height]);
        page.drawImage(embeddedImg, { x: 0, y: 0, width: sheet.width, height: sheet.height });
        const pdfBytes = await newPdf.save();

        setResultData({
          data: pdfBytes,
          mimeType: 'application/pdf',
          filename: `${baseName}_contact_sheet.pdf`,
        });
      } else {
        const ext = format === 'jpeg' ? 'jpg' : 'png';
        const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        setResultData({
          data: sheet.dataUrl,
          mimeType: mime,
          filename: `${baseName}_contact_sheet.${ext}`,
        });
      }

      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to generate contact sheet.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultData(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultData ? (
        <ResultCard
          title="PDF Contact Sheet Generated!"
          filename={resultData.filename}
          data={resultData.data}
          mimeType={resultData.mimeType}
          extraInfo={`All pages arranged into an organized ${columns}-column visual overview.`}
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
            title="Upload PDF to build a contact sheet"
            subtitle="Assembles all document pages into a single grid overview image or PDF."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <LayoutGrid className="w-4 h-4 text-blue-400" />
                <span>Contact Sheet Grid Layout Settings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Grid Columns</label>
                  <select
                    value={columns}
                    onChange={(e) => setColumns(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value={2}>2 Columns (Large Slides)</option>
                    <option value={3}>3 Columns (Balanced Overview)</option>
                    <option value={4}>4 Columns (Compact)</option>
                    <option value={5}>5 Columns (Dense)</option>
                    <option value={6}>6 Columns (Maximum)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Export Format</label>
                  <select
                    value={format}
                    onChange={(e: any) => setFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value="png">PNG Image (Lossless)</option>
                    <option value="jpeg">JPG Image (Compact)</option>
                    <option value="pdf">Single Overview PDF Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Thumbnail Width</label>
                  <select
                    value={thumbnailWidth}
                    onChange={(e) => setThumbnailWidth(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <option value={180}>Small (180px)</option>
                    <option value={240}>Medium (240px)</option>
                    <option value={320}>Large (320px)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPageLabels}
                    onChange={(e) => setShowPageLabels(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600"
                  />
                  <span>Show page number labels beneath each thumbnail</span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleGenerateSheet}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Build Contact Sheet</span>
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
