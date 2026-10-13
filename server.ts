import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { AppData, NotificationMessage, Student, Expense } from './src/types';
import { getInitialData } from './src/defaultData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'kas_data.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load or initialize data
let appData: AppData;
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    appData = JSON.parse(raw);
  } catch (err) {
    console.error('Error reading kas_data.json, initializing fresh data:', err);
    appData = getInitialData();
    saveData();
  }
} else {
  appData = getInitialData();
  saveData();
}

function saveData() {
  try {
    appData.lastUpdated = Date.now();
    fs.writeFileSync(DATA_FILE, JSON.stringify(appData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save data file:', err);
  }
}

// SSE Clients for realtime updates
interface SSEClient {
  id: string;
  res: Response;
  studentId?: string;
}

let sseClients: SSEClient[] = [];

function broadcast(eventType: string, payload: unknown) {
  const dataString = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(dataString);
    } catch {
      // client likely disconnected
    }
  });
}

function broadcastNotification(notif: NotificationMessage) {
  // Broadcast to all clients or specific student
  sseClients.forEach((client) => {
    try {
      const isTarget = notif.targetStudentId === 'all' || client.studentId === notif.targetStudentId;
      if (isTarget) {
        client.res.write(`event: notification\ndata: ${JSON.stringify(notif)}\n\n`);
      }
    } catch {
      // ignore
    }
  });
}

// Middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// API Routes
app.get('/api/data', (_req: Request, res: Response) => {
  res.json(appData);
});

// Realtime SSE endpoint
app.get('/api/realtime', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const studentId = (req.query.studentId as string) || undefined;

  const client: SSEClient = { id: clientId, res, studentId };
  sseClients.push(client);

  // Send initial ping and current state
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Update settings (Nominal Kas per session & PIN Admin)
app.post('/api/settings', (req: Request, res: Response) => {
  const { nominalPerSession, adminPin } = req.body;
  if (typeof nominalPerSession === 'number' && nominalPerSession >= 0) {
    appData.nominalPerSession = nominalPerSession;
  }
  if (typeof adminPin === 'string' && adminPin.trim().length >= 4) {
    appData.adminPin = adminPin.trim();
  }
  saveData();
  broadcast('update', appData);
  res.json({ success: true, appData });
});

// Student management
app.post('/api/students', (req: Request, res: Response) => {
  const { name, absen } = req.body;
  if (!name || typeof absen !== 'number') {
    return res.status(400).json({ error: 'Nama dan Nomor Absen wajib diisi' });
  }

  const newStudent: Student = {
    id: `std-${Date.now()}`,
    name: name.trim().toUpperCase(),
    absen
  };

  appData.students.push(newStudent);
  // Sort students by absen
  appData.students.sort((a, b) => a.absen - b.absen);

  // Initialize payment record
  if (!appData.payments[newStudent.id]) {
    appData.payments[newStudent.id] = {};
    appData.weeks.forEach((w) => {
      appData.payments[newStudent.id][w.id] = { rabu: false, kamis: false };
    });
  }

  saveData();
  broadcast('update', appData);
  res.json({ success: true, student: newStudent, appData });
});

app.put('/api/students/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, absen } = req.body;
  const student = appData.students.find((s) => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Siswa tidak ditemukan' });
  }

  if (name) student.name = name.trim().toUpperCase();
  if (typeof absen === 'number') student.absen = absen;

  appData.students.sort((a, b) => a.absen - b.absen);
  saveData();
  broadcast('update', appData);
  res.json({ success: true, student, appData });
});

app.delete('/api/students/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  appData.students = appData.students.filter((s) => s.id !== id);
  delete appData.payments[id];
  saveData();
  broadcast('update', appData);
  res.json({ success: true, appData });
});

