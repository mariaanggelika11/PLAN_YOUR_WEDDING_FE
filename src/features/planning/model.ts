export const categories = [
  "Perencanaan",
  "Venue",
  "Catering",
  "Dekorasi",
  "Dokumentasi",
  "Busana & MUA",
  "Administrasi",
  "Tamu & undangan",
  "Acara & keluarga",
  "Hari H",
  "Setelah acara",
  "Lainnya",
] as const;
export const statuses = {
  TODO: "Belum mulai",
  IN_PROGRESS: "Sedang dikerjakan",
  COMPLETED: "Selesai",
  SKIPPED: "Tidak diperlukan",
} as const;
export type TaskStatus = keyof typeof statuses;
export interface PlanSettings {
  date: string;
  event: string;
  guests: number;
  budget: number;
  location: string;
  traditional: boolean;
  outdoor: boolean;
  useWo: boolean;
}
export interface WeddingTask {
  id: string;
  title: string;
  category: string;
  guide: string;
  daysBefore: number | null;
  due: string;
  customDue: boolean;
  important: boolean;
  status: TaskStatus;
  assignee: string;
  notes: string;
  vendor: string;
  orderId: string;
  subtasks: { title: string; done: boolean }[];
}
export interface WeddingPlan {
  version: 1;
  settings: PlanSettings;
  tasks: WeddingTask[];
}

// Calendar arithmetic uses UTC to avoid DST and timezone shifts in date-only values.
export function dateOffset(date: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return "";
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}
export function todayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function daysUntil(date: string, today: string) {
  return Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000,
  );
}
export function isPending(task: WeddingTask) {
  return task.status === "TODO" || task.status === "IN_PROGRESS";
}
export function taskSummary(tasks: WeddingTask[]) {
  const applicable = tasks.filter((task) => task.status !== "SKIPPED");
  const completed = applicable.filter((task) => task.status === "COMPLETED").length;
  return {
    total: applicable.length,
    completed,
    percent: applicable.length ? Math.round((completed / applicable.length) * 100) : 0,
  };
}
export function focusTasks(tasks: WeddingTask[], today: string) {
  const pending = tasks.filter(isPending);
  return pending
    .sort((a, b) => {
      const rank = (task: WeddingTask) =>
        task.due && task.due < today
          ? 0
          : task.due && task.due <= dateOffset(today, 7)
            ? 1
            : task.important
              ? 2
              : 3;
      return (
        rank(a) - rank(b) ||
        (a.due || "9999").localeCompare(b.due || "9999") ||
        Number(b.important) - Number(a.important)
      );
    })
    .slice(0, 5);
}
export function reschedule(tasks: WeddingTask[], date: string) {
  return tasks.map((task) =>
    task.customDue || task.daysBefore === null || !isPending(task)
      ? task
      : { ...task, due: dateOffset(date, -task.daysBefore) },
  );
}
export function setTaskStatus(task: WeddingTask, status: TaskStatus): WeddingTask {
  return {
    ...task,
    status,
    subtasks: task.subtasks.map((subtask) => ({
      ...subtask,
      done: status === "COMPLETED" ? true : task.status === "COMPLETED" ? false : subtask.done,
    })),
  };
}
export function toggleSubtask(task: WeddingTask, index: number): WeddingTask {
  const subtasks = task.subtasks.map((item, i) =>
    i === index ? { ...item, done: !item.done } : item,
  );
  return {
    ...task,
    subtasks,
    status: subtasks.every((item) => item.done)
      ? "COMPLETED"
      : subtasks.some((item) => item.done)
        ? "IN_PROGRESS"
        : "TODO",
  };
}

