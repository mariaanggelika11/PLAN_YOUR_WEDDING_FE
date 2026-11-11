import { planningTaskText } from "./taskCopy.ts";
import { translateInterfaceText, type TranslationVariables } from "../../shared/i18n/translate.ts";
import { jsPDF } from "jspdf";
import { isPending, statuses, taskSummary, type PlanSettings, type WeddingTask } from "./model.ts";

interface PlanningPdfInput {
  settings: PlanSettings;
  tasks: WeddingTask[];
  exportedOn: string;
  locale?: "id" | "en";
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

function displayDate(date: string, locale: "id" | "en" = "id") {
  return date
    ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${date}T00:00:00`))
    : locale === "en"
      ? "Not set"
      : "Belum ditentukan";
}

/** Text-only rendering keeps user notes as text; it never interprets HTML or remote resources. */
export function createPlanningPdf(
  { settings, tasks, exportedOn, locale = "id" }: PlanningPdfInput,
  fonts: PdfFonts,
) {
  const translateUI = (text: string, variables?: TranslationVariables) =>
    translateInterfaceText(text, locale, variables);
  const pdf = new jsPDF({ format: "a4", unit: "mm", compress: true, putOnlyUsedFonts: true });
  pdf.addFileToVFS("NotoSans-Regular.ttf", fonts.regular);
  pdf.addFileToVFS("NotoSans-Bold.ttf", fonts.bold);
  pdf.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  pdf.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
  pdf.setProperties({ title: translateUI("Persiapan Pernikahan"), author: "Plan Your Wedding" });
  let y = 24;

  function newPage() {
    pdf.addPage();
    pdf.setFont("NotoSans", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(muted);
    pdf.text(translateUI("PERSIAPAN PERNIKAHAN · LANJUTAN"), margin, 15);
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
  paragraph(translateUI("Persiapan Pernikahan"), 23, true);
  paragraph(
    translateUI("Diunduh pada {0} · Salinan seluruh tugas", { 0: displayDate(exportedOn, locale) }),
    9,
    false,
    muted,
  );
  y += 5;
  paragraph(translateUI("Rencana acara"), 13, true, blush);
  paragraph(translateUI("Tanggal pernikahan: {0}", { 0: displayDate(settings.date, locale) }));
  paragraph(
    translateUI("Rangkaian acara: {0}", {
      0: settings.event.replaceAll("_", " ") || "Belum ditentukan",
    }),
  );
  paragraph(translateUI("Lokasi: {0}", { 0: settings.location || "Belum ditentukan" }));
  paragraph(
    translateUI("Perkiraan tamu: {0}", {
      0: settings.guests
        ? `${settings.guests.toLocaleString(locale === "en" ? "en-GB" : "id-ID")} orang`
        : "Belum ditentukan",
    }),
  );
  paragraph(
    translateUI("Target anggaran: {0}", {
      0: settings.budget
        ? new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(settings.budget)
        : "Belum ditentukan",
    }),
  );
  const needs = [
    settings.traditional && translateUI("Acara adat"),
    settings.outdoor && "Outdoor",
    settings.useWo && "Wedding organizer",
  ].filter(Boolean);
  if (needs.length) paragraph(translateUI("Kebutuhan tambahan: {0}", { 0: needs.join(", ") }));
  y += 3;
  paragraph(translateUI("Progres persiapan"), 13, true, blush);
  paragraph(
    translateUI("{0} dari {1} tugas yang diperlukan selesai ({2}%).", {
      0: summary.completed,
      1: summary.total,
      2: summary.percent,
    }),
  );
  paragraph(
    translateUI("{0} tugas perlu dikerjakan · {1} lewat tenggat.", {
      0: tasks.filter(isPending).length,
      1: tasks.filter((task) => isPending(task) && task.due && task.due < exportedOn).length,
    }),
    10,
    false,
    muted,
  );
  paragraph(
    translateUI("Tugas berstatus Tidak diperlukan tidak dihitung dalam persentase progres."),
    9,
    false,
    muted,
  );
  y += 3;
  paragraph(translateUI("Tentang tenggat tugas"), 11, true);
  paragraph(
    translateUI(
      "Tenggat awal tugas template dihitung dari tanggal pernikahan berdasarkan panduan persiapan. Kamu bisa mengubahnya di detail tugas sesuai kebutuhan atau kesepakatan vendor.",
    ),
    9,
    false,
    muted,
  );
  y += 5;
  paragraph(translateUI("Checklist persiapan · {0} tugas", { 0: tasks.length }), 14, true, blush);
  if (!tasks.length) paragraph(translateUI("Belum ada tugas persiapan."), 10, false, muted);

  tasks.forEach((task, index) => {
    space(35);
    pdf.setDrawColor("#e7e5e4");
    pdf.line(margin, y, margin + textWidth, y);
    y += 7;
    paragraph(`${index + 1}. ${planningTaskText(task, task.title, locale)}`, 12, true);
    paragraph(
      `${translateUI(task.category)} · ${translateUI(statuses[task.status])}${task.important ? ` · ${translateUI("Penting")}` : ""}`,
      9,
      false,
      muted,
    );
    const overdue = isPending(task) && task.due && task.due < exportedOn;
    paragraph(
      translateUI("Tenggat: {0}{1}", {
        0: displayDate(task.due, locale),
        1: overdue ? translateUI(" · Lewat tenggat") : "",
      }),
      10,
      false,
      overdue ? "#92400e" : ink,
    );
    if (task.due && task.customDue)
      paragraph(translateUI("Tenggat diatur sendiri."), 9, false, muted);
    else if (task.daysBefore !== null && !task.customDue) {
      const timing =
        task.daysBefore === 0
          ? translateUI("pada hari pernikahan")
          : translateUI("{0} hari {1} pernikahan", {
              0: Math.abs(task.daysBefore),
              1: translateUI(task.daysBefore > 0 ? "sebelum" : "setelah"),
            });
      paragraph(translateUI("Patokan template: {0}.", { 0: timing }), 9, false, muted);
    }
    paragraph(
      translateUI("Penanggung jawab: {0}", { 0: task.assignee || translateUI("Belum ditugaskan") }),
      10,
    );
    if (task.vendor) paragraph(translateUI("Vendor / kontak: {0}", { 0: task.vendor }), 10);
    if (task.guide)
      paragraph(
        translateUI("Panduan: {0}", { 0: planningTaskText(task, task.guide, locale) }),
        9,
        false,
        muted,
      );
    if (task.subtasks.length) {
      space(13);
      paragraph(translateUI("Langkah persiapan"), 10, true);
      for (const item of task.subtasks)
        paragraph(`${item.done ? "[x]" : "[ ]"} ${planningTaskText(task, item.title, locale)}`, 9);
    }
    if (task.notes.trim()) {
      space(13);
      paragraph(translateUI("Catatan dan kesepakatan"), 10, true);
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
    pdf.text(translateUI("Halaman {0} dari {1}", { 0: page, 1: pages }), margin + textWidth, 288, {
      align: "right",
    });
  }
  return pdf;
}

let fontRequest: Promise<PdfFonts> | undefined;

async function fetchFont(filename: string) {
  const response = await fetch(`/fonts/noto-sans/${filename}`, {
    signal: AbortSignal.timeout(20_000),
  });
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
