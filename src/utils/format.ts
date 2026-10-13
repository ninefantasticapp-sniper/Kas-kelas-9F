import { AppData, Student, DebtorReport } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDateIndo(dateStr: string | number): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatTimeIndo(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return '';
  }
}

export function getStudentStatus(student: Student, data: AppData) {
  const studentPayments = data.payments[student.id] || {};
  const unpaidSessions: {
    weekId: string;
    weekLabel: string;
    session: 'rabu' | 'kamis';
    sessionLabel: string;
  }[] = [];

  let paidSessionsCount = 0;
  let dueSessionsCount = 0;
  const totalSessionsCount = data.weeks.length * 2;

  data.weeks.forEach((week) => {
    const weekPayment = studentPayments[week.id] || { rabu: false, kamis: false };

    if (weekPayment.rabu) {
      paidSessionsCount++;
    } else if (week.rabuDue) {
      // Hanya menjadi tunggakan jika sudah ditandai jatuh tempo / ditagih oleh bendahara
      unpaidSessions.push({
        weekId: week.id,
        weekLabel: week.label,
        session: 'rabu',
        sessionLabel: `Rabu ${week.label.split('(')[0].trim()}`
      });
    }

    if (weekPayment.kamis) {
      paidSessionsCount++;
    } else if (week.kamisDue) {
      // Hanya menjadi tunggakan jika sudah ditandai jatuh tempo / ditagih oleh bendahara
      unpaidSessions.push({
        weekId: week.id,
        weekLabel: week.label,
        session: 'kamis',
        sessionLabel: `Kamis ${week.label.split('(')[0].trim()}`
      });
    }

    if (week.rabuDue) dueSessionsCount++;
    if (week.kamisDue) dueSessionsCount++;
  });

  const totalDebt = unpaidSessions.length * data.nominalPerSession;
  const isLunas = unpaidSessions.length === 0;

  return {
    isLunas,
    unpaidSessions,
    totalDebt,
    paidSessionsCount,
    totalSessionsCount,
    dueSessionsCount,
    unpaidSummaryText: unpaidSessions.map((s) => s.sessionLabel).join(', ')
  };
}

export function calculateSummary(data: AppData) {
  let totalIncome = 0;
  let totalCheckedSessions = 0;

  data.students.forEach((student) => {
    const studentPayments = data.payments[student.id] || {};
    data.weeks.forEach((week) => {
      const wp = studentPayments[week.id];
      if (wp?.rabu) {
        totalIncome += data.nominalPerSession;
        totalCheckedSessions++;
      }
      if (wp?.kamis) {
        totalIncome += data.nominalPerSession;
        totalCheckedSessions++;
      }
    });
  });

  const totalExpense = data.expenses.reduce((sum, item) => sum + item.amount, 0);
  const activeBalance = totalIncome - totalExpense;

  // Calculate debtors list
  const debtors: DebtorReport[] = [];
  data.students.forEach((student) => {
    const status = getStudentStatus(student, data);
    if (!status.isLunas) {
      debtors.push({
        student,
        unpaidSessions: status.unpaidSessions,
        totalDebt: status.totalDebt
      });
    }
  });

  // Sort debtors by largest debt first, then by absen
  debtors.sort((a, b) => {
    if (b.totalDebt !== a.totalDebt) {
      return b.totalDebt - a.totalDebt;
    }
    return a.student.absen - b.student.absen;
  });

  return {
    totalIncome,
    totalExpense,
    activeBalance,
    totalCheckedSessions,
    totalPossibleSessions: data.students.length * data.weeks.length * 2,
    debtors,
    lunasCount: data.students.length - debtors.length,
    debtorCount: debtors.length
  };
}
