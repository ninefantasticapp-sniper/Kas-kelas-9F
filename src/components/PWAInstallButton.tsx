import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="flex items-center justify-between gap-3 p-3.5 glass-card rounded-2xl text-teal-950 text-xs sm:text-sm border border-white/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-800 shrink-0">
              <Smartphone className="w-4 h-4 text-teal-700" />
            </div>
            <span className="font-medium">Pasang aplikasi di layar utama HP untuk notifikasi bilah status lebih optimal.</span>
          </div>
          <button
            onClick={install}
            className="flex items-center gap-1.5 shrink-0 bg-teal-800 hover:bg-teal-700 text-white font-extrabold px-3.5 py-2 rounded-xl shadow-md shadow-teal-900/20 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Install PWA
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-xl bg-teal-600/90 hover:bg-teal-500 border border-teal-400/30 px-3 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-md transition active:scale-95"
        title="Pasang aplikasi di HP"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-bold text-teal-100 hover:bg-white/25 backdrop-blur-md shadow-xs"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl glass-card p-6 shadow-2xl text-slate-800 border border-white/70">
              <div className="flex items-center justify-between pb-3 border-b border-white/40">
                <h3 className="text-base font-extrabold text-teal-950 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-teal-700" />
                  Pasang di iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-3.5 text-xs sm:text-sm text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Buka situs ini di browser Safari.</li>
                <li>Tekan tombol <strong>Bagikan (Share)</strong> di bilah bawah.</li>
                <li>Pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</li>
                <li>Aplikasi akan muncul seperti aplikasi HP asli dengan ikon Kas Kelas.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-teal-800 py-3 text-xs sm:text-sm font-extrabold text-white hover:bg-teal-700 shadow-lg shadow-teal-900/20 active:scale-98"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
