import React, { useState, useEffect } from 'react';
import { FileDropzone, FileItem, formatBytes } from '../../components/common/FileDropzone';
import { ProgressBar } from '../../components/common/ProgressBar';
import { ResultCard } from '../../components/common/ResultCard';
import { getPdfMetadata, updatePdfMetadata } from '../../lib/pdfUtils';
import { FileCog, Trash2, Save, ShieldCheck } from 'lucide-react';

export const PdfMetadataTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [metadata, setMetadata] = useState({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      setMetadata({ title: '', author: '', subject: '', keywords: '', creator: '', producer: '' });
      return;
    }

    getPdfMetadata(files[0].file)
      .then((m) => {
        setMetadata({
          title: m.title || '',
          author: m.author || '',
          subject: m.subject || '',
          keywords: (m.keywords || []).join(', '),
          creator: m.creator || '',
          producer: m.producer || '',
        });
      })
      .catch((err) => setError(err.message));
  }, [files]);

  const handleSaveMetadata = async (removeAll = false) => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);
    setProgress(30);
    setProgressMsg(removeAll ? 'Stripping all metadata tags...' : 'Updating document metadata...');

    try {
      const keywordsArray = metadata.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const updatedBytes = await updatePdfMetadata(files[0].file, {
        title: metadata.title,
        author: metadata.author,
        subject: metadata.subject,
        keywords: keywordsArray,
        creator: metadata.creator,
        producer: metadata.producer,
        removeAll,
      });

      setResultBytes(updatedBytes);
      setIsProcessing(false);
      setProgress(100);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Failed to update metadata.');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBytes(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {resultBytes ? (
        <ResultCard
          title="PDF Metadata Updated Successfully!"
          filename={`${files[0]?.name.replace(/\.pdf$/i, '')}_sanitized.pdf`}
          data={resultBytes}
          fileSizeStr={formatBytes(resultBytes.byteLength)}
          extraInfo="Document metadata tags updated or sanitized."
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
            title="Upload PDF to inspect & edit metadata"
            subtitle="View or clean Title, Author, Subject, Keywords, and Creator tags."
            error={error}
            onErrorDismiss={() => setError(null)}
            disabled={isProcessing}
          />

          {files.length > 0 && !isProcessing && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <FileCog className="w-4 h-4 text-blue-400" />
                  <span>Document Properties & Metadata</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveMetadata(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/60 hover:bg-red-950/70 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Strip All Metadata</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Document Title</label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                    placeholder="Document Title"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Author Name / Username</label>
                  <input
                    type="text"
                    value={metadata.author}
                    onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                    placeholder="Author Name"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Subject</label>
                  <input
                    type="text"
                    value={metadata.subject}
                    onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                    placeholder="Subject Summary"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Keywords (Comma separated)</label>
                  <input
                    type="text"
                    value={metadata.keywords}
                    onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                    placeholder="contract, lease, 2026"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Software Creator</label>
                  <input
                    type="text"
                    value={metadata.creator}
                    onChange={(e) => setMetadata({ ...metadata, creator: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                    placeholder="Application Creator"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">PDF Producer</label>
                  <input
                    type="text"
                    value={metadata.producer}
                    onChange={(e) => setMetadata({ ...metadata, producer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                    placeholder="PDF Producer"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => handleSaveMetadata(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Metadata Changes</span>
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
