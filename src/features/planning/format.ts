import { dateOffset, daysUntil, isPending, type WeddingTask } from "./model.ts";

export function displayDate(date: string, locale: "id" | "en" = "id") {
  return date
    ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${date}T00:00:00`))
    : locale === "en"
      ? "Date not set"
      : "Tanggal belum ditentukan";
}
export function dueLabel(task: WeddingTask, today: string, locale: "id" | "en" = "id") {
  if (!task.due) return locale === "en" ? "No deadline" : "Belum ada tenggat";
  if (!isPending(task)) return displayDate(task.due, locale);
  if (task.due < today)
    return `${locale === "en" ? "Overdue" : "Lewat tenggat"} · ${displayDate(task.due, locale)}`;
  if (task.due === today) return locale === "en" ? "Due today" : "Jatuh tempo hari ini";
  if (task.due <= dateOffset(today, 7))
    return locale === "en"
      ? `${daysUntil(task.due, today)} days left`
      : `${daysUntil(task.due, today)} hari lagi`;
  return displayDate(task.due, locale);
}

export function dueGuidance(
  task: WeddingTask,
  weddingDate: string,
  today: string,
  locale: "id" | "en" = "id",
) {
  if (locale === "en") {
    if (task.customDue)
      return task.due
        ? "You set this deadline yourself. Adjust it as needed."
        : "Choose a deadline based on your needs or vendor agreement.";
    if (task.daysBefore === null) return "Set a deadline based on your needs or vendor agreement.";
    if (!weddingDate)
      return "Add your wedding date to your profile to calculate template deadlines.";
    const timing =
      task.daysBefore === 0
        ? "on your wedding day"
        : `${Math.abs(task.daysBefore)} days ${task.daysBefore > 0 ? "before" : "after"} your wedding date`;
    const guidance = `The initial deadline is based on ${timing}.`;
    return task.due && task.due < today && isPending(task)
      ? `${guidance} The suggested date has passed. Adjust the deadline to your preparation schedule.`
      : `${guidance} You can change the date as needed.`;
  }
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