// Payments checklist toggle
app.post('/api/payments', (req: Request, res: Response) => {
  const { studentId, weekId, session, paid } = req.body;
  if (!studentId || !weekId || (session !== 'rabu' && session !== 'kamis')) {
    return res.status(400).json({ error: 'Parameter tidak valid' });
  }

  if (!appData.payments[studentId]) {
    appData.payments[studentId] = {};
  }
  if (!appData.payments[studentId][weekId]) {
    appData.payments[studentId][weekId] = { rabu: false, kamis: false };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  appData.payments[studentId][weekId][session as 'rabu' | 'kamis'] = !!paid;
  if (paid) {
    if (session === 'rabu') appData.payments[studentId][weekId].rabuPaidAt = todayStr;
    if (session === 'kamis') appData.payments[studentId][weekId].kamisPaidAt = todayStr;
  }

  saveData();
  broadcast('update', appData);
  res.json({ success: true, appData });
});

// Bulk payment update (e.g. mark entire week paid for a student or mark everyone paid for a session)
app.post('/api/payments/bulk', (req: Request, res: Response) => {
  const { weekId, session, studentId, paid } = req.body;
  const todayStr = new Date().toISOString().split('T')[0];

  if (studentId && weekId) {
    // Mark both rabu and kamis for this student in this week
    if (!appData.payments[studentId]) appData.payments[studentId] = {};
    appData.payments[studentId][weekId] = {
      rabu: !!paid,
      kamis: !!paid,
      rabuPaidAt: paid ? todayStr : undefined,
      kamisPaidAt: paid ? todayStr : undefined
    };
  } else if (weekId && session) {
    // Mark all students for this session in this week
    appData.students.forEach((s) => {
      if (!appData.payments[s.id]) appData.payments[s.id] = {};
      if (!appData.payments[s.id][weekId]) {
        appData.payments[s.id][weekId] = { rabu: false, kamis: false };
      }
      appData.payments[s.id][weekId][session as 'rabu' | 'kamis'] = !!paid;
      if (paid) {
        if (session === 'rabu') appData.payments[s.id][weekId].rabuPaidAt = todayStr;
        if (session === 'kamis') appData.payments[s.id][weekId].kamisPaidAt = todayStr;
      }
    });
  }

  saveData();
  broadcast('update', appData);
  res.json({ success: true, appData });
});

// Weeks management
app.post('/api/weeks', (req: Request, res: Response) => {
  const { label } = req.body;
  if (!label) return res.status(400).json({ error: 'Nama minggu wajib diisi' });

  const newWeek = {
    id: `w${appData.weeks.length + 1}-${Date.now().toString(36)}`,
    label: label.trim(),
    rabuDue: false,
    kamisDue: false
  };

  appData.weeks.push(newWeek);
  // Initialize student payments for this week
  appData.students.forEach((s) => {
    if (!appData.payments[s.id]) appData.payments[s.id] = {};
    appData.payments[s.id][newWeek.id] = { rabu: false, kamis: false };
  });

  saveData();
  broadcast('update', appData);
  res.json({ success: true, week: newWeek, appData });
});

// Toggle session due (jatuh tempo / tunggakan)
app.post('/api/weeks/session-due', (req: Request, res: Response) => {
  const { weekId, session, isDue } = req.body;
  const week = appData.weeks.find((w) => w.id === weekId);
  if (!week) return res.status(404).json({ error: 'Minggu tidak ditemukan' });

  if (session === 'rabu') {
    week.rabuDue = !!isDue;
  } else if (session === 'kamis') {
    week.kamisDue = !!isDue;
  }

  saveData();
  broadcast('update', appData);
  res.json({ success: true, appData });
});

app.delete('/api/weeks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  appData.weeks = appData.weeks.filter((w) => w.id !== id);
  appData.students.forEach((s) => {
    if (appData.payments[s.id]) {
      delete appData.payments[s.id][id];
    }
  });

  saveData();
  broadcast('update', appData);
  res.json({ success: true, appData });
});

// Expenses management
app.post('/api/expenses', (req: Request, res: Response) => {
  const { date, title, amount, category, note } = req.body;
  if (!title || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Judul dan nominal belanja valid wajib diisi' });
  }

  const newExpense: Expense = {
    id: `exp-${Date.now()}`,
    date: date || new Date().toISOString().split('T')[0],
    title: title.trim(),
    amount,
    category: category || 'Lainnya',
    note: note?.trim(),
    createdAt: Date.now()
  };

  appData.expenses.unshift(newExpense);
  saveData();
  broadcast('update', appData);
  res.json({ success: true, expense: newExpense, appData });
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  appData.expenses = appData.expenses.filter((e) => e.id !== id);
  saveData();
  broadcast('update', appData);
  res.json({ success: true, appData });
});

