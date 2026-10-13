import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Search, Check, X, Users, AlertCircle } from 'lucide-react';
import { AppData, Student } from '../types';
import { apiAddStudent, apiUpdateStudent, apiDeleteStudent } from '../api';

interface AdminMembersProps {
  data: AppData;
  onDataUpdated: (newData: AppData) => void;
}

export const AdminMembers: React.FC<AdminMembersProps> = ({ data, onDataUpdated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [absenInput, setAbsenInput] = useState('');
  const [error, setError] = useState('');

  const filteredStudents = data.students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.absen).includes(searchQuery)
  );

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setNameInput('');
    setAbsenInput(String(data.students.length + 1));
    setError('');
  };

  const handleStartEdit = (student: Student) => {
    setEditingId(student.id);
    setIsAdding(false);
    setNameInput(student.name);
    setAbsenInput(String(student.absen));
    setError('');
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAbsen = parseInt(absenInput, 10);
    if (!nameInput.trim() || isNaN(parsedAbsen) || parsedAbsen <= 0) {
      setError('Nama lengkap dan nomor absen harus valid.');
      return;
    }

    try {
      const updated = await apiAddStudent(nameInput.trim(), parsedAbsen);
      onDataUpdated(updated);
      setIsAdding(false);
      setNameInput('');
      setAbsenInput('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menambah siswa');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError('');

    const parsedAbsen = parseInt(absenInput, 10);
    if (!nameInput.trim() || isNaN(parsedAbsen) || parsedAbsen <= 0) {
      setError('Nama lengkap dan nomor absen harus valid.');
      return;
    }

    try {
      const updated = await apiUpdateStudent(editingId, nameInput.trim(), parsedAbsen);
      onDataUpdated(updated);
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui siswa');
    }
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Hapus ${student.name} (Absen #${student.absen}) dari anggota kas kelas?`)) return;
    try {
      const updated = await apiDeleteStudent(student.id);
      onDataUpdated(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/40">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            Manajemen Anggota Kelas ({data.students.length} Siswa)
          </h3>
          <p className="text-xs text-slate-500">
            Kelola data dan nomor absen 31 siswa awal atau tambah anggota baru
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black bg-teal-800 hover:bg-teal-700 text-white shadow-md shadow-teal-900/20 transition shrink-0 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Siswa Baru</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-400/30 text-rose-950 text-xs rounded-2xl flex items-center gap-2 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Student Inline Form */}
      {isAdding && (
        <form onSubmit={handleSaveAdd} className="p-4.5 glass-pill rounded-2xl space-y-3 border-teal-500/30 bg-teal-500/10 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-teal-950">Form Tambah Siswa Baru</h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="sm:col-span-1">
              <label className="block font-bold text-slate-700 mb-1">Nomor Absen</label>
              <input
                type="number"
                min="1"
                value={absenInput}
                onChange={(e) => setAbsenInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 font-bold"
                required
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="NAMA LENGKAP SISWA..."
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-800 uppercase font-medium"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-800 text-white font-extrabold text-xs rounded-xl hover:bg-teal-700 shadow-sm"
            >
              Simpan Siswa
            </button>
          </div>
        </form>
      )}

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari siswa berdasarkan nama atau absen..."
          className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl glass-input text-slate-800 placeholder-slate-400 font-medium"
        />
      </div>

      {/* Members Glass Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/50 glass-pill shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/40 text-slate-700 font-extrabold border-b border-white/40">
            <tr>
              <th className="py-3 px-3 text-center w-16">Absen</th>
              <th className="py-3 px-3">Nama Lengkap</th>
              <th className="py-3 px-3 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/30">
            {filteredStudents.map((std) => {
              const isEditingThis = editingId === std.id;

              if (isEditingThis) {
                return (
                  <tr key={std.id} className="bg-teal-500/15">
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={absenInput}
                        onChange={(e) => setAbsenInput(e.target.value)}
                        className="w-14 text-center py-1 px-1 rounded-lg glass-input text-xs font-bold text-slate-800"
                        required
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full py-1 px-2.5 rounded-lg glass-input text-xs uppercase font-bold text-slate-800"
                        required
                        autoFocus
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1.5 rounded-lg bg-teal-800 text-white hover:bg-teal-700 shadow-xs"
                          title="Simpan Perubahan"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg glass-pill text-slate-700 hover:bg-white/60"
                          title="Batal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={std.id} className="hover:bg-white/50 transition">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                    #{std.absen}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    {std.name}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleStartEdit(std)}
                        className="p-1.5 text-slate-500 hover:text-teal-800 hover:bg-teal-500/15 rounded-xl transition"
                        title="Edit Siswa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(std)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/15 rounded-xl transition"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
