import React, { useState } from 'react';
import { Plus, Trash2, Calendar, FileText, ShoppingBag, TrendingDown } from 'lucide-react';
import { AppData, Expense } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/format';
import { apiAddExpense, apiDeleteExpense } from '../api';

interface AdminExpensesProps {
  data: AppData;
  onDataUpdated: (newData: AppData) => void;
}

export const AdminExpenses: React.FC<AdminExpensesProps> = ({ data, onDataUpdated }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Expense['category']>('ATK');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalExpense = data.expenses.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseInt(amount.replace(/\D/g, ''), 10);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Harap isi judul belanja dan nominal yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await apiAddExpense({
        title: title.trim(),
        amount: parsedAmount,
        date,
        category,
        note: note.trim()
      });
      onDataUpdated(updated);
      setTitle('');
      setAmount('');
      setNote('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat pengeluaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus catatan pengeluaran ini?')) return;
    try {
      const updated = await apiDeleteExpense(id);
      onDataUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Form Input Belanja Kelas */}
      <div className="lg:col-span-1 glass-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/40">
          <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/20 text-teal-800">
            <ShoppingBag className="w-4 h-4 text-teal-700" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Catat Belanja Kelas</h3>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-400/30 text-rose-900 text-xs rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Nama Keperluan / Barang
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Sapu ijuk & trash bag"
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-slate-800 font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Nominal Belanja (Rp)
            </label>
            <input
              type="number"
              step="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: 35000"
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-slate-800 font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense['category'])}
                className="w-full px-3 py-2 rounded-2xl glass-input text-slate-700 font-semibold"
              >
                <option value="ATK">ATK & Spidol</option>
                <option value="Kebersihan">Kebersihan</option>
                <option value="Sosial">Sosial / Jenguk</option>
                <option value="Perlengkapan">Perlengkapan</option>
                <option value="Acara">Acara Kelas</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl glass-input text-slate-700 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Keterangan / Tempat Beli (Opsional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Beli di koperasi untuk piket harian..."
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/25 transition flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Simpan Pengeluaran</span>
          </button>
        </form>
      </div>

      {/* Daftar Pengeluaran */}
      <div className="lg:col-span-2 glass-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/40">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Riwayat Belanja Kelas</h3>
            <p className="text-xs text-slate-500">Total {data.expenses.length} transaksi pengeluaran</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 font-semibold">Total Pengeluaran:</span>
            <div className="text-base sm:text-xl font-black text-rose-700">
              {formatRupiah(totalExpense)}
            </div>
          </div>
        </div>

        {data.expenses.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs glass-pill rounded-2xl">
            Belum ada catatan belanja kas kelas.
          </div>
        ) : (
          <div className="divide-y divide-white/40 rounded-2xl overflow-hidden glass-pill shadow-xs">
            {data.expenses.map((item) => (
              <div key={item.id} className="p-4 hover:bg-white/40 transition flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{item.title}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/50 text-slate-700 border border-white/40">
                      {item.category}
                    </span>
                  </div>
                  {item.note && (
                    <p className="text-xs text-slate-600 mt-1">{item.note}</p>
                  )}
                  <span className="text-[11px] text-slate-400 mt-1 inline-block">
                    {formatDateIndo(item.date)}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm font-black text-rose-600">
                    -{formatRupiah(item.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition"
                    title="Hapus catatan ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
