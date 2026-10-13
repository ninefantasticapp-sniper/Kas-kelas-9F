export interface Student {
  id: string;
  name: string;
  absen: number;
}

export interface PaymentStatus {
  rabu: boolean;
  kamis: boolean;
  rabuPaidAt?: string;
  kamisPaidAt?: string;
}

export interface Expense {
  id: string;
  date: string;
  title: string;
  amount: number;
  category: 'ATK' | 'Kebersihan' | 'Sosial' | 'Perlengkapan' | 'Acara' | 'Lainnya';
  note?: string;
  createdAt: number;
}

export interface NotificationMessage {
  id: string;
  targetStudentId: string; // 'all' or specific student id
  targetStudentName?: string;
  title: string;
  message: string;
  createdAt: number;
  readBy?: string[];
}

export interface WeekConfig {
  id: string;
  label: string; // e.g., "Minggu 1", "Minggu 2"
  startDate?: string;
  rabuDue?: boolean;  // Hanya menjadi tunggakan jika ditandai jatuh tempo/tutup sesi oleh bendahara
  kamisDue?: boolean; // Hanya menjadi tunggakan jika ditandai jatuh tempo/tutup sesi oleh bendahara
}

export interface AppData {
  nominalPerSession: number; // default: 2000
  adminPin: string;
  students: Student[];
  weeks: WeekConfig[];
  // payments[studentId][weekId] = PaymentStatus
  payments: Record<string, Record<string, PaymentStatus>>;
  expenses: Expense[];
  notifications: NotificationMessage[];
  lastUpdated: number;
}

export interface DebtorReport {
  student: Student;
  unpaidSessions: {
    weekId: string;
    weekLabel: string;
    session: 'rabu' | 'kamis';
    sessionLabel: string;
  }[];
  totalDebt: number;
}

export interface MatchedScanStudent {
  studentId: string;
  officialName: string;
  absen: number;
  rawTextFromImage?: string;
  rabuPaid: boolean;
  kamisPaid: boolean;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface ScanNotebookResult {
  detectedWeekLabel?: string;
  notes?: string;
  matchedResults: MatchedScanStudent[];
  unmatchedRawEntries?: string[];
}
