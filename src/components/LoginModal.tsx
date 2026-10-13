import React, { useState } from 'react';
import { User, ShieldCheck, KeyRound, Search, CheckCircle2, AlertCircle, X, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Student } from '../types';
import { requestNotificationPermission } from '../utils/notifications';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole: 'student' | 'admin';
  students: Student[];
  adminPin: string;
  onLoginStudent: (student: Student) => void;
  onLoginAdmin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  defaultRole,
  students,
  adminPin,
  onLoginStudent,
  onLoginAdmin
}) => {
  const [tab, setTab] = useState<'student' | 'admin'>(defaultRole);

  // Student login fields
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchName, setSearchName] = useState('');
  const [inputAbsen, setInputAbsen] = useState('');
  const [studentError, setStudentError] = useState('');

  // Admin login fields
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [adminError, setAdminError] = useState('');

  React.useEffect(() => {
    setTab(defaultRole);
    setStudentError('');
    setAdminError('');
    setPinInput('');
    setShowPin(false);
  }, [defaultRole, isOpen]);

  if (!isOpen) return null;

  // Filter students based on typed search query
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchName.toLowerCase()) ||
      String(s.absen).includes(searchName)
  );

  const handleSelectStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    setSearchName(student.name);
    setInputAbsen(String(student.absen));
    setStudentError('');
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    let matchedStudent: Student | undefined;

    if (selectedStudentId) {
      matchedStudent = students.find((s) => s.id === selectedStudentId);
    } else {
      const cleanName = searchName.trim().toUpperCase();
      const numAbsen = parseInt(inputAbsen.trim(), 10);
      matchedStudent = students.find(
        (s) => s.name.toUpperCase() === cleanName && s.absen === numAbsen
      );
    }

    if (!matchedStudent) {
      setStudentError('Nama Lengkap atau Nomor Absen tidak cocok dengan data 31 siswa.');
      return;
    }

    // Verify Absen matches
    if (parseInt(inputAbsen, 10) !== matchedStudent.absen) {
      setStudentError(`Nomor Absen tidak cocok untuk ${matchedStudent.name}.`);
      return;
    }

    // Prompt Web Notification permission as instructed
    await requestNotificationPermission().catch(() => {});

    onLoginStudent(matchedStudent);
    onClose();
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (pinInput.trim() === adminPin.trim()) {
      onLoginAdmin();
      onClose();
    } else {
      setAdminError('Kata sandi / PIN Bendahara salah! Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl overflow-hidden glass-card shadow-2xl border border-white/70">
        {/* Header Tabs */}
        <div className="relative bg-gradient-to-r from-teal-900/85 to-teal-950/90 text-white p-5 pb-4 backdrop-blur-xl border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-teal-200/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">Masuk ke Sistem Kas Kelas</h2>
          </div>

          <div className="flex bg-black/25 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            <button
              onClick={() => {
                setTab('student');
                setStudentError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
                tab === 'student'
                  ? 'bg-white/95 text-teal-950 shadow-md backdrop-blur-md'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              Login Siswa
            </button>
            <button
              onClick={() => {
                setTab('admin');
                setAdminError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
                tab === 'admin'
                  ? 'bg-amber-400 text-teal-950 shadow-md'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Login Bendahara
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 bg-white/40 backdrop-blur-xl space-y-4">
          {tab === 'student' ? (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="glass-pill rounded-2xl p-3 text-xs text-teal-900 leading-relaxed font-medium">
                Pilih atau ketik nama lengkapmu dari daftar 31 siswa, lalu pastikan nomor absen cocok.
              </div>

              {studentError && (
                <div className="p-3 bg-rose-500/15 border border-rose-400/30 rounded-2xl text-rose-900 text-xs flex items-center gap-2 backdrop-blur-md">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{studentError}</span>
                </div>
              )}

              {/* Student Name Selector / Autocomplete */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap Siswa
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => {
                      setSearchName(e.target.value);
                      setSelectedStudentId('');
                    }}
                    placeholder="Ketik atau cari nama kamu..."
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-2xl glass-input text-slate-800 placeholder-slate-400 font-medium transition"
                    required
                  />
                </div>

                {/* Dropdown suggestions when typing */}
                {searchName && !selectedStudentId && filteredStudents.length > 0 && (
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-2xl glass-dropdown divide-y divide-slate-100/50 shadow-xl z-20 text-xs">
                    {filteredStudents.slice(0, 6).map((std) => (
                      <button
                        type="button"
                        key={std.id}
                        onClick={() => handleSelectStudent(std)}
                        className="w-full px-3.5 py-2 text-left hover:bg-teal-500/15 flex items-center justify-between transition"
                      >
                        <span className="font-semibold text-slate-800">{std.name}</span>
                        <span className="bg-teal-600/20 text-teal-900 border border-teal-500/30 font-bold px-1.5 py-0.5 rounded-lg text-[10px]">
                          Absen #{std.absen}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Absen Number Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor Absen
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={inputAbsen}
                  onChange={(e) => setInputAbsen(e.target.value)}
                  placeholder="Contoh: 21"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl glass-input text-slate-800 placeholder-slate-400 font-bold"
                  required
                />
              </div>

              {/* Quick sample student buttons */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Pilihan Cepat:</p>
                <div className="flex flex-wrap gap-1.5">
                  {students.slice(0, 3).map((std) => (
                    <button
                      type="button"
                      key={std.id}
                      onClick={() => handleSelectStudent(std)}
                      className="px-2.5 py-1 text-[11px] glass-pill rounded-xl hover:bg-teal-600 hover:text-white text-slate-700 transition font-medium"
                    >
                      #{std.absen} {std.name.split(' ')[0]}
                    </button>
                  ))}
                  {students.find((s) => s.absen === 21) && (
                    <button
                      type="button"
                      onClick={() => {
                        const caesar = students.find((s) => s.absen === 21);
                        if (caesar) handleSelectStudent(caesar);
                      }}
                      className="px-2.5 py-1 text-[11px] bg-amber-400/30 border border-amber-400/50 text-amber-950 font-bold rounded-xl hover:bg-amber-400/50 transition"
                    >
                      #21 M. CAESAR
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-600 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-teal-900/20 transition flex items-center justify-center gap-2 text-sm active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                Masuk Dashboard Siswa
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="glass-pill rounded-2xl p-3 text-xs text-amber-950 leading-relaxed font-medium border-amber-400/40 bg-amber-500/10">
                Akses khusus Bendahara Kelas. Masukkan kata sandi / PIN keamanan untuk membuka pembukuan dan checklist kas kelas.
              </div>

              {adminError && (
                <div className="p-3 bg-rose-500/15 border border-rose-400/30 rounded-2xl text-rose-900 text-xs flex items-center gap-2 backdrop-blur-md">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{adminError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi / PIN Bendahara
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Ketik kata sandi PIN..."
                    className="w-full pl-10 pr-10 py-2.5 text-sm tracking-wider rounded-2xl glass-input text-slate-800 font-bold"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                    title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-teal-950 font-black rounded-2xl shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 text-sm active:scale-98"
              >
                <ShieldCheck className="w-4 h-4 text-teal-950" />
                Buka Panel Bendahara
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
