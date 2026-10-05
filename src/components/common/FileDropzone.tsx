import React, { useState, useMemo } from 'react';
import { useDropzone, Accept, FileRejection } from 'react-dropzone';
import {
  UploadCloud, File, Trash2, ArrowUp, ArrowDown, AlertTriangle,
  ShieldCheck, Plus, Sparkles, Loader2, CheckCircle2, X
} from 'lucide-react';
import { usePlan } from '../../context/PlanContext';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  sizeStr: string;
  pageCount?: number;
  previewUrl?: string;
  error?: string;
}

export interface FileDropzoneProps {
  accept?: string | Accept;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // Size in bytes (default: 100MB)
  files?: FileItem[];
  onFilesChange?: (files: FileItem[]) => void;
  onFilesSelected?: (files: File[]) => void;
  title?: string;
  subtitle?: string;
  error?: string | null;
  onErrorDismiss?: () => void;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
  loading?: boolean;
  progress?: number;
  progressMessage?: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Normalizes accept prop into react-dropzone Accept format
 */
function normalizeAccept(accept?: string | Accept): Accept | undefined {
  if (!accept) return undefined;
  if (typeof accept === 'object') return accept;

  const parts = accept.split(',').map((p) => p.trim().toLowerCase());
  const acceptObj: Accept = {};

  for (const part of parts) {
    if (part.includes('pdf')) {
      acceptObj['application/pdf'] = ['.pdf'];
    } else if (part === 'image/*' || part.startsWith('image/')) {
      acceptObj['image/*'] = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.bmp', '.tiff'];
    } else if (part === '.heic' || part === '.heif' || part.includes('heic')) {
      acceptObj['image/heic'] = ['.heic', '.heif'];
    } else if (part === '.txt' || part.includes('text/plain')) {
      acceptObj['text/plain'] = ['.txt'];
    } else if (part.startsWith('.')) {
      acceptObj['application/octet-stream'] = [
        ...(acceptObj['application/octet-stream'] || []),
        part,
      ];
    } else if (part.includes('/')) {
      acceptObj[part] = acceptObj[part] || [];
    }
  }

  return Object.keys(acceptObj).length > 0 ? acceptObj : undefined;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept = '.pdf,application/pdf',
  multiple = true,
  maxFiles = 5,
  maxSize = 100 * 1024 * 1024, // 100MB default
  files = [],
  onFilesChange = () => {},
  onFilesSelected,
  title = 'Select or drop your documents here',
  subtitle = 'Supports PDF files up to 100MB each',
  error,
  onErrorDismiss,
  disabled = false,
  className = '',
  isLoading = false,
  loading = false,
  progress = 0,
  progressMessage,
}) => {
  const activeLoading = isLoading || loading;
  const { isPro, openUpgradeModal } = usePlan();
  const [localError, setLocalError] = useState<string | null>(null);

  const parsedAccept = useMemo(() => normalizeAccept(accept), [accept]);

  const onDrop = (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setLocalError(null);

    // Handle file rejections (size, type, excess count)
    if (fileRejections.length > 0) {
      const firstRejection = fileRejections[0];
      const errors = firstRejection.errors.map((e) => {
        if (e.code === 'file-too-large') {
          return `"${firstRejection.file.name}" exceeds the maximum allowed file size of ${formatBytes(maxSize)}.`;
        }
        if (e.code === 'file-invalid-type') {
          return `"${firstRejection.file.name}" has an unsupported file format.`;
        }
        if (e.code === 'too-many-files') {
          return `You cannot upload more than ${maxFiles} file(s) simultaneously.`;
        }
        return e.message;
      });
      setLocalError(errors.join(' '));
      return;
    }

    if (acceptedFiles.length === 0) return;

    if (onFilesSelected) {
      onFilesSelected(acceptedFiles);
      return;
    }

    const newItems: FileItem[] = acceptedFiles.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      file: f,
      name: f.name,
      sizeStr: formatBytes(f.size),
    }));

    if (!multiple) {
      onFilesChange(newItems.slice(0, 1));
      return;
    }

    const combined = [...files, ...newItems];

    if (!isPro && combined.length > maxFiles) {
      onFilesChange(combined.slice(0, maxFiles));
      openUpgradeModal(
        `Free plan is limited to ${maxFiles} files at once. Upgrade to Pro for unlimited files & batch processing.`
      );
    } else {
      onFilesChange(combined);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: parsedAccept,
    maxSize,
    multiple,
    maxFiles: multiple ? (isPro ? undefined : maxFiles) : 1,
    disabled: disabled || activeLoading,
  });

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= files.length) return;
    const reordered = [...files];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;
    onFilesChange(reordered);
  };

  const displayedError = error || localError;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* react-dropzone Root Container */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
          isDragReject
            ? 'border-red-500 bg-red-950/30'
            : isDragAccept || isDragActive
            ? 'border-blue-500 bg-blue-950/40 scale-[1.005]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/80'
        } ${disabled || activeLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-label={title}
        role="button"
        tabIndex={disabled || activeLoading ? -1 : 0}
      >
        <input {...getInputProps()} className="hidden" />

        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              isDragReject
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : isDragActive
                ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300'
                : 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
            }`}
          >
            {activeLoading ? (
              <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div>
            <h4 className="text-base font-semibold text-slate-100">
              {isDragActive
                ? isDragReject
                  ? 'File format or size not supported'
                  : 'Drop your files right here'
                : title}
            </h4>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Client-Side Privacy
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
              Max {formatBytes(maxSize)}
            </span>
            {!isPro && multiple && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Free limit: {maxFiles} files
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar for Loading States */}
        {activeLoading && (
          <div className="mt-5 max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-blue-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{progressMessage || 'Processing documents locally...'}</span>
              </span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ARIA Live Region for Status & Errors */}
      <div aria-live="polite" className="sr-only">
        {activeLoading && (progressMessage || 'Processing file upload')}
        {displayedError}
        {files.length > 0 && `${files.length} file(s) selected.`}
      </div>

      {/* Error Alert */}
      {displayedError && (
        <div
          className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center justify-between gap-2"
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{displayedError}</span>
          </div>
          <button
            onClick={() => {
              setLocalError(null);
              onErrorDismiss?.();
            }}
            className="text-red-400 hover:text-red-200 text-xs font-semibold px-2 py-0.5 cursor-pointer"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Free Plan File Limit Callout */}
      {!isPro && files.length >= maxFiles && (
        <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>You reached the free limit of {maxFiles} files. Need more?</span>
          </div>
          <button
            onClick={() => openUpgradeModal('Merge unlimited files and process in bulk with Pro.')}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs whitespace-nowrap cursor-pointer"
          >
            Unlock Unlimited
          </button>
        </div>
      )}

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Selected Files ({files.length}
              {!isPro && multiple ? ` / ${maxFiles}` : ''})
            </span>
            {multiple && files.length > 1 && (
              <span className="text-[11px] text-slate-500">
                Use arrows to rearrange file order
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {files.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-900/40 text-blue-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.sizeStr}
                      {item.pageCount ? ` • ${item.pageCount} pages` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {multiple && files.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => moveFile(index, 'up')}
                        disabled={index === 0}
                        aria-label={`Move ${item.name} up`}
                        className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveFile(index, 'down')}
                        disabled={index === files.length - 1}
                        aria-label={`Move ${item.name} down`}
                        className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
