import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SavedSignature, HistoryEntry } from '../types';

interface ToolsHubDB extends DBSchema {
  signatures: {
    key: string;
    value: SavedSignature;
    indexes: { 'by-date': number };
  };
  drafts: {
    key: string;
    value: { id: string; toolSlug: string; data: any; updatedAt: number };
  };
  history: {
    key: string;
    value: HistoryEntry;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'toolshub-local-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<ToolsHubDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ToolsHubDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('signatures')) {
          const sigStore = db.createObjectStore('signatures', { keyPath: 'id' });
          sigStore.createIndex('by-date', 'createdAt');
        }
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          const histStore = db.createObjectStore('history', { keyPath: 'id' });
          histStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllSignatures(): Promise<SavedSignature[]> {
  try {
    const db = await getDB();
    const all = await db.getAllFromIndex('signatures', 'by-date');
    return all.reverse();
  } catch (err) {
    const raw = localStorage.getItem('th_signatures_fallback');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveSignatureToDB(signature: SavedSignature): Promise<void> {
  try {
    const db = await getDB();
    await db.put('signatures', signature);
  } catch (err) {
    const existing = await getAllSignatures();
    const updated = [signature, ...existing.filter((s) => s.id !== signature.id)];
    localStorage.setItem('th_signatures_fallback', JSON.stringify(updated));
  }
}

export async function deleteSignatureFromDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('signatures', id);
  } catch (err) {
    const existing = await getAllSignatures();
    const updated = existing.filter((s) => s.id !== id);
    localStorage.setItem('th_signatures_fallback', JSON.stringify(updated));
  }
}

export async function saveDraft(toolSlug: string, data: any): Promise<void> {
  try {
    const db = await getDB();
    await db.put('drafts', { id: toolSlug, toolSlug, data, updatedAt: Date.now() });
  } catch (err) {
    localStorage.setItem(`th_draft_${toolSlug}`, JSON.stringify(data));
  }
}

export async function getDraft(toolSlug: string): Promise<any | null> {
  try {
    const db = await getDB();
    const draft = await db.get('drafts', toolSlug);
    return draft ? draft.data : null;
  } catch (err) {
    const raw = localStorage.getItem(`th_draft_${toolSlug}`);
    return raw ? JSON.parse(raw) : null;
  }
}

// Local History functions (storing ONLY metadata: tool used, file name, timestamp, status)
export async function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<void> {
  const item: HistoryEntry = {
    ...entry,
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
  };

  try {
    const db = await getDB();
    await db.put('history', item);
  } catch {
    const raw = localStorage.getItem('th_history_fallback');
    const existing: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const updated = [item, ...existing.slice(0, 49)];
    localStorage.setItem('th_history_fallback', JSON.stringify(updated));
  }
}

export async function getHistoryEntries(): Promise<HistoryEntry[]> {
  try {
    const db = await getDB();
    const all = await db.getAllFromIndex('history', 'by-timestamp');
    return all.reverse().slice(0, 50);
  } catch {
    const raw = localStorage.getItem('th_history_fallback');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('history');
  } catch {
    // fallback
  }
  localStorage.removeItem('th_history_fallback');
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('history', id);
  } catch {
    const raw = localStorage.getItem('th_history_fallback');
    if (raw) {
      const existing: HistoryEntry[] = JSON.parse(raw);
      const updated = existing.filter((item) => item.id !== id);
      localStorage.setItem('th_history_fallback', JSON.stringify(updated));
    }
  }
}
