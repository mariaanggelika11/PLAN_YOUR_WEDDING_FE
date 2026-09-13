import { jsPDF } from "jspdf";
import { isPending, statuses, taskSummary, type PlanSettings, type WeddingTask } from "./model.ts";

interface PlanningPdfInput {
  settings: PlanSettings;
  tasks: WeddingTask[];
  exportedOn: string;
}

interface PdfFonts {
  regular: string;
  bold: string;
}

const margin = 18;
const pageBottom = 276;
const textWidth = 174;
const ink = "#292524";
const muted = "#57534e";
const blush = "#9d5268";

function displayDate(date: string) {
  return date
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(`${date}T00:00:00`),
      )
    : "Belum ditentukan";
}

/** Text-only rendering keeps user notes as text; it never interprets HTML or remote resources. */
export function createPlanningPdf(
  { settings, tasks, exportedOn }: PlanningPdfInput,
  fonts: PdfFonts,
) {
  const pdf = new jsPDF({ format: "a4", unit: "mm", compress: true, putOnlyUsedFonts: true });
  pdf.addFileToVFS("NotoSans-Regular.ttf", fonts.regular);
  pdf.addFileToVFS("NotoSans-Bold.ttf", fonts.bold);
  pdf.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  pdf.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
  pdf.setProperties({ title: "Persiapan Pernikahan", author: "Plan Your Wedding" });
  let y = 24;

  function newPage() {
    pdf.addPage();
    pdf.setFont("NotoSans", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(muted);
    pdf.text("PERSIAPAN PERNIKAHAN · LANJUTAN", margin, 15);
    y = 27;
  }

  function space(height: number) {
    if (y + height > pageBottom) newPage();
  }

  function paragraph(value: string, size = 10, bold = false, color = ink) {
    const clean = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
    pdf.setFont("NotoSans", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines: string[] = pdf.splitTextToSize(clean, textWidth);
    const lineHeight = size * 0.48;
    for (const line of lines) {
      space(lineHeight);
      pdf.setFont("NotoSans", bold ? "bold" : "normal");
      pdf.setFontSize(size);
      pdf.setTextColor(color);
      pdf.text(line, margin, y);
      y += lineHeight;
    }
    y += 2;
  }

  const summary = taskSummary(tasks);
  paragraph("PLAN YOUR WEDDING", 9, true, blush);
  paragraph("Persiapan Pernikahan", 23, true);
  paragraph(`Diunduh pada ${displayDate(exportedOn)} · Salinan seluruh tugas`, 9, false, muted);
  y += 5;
  paragraph("Rencana acara", 13, true, blush);
  paragraph(`Tanggal pernikahan: ${displayDate(settings.date)}`);
  paragraph(`Rangkaian acara: ${settings.event.replaceAll("_", " ") || "Belum ditentukan"}`);
  paragraph(`Lokasi: ${settings.location || "Belum ditentukan"}`);
  paragraph(
    `Perkiraan tamu: ${settings.guests ? `${settings.guests.toLocaleString("id-ID")} orang` : "Belum ditentukan"}`,
  );
  paragraph(
    `Target anggaran: ${settings.budget ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(settings.budget) : "Belum ditentukan"}`,
  );
  const needs = [
    settings.traditional && "Acara adat",
    settings.outdoor && "Outdoor",
    settings.useWo && "Wedding organizer",
  ].filter(Boolean);
  if (needs.length) paragraph(`Kebutuhan tambahan: ${needs.join(", ")}`);
  y += 3;
  paragraph("Progres persiapan", 13, true, blush);
  paragraph(
    `${summary.completed} dari ${summary.total} tugas yang diperlukan selesai (${summary.percent}%).`,
  );
  paragraph(
    `${tasks.filter(isPending).length} tugas perlu dikerjakan · ${tasks.filter((task) => isPending(task) && task.due && task.due < exportedOn).length} lewat tenggat.`,
    10,
    false,
    muted,
  );
  paragraph(
    "Tugas berstatus Tidak diperlukan tidak dihitung dalam persentase progres.",
    9,
    false,
    muted,
  );
  y += 3;
  paragraph("Tentang tenggat tugas", 11, true);
  paragraph(
    "Tenggat awal tugas template dihitung dari tanggal pernikahan berdasarkan panduan persiapan. Kamu bisa mengubahnya di detail tugas sesuai kebutuhan atau kesepakatan vendor.",
    9,
    false,
    muted,
  );
  y += 5;
  paragraph(`Checklist persiapan · ${tasks.length} tugas`, 14, true, blush);
  if (!tasks.length) paragraph("Belum ada tugas persiapan.", 10, false, muted);

  tasks.forEach((task, index) => {
    space(35);
    pdf.setDrawColor("#e7e5e4");
    pdf.line(margin, y, margin + textWidth, y);
    y += 7;
    paragraph(`${index + 1}. ${task.title}`, 12, true);
    paragraph(
      `${task.category} · ${statuses[task.status]}${task.important ? " · Penting" : ""}`,
      9,
      false,
      muted,
    );
    const overdue = isPending(task) && task.due && task.due < exportedOn;
    paragraph(
      `Tenggat: ${displayDate(task.due)}${overdue ? " · Lewat tenggat" : ""}`,
      10,
      false,
      overdue ? "#92400e" : ink,
    );
    if (task.due && task.customDue) paragraph("Tenggat diatur sendiri.", 9, false, muted);
    else if (task.daysBefore !== null && !task.customDue) {
      const timing =
        task.daysBefore === 0
          ? "pada hari pernikahan"
          : `${Math.abs(task.daysBefore)} hari ${task.daysBefore > 0 ? "sebelum" : "setelah"} pernikahan`;
      paragraph(`Patokan template: ${timing}.`, 9, false, muted);
    }
    paragraph(`Penanggung jawab: ${task.assignee || "Belum ditugaskan"}`, 10);
    if (task.vendor) paragraph(`Vendor / kontak: ${task.vendor}`, 10);
    if (task.guide) paragraph(`Panduan: ${task.guide}`, 9, false, muted);
    if (task.subtasks.length) {
      space(13);
      paragraph("Langkah persiapan", 10, true);
      for (const item of task.subtasks) paragraph(`${item.done ? "[x]" : "[ ]"} ${item.title}`, 9);
    }
    if (task.notes.trim()) {
      space(13);
      paragraph("Catatan dan kesepakatan", 10, true);
      paragraph(task.notes, 9);
    }
    y += 5;
  });

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setFont("NotoSans", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(muted);
    pdf.text("Plan Your Wedding", margin, 288);
    pdf.text(`Halaman ${page} dari ${pages}`, margin + textWidth, 288, { align: "right" });
  }
  return pdf;
}

let fontRequest: Promise<PdfFonts> | undefined;

async function fetchFont(filename: string) {
  const response = await fetch(`/fonts/noto-sans/${filename}`);
  if (!response.ok) throw new Error("Font PDF belum dapat dimuat. Silakan coba unduh kembali.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  return btoa(binary);
}

function loadFonts() {
  if (!fontRequest) {
    fontRequest = Promise.allSettled([
      fetchFont("NotoSans-Regular.ttf"),
      fetchFont("NotoSans-Bold.ttf"),
    ])
      .then((results) => {
        const [regular, bold] = results.map((result) => {
          if (result.status === "rejected") throw result.reason;
          return result.value;
        });
        return { regular, bold };
      })
      .catch((error: unknown) => {
        fontRequest = undefined;
        throw error;
      });
  }
  return fontRequest;
}

export async function downloadPlanningPdf(input: PlanningPdfInput) {
  const fonts = await loadFonts();
  const pdf = createPlanningPdf(input, fonts);
  await pdf.save(`persiapan-pernikahan-${input.exportedOn}.pdf`, { returnPromise: true });
}
