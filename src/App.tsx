import React, { useEffect, useState, useRef } from 'react';
import { 
  Coins, 
  User, 
  ShieldCheck, 
  Smartphone, 
  Calendar, 
  Bell, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AppData, Student, NotificationMessage } from './types';
import { getInitialData } from './defaultData';
import { fetchAppData, getLocalBackup, saveLocalBackup } from './api';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { PWAInstallButton } from './components/PWAInstallButton';
import { triggerSystemNotification, playNotificationChime } from './utils/notifications';
import { formatRupiah, calculateSummary } from './utils/format';

export default function App() {
  const [data, setData] = useState<AppData>(getLocalBackup());
  const [currentRole, setCurrentRole] = useState<'guest' | 'student' | 'admin'>('guest');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalRole, setLoginModalRole] = useState<'student' | 'admin'>('student');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [liveToast, setLiveToast] = useState<{ title: string; body: string } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('kas_role') as 'student' | 'admin' | null;
      const savedStudent = localStorage.getItem('kas_student');
      if (savedRole === 'admin') {
        setCurrentRole('admin');
      } else if (savedRole === 'student' && savedStudent) {
        setCurrentRole('student');
        setCurrentStudent(JSON.parse(savedStudent));
      }
    } catch {
      // ignore
    }

    // Register Service Worker for PWA and Mobile Status Bar Push Notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Kas Kelas Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration warning:', err);
        });
    }

    // Initial fetch from backend
    fetchAppData()
      .then((loaded) => {
        setData(loaded);
      })
      .catch((err) => {
        console.warn('Backend fetch fallback to local:', err);
      });
  }, []);

  // Connect to Realtime Server-Sent Events (SSE)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.EventSource) return;

    let sseUrl = '/api/realtime';
    if (currentStudent) {
      sseUrl += `?studentId=${encodeURIComponent(currentStudent.id)}`;
    }

    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setIsRealtimeConnected(true);
    });

    es.addEventListener('update', (e) => {
      try {
        const payload: AppData = JSON.parse(e.data);
        setData(payload);
        saveLocalBackup(payload);
      } catch (err) {
        console.error('SSE update parse error:', err);
      }
    });

    es.addEventListener('notification', (e) => {
      try {
        const notif: NotificationMessage = JSON.parse(e.data);
        const targetStudentName = currentStudent ? currentStudent.name : 'Kamu';
        const notifTitle = `Kas Kelas - ${notif.targetStudentName || targetStudentName}`;

        // Trigger native status bar notification
        triggerSystemNotification(notifTitle, notif.message, window.location.href);

        // Show in-app toast
        setLiveToast({
          title: notifTitle,
          body: notif.message
        });

        // Hide toast after 6 seconds
        setTimeout(() => {
          setLiveToast(null);
        }, 6000);
      } catch (err) {
        console.error('SSE notification parse error:', err);
      }
    });

    es.onerror = () => {
      setIsRealtimeConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [currentStudent]);

  // Login Handlers
  const handleLoginStudent = (student: Student) => {
    setCurrentStudent(student);
    setCurrentRole('student');
    localStorage.setItem('kas_role', 'student');
    localStorage.setItem('kas_student', JSON.stringify(student));
  };

  const handleLoginAdmin = () => {
    setCurrentRole('admin');
    setCurrentStudent(null);
    localStorage.setItem('kas_role', 'admin');
    localStorage.removeItem('kas_student');
  };

  const handleLogout = () => {
    setCurrentRole('guest');
    setCurrentStudent(null);
    localStorage.removeItem('kas_role');
    localStorage.removeItem('kas_student');
  };

  const handleOpenLogin = (role: 'student' | 'admin') => {
    setLoginModalRole(role);
    setLoginModalOpen(true);
  };

  const summary = calculateSummary(data);

  // Unread notifications for student
  const unreadCount = currentStudent
    ? data.notifications.filter(
        (n) =>
          (n.targetStudentId === 'all' || n.targetStudentId === currentStudent.id) &&
          (!n.readBy || !n.readBy.includes(currentStudent.id))
      ).length
    : 0;

  return (
    <div className="min-h-screen bg-glass-mesh flex flex-col text-slate-800 font-sans relative overflow-x-hidden">
      {/* Background Refractive Ambient Glow Orbs */}
      <div className="fixed top-12 left-10 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/3 w-[30rem] h-[30rem] bg-emerald-400/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        currentStudent={currentStudent}
        onLogout={handleLogout}
        onOpenLogin={handleOpenLogin}
        isRealtimeConnected={isRealtimeConnected}
        unreadCount={unreadCount}
      />

      {/* Realtime Live Notification Toast */}
      {liveToast && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-bounce shadow-2xl">
          <div className="glass-card-dark text-white p-4.5 rounded-3xl border border-white/20 flex items-start gap-3 backdrop-blur-2xl shadow-2xl">
            <div className="p-2.5 rounded-2xl bg-amber-400 text-teal-950 shrink-0 shadow-md">
              <Bell className="w-5 h-5 animate-spin" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-amber-300">{liveToast.title}</h4>
                <button
                  onClick={() => setLiveToast(null)}
                  className="text-xs text-teal-300 hover:text-white"
                >
                  Tutup
                </button>
              </div>
              <p className="text-xs text-teal-100 mt-1 whitespace-pre-wrap leading-relaxed">{liveToast.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 relative z-10">
        {/* PWA Banner if mobile */}
        <div className="mb-4">
          <PWAInstallButton variant="banner" />
        </div>

        {/* View Routing based on currentRole */}
        {currentRole === 'student' && currentStudent ? (
          <StudentDashboard
            student={currentStudent}
            data={data}
            onLogout={handleLogout}
          />
        ) : currentRole === 'admin' ? (
          <AdminDashboard
            data={data}
            onDataUpdated={(updated) => setData(updated)}
            onLogout={handleLogout}
          />
        ) : (
          /* Guest Landing / Portal View */
          <div className="space-y-6 py-4">
            {/* Hero Glass Card */}
            <div className="glass-card-dark text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-white/20">
              <div className="max-w-2xl relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400 text-teal-950 font-black text-xs shadow-md border border-amber-300/60">
                  <Sparkles className="w-3.5 h-3.5" />
                  Sistem Kas Kelas Glassmorphism Realtime
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                  Pengelolaan Uang Kas Kelas Modern, Transparan & Otomatis
                </h2>
                <p className="text-teal-100/90 text-xs sm:text-base leading-relaxed">
                  Penarikan kas rutin <strong className="text-amber-300 font-extrabold">2 kali seminggu (Rabu & Kamis)</strong> sebesar{' '}
                  <strong className="text-amber-300 font-extrabold">{formatRupiah(data.nominalPerSession)}/sesi</strong>. Didukung rekap penunggak otomatis dan notifikasi bilah status HP secara realtime.
                </p>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => handleOpenLogin('student')}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-black text-sm shadow-xl shadow-teal-500/25 transition active:scale-95 border border-white/40"
                  >
                    <User className="w-4 h-4" />
                    <span>Masuk sebagai Siswa</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenLogin('admin')}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm border border-white/25 backdrop-blur-md transition active:scale-95 shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Panel Bendahara</span>
                  </button>
                </div>
              </div>

              {/* Decorative Coin Illustration behind glass */}
              <div className="absolute right-4 bottom-4 opacity-15 pointer-events-none hidden sm:block">
                <Coins className="w-72 h-72 text-teal-300" />
              </div>
            </div>

            {/* Quick Public Summary Glass Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-card glass-card-hover p-5 rounded-3xl">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                  Saldo Kas Kelas Aktif
                </span>
                <div className="text-xl sm:text-2xl font-black text-teal-950 mt-1">
                  {formatRupiah(summary.activeBalance)}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Saldo siap dibelanjakan</p>
              </div>

              <div className="glass-card glass-card-hover p-5 rounded-3xl">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                  Jadwal Penarikan Kas
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Rabu & Kamis
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">{formatRupiah(data.nominalPerSession)} per sesi bayar</p>
              </div>

              <div className="glass-card glass-card-hover p-5 rounded-3xl">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                  Total Anggota Kelas
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {data.students.length} Siswa
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">{summary.lunasCount} siswa lunas minggu berjalan</p>
              </div>
            </div>

            {/* Feature Highlights Glass Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-5 sm:p-6 rounded-3xl flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/20 text-teal-800 shrink-0">
                  <Smartphone className="w-6 h-6 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Notifikasi Bilah Status HP</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Pengingat kas dan tagihan tunggakan langsung muncul di panel atas HP siswa melalui Web Push Notification API dan Service Worker.
                  </p>
                </div>
              </div>

              <div className="glass-card p-5 sm:p-6 rounded-3xl flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-800 shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Transparansi 100% Bebas Curiga</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Setiap siswa dapat mengecek catatan pembukuan, sesi yang sudah dibayar, serta riwayat belanja barang dan keperluan kelas.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Student Selector on Landing Page */}
            <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/40">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Pilih Akun untuk Langsung Mencoba:
                </h3>
                <span className="text-xs text-slate-500 font-semibold">31 Siswa Terdaftar</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.students.slice(0, 10).map((std) => (
                  <button
                    key={std.id}
                    onClick={() => handleLoginStudent(std)}
                    className="px-3.5 py-2 text-xs glass-pill hover:bg-teal-800 hover:text-white rounded-2xl font-bold text-slate-700 transition"
                  >
                    #{std.absen} {std.name.split(' ')[0]}
                  </button>
                ))}
                <button
                  onClick={() => handleOpenLogin('student')}
                  className="px-3.5 py-2 text-xs bg-teal-500/15 text-teal-900 font-extrabold rounded-2xl hover:bg-teal-500/25 border border-teal-500/30 transition shadow-xs"
                >
                  Lihat Semua ({data.students.length})...
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Glass Footer */}
      <footer className="mt-auto border-t border-white/30 bg-white/20 backdrop-blur-xl py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; Sistem Kas Kelas Digital &bull; Realtime Glassmorphism & PWA Push</span>
          <span>Penarikan Kas Rutin: Hari Rabu & Kamis</span>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        defaultRole={loginModalRole}
        students={data.students}
        adminPin={data.adminPin}
        onLoginStudent={handleLoginStudent}
        onLoginAdmin={handleLoginAdmin}
      />
    </div>
  );
}
