import { AppData, Student, Expense, ScanNotebookResult, MatchedScanStudent } from './types';
import { getInitialData } from './defaultData';

const LOCAL_STORAGE_KEY = 'kas_kelas_local_backup_v1';

// Save local backup
export function saveLocalBackup(data: AppData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Load local backup
export function getLocalBackup(): AppData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return getInitialData();
}

export async function fetchAppData(): Promise<AppData> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    saveLocalBackup(data);
    return data;
  } catch (err) {
    console.warn('Using local cached data fallback:', err);
    return getLocalBackup();
  }
}

export async function apiUpdateSettings(nominalPerSession?: number, adminPin?: string): Promise<AppData> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nominalPerSession, adminPin })
  });
  if (!res.ok) throw new Error('Gagal memperbarui pengaturan');
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiAddStudent(name: string, absen: number): Promise<AppData> {
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, absen })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal menambah siswa');
  }
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiUpdateStudent(id: string, name: string, absen: number): Promise<AppData> {
  const res = await fetch(`/api/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, absen })
  });
  if (!res.ok) throw new Error('Gagal memperbarui data siswa');
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiDeleteStudent(id: string): Promise<AppData> {
  const res = await fetch(`/api/students/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Gagal menghapus siswa');
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiTogglePayment(studentId: string, weekId: string, session: 'rabu' | 'kamis', paid: boolean): Promise<AppData> {
  const res = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, weekId, session, paid })
  });
  if (!res.ok) throw new Error('Gagal memperbarui status kas');
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiBulkTogglePayment(params: {
  weekId: string;
  session?: 'rabu' | 'kamis';
  studentId?: string;
  paid: boolean;
}): Promise<AppData> {
  const res = await fetch('/api/payments/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Gagal bulk update status kas');
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiAddWeek(label: string): Promise<AppData> {
  const res = await fetch('/api/weeks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label })
  });
  if (!res.ok) throw new Error('Gagal menambah minggu kas');
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiDeleteWeek(id: string): Promise<AppData> {
  const res = await fetch(`/api/weeks/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal menghapus minggu');
  }
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiAddExpense(payload: {
  date: string;
  title: string;
  amount: number;
  category: Expense['category'];
  note?: string;
}): Promise<AppData> {
  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mencatat pengeluaran');
  }
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiDeleteExpense(id: string): Promise<AppData> {
  const res = await fetch(`/api/expenses/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Gagal menghapus pengeluaran');
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiSendNotification(payload: {
  targetStudentId: string;
  title: string;
  message: string;
}): Promise<AppData> {
  const res = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mengirim notifikasi');
  }
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiMarkNotificationRead(notificationId: string, studentId: string): Promise<void> {
  await fetch('/api/notifications/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationId, studentId })
  }).catch(() => {});
}

export async function apiResetData(): Promise<AppData> {
  const res = await fetch('/api/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Gagal mereset data');
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiRestartFinances(): Promise<AppData> {
  const res = await fetch('/api/restart-finances', { method: 'POST' });
  if (!res.ok) throw new Error('Gagal me-restart keuangan');
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiToggleSessionDue(weekId: string, session: 'rabu' | 'kamis', isDue: boolean): Promise<AppData> {
  const res = await fetch('/api/weeks/session-due', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekId, session, isDue })
  });
  if (!res.ok) throw new Error('Gagal memperbarui status jatuh tempo sesi');
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result.appData;
}

export async function apiScanNotebook(imageBase64: string, mimeType = 'image/jpeg'): Promise<ScanNotebookResult> {
  const res = await fetch('/api/scan-notebook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memindai foto buku kas');
  }
  const data = await res.json();
  return data.result;
}

export async function apiApplyScanResults(payload: {
  weekId?: string;
  weekLabel?: string;
  results: { studentId: string; rabu: boolean; kamis: boolean }[];
}): Promise<{ appData: AppData; weekId: string; weekLabel: string; updatedCount: number }> {
  const res = await fetch('/api/scan-notebook/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal menerapkan hasil scan');
  }
  const result = await res.json();
  saveLocalBackup(result.appData);
  return result;
}
