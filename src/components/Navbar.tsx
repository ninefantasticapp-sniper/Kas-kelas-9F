import React from 'react';
import { Coins, LogOut, User, ShieldCheck, Bell, BellRing, Wifi, WifiOff } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { Student } from '../types';
import { getNotificationPermission, requestNotificationPermission } from '../utils/notifications';

interface NavbarProps {
  currentRole: 'guest' | 'student' | 'admin';
  currentStudent: Student | null;
  onLogout: () => void;
  onOpenLogin: (role: 'student' | 'admin') => void;
  isRealtimeConnected: boolean;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentStudent,
  onLogout,
  onOpenLogin,
  isRealtimeConnected,
  unreadCount = 0
}) => {
  const [notifState, setNotifState] = React.useState<NotificationPermission>('default');

  React.useEffect(() => {
    setNotifState(getNotificationPermission());
  }, []);

  const handleRequestNotif = async () => {
    const perm = await requestNotificationPermission();
    setNotifState(perm);
  };

  return (
    <header className="sticky top-0 z-40 bg-teal-950/75 backdrop-blur-xl text-white shadow-lg border-b border-white/10">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-teal-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 border border-white/30">
            <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-teal-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-white drop-shadow-xs">
                Kas Kelas Digital
              </h1>
              {isRealtimeConnected ? (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md shadow-xs">
                  <Wifi className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  <span className="hidden xs:inline">Live</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                  <WifiOff className="w-2.5 h-2.5 text-amber-300" />
                  <span className="hidden xs:inline">Lokal</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-teal-200/90 hidden sm:block">Sistem Kas Penarikan Rabu & Kamis</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Notification Permission Toggle */}
          <button
            onClick={handleRequestNotif}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition backdrop-blur-md border ${
              notifState === 'granted'
                ? 'bg-teal-800/40 text-emerald-300 border-emerald-500/30 hover:bg-teal-800/60'
                : 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
            }`}
            title={notifState === 'granted' ? 'Notifikasi Bilah Status Aktif' : 'Aktifkan Notifikasi Bilah Status HP'}
          >
            {notifState === 'granted' ? (
              <>
                <BellRing className="w-4 h-4 text-emerald-300" />
                <span className="hidden md:inline">Notif Aktif</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
                <span className="hidden md:inline">Aktifkan Notif</span>
              </>
            )}
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* PWA Install */}
          <PWAInstallButton variant="header" />

          {/* Role Status or Login */}
          {currentRole === 'student' && currentStudent ? (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md pl-2.5 pr-1 py-1 rounded-xl border border-white/20 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-teal-100 max-w-[130px] sm:max-w-[200px] truncate">
                <User className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                <span className="truncate font-semibold">{currentStudent.name}</span>
                <span className="text-[10px] bg-teal-800/80 text-teal-200 px-1.5 py-0.2 rounded-md font-black border border-white/10">
                  #{currentStudent.absen}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-rose-600/80 text-rose-200 hover:text-white transition"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : currentRole === 'admin' ? (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md pl-2.5 pr-1 py-1 rounded-xl border border-white/20 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Bendahara</span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-rose-600/80 text-rose-200 hover:text-white transition"
                title="Keluar dari Panel Bendahara"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenLogin('student')}
                className="px-3 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-xl text-white backdrop-blur-md border border-white/20 shadow-xs transition"
              >
                Login Siswa
              </button>
              <button
                onClick={() => onOpenLogin('admin')}
                className="px-3 py-1.5 text-xs font-bold bg-amber-400/90 hover:bg-amber-300 text-teal-950 rounded-xl shadow-md border border-amber-300/60 backdrop-blur-md transition active:scale-95"
              >
                Bendahara
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
