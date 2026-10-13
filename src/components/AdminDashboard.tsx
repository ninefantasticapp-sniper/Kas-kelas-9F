import React, { useState } from 'react';
import { 
  CheckSquare, 
  AlertTriangle, 
  ShoppingBag, 
  Bell, 
  Users, 
  Settings, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Sparkles,
  Camera
} from 'lucide-react';
import { AppData, Student } from '../types';
import { formatRupiah, calculateSummary } from '../utils/format';
import { apiRestartFinances } from '../api';
import { AdminChecklist } from './AdminChecklist';
import { AdminAiScan } from './AdminAiScan';
import { AdminDebtors } from './AdminDebtors';
import { AdminExpenses } from './AdminExpenses';
import { AdminNotifications } from './AdminNotifications';
import { AdminMembers } from './AdminMembers';
import { AdminSettings } from './AdminSettings';

interface AdminDashboardProps {
  data: AppData;
  onDataUpdated: (newData: AppData) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  data,
  onDataUpdated,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<
    'checklist' | 'aiscan' | 'debtors' | 'expenses' | 'notifications' | 'members' | 'settings'
  >('checklist');

  // Pre-fill fields when transferring from Debtors to Notifications
  const [prefilledStudentId, setPrefilledStudentId] = useState<string>('all');
  const [prefilledMessage, setPrefilledMessage] = useState<string>('');

  const summary = calculateSummary(data);

  const handlePrepareNotification = (studentId: string, message: string) => {
    setPrefilledStudentId(studentId);
    setPrefilledMessage(message);
    setActiveTab('notifications');
  };

