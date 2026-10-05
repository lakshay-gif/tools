import React, { useState } from 'react';
import { useToolHistory } from '../../hooks/useToolHistory';
import {
  History, Trash2, ArrowRight, ShieldCheck, Clock, FileText, Search,
  CheckCircle2, AlertCircle, RefreshCw, Sparkles, Filter, ExternalLink
} from 'lucide-react';

interface HistoryDashboardProps {
  onNavigate?: (route: string) => void;
  className?: string;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ onNavigate, className = '' }) => {
  const { logs, loading, removeLog, clearAllLogs, refreshLogs } = useToolHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const title = (log.toolTitle || log.toolName || log.toolSlug || '').toLowerCase();
    const name = (log.fileName || log.filename || '').toLowerCase();
    const slug = (log.toolSlug || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      title.includes(q) ||
      name.includes(q) ||
      slug.includes(q);

    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const formatTimestamp = (ts: number) => {
    const now = Date.now();
    const diffMs = now - ts;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClear = async () => {
    await clearAllLogs();
    setConfirmClear(false);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Tool Usage History</h2>
              <p className="text-xs text-slate-400">
                Local in-browser record stored securely in your device's IndexedDB
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshLogs()}
            title="Refresh logs"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {logs.length > 0 && (
            confirmClear ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Confirm Clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-900/40 text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Logs</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Privacy Guarantee Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-200">100% Client-Side Privacy:</strong> Only the operation metadata (tool name, filename, timestamp) is logged in your local IndexedDB. Your actual file data is never saved or transmitted.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 hidden md:inline-block">
          {logs.length} logged
        </span>
      </div>

      {/* Search & Filter Bar */}
      {logs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by tool or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/80"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] mr-1 hidden sm:inline">Status:</span>
            {(['all', 'success', 'failed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logs Table / List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading tool usage logs from IndexedDB...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-800/80 rounded-2xl bg-slate-900/30 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">
            {logs.length === 0 ? 'No Tool Usage Recorded Yet' : 'No logs match your filter'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {logs.length === 0
              ? 'Whenever you merge, split, compress, or convert files using any of our tools, an audit log is automatically saved here for your convenience.'
              : 'Try clearing your search query or switching your status filter to "all".'}
          </p>
          {logs.length === 0 && onNavigate && (
            <button
              onClick={() => onNavigate('/pdf-documents')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Explore 32 Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredLogs.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-2xl border border-slate-800/90 bg-slate-900/70 hover:bg-slate-900 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    entry.status === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-400'
                      : 'bg-red-950/60 border border-red-800/40 text-red-400'
                  }`}
                >
                  {entry.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-200">
                      {entry.toolTitle || entry.toolName || entry.toolSlug}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                      /{entry.toolSlug}
                    </span>
                    {entry.fileSizeStr && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({entry.fileSizeStr})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate text-slate-300 font-mono text-[11px]">{entry.fileName || entry.filename || 'Processed document'}</span>
                  </div>
                  {entry.details && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {entry.details}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(entry.timestamp)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate(`/${entry.toolSlug}`)}
                      title={`Launch ${entry.toolTitle}`}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={() => removeLog(entry.id)}
                    title="Delete this entry"
                    className="p-1 text-slate-600 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