type Template = [
  string,
  string,
  string,
  number,
  boolean,
  string,
  string[],
  ("traditional" | "outdoor" | "useWo")?,
];
const templates: Template[] = [
  [
    "priorities",
    "Sepakati konsep dan prioritas",
    "Perencanaan",
    180,
    true,
    "Diskusikan bersama pasangan dan keluarga sebelum memilih layanan.",
    ["Tentukan rangkaian acara", "Sepakati tiga prioritas utama", "Bagi tanggung jawab"],
  ],
  [
    "budget",
    "Susun anggaran pernikahan",
    "Perencanaan",
    180,
    true,
    "Catat batas biaya, sumber dana, dan cadangan sesuai kemampuan bersama.",
    ["Sepakati total anggaran", "Bagi anggaran per kategori", "Siapkan dana cadangan"],
  ],
  [
    "guest-estimate",
    "Perkirakan jumlah tamu",
    "Tamu & undangan",
    180,
    true,
    "Jumlah tamu membantu menentukan kapasitas tempat dan kebutuhan konsumsi.",
    [
      "Daftar tamu kedua keluarga",
      "Pisahkan jumlah undangan dan orang",
      "Sepakati perkiraan total",
    ],
  ],
  [
    "venue",
    "Pilih dan konfirmasi venue",
    "Venue",
    150,
    true,
    "Periksa tanggal, kapasitas, fasilitas, akses, serta isi kesepakatan sebelum booking.",
    [
      "Survei tempat",
      "Cek ketersediaan tanggal",
      "Periksa fasilitas dan biaya",
      "Simpan konfirmasi booking",
    ],
  ],
  [
    "wo",
    "Pilih wedding organizer",
    "Acara & keluarga",
    150,
    false,
    "Sepakati layanan yang ditangani WO dan yang tetap menjadi tanggung jawab keluarga.",
    ["Bandingkan layanan", "Tentukan PIC", "Catat pembagian tugas"],
    "useWo",
  ],
  [
    "catering",
    "Booking catering",
    "Catering",
    120,
    true,
    "Pastikan kapasitas layanan, cakupan paket, dan ketentuan perubahan jumlah porsi.",
    ["Bandingkan paket", "Cek cakupan harga", "Konfirmasi booking"],
  ],
  [
    "photo",
    "Booking foto dan video",
    "Dokumentasi",
    120,
    false,
    "Sepakati durasi liputan, jumlah kru, hasil akhir, dan jadwal penyerahan.",
    ["Lihat portofolio", "Sepakati paket", "Konfirmasi booking"],
  ],
  [
    "decor",
    "Tentukan konsep dekorasi",
    "Dekorasi",
    90,
    false,
    "Sesuaikan konsep dengan ukuran venue dan anggaran yang disepakati.",
    ["Kumpulkan referensi", "Tinjau layout", "Konfirmasi rincian dekorasi"],
  ],
  [
    "mua",
    "Booking MUA dan busana",
    "Busana & MUA",
    120,
    false,
    "Catat kebutuhan setiap acara, jadwal rias, dan busana keluarga bila diperlukan.",
    ["Tentukan kebutuhan busana", "Pilih MUA", "Konfirmasi jadwal dan booking"],
  ],
  [
    "admin",
    "Konfirmasi persyaratan administrasi",
    "Administrasi",
    120,
    true,
    "Hubungi instansi atau tempat ibadah terkait untuk persyaratan dan jadwal yang berlaku bagi acara Anda.",
    ["Hubungi pihak terkait", "Catat dokumen yang diminta", "Jadwalkan pengurusan"],
  ],
  [
    "documents",
    "Lengkapi administrasi pernikahan",
    "Administrasi",
    60,
    true,
    "Gunakan daftar persyaratan yang sudah dikonfirmasi langsung, lalu cek kelengkapan bersama.",
    ["Lengkapi dokumen sesuai arahan", "Serahkan sesuai prosedur", "Konfirmasi proses dan jadwal"],
  ],
  [
    "rings",
    "Siapkan cincin dan perlengkapan seremoni",
    "Acara & keluarga",
    60,
    false,
    "Sesuaikan perlengkapan dengan rangkaian acara yang dipilih.",
    ["Daftar perlengkapan", "Cek ukuran dan pesanan", "Tentukan penanggung jawab"],
  ],
  [
    "tradition",
    "Siapkan kebutuhan acara adat",
    "Acara & keluarga",
    75,
    false,
    "Diskusikan kebutuhan adat dengan keluarga dan pihak yang memandu acara.",
    ["Sepakati rangkaian adat", "Daftar perlengkapan", "Konfirmasi petugas dan keluarga"],
    "traditional",
  ],
  [
    "tasting",
    "Food tasting dan pilihan menu",
    "Catering",
    60,
    false,
    "Catat menu, pantangan makanan tamu yang diketahui, dan hasil kesepakatan.",
    ["Jadwalkan tasting", "Pilih menu", "Catat kebutuhan khusus"],
  ],
  [
    "invites",
    "Siapkan dan kirim undangan",
    "Tamu & undangan",
    45,
    false,
    "Periksa nama, tanggal, lokasi, tautan peta, dan kontak konfirmasi sebelum dikirim.",
    ["Finalisasi daftar tamu", "Periksa isi undangan", "Kirim undangan"],
  ],
  [
    "souvenirs",
    "Siapkan souvenir",
    "Tamu & undangan",
    45,
    false,
    "Sesuaikan jumlah dan pilihan dengan kebutuhan; lewati jika tidak digunakan.",
    ["Pilih souvenir", "Konfirmasi jumlah", "Cek hasil pesanan"],
  ],
  [
    "music",
    "Finalisasi MC dan musik",
    "Acara & keluarga",
    30,
    false,
    "Berikan panduan penyebutan nama dan pilihan lagu sesuai suasana acara.",
    ["Konfirmasi MC", "Pilih daftar lagu", "Kirim panduan acara"],
  ],
  [
    "fitting",
    "Fitting akhir busana",
    "Busana & MUA",
    21,
    false,
    "Coba busana beserta sepatu dan aksesori agar perubahan dapat diselesaikan.",
    ["Jadwalkan fitting", "Cek penyesuaian", "Konfirmasi pengambilan"],
  ],
  [
    "rsvp",
    "Konfirmasi kehadiran tamu",
    "Tamu & undangan",
    14,
    false,
    "Perbarui perkiraan hadir untuk membantu konsumsi dan penataan tempat.",
    [
      "Hubungi tamu yang belum menjawab",
      "Perbarui jumlah hadir",
      "Atur tempat duduk bila diperlukan",
    ],
  ],
  [
    "transport",
    "Atur transportasi dan penginapan",
    "Tamu & undangan",
    21,
    false,
    "Utamakan kebutuhan keluarga atau tamu yang datang dari luar kota.",
    ["Catat kebutuhan", "Konfirmasi reservasi", "Bagikan informasi perjalanan"],
  ],
  [
    "rundown",
    "Finalisasi rundown acara",
    "Acara & keluarga",
    14,
    true,
    "Susun urutan acara, jam mulai, durasi, dan penanggung jawab setiap bagian.",
    ["Susun urutan acara", "Sepakati bersama keluarga", "Bagikan ke vendor dan PIC"],
  ],
  [
    "meeting",
    "Technical meeting vendor dan keluarga",
    "Acara & keluarga",
    14,
    true,
    "Cocokkan rundown dengan kesiapan tempat dan jadwal setiap vendor.",
    ["Undang semua PIC", "Bahas akses dan waktu persiapan", "Catat hasil pertemuan"],
  ],
  [
    "portions",
    "Konfirmasi jumlah porsi final",
    "Catering",
    7,
    true,
    "Ikuti tenggat perubahan dari vendor; sesuaikan tanggal tugas jika kesepakatannya berbeda.",
    ["Cek estimasi hadir", "Konfirmasi porsi dengan vendor", "Simpan kesepakatan akhir"],
  ],
  [
    "payments",
    "Periksa pembayaran vendor",
    "Perencanaan",
    7,
    true,
    "Cek tagihan dan tenggat tiap pesanan. Pembayaran dan kesiapan layanan perlu diperiksa terpisah.",
    ["Periksa tagihan tersisa", "Cocokkan bukti pembayaran", "Catat tenggat sesuai kesepakatan"],
  ],
  [
    "rain",
    "Siapkan rencana cadangan outdoor",
    "Venue",
    14,
    true,
    "Sepakati tempat alternatif dan siapa yang memutuskan perubahan saat kondisi tidak mendukung.",
    ["Tentukan tempat cadangan", "Cek perlindungan peralatan", "Bagikan rencana ke PIC"],
    "outdoor",
  ],
  [
    "contacts",
    "Bagikan kontak dan tugas hari H",
    "Hari H",
    3,
    true,
    "Tunjuk PIC agar pasangan tidak perlu menangani seluruh koordinasi saat acara.",
    ["Daftar kontak vendor", "Tentukan PIC keluarga", "Bagikan rundown final"],
  ],
  [
    "kit",
    "Siapkan perlengkapan pribadi",
    "Hari H",
    2,
    false,
    "Siapkan barang yang Anda perlukan dan simpan di tempat yang mudah dijangkau PIC.",
    ["Busana dan aksesori", "Perlengkapan pribadi", "Air minum dan barang cadangan"],
  ],
  [
    "handover",
    "Cek kesiapan terakhir",
    "Hari H",
    1,
    true,
    "Lakukan pengecekan bersama PIC, kemudian sisihkan waktu istirahat.",
    ["Konfirmasi kedatangan vendor", "Cek perlengkapan seremoni", "Serahkan barang ke PIC"],
  ],
  [
    "returns",
    "Kembalikan barang sewa",
    "Setelah acara",
    -2,
    false,
    "Ikuti waktu pengembalian dalam kesepakatan penyewaan.",
    ["Cek barang dan kelengkapan", "Kembalikan barang", "Simpan bukti pengembalian"],
  ],
  [
    "settlement",
    "Selesaikan administrasi dan tagihan akhir",
    "Setelah acara",
    -7,
    false,
    "Cocokkan layanan yang diterima dengan kesepakatan dan catat penyelesaian tagihan.",
    ["Periksa tagihan akhir", "Selesaikan kewajiban", "Arsipkan bukti"],
  ],
  [
    "delivery",
    "Terima hasil foto dan video",
    "Setelah acara",
    -30,
    false,
    "Ubah tenggat sesuai jadwal penyerahan yang disepakati bersama vendor.",
    ["Konfirmasi jadwal penyerahan", "Cek hasil yang diterima", "Simpan salinan pribadi"],
  ],
  [
    "reviews",
    "Bagikan ulasan vendor",
    "Setelah acara",
    -30,
    false,
    "Tuliskan pengalaman setelah layanan selesai untuk membantu pasangan lain.",
    ["Tinjau layanan yang diterima", "Berikan ulasan pada pesanan"],
  ],
];
export function createPlan(settings: PlanSettings): WeddingPlan {
  return {
    version: 1,
    settings,
    tasks: templates
      .filter((item) => !item[7] || settings[item[7]])
      .map(([id, title, category, daysBefore, important, guide, subtasks]) => ({
        id,
        title,
        category,
        daysBefore,
        important,
        guide,
        due: dateOffset(settings.date, -daysBefore),
        customDue: false,
        status: "TODO",
        assignee: "Saya",
        notes: "",
        vendor: "",
        orderId: "",
        subtasks: subtasks.map((title) => ({ title, done: false })),
      })),
  };
}
export function updateSettings(
  plan: WeddingPlan,
  settings: PlanSettings,
  shiftDates: boolean,
): WeddingPlan {
  const existing = new Set(plan.tasks.map((task) => task.id));
  const additions = createPlan(settings).tasks.filter((task) => !existing.has(task.id));
  return {
    ...plan,
    settings,
    tasks: [...(shiftDates ? reschedule(plan.tasks, settings.date) : plan.tasks), ...additions],
  };
}
export function parsePlan(raw: string): WeddingPlan {
  const plan = JSON.parse(raw) as WeddingPlan;
  const string = (value: unknown) => typeof value === "string";
  if (plan?.version !== 1 || !plan.settings || !Array.isArray(plan.tasks))
    throw new Error("Format rencana tidak valid.");
  const s = plan.settings;
  if (
    ![s.date, s.event, s.location].every(string) ||
    (s.date && !dateOffset(s.date, 0)) ||
    ![s.guests, s.budget].every((value) => Number.isFinite(value) && value >= 0) ||
    ![s.traditional, s.outdoor, s.useWo].every((value) => typeof value === "boolean")
  )
    throw new Error("Pengaturan rencana tidak valid.");
  const ids = new Set<string>();
  for (const t of plan.tasks) {
    if (
      !t ||
      ![t.id, t.title, t.category, t.guide, t.due, t.assignee, t.notes, t.vendor, t.orderId].every(
        string,
      ) ||
      !t.id ||
      ids.has(t.id) ||
      !Object.hasOwn(statuses, t.status) ||
      (t.due && !dateOffset(t.due, 0)) ||
      typeof t.customDue !== "boolean" ||
      typeof t.important !== "boolean" ||
      (t.daysBefore !== null && !Number.isFinite(t.daysBefore)) ||
      !Array.isArray(t.subtasks) ||
      !t.subtasks.every((item) => item && string(item.title) && typeof item.done === "boolean")
    )
      throw new Error("Data tugas tidak valid.");
    ids.add(t.id);
  }
  return plan;
}