// Notifications
app.post('/api/notifications', (req: Request, res: Response) => {
  const { targetStudentId, title, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Pesan notifikasi tidak boleh kosong' });
  }

  let targetStudentName = 'Semua Siswa';
  if (targetStudentId && targetStudentId !== 'all') {
    const student = appData.students.find((s) => s.id === targetStudentId);
    if (student) targetStudentName = student.name;
  }

  const newNotif: NotificationMessage = {
    id: `notif-${Date.now()}`,
    targetStudentId: targetStudentId || 'all',
    targetStudentName,
    title: title?.trim() || 'Kas Kelas',
    message: message.trim(),
    createdAt: Date.now(),
    readBy: []
  };

  appData.notifications.unshift(newNotif);
  // Keep only latest 100 notifications
  if (appData.notifications.length > 100) {
    appData.notifications = appData.notifications.slice(0, 100);
  }

  saveData();
  broadcast('update', appData);
  broadcastNotification(newNotif);

  res.json({ success: true, notification: newNotif, appData });
});

// Mark notification as read
app.post('/api/notifications/read', (req: Request, res: Response) => {
  const { notificationId, studentId } = req.body;
  const notif = appData.notifications.find((n) => n.id === notificationId);
  if (notif && studentId) {
    if (!notif.readBy) notif.readBy = [];
    if (!notif.readBy.includes(studentId)) {
      notif.readBy.push(studentId);
      saveData();
      broadcast('update', appData);
    }
  }
  res.json({ success: true });
});

// Restart all financial numbers to Rp 0 without exception
app.post('/api/restart-finances', (_req: Request, res: Response) => {
  const currentPin = appData.adminPin || '130711#$$#';
  const currentNominal = appData.nominalPerSession || 2000;

  // Clear all payments for all students
  const emptyPayments: Record<string, Record<string, any>> = {};
  appData.students.forEach((s) => {
    emptyPayments[s.id] = {};
  });

  appData.weeks = [];
  appData.payments = emptyPayments;
  appData.expenses = [];
  appData.notifications = [];
  appData.nominalPerSession = currentNominal;
  appData.adminPin = currentPin;
  appData.lastUpdated = Date.now();

  saveData();
  broadcast('update', appData);
  res.json({ success: true, appData });
});

// Reset data back to default initial state
app.post('/api/reset', (_req: Request, res: Response) => {
  appData = getInitialData();
  appData.adminPin = '130711#$$#';
  saveData();
  broadcast('update', appData);
  res.json({ success: true, appData });
});

// AI Fast Scanner for Physical Treasurer Notebook
app.post('/api/scan-notebook', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Foto buku kas bendahara wajib disertakan.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi pada environment server.' });
    }

    // Clean base64 string if data URI prefix was included
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const rosterText = appData.students
      .map((s) => `Absen #${s.absen}: "${s.name}" (ID: ${s.id})`)
      .join('\n');

    const promptText = `Anda adalah asisten AI cerdas untuk Bendahara Kelas (Sistem Kas Kelas Digital).
Bendahara mengambil foto lembaran buku catatan kas fisik manual yang digunakan sebelum aplikasi digital ini dirilis.

Daftar resmi 31 siswa di kelas:
${rosterText}

Karakteristik tabel buku kas bendahara:
1. Format tabel: Berisi kolom No/Absen, Nama Siswa, dan kolom-kolom hari/minggu (biasanya hari 'Rabu' dan 'Kamis', 'R' & 'K', atau kolom per tanggal/sesi).
2. Tanda Lunas: Tanda centang (✓, v, V), silang (X), tanda bulat/titik (•), tulisan 'L' (Lunas), 'B' (Bayar), 'OK', paraf tanda tangan, angka nominal Rp2.000 / 2k, atau kotak terisi.
3. Tanda Belum Bayar: Kolom kosong (blank), tanda strip (-), atau tanda tanya (?).
4. Jika di buku bendahara hanya ada 1 kolom tanda centang per siswa untuk minggu tersebut, anggap siswa sudah melunasi kedua sesi minggu tersebut (Rabu & Kamis) atau sesuaikan dengan konteks catatan.

TUGAS ANDA:
1. Baca teks nama, nomor urut/absen, dan tanda centang setoran kas pada foto buku bendahara tersebut dengan seksama.
2. Cocokkan setiap baris nama yang terbaca dengan daftar 31 siswa resmi di atas. Gunakan pencocokan cerdas / fuzzy matching (toleransi nama panggilan, nama depan saja, singkatan nama depan/belakang, atau kesalahan ejaan ringan).
3. Buat hasil untuk SETIAP 31 siswa dalam daftar resmi. Jika seorang siswa tidak tertulis di foto atau kolomnya kosong, tandai rabuPaid: false dan kamisPaid: false.
4. Deteksi judul minggu jika ada di bagian atas lembar catatan buku kas (misal "Minggu 1", "Minggu 2", "Kas Bulan Agustus M1", dll.)

Format respons JSON yang WAJIB dipatuhi:
{
  "detectedWeekLabel": "string judul minggu atau null",
  "notes": "Ringkasan analisis foto buku kas",
  "matchedResults": [
    {
      "studentId": "id-siswa-dari-daftar-resmi",
      "officialName": "NAMA SISWA RESMI",
      "absen": 1,
      "rawTextFromImage": "teks nama yang terbaca di foto",
      "rabuPaid": true,
      "kamisPaid": false,
      "confidence": "high",
      "notes": "Centang jelas di kolom Rabu"
    }
  ],
  "unmatchedRawEntries": []
}`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawJsonText = response.text || '{}';
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(rawJsonText);
    } catch {
      const cleanJson = rawJsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    }

    // Ensure all 31 students are represented in matchedResults
    if (parsedResult && Array.isArray(parsedResult.matchedResults)) {
      const existingIds = new Set(parsedResult.matchedResults.map((m: any) => m.studentId));
      appData.students.forEach((s) => {
        if (!existingIds.has(s.id)) {
          parsedResult.matchedResults.push({
            studentId: s.id,
            officialName: s.name,
            absen: s.absen,
            rawTextFromImage: '(Tidak terdeteksi)',
            rabuPaid: false,
            kamisPaid: false,
            confidence: 'low',
            notes: 'Nama tidak ditemukan di lembar foto'
          });
        }
      });
      // Sort by absen
      parsedResult.matchedResults.sort((a: any, b: any) => a.absen - b.absen);
    }

    res.json({ success: true, result: parsedResult });
  } catch (err: unknown) {
    console.error('Error in /api/scan-notebook:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Gagal memindai foto buku kas dengan AI'
    });
  }
});

