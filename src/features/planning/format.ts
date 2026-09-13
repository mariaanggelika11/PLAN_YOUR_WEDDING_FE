import { dateOffset, daysUntil, isPending, type WeddingTask } from "./model";

export function displayDate(date: string) {
  return date
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(`${date}T00:00:00`),
      )
    : "Tanggal belum ditentukan";
}
export function dueLabel(task: WeddingTask, today: string) {
  if (!task.due) return "Belum ada tenggat";
  if (!isPending(task)) return displayDate(task.due);
  if (task.due < today) return `Lewat tenggat · ${displayDate(task.due)}`;
  if (task.due === today) return "Jatuh tempo hari ini";
  if (task.due <= dateOffset(today, 7)) return `${daysUntil(task.due, today)} hari lagi`;
  return displayDate(task.due);
}

export function dueGuidance(task: WeddingTask, weddingDate: string, today: string) {
  if (task.customDue) {
    return task.due
      ? "Tenggat ini sudah kamu atur sendiri. Kamu bisa mengubahnya sesuai kebutuhan."
      : "Pilih tanggal tenggat sesuai kebutuhan atau kesepakatan vendor.";
  }
  if (task.daysBefore === null) {
    return "Kamu bisa mengatur tenggat sesuai kebutuhan atau kesepakatan vendor.";
  }
  if (!weddingDate) {
    return "Isi tanggal pernikahan di profil agar tenggat template bisa dihitung.";
  }
  const timing =
    task.daysBefore === 0
      ? "pada hari pernikahanmu"
      : `${Math.abs(task.daysBefore)} hari ${task.daysBefore > 0 ? "sebelum" : "setelah"} tanggal pernikahanmu`;
  const guidance = `Tenggat awal menggunakan patokan ${timing}.`;
  return task.due && task.due < today && isPending(task)
    ? `${guidance} Tanggal panduan sudah terlewati. Kamu bisa menyesuaikan tenggat dengan waktu persiapanmu.`
    : `${guidance} Kamu bisa mengubah tanggalnya sesuai kebutuhan.`;
}
