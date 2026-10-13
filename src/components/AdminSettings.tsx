import React, { useState } from 'react';
import { Settings, Save, KeyRound, RotateCcw, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { AppData } from '../types';
import { formatRupiah } from '../utils/format';
import { apiUpdateSettings, apiResetData, apiRestartFinances } from '../api';

interface AdminSettingsProps {
  data: AppData;
  onDataUpdated: (newData: AppData) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ data, onDataUpdated }) => {
  const [nominalInput, setNominalInput] = useState(String(data.nominalPerSession));
  const [pinInput, setPinInput] = useState(data.adminPin);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const parsedNominal = parseInt(nominalInput, 10);
    if (isNaN(parsedNominal) || parsedNominal < 500) {
      setMessage({ type: 'error', text: 'Nominal kas per sesi minimal Rp 500.' });
      return;
    }

    if (!pinInput.trim() || pinInput.trim().length < 4) {
      setMessage({ type: 'error', text: 'PIN Bendahara minimal 4 karakter.' });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await apiUpdateSettings(parsedNominal, pinInput.trim());
      onDataUpdated(updated);
      setMessage({ type: 'success', text: 'Pengaturan kas dan PIN berhasil disimpan!' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal menyimpan pengaturan' });
    } finally {
      setIsSaving(false);
    }
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

    setIsRestarting(true);
    setMessage(null);
    try {
      const updated = await apiRestartFinances();
      onDataUpdated(updated);
      setMessage({
        type: 'success',
        text: 'Semua angka kas, saldo, pemasukan, pengeluaran, dan tunggakan berhasil di-restart ke Rp 0 tanpa terkecuali!'
      });
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal me-restart keuangan'
      });
    } finally {
      setIsRestarting(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin mengembalikan semua data ke awal? Ini akan membersihkan checklist.')) {
      return;
    }

    try {
      const updated = await apiResetData();
      onDataUpdated(updated);
      setNominalInput(String(updated.nominalPerSession));
      setPinInput(updated.adminPin);
      setMessage({ type: 'success', text: 'Data berhasil direset ke kondisi awal 31 siswa bersih.' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-card rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-white/40">
        <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-800">
          <Settings className="w-5 h-5 text-teal-700" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Pengaturan Sistem Kas Kelas</h3>
          <p className="text-xs text-slate-500">Konfigurasi nominal penarikan kas dan kata sandi Bendahara</p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 backdrop-blur-md ${
            message.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-400/40 text-emerald-950'
              : 'bg-rose-500/15 border border-rose-400/40 text-rose-950'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Nominal Kas per Session */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5">
            Nominal Kas per Sesi Bayar (Rabu & Kamis)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 font-extrabold text-slate-400">Rp</span>
            <input
              type="number"
              step="500"
              min="500"
              value={nominalInput}
              onChange={(e) => setNominalInput(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-sm font-extrabold rounded-2xl glass-input text-slate-800"
              required
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Default: <strong>Rp 2.000</strong> per sesi bayar. Dengan 2x penarikan (Rabu & Kamis), total per siswa per minggu adalah {formatRupiah(parseInt(nominalInput || '0', 10) * 2)}.
          </p>
        </div>

        {/* PIN Bendahara */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5">
            Kata Sandi / PIN Keamanan Bendahara
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Ketik kata sandi PIN bendahara..."
              className="w-full pl-10 pr-3 py-2.5 text-sm tracking-wider font-extrabold rounded-2xl glass-input text-slate-800"
              required
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Gunakan kombinasi kata sandi rahasia untuk mengunci akses panel bendahara kelas.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-600 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-teal-900/20 transition flex items-center justify-center gap-2 text-sm active:scale-98"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </button>
      </form>

      {/* Fitur Restart Semua Angka Keuangan */}
      <div className="pt-5 border-t border-white/40 space-y-3">
        <div className="p-4 rounded-2xl glass-pill border-rose-300/40 bg-rose-500/10 space-y-2">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 text-rose-600 ${isRestarting ? 'animate-spin' : ''}`} />
            <h4 className="font-extrabold text-xs text-rose-950 uppercase tracking-wide">
              Fitur Restart Semua Keuangan Kas ke Rp 0
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Me-restart seluruh angka uang tanpa terkecuali (Saldo Aktif, Pemasukan, Pengeluaran, Checklist Minggu, dan Tunggakan menjadi <strong>Rp 0</strong> bersih seperti awal). Seluruh data 31 siswa anggota kelas tetap aman.
          </p>
          <button
            type="button"
            disabled={isRestarting}
            onClick={handleRestartAllFinances}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-md shadow-rose-600/25 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRestarting ? 'animate-spin' : ''}`} />
            <span>{isRestarting ? 'Me-restart Angka...' : 'Restart Semua Angka Keuangan ke Rp 0'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