// Apply scanned notebook results to class treasury
app.post('/api/scan-notebook/apply', (req: Request, res: Response) => {
  const { weekId, weekLabel, results } = req.body;
  if (!Array.isArray(results)) {
    return res.status(400).json({ error: 'Data hasil pemindaian tidak valid' });
  }

  let targetWeekId = weekId;
  const todayStr = new Date().toISOString().split('T')[0];

  // If weekId is 'new' or not found, create a new week
  let existingWeek = appData.weeks.find((w) => w.id === targetWeekId);
  if (!existingWeek || targetWeekId === 'new') {
    const defaultLabel = weekLabel && weekLabel.trim() 
      ? weekLabel.trim() 
      : `Minggu ${appData.weeks.length + 1} (Buku Fisik)`;
    
    const newWeek = {
      id: `w${appData.weeks.length + 1}-${Date.now().toString(36)}`,
      label: defaultLabel,
      rabuDue: false,
      kamisDue: false
    };
    appData.weeks.push(newWeek);
    targetWeekId = newWeek.id;
    existingWeek = newWeek;

    // Initialize all student payments for this new week
    appData.students.forEach((s) => {
      if (!appData.payments[s.id]) appData.payments[s.id] = {};
      appData.payments[s.id][targetWeekId] = { rabu: false, kamis: false };
    });
  }

  let updatedCount = 0;
  results.forEach((item: { studentId: string; rabu: boolean; kamis: boolean }) => {
    if (!item.studentId) return;
    if (!appData.payments[item.studentId]) {
      appData.payments[item.studentId] = {};
    }
    const current = appData.payments[item.studentId][targetWeekId] || { rabu: false, kamis: false };
    appData.payments[item.studentId][targetWeekId] = {
      rabu: !!item.rabu,
      kamis: !!item.kamis,
      rabuPaidAt: item.rabu ? (current.rabuPaidAt || todayStr) : undefined,
      kamisPaidAt: item.kamis ? (current.kamisPaidAt || todayStr) : undefined,
    };
    if (item.rabu || item.kamis) {
      updatedCount++;
    }
  });

  saveData();
  broadcast('update', appData);
  res.json({
    success: true,
    weekId: targetWeekId,
    weekLabel: existingWeek.label,
    updatedCount,
    appData
  });
});

// Start Express server and mount Vite or Static assets
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server Kas Kelas running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