  const handleRestartAllFinances = async () => {
    const confirmed = confirm(
      '⚠️ KONFIRMASI RESTART SEMUA KEUANGAN KAS:\n\n' +
      'Apakah Anda yakin ingin me-restart seluruh angka kas, saldo, pengeluaran, checklist pembayaran, dan tunggakan menjadi Rp 0 tanpa terkecuali?\n\n' +
      '• Saldo Kas Aktif -> Rp 0\n' +
      '• Total Pemasukan -> Rp 0\n' +
      '• Total Pengeluaran -> Rp 0\n' +
      '• Seluruh Tunggakan -> Rp 0 (0 Penunggak)\n' +
      '• 31 Siswa Anggota Kelas -> Tetap Utuh Terjaga\n\n' +
      'Tekan [OK] untuk me-restart sekarang.'
    );
    if (!confirmed) return;

    try {
      const updated = await apiRestartFinances();
      onDataUpdated(updated);
      alert('Semua angka keuangan kas telah berhasil di-restart ke Rp 0 tanpa terkecuali!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal me-restart keuangan');
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Admin Top Header Glass Card */}
      <div className="glass-card-dark rounded-3xl p-5 sm:p-7 text-white relative overflow-hidden shadow-2xl border border-white/20">
        <div className="absolute right-0 top-0 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 w-60 h-60 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold mb-2.5 border border-amber-300/30 backdrop-blur-md shadow-xs">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              Panel Bendahara Kelas
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
              Manajemen & Rekap Kas Kelas
            </h2>
            <p className="text-xs sm:text-sm text-teal-200/90 mt-1">
              Jadwal Penarikan: Setiap <strong className="text-white font-extrabold">Rabu & Kamis</strong> &bull; Nominal: <strong className="text-amber-300 font-extrabold">{formatRupiah(data.nominalPerSession)}</strong> per sesi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/20 text-xs font-bold text-teal-100 backdrop-blur-md shadow-xs">
              {data.students.length} Siswa Terdaftar
            </span>

            <button
              type="button"
              onClick={handleRestartAllFinances}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-600/80 hover:bg-rose-600 border border-rose-400/40 text-xs font-black text-white backdrop-blur-md shadow-md shadow-rose-950/30 transition active:scale-95"
              title="Restart semua angka kas ke Rp 0 tanpa terkecuali"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart Kas ke 0</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Financial & Ledger Overview Glass Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wide">Saldo Kas Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-800 flex items-center justify-center border border-teal-500/20">
              <Coins className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-teal-950 truncate mt-1">
            {formatRupiah(summary.activeBalance)}
          </div>
          <span className="text-[10px] text-teal-700 mt-1 font-semibold">Uang kas bersih siap pakai</span>
        </div>

        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wide">Total Pemasukan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-800 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-800 truncate mt-1">
            {formatRupiah(summary.totalIncome)}
          </div>
          <span className="text-[10px] text-emerald-700 mt-1 font-semibold">Dari {summary.totalCheckedSessions} sesi terbayar</span>
        </div>

        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wide">Total Pengeluaran</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-800 flex items-center justify-center border border-rose-500/20">
              <TrendingDown className="w-4 h-4 text-rose-700" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-800 truncate mt-1">
            {formatRupiah(summary.totalExpense)}
          </div>
          <span className="text-[10px] text-rose-700 mt-1 font-semibold">{data.expenses.length} transaksi belanja</span>
        </div>

        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wide">Rekap Penunggak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-950 truncate mt-1">
            {summary.debtors.length} Siswa
          </div>
          <span className="text-[10px] text-amber-800 mt-1 font-semibold">{summary.lunasCount} siswa telah lunas</span>
        </div>
      </div>

      {/* Main Admin Glass Tab Navigation Bar */}
      <div className="glass-pill p-1 rounded-2xl flex gap-1 overflow-x-auto text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'checklist'
              ? 'bg-teal-800 text-white shadow-md'
              : 'hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Pencatatan Kas (Checklist)
        </button>

        <button
          onClick={() => setActiveTab('aiscan')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition relative ${
            activeTab === 'aiscan'
              ? 'bg-linear-to-r from-amber-600 to-teal-800 text-white shadow-md'
              : 'hover:text-slate-900 hover:bg-white/40 text-amber-950 font-black'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Scan Buku Kas (AI)</span>
          <span className="bg-amber-400 text-teal-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-xs">
            Baru
          </span>
        </button>

        <button
          onClick={() => setActiveTab('debtors')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition relative ${
            activeTab === 'debtors'
              ? 'bg-teal-800 text-white shadow-md'
              : 'hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Rekap Penunggak
          {summary.debtors.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
              {summary.debtors.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'expenses'
              ? 'bg-teal-800 text-white shadow-md'
              : 'hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Pengeluaran & Belanja
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'notifications'
              ? 'bg-teal-800 text-white shadow-md'
              : 'hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Kirim Notifikasi Realtime
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'members'
              ? 'bg-teal-800 text-white shadow-md'
              : 'hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Manajemen Anggota ({data.students.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'settings'
              ? 'bg-teal-800 text-white shadow-md'
              : 'hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Pengaturan Kas
        </button>
      </div>

      {/* Render Selected Tab */}
      {activeTab === 'checklist' && (
        <AdminChecklist
          data={data}
          onDataUpdated={onDataUpdated}
          onNavigateToScan={() => setActiveTab('aiscan')}
        />
      )}

      {activeTab === 'aiscan' && (
        <AdminAiScan
          data={data}
          onDataUpdated={onDataUpdated}
          onNavigateToChecklist={(_weekId) => setActiveTab('checklist')}
        />
      )}

      {activeTab === 'debtors' && (
        <AdminDebtors data={data} onPrepareNotification={handlePrepareNotification} />
      )}

      {activeTab === 'expenses' && (
        <AdminExpenses data={data} onDataUpdated={onDataUpdated} />
      )}

      {activeTab === 'notifications' && (
        <AdminNotifications
          data={data}
          onDataUpdated={onDataUpdated}
          prefilledStudentId={prefilledStudentId}
          prefilledMessage={prefilledMessage}
        />
      )}

      {activeTab === 'members' && (
        <AdminMembers data={data} onDataUpdated={onDataUpdated} />
      )}

      {activeTab === 'settings' && (
        <AdminSettings data={data} onDataUpdated={onDataUpdated} />
      )}
    </div>
  );
};
