import { useState, useEffect, useCallback } from 'react';
import { HistoryEntry } from '../types';
import { getHistoryEntries, addHistoryEntry, deleteHistoryEntry, clearHistory } from '../lib/db';

export function useToolHistory() {
  const [logs, setLogs] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getHistoryEntries();
      setLogs(items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tool history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = useCallback(async (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    try {
      await addHistoryEntry(entry);
      // Immediately refresh logs
      await fetchLogs();
    } catch (err: any) {
      console.error('Error adding tool history log:', err);
    }
  }, [fetchLogs]);

  const removeLog = useCallback(async (id: string) => {
    try {
      await deleteHistoryEntry(id);
      setLogs((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error('Error removing tool history log:', err);
    }
  }, []);

  const clearAllLogs = useCallback(async () => {
    try {
      await clearHistory();
      setLogs([]);
    } catch (err: any) {
      console.error('Error clearing tool history:', err);
    }
  }, []);

  return {
    logs,
    loading,
    error,
    addLog,
    removeLog,
    clearAllLogs,
    refreshLogs: fetchLogs,
  };
}
