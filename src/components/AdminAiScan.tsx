import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Search, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Image as ImageIcon,
  ArrowRight,
  Eye,
  RefreshCw,
  HelpCircle,
  Zap,
  Info
} from 'lucide-react';
import { AppData, MatchedScanStudent, ScanNotebookResult } from '../types';
import { apiScanNotebook, apiApplyScanResults } from '../api';
import { formatRupiah } from '../utils/format';

interface AdminAiScanProps {
  data: AppData;
  onDataUpdated: (newData: AppData) => void;
  onNavigateToChecklist?: (weekId: string) => void;
}

export const AdminAiScan: React.FC<AdminAiScanProps> = ({
  data,
  onDataUpdated,
  onNavigateToChecklist
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanNotebookResult | null>(null);
  const [editableResults, setEditableResults] = useState<MatchedScanStudent[]>([]);
  const [weekTargetMode, setWeekTargetMode] = useState<'new' | 'existing'>('new');
  const [targetWeekId, setTargetWeekId] = useState<string>(data.weeks[0]?.id || 'new');
  const [customWeekLabel, setCustomWeekLabel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessInfo, setApplySuccessInfo] = useState<{ weekLabel: string; weekId: string; updatedCount: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Compress image to ensure speedy uploads and optimal OCR
  const processImageFile = (file: File) => {
    setErrorMsg(null);
    setApplySuccessInfo(null);
    setImageMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setSelectedImage(compressedDataUrl);
        } else {
          setSelectedImage(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Generate realistic demo notebook ledger image for instant testing
  const handleLoadDemoImage = () => {
    setErrorMsg(null);
    setApplySuccessInfo(null);
    setScanResult(null);

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background paper color (lined notebook paper texture)
    ctx.fillStyle = '#fbf7ee';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Notebook red margin line on left
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(110, 0);
    ctx.lineTo(110, canvas.height);
    ctx.stroke();

    // Blue horizontal ruled notebook lines
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1.2;
    const startY = 180;
    const lineSpacing = 42;
    for (let y = startY; y < canvas.height - 40; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Title & Header handwritten text style
    ctx.font = 'bold 34px cursive, sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText('CATATAN KAS KELAS - MINGGU 1 (SEBELUM RILIS)', 140, 95);

    ctx.font = '22px cursive, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Penarikan Kas: Rabu & Kamis @ Rp 2.000 / siswa', 140, 140);

    // Table Column Headers
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('NO', 40, startY - 12);
    ctx.fillText('NAMA SISWA', 140, startY - 12);
    ctx.fillText('RABU (Rp 2k)', 780, startY - 12);
    ctx.fillText('KAMIS (Rp 2k)', 970, startY - 12);

    // Draw student rows with realistic handwriting checkmarks
    const sampleStudents = data.students.slice(0, 31);
    sampleStudents.forEach((student, idx) => {
      const rowY = startY + (idx + 1) * lineSpacing - 12;
      if (rowY > canvas.height - 30) return;

      // Absen number
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#334155';
      ctx.fillText(String(student.absen).padStart(2, '0'), 50, rowY);

      // Student name (slightly shortened or handwritten look)
      ctx.font = 'bold 17px cursive, sans-serif';
      ctx.fillStyle = '#1e293b';
      const displayName = student.name.length > 25 ? student.name.substring(0, 24) + '...' : student.name;
      ctx.fillText(displayName, 140, rowY);

      // Rabu session mark (mostly checked ✓, some missed)
      const isRabuPaid = (idx % 7 !== 3 && idx % 11 !== 4);
      if (isRabuPaid) {
        ctx.font = 'bold 24px cursive, sans-serif';
        ctx.fillStyle = '#047857';
        ctx.fillText('✓ Lunas', 820, rowY);
      } else {
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('-', 845, rowY);
      }

      // Kamis session mark
      const isKamisPaid = (idx % 5 !== 2 && idx % 8 !== 6);
      if (isKamisPaid) {
        ctx.font = 'bold 24px cursive, sans-serif';
        ctx.fillStyle = '#047857';
        ctx.fillText('✓ Lunas', 1010, rowY);
      } else {
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('-', 1035, rowY);
      }
    });

    const demoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSelectedImage(demoDataUrl);
    setImageMimeType('image/jpeg');
  };

  // Run AI Analysis via server
  const handleStartScan = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setErrorMsg(null);
    setApplySuccessInfo(null);
    setAnalysisStep('Mengirim foto ke Gemini AI...');

    try {
      setAnalysisStep('Gemini 3.8 Flash sedang menganalisis tabel dan tulisan tangan...');
      const result = await apiScanNotebook(selectedImage, imageMimeType);

      setScanResult(result);
      setEditableResults(result.matchedResults || []);

      // Auto-populate week label
      if (result.detectedWeekLabel) {
        setCustomWeekLabel(result.detectedWeekLabel);
      } else {
        setCustomWeekLabel(`Minggu ${data.weeks.length + 1} (Buku Fisik)`);
      }

      setAnalysisStep('');
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memindai foto buku kas dengan AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle checkmark in review table
  const handleToggleStudent = (studentId: string, session: 'rabu' | 'kamis') => {
    setEditableResults((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          return {
            ...item,
            [session === 'rabu' ? 'rabuPaid' : 'kamisPaid']: !item[session === 'rabu' ? 'rabuPaid' : 'kamisPaid']
          };
        }
        return item;
      })
    );
  };

  // Bulk actions on review table
  const handleBulkSetSession = (session: 'rabu' | 'kamis', value: boolean) => {
    setEditableResults((prev) =>
      prev.map((item) => ({
        ...item,
        [session === 'rabu' ? 'rabuPaid' : 'kamisPaid']: value
      }))
    );
  };

  // Apply to Class Treasury
  const handleApplyToTreasury = async () => {
    if (editableResults.length === 0) return;

    setIsApplying(true);
    setErrorMsg(null);

    try {
      const payloadWeekLabel = weekTargetMode === 'new' 
        ? (customWeekLabel.trim() || `Minggu ${data.weeks.length + 1} (Buku Fisik)`)
        : undefined;

      const payloadWeekId = weekTargetMode === 'existing' ? targetWeekId : 'new';

      const resultsPayload = editableResults.map((r) => ({
        studentId: r.studentId,
        rabu: r.rabuPaid,
        kamis: r.kamisPaid
      }));

      const response = await apiApplyScanResults({
        weekId: payloadWeekId,
        weekLabel: payloadWeekLabel,
        results: resultsPayload
      });

      onDataUpdated(response.appData);
      setApplySuccessInfo({
        weekLabel: response.weekLabel,
        weekId: response.weekId,
        updatedCount: response.updatedCount
      });
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menerapkan data scan ke kas kelas');
    } finally {
      setIsApplying(false);
    }
  };

  // Stats from editable results
  const totalRabuPaid = editableResults.filter((r) => r.rabuPaid).length;
  const totalKamisPaid = editableResults.filter((r) => r.kamisPaid).length;
  const totalEstimatedCollected = (totalRabuPaid + totalKamisPaid) * data.nominalPerSession;

  const filteredReviewList = editableResults.filter(
    (item) =>
      item.officialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.absen).includes(searchQuery) ||
      (item.rawTextFromImage && item.rawTextFromImage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="glass-card-dark rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl border border-white/20">
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-teal-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black mb-2 border border-amber-300/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Fitur AI Pemindaian Cepat
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
              Scan Lembar Buku Kas Fisik Bendahara
            </h3>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
              Foto buku kas manual minggu-minggu sebelumnya waktu kas sudah mulai sebelum aplikasi ini dirilis.
              AI Gemini akan membaca nama siswa, nomor absen, dan tanda centang setoran kas secara otomatis!
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadDemoImage}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-500/30 hover:bg-teal-500/40 border border-teal-300/40 text-xs font-black text-teal-100 backdrop-blur-md shadow-sm transition active:scale-95 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Coba Contoh Catatan Buku
          </button>
        </div>
      </div>

      {/* Upload & Capture Section */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-900/10">
          <div>
            <h4 className="text-sm font-extrabold text-teal-950 flex items-center gap-2">
              <Camera className="w-4 h-4 text-teal-700" />
              Langkah 1: Foto Lembaran Buku Kas
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan kamera HP untuk memotret buku tulis bendahara, atau unggah foto dari galeri.
            </p>
          </div>

          {selectedImage && (
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setScanResult(null);
                setEditableResults([]);
                setApplySuccessInfo(null);
              }}
              className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ganti Foto
            </button>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedImage ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Camera Capture Card */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="glass-card-hover p-6 rounded-2xl border-2 border-dashed border-teal-500/40 hover:border-teal-600 flex flex-col items-center justify-center text-center group cursor-pointer transition active:scale-98"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-500/15 text-teal-800 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-inner">
                <Camera className="w-7 h-7 text-teal-700" />
              </div>
              <span className="text-sm font-black text-teal-950">
                Ambil Foto Buku dengan Kamera HP
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Kamera belakang perangkat akan terbuka
              </span>
            </button>

            {/* File Upload Card */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="glass-card-hover p-6 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-600 flex flex-col items-center justify-center text-center group cursor-pointer transition active:scale-98"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-inner">
                <Upload className="w-7 h-7 text-amber-700" />
              </div>
              <span className="text-sm font-black text-amber-950">
                Pilih Foto dari Galeri / File
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Format JPG, PNG, WEBP didukung
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview Card */}
            <div className="relative rounded-2xl overflow-hidden border border-teal-900/15 bg-slate-900 shadow-inner max-h-[380px] flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Foto Lembar Buku Kas"
                className="max-h-[380px] w-auto object-contain"
              />

              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center mb-3 animate-bounce">
                    <Sparkles className="w-8 h-8 text-amber-300 animate-spin" />
                  </div>
                  <h5 className="text-base font-black text-white">
                    AI Sedang Membaca Tulisan Tangan...
                  </h5>
                  <p className="text-xs text-teal-200 mt-1 max-w-sm">
                    {analysisStep || 'Mencocokkan nama dengan 31 siswa & memeriksa centang setoran kas...'}
                  </p>
                  <div className="w-48 h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-linear-to-r from-teal-400 via-amber-300 to-teal-400 rounded-full animate-pulse w-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Scan Action Controls */}
            {!scanResult && !isAnalyzing && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-600">
                  Foto siap dianalisis. Tekan tombol di samping untuk mulai pemindaian otomatis dengan AI.
                </div>
                <button
                  type="button"
                  onClick={handleStartScan}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-linear-to-r from-teal-700 to-teal-900 hover:from-teal-800 hover:to-teal-950 text-white font-black text-sm shadow-xl shadow-teal-950/20 active:scale-95 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Mulai Pemindaian AI Sekarang</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="glass-card p-4 rounded-2xl border-rose-300/60 bg-rose-50/60 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <strong className="font-extrabold">Terjadi Kendala: </strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {applySuccessInfo && (
        <div className="glass-card p-5 rounded-2xl border-emerald-400/60 bg-emerald-50/70 text-emerald-900 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-sm font-black text-emerald-950">
                Berhasil Diterapkan ke Kas Kelas!
              </h5>
              <p className="text-xs text-emerald-800 mt-0.5">
                Data setoran kas untuk <strong className="font-extrabold">{applySuccessInfo.weekLabel}</strong> telah tercatat di sistem ({applySuccessInfo.updatedCount} siswa berstatus lunas).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {onNavigateToChecklist && (
              <button
                type="button"
                onClick={() => onNavigateToChecklist(applySuccessInfo.weekId)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs active:scale-95"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Lihat di Checklist Kas Sekarang
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setScanResult(null);
                setEditableResults([]);
                setApplySuccessInfo(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/70 hover:bg-white text-emerald-900 border border-emerald-300 text-xs font-bold transition shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              Scan Halaman Minggu Lainnya
            </button>
          </div>
        </div>
      )}

      {/* Review & Verification Table (Only shown after scan completes) */}
      {scanResult && editableResults.length > 0 && (
        <div className="glass-card p-5 sm:p-6 rounded-3xl space-y-5 animate-in fade-in duration-300">
          {/* Step 2 Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-900/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 text-[11px] font-black border border-emerald-500/25 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                Pemindaian AI Berhasil
              </div>
              <h4 className="text-base font-black text-teal-950">
                Langkah 2: Verifikasi & Tentukan Minggu Kas
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Periksa hasil centang yang dibaca AI di bawah ini. Anda dapat mencentang atau menghapus centang secara manual sebelum disimpan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs font-bold text-teal-900">
                {editableResults.length} Siswa Terpetakan
              </span>
            </div>
          </div>

          {/* Week Target Configuration */}
          <div className="glass-card-inner p-4 rounded-2xl space-y-3 bg-white/40 border border-teal-900/10">
            <label className="text-xs font-black uppercase text-teal-950 tracking-wide flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-700" />
              Target Minggu Kas di Aplikasi:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                weekTargetMode === 'new' 
                  ? 'bg-teal-500/15 border-teal-600 shadow-xs' 
                  : 'bg-white/50 border-slate-200 hover:bg-white'
              }`}>
                <input
                  type="radio"
                  name="weekTargetMode"
                  checked={weekTargetMode === 'new'}
                  onChange={() => setWeekTargetMode('new')}
                  className="mt-1 text-teal-700 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <span className="text-xs font-black text-teal-950 block">
                    Buat Minggu Baru Otomatis
                  </span>
                  <input
                    type="text"
                    value={customWeekLabel}
                    onChange={(e) => setCustomWeekLabel(e.target.value)}
                    disabled={weekTargetMode !== 'new'}
                    placeholder="Contoh: Minggu 1 (Buku Fisik)"
                    className="mt-1.5 w-full text-xs font-bold px-3 py-1.5 rounded-lg border border-teal-900/20 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-50"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {scanResult.detectedWeekLabel 
                      ? `Terdeteksi dari foto: "${scanResult.detectedWeekLabel}"`
                      : 'Minggu baru akan ditambahkan ke riwayat kas'}
                  </span>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                weekTargetMode === 'existing' 
                  ? 'bg-teal-500/15 border-teal-600 shadow-xs' 
                  : 'bg-white/50 border-slate-200 hover:bg-white'
              }`}>
                <input
                  type="radio"
                  name="weekTargetMode"
                  checked={weekTargetMode === 'existing'}
                  onChange={() => setWeekTargetMode('existing')}
                  className="mt-1 text-teal-700 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <span className="text-xs font-black text-teal-950 block">
                    Terapkan ke Minggu yang Sudah Ada
                  </span>
                  <select
                    value={targetWeekId}
                    onChange={(e) => setTargetWeekId(e.target.value)}
                    disabled={weekTargetMode !== 'existing' || data.weeks.length === 0}
                    className="mt-1.5 w-full text-xs font-bold px-3 py-1.5 rounded-lg border border-teal-900/20 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-50"
                  >
                    {data.weeks.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Memperbarui checklist pada minggu yang dipilih
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Scanned Stats Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="glass-card-inner p-3 rounded-xl border border-teal-900/10">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Lunas Rabu</span>
              <span className="text-lg font-black text-teal-950 mt-0.5 block">
                {totalRabuPaid} / {editableResults.length}
              </span>
              <span className="text-[10px] text-teal-700 font-semibold">Sesi Rabu terbayar</span>
            </div>

            <div className="glass-card-inner p-3 rounded-xl border border-teal-900/10">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Lunas Kamis</span>
              <span className="text-lg font-black text-teal-950 mt-0.5 block">
                {totalKamisPaid} / {editableResults.length}
              </span>
              <span className="text-[10px] text-teal-700 font-semibold">Sesi Kamis terbayar</span>
            </div>

            <div className="glass-card-inner p-3 rounded-xl border border-teal-900/10">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Total Terkumpul</span>
              <span className="text-lg font-black text-emerald-800 mt-0.5 block truncate">
                {formatRupiah(totalEstimatedCollected)}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">Estimasi uang masuk</span>
            </div>

            <div className="glass-card-inner p-3 rounded-xl border border-teal-900/10">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Catatan AI</span>
              <span className="text-xs font-bold text-slate-700 mt-1 line-clamp-2 block" title={scanResult.notes || ''}>
                {scanResult.notes || 'Pembacaan tulisan tangan selesai'}
              </span>
            </div>
          </div>

          {/* Search & Bulk Control Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa atau no absen..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border border-teal-900/15 bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
              <button
                type="button"
                onClick={() => handleBulkSetSession('rabu', true)}
                className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-900 border border-teal-500/20 whitespace-nowrap"
              >
                Centang Semua Rabu
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetSession('kamis', true)}
                className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-900 border border-teal-500/20 whitespace-nowrap"
              >
                Centang Semua Kamis
              </button>
              <button
                type="button"
                onClick={() => {
                  handleBulkSetSession('rabu', false);
                  handleBulkSetSession('kamis', false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap"
              >
                Kosongkan
              </button>
            </div>
          </div>

          {/* Student Verification Checklist Table */}
          <div className="overflow-x-auto rounded-2xl border border-teal-900/15 bg-white/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-teal-950/5 text-teal-950 font-black border-b border-teal-900/10">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Absen</th>
                  <th className="py-2.5 px-3">Nama Siswa Resmi</th>
                  <th className="py-2.5 px-3 hidden md:table-cell">Terbaca di Foto</th>
                  <th className="py-2.5 px-3 text-center w-28">
                    Rabu (Rp 2k)
                  </th>
                  <th className="py-2.5 px-3 text-center w-28">
                    Kamis (Rp 2k)
                  </th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Akurasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-900/5">
                {filteredReviewList.map((item) => (
                  <tr key={item.studentId} className="hover:bg-teal-50/50 transition">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                      #{item.absen}
                    </td>
                    <td className="py-2.5 px-3 font-extrabold text-teal-950">
                      <div>{item.officialName}</div>
                      {item.notes && (
                        <div className="text-[10px] text-slate-400 font-normal">{item.notes}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 hidden md:table-cell text-slate-600 font-medium italic">
                      {item.rawTextFromImage || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStudent(item.studentId, 'rabu')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-[11px] transition cursor-pointer active:scale-95 ${
                          item.rabuPaid
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {item.rabuPaid ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Lunas</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5" />
                            <span>Belum</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStudent(item.studentId, 'kamis')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-[11px] transition cursor-pointer active:scale-95 ${
                          item.kamisPaid
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {item.kamisPaid ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Lunas</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5" />
                            <span>Belum</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.confidence === 'high'
                          ? 'bg-emerald-500/15 text-emerald-800'
                          : item.confidence === 'medium'
                          ? 'bg-amber-500/15 text-amber-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.confidence === 'high' ? 'Pasti' : item.confidence === 'medium' ? 'Sedang' : 'Manual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Final Submission Button Bar */}
          <div className="pt-3 border-t border-teal-900/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 text-center sm:text-left">
              Total <strong className="text-teal-950">{totalRabuPaid + totalKamisPaid} sesi lunas</strong> akan dicatat ke database kas kelas secara realtime.
            </div>

            <button
              type="button"
              disabled={isApplying}
              onClick={handleApplyToTreasury}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white font-black text-sm shadow-xl shadow-teal-950/20 active:scale-95 transition disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Menyimpan ke Kas Kelas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Terapkan Hasil Scan ke Kas Kelas</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
