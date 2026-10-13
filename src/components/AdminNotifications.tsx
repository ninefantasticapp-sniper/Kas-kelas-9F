import React, { useState } from 'react';
import { Send, Bell, Smartphone, Users, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppData, Student } from '../types';
import { formatTimeIndo } from '../utils/format';
import { apiSendNotification } from '../api';
import { triggerSystemNotification } from '../utils/notifications';

interface AdminNotificationsProps {
  data: AppData;
  onDataUpdated: (newData: AppData) => void;
  prefilledStudentId?: string;
  prefilledMessage?: string;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({
  data,
  onDataUpdated,
  prefilledStudentId,
  prefilledMessage
}) => {
  const [targetStudentId, setTargetStudentId] = useState<string>(prefilledStudentId || 'all');
  const [title, setTitle] = useState('Kas Kelas');
  const [message, setMessage] = useState(prefilledMessage || '');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (prefilledStudentId) setTargetStudentId(prefilledStudentId);
    if (prefilledMessage) setMessage(prefilledMessage);
  }, [prefilledStudentId, prefilledMessage]);

  const handleTemplateClick = (type: 'rabu' | 'kamis' | 'tunggakan' | 'belanja') => {
    const targetStudent = data.students.find((s) => s.id === targetStudentId);
    const greeting = targetStudent ? `Halo ${targetStudent.name}` : `Halo teman-teman semua`;

    if (type === 'rabu') {
      setTitle('Pengingat Kas Hari Rabu');
      setMessage(`${greeting}, hari ini adalah jadwal penarikan uang kas kelas sesi Rabu sebesar Rp ${data.nominalPerSession.toLocaleString('id-ID')}. Mohon siapkan uang pas ya. Terima kasih!`);
    } else if (type === 'kamis') {
      setTitle('Pengingat Kas Hari Kamis');
      setMessage(`${greeting}, hari ini adalah jadwal penarikan kas sesi Kamis sebesar Rp ${data.nominalPerSession.toLocaleString('id-ID')}. Mohon segera membayarkan ke Bendahara ya.`);
    } else if (type === 'tunggakan') {
      setTitle('Peringatan Tunggakan Kas');
      setMessage(`${greeting}, kamu tercatat masih memiliki kekurangan pembayaran kas kelas. Mohon segera melunasi kepada Bendahara agar pembukuan kas kelas tetap lancar.`);
    } else if (type === 'belanja') {
      setTitle('Info Pengeluaran Kas Kelas');
      setMessage(`${greeting}, ada pengeluaran kas kelas baru untuk keperluan perlengkapan belajar bersama. Silakan cek transparansi riwayat belanja di aplikasi.`);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!message.trim()) {
      setFeedback({ type: 'error', text: 'Teks pesan notifikasi tidak boleh kosong.' });
      return;
    }

    setIsSending(true);
    try {
      const updated = await apiSendNotification({
        targetStudentId,
        title: title.trim() || 'Kas Kelas',
        message: message.trim()
      });

      // Also trigger browser/device system notification locally for instant demonstration
      const targetStudent = data.students.find((s) => s.id === targetStudentId);
      const studentName = targetStudent ? targetStudent.name : 'Seluruh Siswa';
      await triggerSystemNotification(`Kas Kelas - ${studentName}`, message.trim());

      onDataUpdated(updated);
      setFeedback({
        type: 'success',
        text: `Notifikasi berhasil dikirim secara realtime ke ${targetStudentId === 'all' ? 'Seluruh Siswa' : studentName}!`
      });
      setMessage('');
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal mengirim notifikasi'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Send Notification Form */}
      <div className="lg:col-span-1 glass-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/40">
          <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-800">
            <Smartphone className="w-4 h-4 text-teal-700" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
            Kirim Notifikasi Realtime
          </h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Pesan akan dikirim langsung ke bilah status HP siswa secara realtime via Web Notification & Service Worker.
        </p>

        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-start gap-2 backdrop-blur-md ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-400/40 text-emerald-950'
                : 'bg-rose-500/15 border border-rose-400/40 text-rose-950'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
        )}

        {/* Template Buttons */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 mb-1.5 block">
            Template Pesan Cepat:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleTemplateClick('rabu')}
              className="px-2.5 py-1 text-[11px] glass-pill hover:bg-white/60 rounded-xl text-slate-700 transition font-bold"
            >
              Kas Hari Rabu
            </button>
            <button
              type="button"
              onClick={() => handleTemplateClick('kamis')}
              className="px-2.5 py-1 text-[11px] glass-pill hover:bg-white/60 rounded-xl text-slate-700 transition font-bold"
            >
              Kas Hari Kamis
            </button>
            <button
              type="button"
              onClick={() => handleTemplateClick('tunggakan')}
              className="px-2.5 py-1 text-[11px] bg-rose-500/15 hover:bg-rose-500/25 text-rose-900 rounded-xl border border-rose-300/40 transition font-bold"
            >
              Tagihan Tunggakan
            </button>
            <button
              type="button"
              onClick={() => handleTemplateClick('belanja')}
              className="px-2.5 py-1 text-[11px] glass-pill hover:bg-white/60 rounded-xl text-slate-700 transition font-bold"
            >
              Info Belanja
            </button>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-3.5 text-xs">
          {/* Target Student Dropdown */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Target Penerima Notifikasi
            </label>
            <select
              value={targetStudentId}
              onChange={(e) => setTargetStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-slate-800 font-bold"
            >
              <option value="all">📢 Seluruh Siswa (Semua 31 Anggota)</option>
              <optgroup label="Siswa Tertentu (Pribadi)">
                {data.students.map((std) => (
                  <option key={std.id} value={std.id}>
                    #{std.absen} {std.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Judul Notifikasi
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kas Kelas"
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-slate-800 font-bold"
              required
            />
          </div>

          {/* Message Text */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Isi Pesan Notifikasi (Teks Bebas)
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ketik pesan penagihan kas, pengingat, atau info kelas..."
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-slate-800 leading-relaxed font-medium"
              required
            />
          </div>

          <div className="glass-pill p-3 rounded-2xl border border-white/60 text-[11px] text-slate-700">
            <span className="font-extrabold text-teal-950">Preview Bilah Status HP:</span>
            <div className="mt-1 font-bold text-teal-900">
              Judul: Kas Kelas - {targetStudentId === 'all' ? 'Seluruh Siswa' : data.students.find((s) => s.id === targetStudentId)?.name || 'Nama Siswa'}
            </div>
            <div className="text-slate-500 italic mt-0.5 line-clamp-2">
              "{message || 'Isi pesan akan tampil di bilah status HP siswa'}"
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full py-3 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-600 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-teal-900/20 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'Mengirim...' : 'Kirim Notifikasi Realtime'}</span>
          </button>
        </form>
      </div>

      {/* History of Sent Notifications */}
      <div className="lg:col-span-2 glass-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/40">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Riwayat Pengiriman Notifikasi
            </h3>
            <p className="text-xs text-slate-500">
              Total {data.notifications.length} notifikasi tercatat
            </p>
          </div>
        </div>

        {data.notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs glass-pill rounded-2xl">
            Belum ada notifikasi yang pernah dikirim.
          </div>
        ) : (
          <div className="divide-y divide-white/40 rounded-2xl overflow-hidden glass-pill shadow-xs">
            {data.notifications.map((notif) => {
              const isAll = notif.targetStudentId === 'all';

              return (
                <div key={notif.id} className="p-4 hover:bg-white/40 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {notif.title}
                        </span>
                        {isAll ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-900 border border-teal-400/30 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Semua Siswa
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-950 border border-amber-300/40 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {notif.targetStudentName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 mt-1.5 whitespace-pre-wrap leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 shrink-0">
                      {formatTimeIndo(notif.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
