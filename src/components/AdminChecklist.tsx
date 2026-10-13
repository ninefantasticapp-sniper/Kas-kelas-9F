import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Search, 
  Plus, 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  Clock, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { AppData, Student } from '../types';
import { formatRupiah } from '../utils/format';
import { apiTogglePayment, apiBulkTogglePayment, apiAddWeek, apiDeleteWeek, apiToggleSessionDue } from '../api';

interface AdminChecklistProps {
  data: AppData;
  onDataUpdated: (newData: AppData) => void;
  onNavigateToScan?: () => void;
}

export const AdminChecklist: React.FC<AdminChecklistProps> = ({ 
  data, 
  onDataUpdated,
  onNavigateToScan 
}) => {
  const [selectedWeekId, setSelectedWeekId] = useState<string>(data.weeks[0]?.id || 'w1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingWeek, setIsAddingWeek] = useState(false);
  const [newWeekLabel, setNewWeekLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeWeek = data.weeks.find((w) => w.id === selectedWeekId) || data.weeks[0];

  const filteredStudents = data.students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.absen).includes(searchQuery)
  );

  // Stats for current week
  let rabuPaidCount = 0;
  let kamisPaidCount = 0;
  data.students.forEach((s) => {
    const wp = data.payments[s.id]?.[selectedWeekId];
    if (wp?.rabu) rabuPaidCount++;
    if (wp?.kamis) kamisPaidCount++;
  });
  const totalStudents = data.students.length;
  const collectedWeek = (rabuPaidCount + kamisPaidCount) * data.nominalPerSession;

  const handleToggle = async (studentId: string, session: 'rabu' | 'kamis', currentVal: boolean) => {
    try {
      const updated = await apiTogglePayment(studentId, selectedWeekId, session, !currentVal);
      onDataUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkToggle = async (session?: 'rabu' | 'kamis', studentId?: string, paid: boolean = true) => {
    setIsSaving(true);
    try {
      const updated = await apiBulkTogglePayment({
        weekId: selectedWeekId,
        session,
        studentId,
        paid
      });
      onDataUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWeekSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeekLabel.trim()) return;
    try {
      const updated = await apiAddWeek(newWeekLabel.trim());
      onDataUpdated(updated);
      const newlyAdded = updated.weeks[updated.weeks.length - 1];
      if (newlyAdded) setSelectedWeekId(newlyAdded.id);
      setIsAddingWeek(false);
      setNewWeekLabel('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWeek = async (weekId: string) => {
    if (!confirm('Yakin ingin menghapus minggu kas ini?')) return;
    try {
      const updated = await apiDeleteWeek(weekId);
      onDataUpdated(updated);
      if (selectedWeekId === weekId) {
        setSelectedWeekId(updated.weeks[0]?.id || '');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  const handleToggleDue = async (session: 'rabu' | 'kamis', isDue: boolean) => {
    try {
      const updated = await apiToggleSessionDue(selectedWeekId, session, isDue);
      onDataUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (data.weeks.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-teal-500/15 border border-teal-500/30 text-teal-800 flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-8 h-8 text-teal-700" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900">Buku Kas Bersih & Fresh (0 Minggu Aktif)</h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
            Belum ada penarikan kas yang dimulai. Seluruh saldo kas dan tunggakan siswa bernilai <strong>Rp 0</strong>.
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={async () => {
              const updated = await apiAddWeek('Minggu 1');
              onDataUpdated(updated);
              if (updated.weeks[0]) setSelectedWeekId(updated.weeks[0].id);
            }}
            className="px-6 py-3.5 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-600 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-xl shadow-teal-900/25 transition active:scale-95 inline-flex items-center gap-2 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Mulai Penarikan Kas (Buka Minggu 1)</span>
          </button>

          {onNavigateToScan && (
            <button
              onClick={onNavigateToScan}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-600 to-teal-800 hover:from-amber-500 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-xl shadow-amber-950/20 transition active:scale-95 inline-flex items-center gap-2 text-sm"
            >
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>Scan Catatan Buku Kas (AI)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Week Selector Bar & Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/40">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {data.weeks.map((week) => (
              <button
                key={week.id}
                onClick={() => setSelectedWeekId(week.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition backdrop-blur-md ${
                  selectedWeekId === week.id
                    ? 'bg-teal-800 text-white shadow-md shadow-teal-900/20 border border-teal-700/60'
                    : 'glass-pill hover:bg-white/60 text-slate-700'
                }`}
              >
                {week.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddingWeek(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-teal-500/15 text-teal-900 hover:bg-teal-500/25 border border-teal-500/30 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-teal-700" />
            Tambah Minggu
          </button>

          {onNavigateToScan && (
            <button
              onClick={onNavigateToScan}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black bg-amber-400/20 text-amber-950 hover:bg-amber-400/35 border border-amber-400/50 transition shadow-xs"
              title="Foto lembaran buku kas bendahara untuk diisi otomatis oleh AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Scan Buku Kas (AI)</span>
            </button>
          )}
        </div>

        {/* Current Week Summary */}
        <div className="flex items-center gap-3 text-xs glass-pill px-4 py-2 rounded-2xl border border-white/60">
          <div>
            <span className="text-slate-500">Kas Terkumpul Minggu Ini:</span>{' '}
            <strong className="text-teal-950 font-black">{formatRupiah(collectedWeek)}</strong>
          </div>
          <div className="hidden sm:block text-slate-300">|</div>
          <div className="hidden sm:flex items-center gap-2">
            <span>Rabu: <b className="text-teal-700">{rabuPaidCount}/{totalStudents}</b></span>
            <span>Kamis: <b className="text-teal-700">{kamisPaidCount}/{totalStudents}</b></span>
          </div>
        </div>
      </div>

      {/* Add Week Modal / Form */}
      {isAddingWeek && (
        <form onSubmit={handleAddWeekSubmit} className="p-3.5 glass-pill rounded-2xl flex flex-wrap items-center gap-2 border-teal-500/30 bg-teal-500/10">
          <input
            type="text"
            value={newWeekLabel}
            onChange={(e) => setNewWeekLabel(e.target.value)}
            placeholder={`Contoh: Minggu ${data.weeks.length + 1}`}
            className="flex-1 min-w-[200px] text-xs px-3.5 py-2 rounded-xl glass-input text-slate-800"
            autoFocus
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-teal-800 text-white text-xs font-extrabold rounded-xl hover:bg-teal-700 shadow-sm"
          >
            Simpan Minggu Baru
          </button>
          <button
            type="button"
            onClick={() => setIsAddingWeek(false)}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Batal
          </button>
        </form>
      )}

      {/* Search & Bulk Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa atau absen..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl glass-input text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-bold mr-1">Aksi Cepat:</span>
          <button
            onClick={() => handleBulkToggle('rabu', undefined, true)}
            disabled={isSaving}
            className="px-3 py-1.5 text-[11px] font-extrabold rounded-xl bg-emerald-500/15 text-emerald-900 hover:bg-emerald-500/25 border border-emerald-400/40 transition shadow-xs"
          >
            Centang Semua Rabu
          </button>
          <button
            onClick={() => handleBulkToggle('kamis', undefined, true)}
            disabled={isSaving}
            className="px-3 py-1.5 text-[11px] font-extrabold rounded-xl bg-emerald-500/15 text-emerald-900 hover:bg-emerald-500/25 border border-emerald-400/40 transition shadow-xs"
          >
            Centang Semua Kamis
          </button>
          {data.weeks.length > 1 && (
            <button
              onClick={() => handleDeleteWeek(selectedWeekId)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-500/10 transition"
              title="Hapus minggu ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Checklist Glass Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/50 glass-pill shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/40 text-slate-700 font-extrabold border-b border-white/40">
            <tr>
              <th className="py-3 px-3 text-center w-14">Absen</th>
              <th className="py-3 px-3">Nama Lengkap Siswa</th>
              <th className="py-3 px-3 text-center w-44">
                <div className="font-black text-teal-950">Sesi Rabu</div>
                <div className="text-[10px] font-normal text-slate-500">Rp {data.nominalPerSession.toLocaleString('id-ID')}</div>
                <button
                  type="button"
                  onClick={() => handleToggleDue('rabu', !activeWeek?.rabuDue)}
                  className={`mt-1 px-2 py-0.5 rounded-lg text-[9px] font-bold border transition ${
                    activeWeek?.rabuDue
                      ? 'bg-rose-500/20 text-rose-900 border-rose-400/40 hover:bg-rose-500/30'
                      : 'bg-teal-500/15 text-teal-800 border-teal-400/30 hover:bg-teal-500/25'
                  }`}
                  title={activeWeek?.rabuDue ? 'Klik untuk batalkan status tunggakan' : 'Klik jika sesi ini sudah lewat batas dan ingin dicatat sebagai tunggakan'}
                >
                  {activeWeek?.rabuDue ? '⚠️ Ditandai Jatuh Tempo' : 'Berjalan (Bukan Tunggakan)'}
                </button>
              </th>
              <th className="py-3 px-3 text-center w-44">
                <div className="font-black text-teal-950">Sesi Kamis</div>
                <div className="text-[10px] font-normal text-slate-500">Rp {data.nominalPerSession.toLocaleString('id-ID')}</div>
                <button
                  type="button"
                  onClick={() => handleToggleDue('kamis', !activeWeek?.kamisDue)}
                  className={`mt-1 px-2 py-0.5 rounded-lg text-[9px] font-bold border transition ${
                    activeWeek?.kamisDue
                      ? 'bg-rose-500/20 text-rose-900 border-rose-400/40 hover:bg-rose-500/30'
                      : 'bg-teal-500/15 text-teal-800 border-teal-400/30 hover:bg-teal-500/25'
                  }`}
                  title={activeWeek?.kamisDue ? 'Klik untuk batalkan status tunggakan' : 'Klik jika sesi ini sudah lewat batas dan ingin dicatat sebagai tunggakan'}
                >
                  {activeWeek?.kamisDue ? '⚠️ Ditandai Jatuh Tempo' : 'Berjalan (Bukan Tunggakan)'}
                </button>
              </th>
              <th className="py-3 px-3 text-center w-28">Status Minggu</th>
              <th className="py-3 px-3 text-center w-28">Aksi Cepat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/30">
            {filteredStudents.map((student) => {
              const weekPayment = data.payments[student.id]?.[selectedWeekId] || {
                rabu: false,
                kamis: false
              };
              const isWeekLunas = weekPayment.rabu && weekPayment.kamis;

              return (
                <tr
                  key={student.id}
                  className={`hover:bg-white/50 transition ${
                    isWeekLunas ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                    #{student.absen}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-800">{student.name}</span>
                  </td>

                  {/* Checklist Sesi Rabu */}
                  <td className="py-2.5 px-3 text-center">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={weekPayment.rabu}
                        onChange={() => handleToggle(student.id, 'rabu', weekPayment.rabu)}
                        className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer shadow-xs"
                      />
                      <span
                        className={`text-[11px] font-extrabold ${
                          weekPayment.rabu ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {weekPayment.rabu ? 'Lunas' : 'Belum'}
                      </span>
                    </label>
                  </td>

                  {/* Checklist Sesi Kamis */}
                  <td className="py-2.5 px-3 text-center">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={weekPayment.kamis}
                        onChange={() => handleToggle(student.id, 'kamis', weekPayment.kamis)}
                        className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer shadow-xs"
                      />
                      <span
                        className={`text-[11px] font-extrabold ${
                          weekPayment.kamis ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {weekPayment.kamis ? 'Lunas' : 'Belum'}
                      </span>
                    </label>
                  </td>

                  {/* Status Minggu Ini */}
                  <td className="py-2.5 px-3 text-center">
                    {isWeekLunas ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-900 border border-emerald-400/30">
                        Lunas
                      </span>
                    ) : weekPayment.rabu || weekPayment.kamis ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-950 border border-amber-400/30">
                        1/2 Lunas
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-900 border border-rose-400/30">
                        Belum
                      </span>
                    )}
                  </td>

                  {/* Aksi Cepat: Lunas 1 Minggu */}
                  <td className="py-2.5 px-3 text-center">
                    {isWeekLunas ? (
                      <button
                        onClick={() => handleBulkToggle(undefined, student.id, false)}
                        className="text-[10px] font-bold text-slate-400 hover:text-rose-600 underline"
                      >
                        Batalkan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBulkToggle(undefined, student.id, true)}
                        className="px-2.5 py-1 text-[10px] font-extrabold rounded-xl bg-teal-800 text-white hover:bg-teal-700 shadow-xs transition"
                      >
                        Set Lunas
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <span>Menampilkan {filteredStudents.length} dari {data.students.length} siswa</span>
        <span>Perubahan checklist otomatis tersimpan dan terkirim secara realtime</span>
      </div>
    </div>
  );
};
