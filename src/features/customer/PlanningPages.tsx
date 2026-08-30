"use client";

import { notificationRepository } from "@/features/notifications/repository";
import { DashboardCard } from "@/shared/components/data-display/Cards";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppDatePicker, AppInput, AppSelect } from "@/shared/components/ui/FormFields";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { CalendarDays, Check, Circle, Plus, Sparkles } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

type WeddingTaskItem = {
  id: string;
  title: string;
  category: string;
  due: string;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
};

const initialWeddingTasks: WeddingTaskItem[] = [
  { id: "menu", title: "Finalisasi menu catering", category: "Catering", due: "2026-08-31", status: "IN_PROGRESS" },
  { id: "decor", title: "Konfirmasi konsep dekorasi", category: "Dekorasi", due: "2026-09-05", status: "TODO" },
  { id: "music", title: "Kirim daftar lagu", category: "Entertainment", due: "2026-09-12", status: "TODO" },
  { id: "photo", title: "Booking fotografer", category: "Dokumentasi", due: "2026-08-28", status: "COMPLETED" },
];

function Page({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <FeaturePage title={title} description={description} showHeader={false}>
      {children}
    </FeaturePage>
  );
}

export function ProgressPage() {
  // TODO API: Ganti data preview dengan wedding profile dan wedding tasks milik customer.
  const [tasks, setTasks] = useState(initialWeddingTasks);
  const [showForm, setShowForm] = useState(false);
  const completedCount = tasks.filter((task) => task.status === "COMPLETED").length;
  const inProgressCount = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const todoCount = tasks.filter((task) => task.status === "TODO").length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const title = String(values.get("title") ?? "").trim();
    const category = String(values.get("category") ?? "").trim();
    const due = String(values.get("due") ?? "");
    if (!title || !category || !due) return;
    setTasks((current) => [
      ...current,
      { id: `${Date.now()}`, title, category, due, status: "TODO" },
    ]);
    form.reset();
    setShowForm(false);
  }

  function toggleTask(id: string) {
    setTasks((current) => current.map((task) => task.id === id
      ? { ...task, status: task.status === "COMPLETED" ? "TODO" : "COMPLETED" }
      : task));
  }
  return (
    <Page title="Progress Wedding" description="Semua yang perlu disiapkan menuju hari pernikahan Anda.">
      <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-stone-500"><CalendarDays size={17} /> Minggu, 6 Desember 2026</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">98 hari menuju pernikahan</h2>
          </div>
          <AppButton onClick={() => setShowForm((current) => !current)}><Plus size={17} /> Tambah tugas</AppButton>
        </div>
        <div className="mt-8 flex items-end justify-between gap-4"><span className="text-sm font-medium text-stone-600">Progress keseluruhan</span><strong className="text-3xl text-blush">{progress}%</strong></div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-rose-100"><div className="h-full rounded-full bg-blush transition-all" style={{ width: `${progress}%` }} /></div>
        <div className="mt-5 grid grid-cols-3 divide-x rounded-2xl bg-stone-50 p-4 text-center">
          <ProgressCount label="Selesai" value={String(completedCount)} />
          <ProgressCount label="Berjalan" value={String(inProgressCount)} />
          <ProgressCount label="Belum mulai" value={String(todoCount)} />
        </div>
      </section>

      {showForm && (
        <form className="grid gap-4 rounded-3xl border bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6" onSubmit={addTask}>
          <div className="sm:col-span-2"><h2 className="text-lg font-semibold">Tambah tugas persiapan</h2><p className="mt-1 text-sm text-stone-500">Data sementara dan belum tersimpan ke backend.</p></div>
          <AppInput label="Nama tugas" name="title" required />
          <AppSelect defaultValue="" label="Kategori" name="category" required>
            <option disabled value="">Pilih kategori</option>
            {["Catering", "Dekorasi", "Dokumentasi", "Entertainment", "Pakaian", "Undangan", "Lainnya"].map((category) => <option key={category}>{category}</option>)}
          </AppSelect>
          <AppDatePicker label="Tenggat" name="due" required />
          <div className="flex items-end justify-end gap-2"><AppButton onClick={() => setShowForm(false)} type="button" variant="secondary">Batal</AppButton><AppButton type="submit">Simpan tugas</AppButton></div>
        </form>
      )}

      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5 sm:p-6">
          <div><h2 className="text-lg font-semibold">Checklist persiapan</h2><p className="mt-1 text-sm text-stone-500">Selesaikan tugas satu per satu.</p></div>
        </div>
        <div className="divide-y">
          {tasks.map((task) => <WeddingTask key={task.id} onToggle={() => toggleTask(task.id)} {...task} />)}
        </div>
      </section>
    </Page>
  );
}

function ProgressCount({ label, value }: { label: string; value: string }) {
  return <div><strong className="text-xl text-ink">{value}</strong><p className="mt-1 text-xs text-stone-500">{label}</p></div>;
}

function WeddingTask({ category, due, onToggle, status, title }: WeddingTaskItem & { onToggle: () => void }) {
  const completed = status === "COMPLETED";
  return <article className="flex items-center gap-4 p-4 sm:px-6"><button aria-label={completed ? `Batalkan tanda selesai untuk ${title}` : `Tandai ${title} selesai`} className={`grid size-9 shrink-0 place-items-center rounded-full border-2 transition ${completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-stone-300 text-stone-300 hover:border-blush hover:text-blush"}`} onClick={onToggle} type="button">{completed ? <Check size={17} /> : <Circle size={13} />}</button><div className="min-w-0 flex-1"><h3 className={`truncate text-sm font-semibold ${completed ? "text-stone-400 line-through" : "text-ink"}`}>{title}</h3><p className="mt-1 text-xs text-stone-500">{category} · {formatTaskDate(due)}</p></div><StatusBadge status={status} /></article>;
}

function formatTaskDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
export function BudgetPage() {
  return (
    <Page title="Budget Management" description="Bandingkan rencana dan realisasi biaya wedding.">
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard label="Total budget" value={formatCurrency(250000000)} />
        <DashboardCard label="Rencana" value={formatCurrency(210000000)} />
        <DashboardCard label="Aktual" value={formatCurrency(168000000)} />
        <DashboardCard label="Sisa" value={formatCurrency(82000000)} />
      </div>
      <DataTable
        columns={["Kategori", "Rencana", "Aktual", "Terkait pesanan"]}
        rows={[
          ["Decoration", formatCurrency(50000000), formatCurrency(45000000), "PYW-260601"],
          ["Catering", formatCurrency(90000000), formatCurrency(85000000), "PYW-260602"],
        ]}
      />
    </Page>
  );
}
export function NotificationPage() {
  /* TODO API: Ambil daftar notifikasi user dan tandai notifikasi sebagai read */ return (
    <Page title="Notifikasi" description="Pembaruan penting mengenai booking dan pembayaran.">
      <div className="grid gap-3">
        {notificationRepository.list().map((n) => (
          <article className="flex gap-4 rounded-3xl border bg-white p-5 shadow-sm" key={n.id}>
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-rose-50 text-blush">
              <Sparkles size={18} />
            </span>
            <div>
              <h3 className="font-semibold">{n.title}</h3>
              <p className="mt-1 text-sm text-stone-500">{n.message}</p>
              <button className="mt-2 text-xs font-semibold text-blush">Tandai sudah dibaca</button>
            </div>
          </article>
        ))}
      </div>
    </Page>
  );
}
