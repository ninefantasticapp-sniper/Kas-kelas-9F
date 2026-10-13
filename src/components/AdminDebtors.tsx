import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Send, 
  Copy, 
  Check, 
  Download, 
  Search, 
  CheckCircle2, 
  Share2, 
  Calendar 
} from 'lucide-react';
import { AppData, Student } from '../types';
import { formatRupiah, calculateSummary } from '../utils/format';

interface AdminDebtorsProps {
  data: AppData;
  onPrepareNotification: (targetStudentId: string, prefilledMessage: string) => void;
}

export const AdminDebtors: React.FC<AdminDebtorsProps> = ({ data, onPrepareNotification }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const summary = calculateSummary(data);

  const filteredDebtors = summary.debtors.filter(
    (d) =>
      d.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(d.student.absen).includes(searchQuery)
  );

  const totalOutstanding = summary.debtors.reduce((sum, d) => sum + d.totalDebt, 0);

  // Copy WhatsApp format recap to clipboard
  const handleCopyWhatsApp = () => {
    let text = `📢 *REKAP TUNGGAKAN KAS KELAS*\n`;
    text += `Total Penunggak: ${summary.debtors.length} Siswa\n`;
    text += `Total Belum Terbayar: ${formatRupiah(totalOutstanding)}\n`;
    text += `Nominal per Sesi: ${formatRupiah(data.nominalPerSession)} (Rabu & Kamis)\n\n`;

    summary.debtors.forEach((d, idx) => {
      const sessionsText = d.unpaidSessions.map((s) => s.sessionLabel).join(', ');
      text += `${idx + 1}. *#${d.student.absen} ${d.student.name}*\n`;
      text += `   - Total: *${formatRupiah(d.totalDebt)}*\n`;
      text += `   - Belum Bayar: ${sessionsText}\n\n`;
    });

    text += `Mohon segera melunasi ke Bendahara saat hari penarikan Rabu / Kamis. Terima kasih!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportCSV = () => {
    let csv = 'No Absen,Nama Siswa,Sesi Belum Bayar,Total Tunggakan (Rp)\n';
    summary.debtors.forEach((d) => {
      const sessionsText = d.unpaidSessions.map((s) => s.sessionLabel).join('; ');
      csv += `"${d.student.absen}","${d.student.name}","${sessionsText}","${d.totalDebt}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap_penunggak_kas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-pill p-4 rounded-2xl border-rose-300/40 bg-rose-500/10">
          <span className="text-[11px] font-black text-rose-800 uppercase tracking-wide">
            Total Tunggakan Kas
          </span>
          <div className="text-xl sm:text-2xl font-black text-rose-700 mt-0.5">
            {formatRupiah(totalOutstanding)}
          </div>
          <span className="text-[11px] text-rose-600 font-semibold">Dari {summary.debtors.length} siswa</span>
        </div>

        <div className="glass-pill p-4 rounded-2xl border-emerald-300/40 bg-emerald-500/10">
          <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wide">
            Siswa Sudah Lunas
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
            {summary.lunasCount} Siswa
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {((summary.lunasCount / data.students.length) * 100).toFixed(0)}% dari total kelas
          </span>
        </div>

        <div className="glass-pill p-4 rounded-2xl border-teal-300/40 bg-teal-500/10">
          <span className="text-[11px] font-black text-teal-800 uppercase tracking-wide">
            Sistem Penarikan
          </span>
          <div className="text-base sm:text-lg font-black text-teal-950 mt-0.5">
            Rabu & Kamis
          </div>
          <span className="text-[11px] text-teal-700 font-semibold">
            {formatRupiah(data.nominalPerSession)} per sesi bayar
          </span>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari penunggak..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl glass-input text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Format WhatsApp'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold glass-pill hover:bg-white/60 text-slate-800 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Debtors List Glass Table */}
      {filteredDebtors.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs glass-pill rounded-2xl">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
          <p className="font-extrabold text-slate-800 text-sm">Tidak Ada Penunggak Kas (Tunggakan: Rp 0)</p>
          <p className="text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Semua 31 siswa bersih dari tunggakan. Sesi kas yang baru dibuka berstatus sedang berjalan dan belum ditandai jatuh tempo/tunggakan manual oleh bendahara.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/50 glass-pill shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/40 text-slate-700 font-extrabold border-b border-white/40">
              <tr>
                <th className="py-3 px-3 text-center w-14">Absen</th>
                <th className="py-3 px-3">Nama Siswa</th>
                <th className="py-3 px-3">Detail Sesi yang Belum Dibayar</th>
                <th className="py-3 px-3 text-right">Total Kekurangan</th>
                <th className="py-3 px-3 text-center w-36">Aksi Penagihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30">
              {filteredDebtors.map((item) => {
                const unpaidText = item.unpaidSessions
                  .map((s) => s.sessionLabel)
                  .join(', ');

                return (
                  <tr key={item.student.id} className="hover:bg-white/50 transition">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                      #{item.student.absen}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-800">{item.student.name}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {item.unpaidSessions.map((session, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-block px-2.5 py-0.5 rounded-lg bg-rose-500/15 text-rose-950 font-bold text-[10px] border border-rose-300/40"
                          >
                            {session.sessionLabel}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-black text-rose-700 text-xs sm:text-sm">
                        {formatRupiah(item.totalDebt)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          const message = `Halo ${item.student.name} (Absen #${item.student.absen}), kamu memiliki tunggakan kas kelas sebesar ${formatRupiah(item.totalDebt)} untuk sesi: ${unpaidText}. Mohon segera melunasi pada jadwal penarikan kas hari Rabu/Kamis ya. Terima kasih!`;
                          onPrepareNotification(item.student.id, message);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-black text-[11px] shadow-sm transition active:scale-95"
                        title="Kirim pesan notifikasi penagihan ke HP siswa ini"
                      >
                        <Send className="w-3 h-3" />
                        <span>Tagih via Notif</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
