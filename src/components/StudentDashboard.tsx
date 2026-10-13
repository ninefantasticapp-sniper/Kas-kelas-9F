import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  Calendar, 
  FileText, 
  Users, 
  Search, 
  Volume2, 
  Smartphone,
  Check,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { AppData, Student, NotificationMessage } from '../types';
import { formatRupiah, formatDateIndo, formatTimeIndo, getStudentStatus, calculateSummary } from '../utils/format';
import { triggerSystemNotification, requestNotificationPermission, getNotificationPermission } from '../utils/notifications';

interface StudentDashboardProps {
  student: Student;
  data: AppData;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, data }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'transparency' | 'expenses' | 'notifications'>('status');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('all');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [testNotifSent, setTestNotifSent] = useState(false);

  React.useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const studentStatus = getStudentStatus(student, data);
  const summary = calculateSummary(data);

  // Filter notifications for this student
  const myNotifications = data.notifications.filter(
    (n) => n.targetStudentId === 'all' || n.targetStudentId === student.id
  );

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  const handleTestSystemNotification = async () => {
    setTestNotifSent(true);
    await triggerSystemNotification(
      `Kas Kelas - ${student.name}`,
      `Halo Absen #${student.absen}! Uji coba notifikasi bilah status HP berhasil. Kamu akan menerima notifikasi tagihan atau pengumuman di sini.`,
      window.location.href
    );
    setTimeout(() => setTestNotifSent(false), 3000);
  };

  // Filter class students for transparency table
  const filteredClass = data.students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.absen).includes(searchQuery)
  );

  return (
    <div className="space-y-4 pb-12">
      {/* Top Welcome & Notification Glass Card */}
      <div className="rounded-3xl p-5 sm:p-7 glass-card-dark text-white relative overflow-hidden shadow-2xl border border-white/20">
        {/* Ambient Glow Orbs behind glass */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-semibold mb-2.5 border border-white/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400" />
              Siswa Terautentikasi
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
              {student.name}
            </h2>
            <p className="text-xs sm:text-sm text-teal-200/90 mt-1">
              Nomor Absen: <strong className="text-white font-extrabold px-1.5 py-0.5 rounded-md bg-white/15 border border-white/20">#{student.absen}</strong> &bull; Jadwal Kas: Setiap <span className="text-amber-300 font-bold">Rabu</span> & <span className="text-amber-300 font-bold">Kamis</span>
            </p>
          </div>

          {/* Quick Notification State Pill & Test Button */}
          <div className="flex flex-wrap items-center gap-2">
            {notifPermission === 'granted' ? (
              <button
                onClick={handleTestSystemNotification}
                disabled={testNotifSent}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/30 border border-emerald-400/40 backdrop-blur-md transition active:scale-95"
                title="Kirim uji coba notifikasi bilah HP sekarang"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{testNotifSent ? 'Terkirim ke Bilah HP!' : 'Uji Notif Bilah HP'}</span>
              </button>
            ) : (
              <button
                onClick={handleRequestPermission}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-teal-950 text-xs font-black rounded-2xl shadow-lg shadow-amber-400/30 border border-amber-300/50 transition animate-pulse"
              >
                <Bell className="w-3.5 h-3.5 text-teal-950" />
                <span>Aktifkan Notif Bilah HP</span>
              </button>
            )}
          </div>
        </div>

        {/* Informative Notification banner if not granted yet */}
        {notifPermission !== 'granted' && (
          <div className="mt-4 p-3.5 bg-white/10 border border-white/15 rounded-2xl text-xs text-teal-100 flex items-start gap-2.5 backdrop-blur-md">
            <Volume2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-bold text-white">Notifikasi Bilah Status HP belum aktif:</span> Tekan tombol di atas agar pesan tagihan dan pengingat dari Bendahara langsung muncul di bilah status HP kamu.
            </div>
          </div>
        )}
      </div>

      {/* Primary Status Glass Card: Lunas vs Menunggak */}
      <div
        className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 ${
          studentStatus.isLunas
            ? 'glass-card border-emerald-300/60 text-emerald-950 glass-glow-emerald'
            : 'glass-card border-rose-300/60 text-rose-950 glass-glow-rose'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                studentStatus.isLunas
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
                  : 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/30 animate-bounce'
              }`}
            >
              {studentStatus.isLunas ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-500">
                  Status Kas Pribadi
                </span>
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full shadow-xs ${
                    studentStatus.isLunas
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-rose-600 text-white shadow-rose-600/30'
                  }`}
                >
                  {studentStatus.isLunas ? 'LUNAS' : 'KURANG BAYAR / MENUNGGAK'}
                </span>
              </div>
              <p className="text-base sm:text-lg font-extrabold mt-1 text-slate-900">
                {studentStatus.isLunas
                  ? data.weeks.length === 0
                    ? 'Buku kas baru & bersih. Tidak ada tagihan berjalan (Tunggakan: Rp 0).'
                    : 'Alhamdulillah, pembayaran kas kamu sudah lengkap!'
                  : `Kamu memiliki kekurangan kas sebesar ${formatRupiah(studentStatus.totalDebt)}`}
              </p>
            </div>
          </div>

          <div className="text-right sm:self-center glass-pill px-4 py-2 rounded-2xl border border-white/60">
            <div className="text-[11px] font-semibold text-slate-500">Tercatat Membayar</div>
            <div className="text-sm sm:text-base font-black text-slate-900">
              {studentStatus.paidSessionsCount} / {studentStatus.totalSessionsCount} Sesi
            </div>
          </div>
        </div>

        {/* Detailed unpaid sessions list if debtor */}
        {!studentStatus.isLunas && (
          <div className="mt-4 pt-4 border-t border-rose-200/60">
            <h4 className="text-xs font-bold text-rose-900 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              Detail Sesi yang Belum Dibayar ({studentStatus.unpaidSessions.length} Sesi):
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {studentStatus.unpaidSessions.map((session, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-500/15 text-rose-950 font-bold text-xs border border-rose-300/70 backdrop-blur-md"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  {session.sessionLabel} ({formatRupiah(data.nominalPerSession)})
                </span>
              ))}
            </div>
            <p className="text-[11px] text-rose-800 mt-2 font-medium">
              Mohon segera melunasi ke Bendahara Kelas pada hari Rabu atau Kamis saat penarikan kas.
            </p>
          </div>
        )}
      </div>

      {/* Class Financial Summary Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-800 flex items-center justify-center shrink-0 shadow-inner">
            <Coins className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Saldo Kas Aktif
            </span>
            <div className="text-lg sm:text-xl font-black text-teal-950 mt-0.5">
              {formatRupiah(summary.activeBalance)}
            </div>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 flex items-center justify-center shrink-0 shadow-inner">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Total Kas Masuk
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-800 mt-0.5">
              {formatRupiah(summary.totalIncome)}
            </div>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-4 sm:p-5 rounded-3xl flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-800 flex items-center justify-center shrink-0 shadow-inner">
            <TrendingDown className="w-5 h-5 text-rose-700" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Total Pengeluaran
            </span>
            <div className="text-lg sm:text-xl font-black text-rose-800 mt-0.5">
              {formatRupiah(summary.totalExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* Glass Navigation Tabs Bar */}
      <div className="glass-pill p-1 rounded-2xl flex gap-1 overflow-x-auto text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'status'
              ? 'bg-teal-800 text-white shadow-md'
              : 'hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Riwayat Kas Saya
        </button>
        <button
          onClick={() => setActiveTab('transparency')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'transparency'
              ? 'bg-teal-800 text-white shadow-md'
              : 'hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Transparansi Kelas ({data.students.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl whitespace-nowrap transition ${
            activeTab === 'expenses'
              ? 'bg-teal-800 text-white shadow-md'
              : 'hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Belanja Kelas ({data.expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl whitespace-nowrap transition relative ${
            activeTab === 'notifications'
              ? 'bg-teal-800 text-white shadow-md'
              : 'hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Pesan & Notif
          {myNotifications.length > 0 && (
            <span className="bg-amber-400 text-teal-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
              {myNotifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Riwayat Kas Saya */}
      {activeTab === 'status' && (
        <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/40">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Jadwal Penarikan Kas Pribadi
              </h3>
              <p className="text-xs text-slate-500">
                Nominal kas Rp {data.nominalPerSession.toLocaleString('id-ID')} per sesi (Rabu & Kamis)
              </p>
            </div>
          </div>

          {data.weeks.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs glass-pill rounded-2xl">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-700" />
              Belum ada sesi penarikan kas mingguan yang dibuka oleh Bendahara.
              <p className="text-[11px] text-slate-400 mt-1">Seluruh kewajiban kas saat ini bernilai Rp 0 (Fresh).</p>
            </div>
          ) : (
            <div className="divide-y divide-white/40 rounded-2xl overflow-hidden glass-pill">
              {data.weeks.map((week) => {
              const weekData = data.payments[student.id]?.[week.id] || { rabu: false, kamis: false };
              const isWeekFull = weekData.rabu && weekData.kamis;

              return (
                <div key={week.id} className="p-4 hover:bg-white/40 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{week.label}</span>
                        {isWeekFull ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-900 border border-emerald-400/30">
                            Lunas Minggu Ini
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-950 border border-amber-400/40">
                            Belum Lengkap
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">Total Rp 4.000 / minggu</span>
                    </div>

                    {/* Rabu & Kamis pill indicators */}
                    <div className="flex items-center gap-2">
                      {/* Sesi Rabu */}
                      <div
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs backdrop-blur-md ${
                          weekData.rabu
                            ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-950'
                            : 'bg-rose-500/15 border-rose-400/40 text-rose-950'
                        }`}
                      >
                        {weekData.rabu ? (
                          <Check className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <div>
                          <div className="font-bold">Sesi Rabu</div>
                          <div className="text-[10px] text-slate-500">
                            {weekData.rabu ? 'Sudah Dibayar' : 'Belum Bayar'}
                          </div>
                        </div>
                      </div>

                      {/* Sesi Kamis */}
                      <div
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs backdrop-blur-md ${
                          weekData.kamis
                            ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-950'
                            : 'bg-rose-500/15 border-rose-400/40 text-rose-950'
                        }`}
                      >
                        {weekData.kamis ? (
                          <Check className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <div>
                          <div className="font-bold">Sesi Kamis</div>
                          <div className="text-[10px] text-slate-500">
                            {weekData.kamis ? 'Sudah Dibayar' : 'Belum Bayar'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* Tab 2: Transparansi Rekap Kelas */}
      {activeTab === 'transparency' && (
        <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/40">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Transparansi Pembayaran Seluruh Kelas
              </h3>
              <p className="text-xs text-slate-500">
                Keterbukaan rekap status kas 31 siswa
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari siswa atau absen..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl glass-input text-slate-800 placeholder-slate-400"
                />
              </div>

              <select
                value={selectedWeekFilter}
                onChange={(e) => setSelectedWeekFilter(e.target.value)}
                className="text-xs rounded-2xl px-3 py-2 glass-input text-slate-700 font-medium"
              >
                <option value="all">Semua Minggu</option>
                {data.weeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/50 glass-pill">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/40 text-slate-700 font-extrabold border-b border-white/40">
                <tr>
                  <th className="py-3 px-3 text-center w-14">Absen</th>
                  <th className="py-3 px-3">Nama Siswa</th>
                  {selectedWeekFilter === 'all' ? (
                    <>
                      <th className="py-3 px-3 text-center">Status Keseluruhan</th>
                      <th className="py-3 px-3 text-right">Kekurangan</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-3 text-center">Rabu</th>
                      <th className="py-3 px-3 text-center">Kamis</th>
                      <th className="py-3 px-3 text-center">Status Minggu</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30">
                {filteredClass.map((std) => {
                  const isCurrent = std.id === student.id;
                  const stat = getStudentStatus(std, data);

                  if (selectedWeekFilter === 'all') {
                    return (
                      <tr
                        key={std.id}
                        className={`hover:bg-white/50 transition ${
                          isCurrent ? 'bg-teal-500/15 font-bold text-teal-950' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-500 font-bold">
                          #{std.absen}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span>{std.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-teal-800 text-white px-2 py-0.5 rounded-full font-black">
                                Kamu
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {stat.isLunas ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-900 border border-emerald-400/30">
                              Lunas
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-900 border border-rose-400/30">
                              Kurang {stat.unpaidSessions.length} Sesi
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {stat.isLunas ? (
                            <span className="text-emerald-700 font-extrabold">Rp 0</span>
                          ) : (
                            <span className="text-rose-700 font-black">
                              {formatRupiah(stat.totalDebt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  // Single week view
                  const wp = data.payments[std.id]?.[selectedWeekFilter] || {
                    rabu: false,
                    kamis: false
                  };
                  const weekLunas = wp.rabu && wp.kamis;

                  return (
                    <tr
                      key={std.id}
                      className={`hover:bg-white/50 transition ${
                        isCurrent ? 'bg-teal-500/15 font-bold text-teal-950' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-500 font-bold">
                        #{std.absen}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span>{std.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-teal-800 text-white px-2 py-0.5 rounded-full font-black">
                              Kamu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {wp.rabu ? (
                          <span className="text-emerald-700 font-extrabold inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Lunas
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Belum
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {wp.kamis ? (
                          <span className="text-emerald-700 font-extrabold inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Lunas
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Belum
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {weekLunas ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-900 border border-emerald-400/30">
                            Lunas
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-900 border border-rose-400/30">
                            Kurang
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Catatan Belanja Kas */}
      {activeTab === 'expenses' && (
        <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/40">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Catatan Pengeluaran & Belanja Kas
              </h3>
              <p className="text-xs text-slate-500">
                Daftar semua belanja keperluan kelas yang dibiayai kas bersama
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500">Total Belanja</span>
              <div className="text-base sm:text-lg font-black text-rose-700">
                {formatRupiah(summary.totalExpense)}
              </div>
            </div>
          </div>

          {data.expenses.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs glass-pill rounded-2xl">
              Belum ada catatan pengeluaran kas yang dibukukan.
            </div>
          ) : (
            <div className="divide-y divide-white/40 rounded-2xl overflow-hidden glass-pill">
              {data.expenses.map((item) => (
                <div key={item.id} className="p-4 hover:bg-white/40 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{item.title}</span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-200/70 text-slate-700 border border-white/40">
                          {item.category}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-xs text-slate-600 mt-1">{item.note}</p>
                      )}
                      <span className="text-[11px] text-slate-400 mt-1 inline-block">
                        Tanggal: {formatDateIndo(item.date)}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-black text-rose-600">
                        -{formatRupiah(item.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Pesan & Notifikasi */}
      {activeTab === 'notifications' && (
        <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/40">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Pesan & Notifikasi Masuk
              </h3>
              <p className="text-xs text-slate-500">
                Pemberitahuan tagihan dan pengumuman kas dari Bendahara
              </p>
            </div>
            <button
              onClick={handleTestSystemNotification}
              className="text-xs text-teal-800 hover:text-teal-950 font-bold flex items-center gap-1.5 glass-pill px-3 py-1.5 rounded-xl hover:bg-white/60 transition shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-700" />
              Tes Notif HP
            </button>
          </div>

          {myNotifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs glass-pill rounded-2xl">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Belum ada pesan notifikasi untuk akun kamu.
            </div>
          ) : (
            <div className="space-y-3">
              {myNotifications.map((msg) => {
                const isTargetPersonal = msg.targetStudentId === student.id;

                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border transition backdrop-blur-md ${
                      isTargetPersonal
                        ? 'bg-amber-400/15 border-amber-300/40 text-amber-950 shadow-xs'
                        : 'glass-pill text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{msg.title}</span>
                        {isTargetPersonal ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/30 text-amber-950 border border-amber-400/40">
                            Pesan Khusus Untukmu
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/40 text-slate-700 border border-white/40">
                            Semua Siswa
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {formatTimeIndo(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 mt-2 whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
