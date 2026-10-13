import { AppData, Student, WeekConfig } from './types';

export const INITIAL_STUDENTS_LIST: string[] = [
  "AFFLAH INTAN NOOR IZZAH",
  "AHMAD RENO KHOIDOR MAULANA",
  "AMELIA AYU SAFIRA",
  "ANGGUN KHAIRUNNISA AZZAHRA",
  "ARIFFI KHOIRUN NIZAR",
  "ATHALIA WIDYA PRAMESWARI",
  "AYU NOVITA DIUSTIRA",
  "BISMA NARAENDRA AZKA LAKSANA",
  "CALLISTA MICHEILS NATHANIA",
  "CYNTHA LIALATUL QUR'AN",
  "DEVARA RAKHA ADWIJAYA",
  "DHIA AULIA NUR MAKAILA",
  "DINI ANGGRAINI",
  "FAIRIS ZALFA HERDIANI",
  "FIRMAN MAULANA PUTRA",
  "GHISTA FELIYANA FAIRIN",
  "IBNU SAWQISYAH",
  "JULIA PRICILIA TUNGGAL DEWI",
  "M. RAFY HANIF ASLAM",
  "MOCH ARIEF RAHMAN HAKIM",
  "MUHAMMAD CAESAR FAHREZY",
  "MUHAMMAD NAUFAL PUTRA RADITYA",
  "MUHAMMAD RIZAL TRISANTOSO",
  "NAFITA DWI LESTARI",
  "NINDIYA CALLISTA PRIMALIA SARI",
  "PRADANA RAHADIAN NUGROHO",
  "QANIAH SHAKIRAH PULUNGAN",
  "SATRIO ANDI BRAMANTIO",
  "SAZKIA AULIA PUTRI",
  "YANUARTA AINUN NADZAR",
  "YULIANA NUR CAHYA"
];

export const INITIAL_STUDENTS: Student[] = INITIAL_STUDENTS_LIST.map((name, index) => ({
  id: `std-${index + 1}`,
  name,
  absen: index + 1
}));

// Fresh start: no active weeks yet, so all balances and arrears are strictly Rp 0
export const INITIAL_WEEKS: WeekConfig[] = [];

export function getInitialData(): AppData {
  const payments: AppData['payments'] = {};

  INITIAL_STUDENTS.forEach((std) => {
    payments[std.id] = {};
  });

  return {
    nominalPerSession: 2000,
    adminPin: '130711#$$#',
    students: INITIAL_STUDENTS,
    weeks: [],
    payments,
    expenses: [],
    notifications: [],
    lastUpdated: Date.now()
  };
}
