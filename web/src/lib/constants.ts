// Constants and Seed Data for Grade XII SIJA Students
// SMK Telkom Sidoarjo UKL 3

export const DISPENSE_PRESETS = [50, 100, 200, 300] as const;

export interface RegisteredStudentSeed {
  id: string;
  nis: string;
  name: string;
  class: string;
  daily_goal_ml: number;
  // Default PIN is 1234 for initial testing in school lab
  // SHA-256 of "1234" = 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
  pin_hash: string;
}

export const REGISTERED_STUDENTS: RegisteredStudentSeed[] = [
  {
    id: "student_01",
    nis: "12022001",
    name: "Ahmad Fauzi",
    class: "XII SIJA 2",
    daily_goal_ml: 1500,
    pin_hash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", // 1234
  },
  {
    id: "student_02",
    nis: "12022002",
    name: "Bunga Citra",
    class: "XII SIJA 2",
    daily_goal_ml: 1800,
    pin_hash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", // 1234
  },
  {
    id: "student_03",
    nis: "12022003",
    name: "Dimas Pratama",
    class: "XII SIJA 2",
    daily_goal_ml: 2000,
    pin_hash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", // 1234
  },
  {
    id: "student_04",
    nis: "12022004",
    name: "Nabila Putri",
    class: "XII SIJA 2",
    daily_goal_ml: 1600,
    pin_hash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", // 1234
  },
  {
    id: "student_05",
    nis: "12022005",
    name: "Rizky Ramadhan",
    class: "XII SIJA 2",
    daily_goal_ml: 2200,
    pin_hash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", // 1234
  },
];

export const AI_RULE_EXPLANATIONS: Record<string, { title: string; risk: string; advice: string }> = {
  AMAN: {
    title: "Sistem Normal & Siap",
    risk: "LOW",
    advice: "Dispenser siap melayani pengisian air.",
  },
  GELAS_TIDAK_ADA: {
    title: "Cangkir Tidak Terdeteksi",
    risk: "CRITICAL / LOW",
    advice: "Letakkan cangkir tepat di bawah nozzle sebelum memulai.",
  },
  AIR_RENDAH: {
    title: "Volume Tandon Menipis",
    risk: "MEDIUM",
    advice: "Segera isi ulang air tandon untuk menghindari pompa kering.",
  },
  TUMPAHAN: {
    title: "Genangan Air di Baki Tetesan",
    risk: "CRITICAL",
    advice: "Keringkan baki tetesan dengan kain bersih untuk melanjutkan.",
  },
  ALIRAN_BERMASALAH: {
    title: "Aliran Air Tidak Terdeteksi",
    risk: "HIGH",
    advice: "Periksa kemungkinan selang terjepit atau pompa tersumbat.",
  },
  SENSOR_ERROR: {
    title: "Gangguan Pembacaan Sensor",
    risk: "HIGH",
    advice: "Periksa koneksi kabel jumper ultrasonik atau ADC.",
  },
};
