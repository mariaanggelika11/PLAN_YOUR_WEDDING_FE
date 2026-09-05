"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Download,
  Flag,
  Heart,
  Plus,
  Search,
  Settings2,
  ClipboardCheck,
  X,
} from "lucide-react";
import { useProfileData } from "@/features/profile/context/ProfileProvider";
import type { CustomerApiProfile } from "@/features/profile/types";
import { getOrders } from "@/features/orders/repository";
import type { Order } from "@/features/orders/types";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppDatePicker, AppInput, AppSelect, AppTextarea } from "@/shared/components/ui/FormFields";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { ROUTES } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import {
  categories,
  createPlan,
  dateOffset,
  daysUntil,
  focusTasks,
  isPending,
  parsePlan,
  setTaskStatus,
  statuses,
  taskSummary,
  todayDate,
  toggleSubtask,
  updateSettings,
  type PlanSettings,
  type TaskStatus,
  type WeddingPlan,
  type WeddingTask,
} from "./model";

export function ProgressPage() {
  const profile = useProfileData("customer");
  if (profile.loading) return <LoadingSkeleton />;
  if (profile.error) return <ErrorState retry={() => void profile.reload()} />;
  if (!profile.data)
    return (
      <div>
        <EmptyState
          title="Lengkapi profil pernikahan"
          description="Isi profil customer untuk mulai menyiapkan rencana pernikahan."
        />
        <AppButton asChild>
          <Link href={ROUTES.customer.profile}>Lengkapi profil</Link>
        </AppButton>
      </div>
    );
  return <Planner key={profile.data.user.id} profile={profile.data} />;
}

function Planner({ profile }: { profile: CustomerApiProfile }) {
  const storageKey = `pyw-wedding-plan:v1:${profile.user.id}`;
  const [plan, setPlan] = useState<WeddingPlan | null>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [category, setCategory] = useState("");
  const [today, setToday] = useState(todayDate);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayDate()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setPlan(parsePlan(raw));
    } catch {
      setStorageError(
        "Rencana tersimpan tidak dapat dibaca. Muat ulang untuk mencoba lagi. Membuat rencana baru akan mengganti salinan di browser ini.",
      );
    }
    setReady(true);
  }, [storageKey]);
  function save(next: WeddingPlan) {
    setPlan(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError(
        "Perubahan belum tersimpan. Penyimpanan browser tidak tersedia atau penuh. Unduh salinan sebelum meninggalkan halaman.",
      );
    }
  }
  function patch(task: WeddingTask) {
    if (plan)
      save({ ...plan, tasks: plan.tasks.map((item) => (item.id === task.id ? task : item)) });
  }
  function download() {
    if (!plan) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `persiapan-pernikahan-${today}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const defaultSettings: PlanSettings = {
    date: dateOffset(profile.weddingDate?.slice(0, 10) ?? "", 0),
    event: profile.eventType ?? "",
    guests: profile.estimatedGuests ?? 0,
    budget: profile.estimatedBudget ?? 0,
    location: profile.weddingLocation ?? "",
    traditional: false,
    outdoor: false,
    useWo: false,
  };
  if (!ready) return <LoadingSkeleton />;
  const summary = taskSummary(plan?.tasks ?? []);
  const pending = plan?.tasks.filter(isPending) ?? [];
  const late = pending.filter((task) => task.due && task.due < today);
  const urgent = pending.filter((task) => task.important);
  const focus = focusTasks(plan?.tasks ?? [], today);
  const days = plan?.settings.date ? daysUntil(plan.settings.date, today) : null;
  const selectedTask = plan?.tasks.find((task) => task.id === selected);
  const visible = (plan?.tasks ?? []).filter(
    (task) =>
      (!category || task.category === category) &&
      (!search ||
        `${task.title} ${task.assignee} ${task.notes}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (filter === "ALL" ||
        (filter === "LATE"
          ? isPending(task) && task.due && task.due < today
          : task.status === filter)),
  );
  const visibleCategories = [...new Set(visible.map((task) => task.category))];
  return (
    <FeaturePage
      title="Persiapan pernikahan"
      description="Langkah kecil menuju hari istimewa."
      showHeader={false}
    >
      <div className="grid gap-6">
        {storageError && (
          <div
            role="alert"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {storageError}
          </div>
        )}
        {!plan ? (
          <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6 sm:p-10">
            <span className="inline-flex rounded-2xl bg-white p-3 text-blush shadow-sm">
              <Heart size={28} />
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-blush">
              Rencana untuk hari istimewamu
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight text-ink">
              Persiapan pernikahan, satu langkah setiap hari.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-stone-600">
              Mulai dengan template dari perencanaan awal hingga setelah acara. Sesuaikan dengan
              kebutuhanmu, bagi tanggung jawab, dan centang setiap kemajuan.
            </p>
            <div className="my-7 grid gap-3 sm:grid-cols-3">
              {[
                "Checklist siap disesuaikan",
                "Tenggat mengikuti hari acara",
                "Catatan dan pesanan dalam tugas",
              ].map((label) => (
                <div key={label} className="flex gap-2 rounded-xl border bg-white/80 p-4 text-sm">
                  <Check size={18} className="shrink-0 text-blush" />
                  {label}
                </div>
              ))}
            </div>
            <AppButton onClick={() => setSettingsOpen(true)}>
              <ClipboardCheck size={17} /> Buat checklist pernikahanku
            </AppButton>
            <p className="mt-4 text-xs leading-5 text-stone-500">
              Tersimpan di browser ini untuk akunmu. Belum tersinkron ke perangkat lain.
            </p>
          </section>
        ) : (
          <>
            <section className="overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blush">
                    <Heart size={16} /> Persiapan pernikahan
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">
                    {days === null
                      ? "Hari istimewamu dimulai dari sini"
                      : days > 0
                        ? `${days} hari menuju hari istimewa`
                        : days === 0
                          ? "Selamat menikmati hari pernikahanmu!"
                          : "Lengkapi langkah setelah pernikahan"}
                  </h2>
                  <p className="mt-3 flex items-center gap-2 text-sm text-stone-500">
                    <CalendarDays size={16} />
                    {displayDate(plan.settings.date)}
                    {plan.settings.event && ` · ${plan.settings.event.replaceAll("_", " ")}`}
                  </p>
                </div>
                <AppButton variant="secondary" onClick={() => setSettingsOpen(true)}>
                  <Settings2 size={16} /> Atur rencana
                </AppButton>
              </div>
              <div className="mt-7 grid items-center gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">Tugas selesai</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {summary.completed} dari {summary.total} tugas yang diperlukan
                      </p>
                    </div>
                    <strong className="text-3xl font-semibold text-blush">
                      {summary.percent}%
                    </strong>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Tugas persiapan selesai"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={summary.percent}
                    className="mt-3 h-2.5 overflow-hidden rounded-full bg-rose-100"
                  >
                    <div
                      className="h-full rounded-full bg-blush transition-all"
                      style={{ width: `${summary.percent}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x rounded-2xl border bg-white/80 py-4 text-center">
                  <Count value={pending.length} label="Perlu dikerjakan" />
                  <Count value={late.length} label="Lewat tenggat" />
                  <Count value={urgent.length} label="Tugas penting" />
                </div>
              </div>
              {urgent.length > 0 && (
                <p className="mt-4 text-xs leading-5 text-stone-600">
                  Masih perlu perhatian:{" "}
                  {urgent
                    .slice(0, 2)
                    .map((task) => task.title.toLowerCase())
                    .join(" dan ")}
                  {urgent.length > 2 ? `, serta ${urgent.length - 2} tugas penting lainnya` : ""}.
                </p>
              )}
            </section>
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="grid min-w-0 gap-6">
                <section className="rounded-3xl border bg-white p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={19} className="text-blush" />
                    <h2 className="text-lg font-semibold text-ink">Fokus berikutnya</h2>
                  </div>
                  <p className="mt-1 text-sm text-stone-500">
                    Dahulukan yang lewat tenggat dan jatuh tempo dalam 7 hari.
                  </p>
                  <div className="mt-4 divide-y">
                    {focus.length ? (
                      focus.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => setSelected(task.id)}
                          className="flex w-full items-center gap-3 py-3 text-left hover:text-blush"
                        >
                          <span
                            className={`grid size-9 shrink-0 place-items-center rounded-xl ${task.due && task.due < today ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-blush"}`}
                          >
                            <Flag size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{task.title}</span>
                            <span className="mt-1 block text-xs text-stone-500">
                              {dueLabel(task, today)} · {task.assignee || "Belum ditugaskan"}
                            </span>
                          </span>
                          <ChevronRight size={17} />
                        </button>
                      ))
                    ) : (
                      <p className="py-4 text-sm text-emerald-700">
                        Semua tugas yang diperlukan sudah selesai. Kamu dapat menambah kebutuhan
                        lain di bawah.
                      </p>
                    )}
                  </div>
                </section>
                <section className="overflow-hidden rounded-3xl border bg-white">
                  <div className="grid gap-4 border-b p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-ink">Checklist persiapan</h2>
                        <p className="mt-1 text-sm text-stone-500">
                          Buka tugas untuk panduan, subtugas, dan catatan.
                        </p>
                      </div>
                      <AppButton variant="secondary" onClick={() => setAdding(true)}>
                        <Plus size={16} /> Tambah tugas
                      </AppButton>
                    </div>
                    <div className="grid items-start gap-3 sm:grid-cols-3 [&>label]:min-w-0">
                      <AppInput
                        className="h-12 min-w-0 w-full"
                        label="Cari tugas"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nama tugas, PIC, catatan"
                      />
                      <AppSelect
                        className="h-12 min-w-0 w-full"
                        label="Kategori"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="">Semua kategori</option>
                        {categories.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </AppSelect>
                      <AppSelect
                        className="h-12 min-w-0 w-full"
                        label="Status"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="ALL">Semua status</option>
                        <option value="LATE">Lewat tenggat</option>
                        {Object.entries(statuses).map(([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ))}
                      </AppSelect>
                    </div>
                  </div>
                  {visibleCategories.map((name) => (
                    <details
                      key={`${name}-${filter}-${search}`}
                      open={
                        name === visibleCategories[0] ||
                        filter !== "ALL" ||
                        Boolean(search) ||
                        Boolean(category)
                      }
                      className="group border-b last:border-0"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-stone-50/80 px-5 py-4 text-sm font-semibold sm:px-6">
                        <span>{name}</span>
                        <span className="flex items-center gap-3 text-xs font-normal text-stone-500">
                          {
                            taskSummary(plan.tasks.filter((task) => task.category === name))
                              .completed
                          }
                          /{taskSummary(plan.tasks.filter((task) => task.category === name)).total}{" "}
                          selesai
                          <ChevronRight size={15} className="transition group-open:rotate-90" />
                        </span>
                      </summary>
                      <div className="divide-y">
                        {visible
                          .filter((task) => task.category === name)
                          .map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 px-5 py-4 sm:px-6"
                            >
                              <input
                                type="checkbox"
                                aria-label={`Tandai ${task.title} selesai`}
                                checked={task.status === "COMPLETED"}
                                onChange={(e) =>
                                  patch(
                                    setTaskStatus(task, e.target.checked ? "COMPLETED" : "TODO"),
                                  )
                                }
                                className="size-5 shrink-0 accent-blush"
                              />
                              <button
                                onClick={() => setSelected(task.id)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <span
                                  className={`block text-sm font-medium ${task.status === "COMPLETED" || task.status === "SKIPPED" ? "text-stone-400 line-through" : "text-ink"}`}
                                >
                                  {task.title}
                                </span>
                                <span
                                  className={`mt-1 block text-xs ${isPending(task) && task.due && task.due < today ? "text-amber-700" : "text-stone-500"}`}
                                >
                                  {dueLabel(task, today)} · {task.assignee || "Belum ditugaskan"}
                                  {task.subtasks.length > 0 &&
                                    ` · ${task.subtasks.filter((item) => item.done).length}/${task.subtasks.length} langkah`}
                                </span>
                                <span className="mt-2 flex flex-wrap gap-2">
                                  {task.important && (
                                    <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] text-blush">
                                      Penting
                                    </span>
                                  )}
                                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">
                                    {statuses[task.status]}
                                  </span>
                                </span>
                              </button>
                              <button
                                aria-label={`Buka detail ${task.title}`}
                                onClick={() => setSelected(task.id)}
                                className="p-2 text-stone-400 hover:text-blush"
                              >
                                <ChevronRight size={18} />
                              </button>
                            </div>
                          ))}
                      </div>
                    </details>
                  ))}
                  {!visible.length && (
                    <div className="p-8 text-center">
                      <Search className="mx-auto text-stone-300" />
                      <p className="mt-3 text-sm text-stone-500">
                        Tidak ada tugas yang cocok dengan filter.
                      </p>
                      <AppButton
                        variant="ghost"
                        onClick={() => {
                          setSearch("");
                          setCategory("");
                          setFilter("ALL");
                        }}
                      >
                        Tampilkan semua tugas
                      </AppButton>
                    </div>
                  )}
                </section>
              </div>
              <aside className="grid gap-5">
                <section className="rounded-3xl border bg-white p-5">
                  <h2 className="font-semibold text-ink">Rencana acaramu</h2>
                  <dl className="mt-4 grid gap-4 text-sm">
                    <Info label="Lokasi" value={plan.settings.location || "Belum ditentukan"} />
                    <Info
                      label="Perkiraan tamu"
                      value={
                        plan.settings.guests
                          ? `${plan.settings.guests.toLocaleString("id-ID")} orang`
                          : "Belum ditentukan"
                      }
                    />
                    <Info
                      label="Target anggaran"
                      value={
                        plan.settings.budget
                          ? formatCurrency(plan.settings.budget)
                          : "Belum ditentukan"
                      }
                    />
                    <Info
                      label="Koordinasi"
                      value={
                        plan.settings.useWo
                          ? "Dibantu wedding organizer"
                          : "Mandiri / bersama keluarga"
                      }
                    />
                  </dl>
                  <p className="mt-5 border-t pt-4 text-xs leading-5 text-stone-500">
                    Tenggat template adalah panduan. Sesuaikan dengan kebutuhan dan kesepakatan
                    vendormu.
                  </p>
                </section>
                <section className="rounded-3xl bg-rose-50 p-5">
                  <h2 className="font-semibold text-ink">Lengkapi tim pernikahanmu</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Temukan vendor, lalu tautkan pesanan ke tugas yang ditangani. Vendor di luar
                    aplikasi juga bisa dicatat.
                  </p>
                  <AppButton asChild variant="secondary" className="mt-4 w-full">
                    <Link href={ROUTES.customer.marketplace}>
                      Cari vendor <ArrowRight size={16} />
                    </Link>
                  </AppButton>
                  <Link
                    className="mt-4 block text-center text-sm font-medium text-blush"
                    href={ROUTES.customer.orders}
                  >
                    Lihat pesanan & pembayaran
                  </Link>
                </section>
                <section className="rounded-2xl border border-dashed p-5">
                  <p className="text-xs leading-5 text-stone-500">
                    Checklist tersimpan di browser ini untuk akunmu, belum tersinkron
                    antarperangkat. Simpan salinan agar catatanmu tetap tersedia jika data browser
                    dihapus.
                  </p>
                  <AppButton variant="ghost" className="mt-2 px-0" onClick={download}>
                    <Download size={16} /> Unduh salinan
                  </AppButton>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
      {settingsOpen && (
        <Modal
          title={plan ? "Atur rencana pernikahan" : "Buat rencana pernikahanmu"}
          description="Sesuaikan template dengan acara dan kebutuhanmu."
          onClose={() => setSettingsOpen(false)}
        >
          <SettingsForm
            initial={plan?.settings ?? defaultSettings}
            existing={Boolean(plan)}
            onSave={(settings, shift) => {
              save(plan ? updateSettings(plan, settings, shift) : createPlan(settings));
              setSettingsOpen(false);
            }}
          />
        </Modal>
      )}
      {selectedTask && (
        <Modal
          title="Detail persiapan"
          description="Atur langkah, penanggung jawab, dan kebutuhan tugas ini."
          onClose={() => setSelected(null)}
        >
          <TaskEditor
            key={selectedTask.id}
            task={selectedTask}
            onSave={(task) => {
              patch(task);
              setSelected(null);
            }}
            onCancel={() => setSelected(null)}
          />
        </Modal>
      )}
      {adding && plan && (
        <Modal
          title="Tambah tugas persiapan"
          description="Tambahkan kebutuhan yang belum ada di template."
          onClose={() => setAdding(false)}
        >
          <TaskEditor
            task={{
              id: "",
              title: "",
              category: "Lainnya",
              guide: "",
              daysBefore: null,
              due: "",
              customDue: true,
              important: false,
              status: "TODO",
              assignee: "Saya",
              notes: "",
              vendor: "",
              orderId: "",
              subtasks: [],
            }}
            onSave={(task) => {
              save({ ...plan, tasks: [...plan.tasks, { ...task, id: crypto.randomUUID() }] });
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </Modal>
      )}
    </FeaturePage>
  );
}

function SettingsForm({
  initial,
  existing,
  onSave,
}: {
  initial: PlanSettings;
  existing: boolean;
  onSave: (settings: PlanSettings, shift: boolean) => void;
}) {
  const [settings, setSettings] = useState(initial);
  const [shift, setShift] = useState(true);
  function submit(e: FormEvent) {
    e.preventDefault();
    onSave(settings, shift);
  }
  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid items-start gap-4 sm:grid-cols-2 [&>label]:min-w-0">
        <AppDatePicker
          className="h-12 min-w-0 w-full"
          label="Tanggal pernikahan"
          helper="Boleh dikosongkan jika belum ditentukan."
          value={settings.date}
          onChange={(e) => setSettings({ ...settings, date: e.target.value })}
        />
        <AppInput
          className="h-12 min-w-0 w-full"
          label="Rangkaian acara"
          placeholder="Contoh: akad dan resepsi"
          value={settings.event}
          maxLength={150}
          onChange={(e) => setSettings({ ...settings, event: e.target.value })}
        />
        <AppInput
          className="h-12 min-w-0 w-full"
          label="Perkiraan tamu"
          type="number"
          min={0}
          step={1}
          value={settings.guests || ""}
          onChange={(e) => setSettings({ ...settings, guests: Number(e.target.value) })}
        />
        <AppInput
          className="h-12 min-w-0 w-full"
          label="Target anggaran (Rp)"
          type="number"
          min={0}
          step={1}
          value={settings.budget || ""}
          onChange={(e) => setSettings({ ...settings, budget: Number(e.target.value) })}
        />
        <div className="sm:col-span-2">
          <AppInput
            className="h-12 min-w-0 w-full"
            label="Lokasi acara"
            value={settings.location}
            maxLength={200}
            onChange={(e) => setSettings({ ...settings, location: e.target.value })}
          />
        </div>
      </div>
      <fieldset className="grid gap-3 rounded-2xl bg-stone-50 p-4">
        <legend className="text-sm font-semibold">Kebutuhan tambahan</legend>
        {(
          [
            ["traditional", "Ada rangkaian acara adat"],
            ["outdoor", "Acara di luar ruangan"],
            ["useWo", "Menggunakan wedding organizer"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <input
              className="size-4 accent-blush"
              type="checkbox"
              checked={settings[key]}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </fieldset>
      {existing && (
        <>
          <label className="flex items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-blush"
              checked={shift}
              onChange={(e) => setShift(e.target.checked)}
            />
            Sesuaikan tenggat otomatis saat tanggal acara berubah. Tenggat yang diedit sendiri dan
            tugas selesai tetap dipertahankan.
          </label>
          <p className="text-xs leading-5 text-stone-500">
            Kebutuhan tambahan akan menambahkan tugas yang belum ada. Tugas lama tetap disimpan;
            pilih “Tidak diperlukan” pada tugas yang tidak lagi relevan. Pengaturan ini hanya
            berlaku untuk checklist.
          </p>
        </>
      )}
      <AppButton type="submit">{existing ? "Simpan pengaturan" : "Buat checklist"}</AppButton>
    </form>
  );
}

const orderLoader = () => getOrders({ pageNumber: 1, pageSize: 100 });
function TaskEditor({
  task,
  onSave,
  onCancel,
}: {
  task: WeddingTask;
  onSave: (task: WeddingTask) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(task);
  const [subtask, setSubtask] = useState("");
  const orders = useAsyncResource(orderLoader, { initialData: null });
  const linked = orders.data?.data.find((order) => order.id === draft.orderId);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (draft.title.trim()) onSave({ ...draft, title: draft.title.trim() });
  }
  return (
    <form onSubmit={submit} className="grid gap-5">
      <AppInput
        className="h-12 min-w-0 w-full"
        label="Nama tugas"
        required
        maxLength={200}
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
      />
      {draft.guide && (
        <p className="rounded-2xl bg-rose-50 p-4 text-sm leading-6 text-stone-700">{draft.guide}</p>
      )}
      <div className="grid items-start gap-4 sm:grid-cols-2 [&>label]:min-w-0">
        <AppSelect
          className="h-12 min-w-0 w-full"
          label="Kategori"
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </AppSelect>
        <AppSelect
          className="h-12 min-w-0 w-full"
          label="Status"
          value={draft.status}
          onChange={(e) => setDraft(setTaskStatus(draft, e.target.value as TaskStatus))}
        >
          {Object.entries(statuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </AppSelect>
        <AppDatePicker
          className="h-12 min-w-0 w-full"
          label="Tenggat"
          value={draft.due}
          onChange={(e) => setDraft({ ...draft, due: e.target.value, customDue: true })}
          helper={draft.customDue ? "Tanggal diatur sendiri." : "Mengikuti tanggal pernikahan."}
        />
        <AppInput
          className="h-12 min-w-0 w-full"
          label="Penanggung jawab"
          value={draft.assignee}
          maxLength={100}
          placeholder="Saya, pasangan, keluarga, atau WO"
          onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-blush"
          checked={draft.important}
          onChange={(e) => setDraft({ ...draft, important: e.target.checked })}
        />
        Tandai sebagai tugas penting
      </label>
      <section className="rounded-2xl border p-4">
        <h3 className="text-sm font-semibold">Langkah yang perlu disiapkan</h3>
        <div className="mt-3 grid gap-3">
          {draft.subtasks.map((item, index) => (
            <label key={index} className="flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-blush"
                checked={item.done}
                onChange={() => setDraft(toggleSubtask(draft, index))}
              />
              <span className={item.done ? "text-stone-400 line-through" : ""}>{item.title}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <AppInput
              className="h-12 min-w-0 w-full"
              label="Langkah tambahan"
              value={subtask}
              maxLength={200}
              onChange={(e) => setSubtask(e.target.value)}
            />
          </div>
          <AppButton
            type="button"
            variant="secondary"
            disabled={!subtask.trim()}
            aria-label="Tambahkan langkah"
            onClick={() => {
              setDraft({
                ...draft,
                status: draft.status === "COMPLETED" ? "IN_PROGRESS" : draft.status,
                subtasks: [...draft.subtasks, { title: subtask.trim(), done: false }],
              });
              setSubtask("");
            }}
          >
            <Plus size={18} />
          </AppButton>
        </div>
      </section>
      <AppTextarea
        label="Catatan dan kesepakatan"
        value={draft.notes}
        maxLength={5000}
        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
      />
      <AppInput
        className="h-12 min-w-0 w-full"
        label="Vendor / kontak di luar aplikasi"
        value={draft.vendor}
        maxLength={300}
        onChange={(e) => setDraft({ ...draft, vendor: e.target.value })}
      />
      <AppSelect
        className="h-12 min-w-0 w-full"
        label="Pesanan terkait"
        value={draft.orderId}
        onChange={(e) => setDraft({ ...draft, orderId: e.target.value })}
      >
        <option value="">Tidak ditautkan</option>
        {draft.orderId && !linked && (
          <option value={draft.orderId}>Pesanan tersimpan · {draft.orderId}</option>
        )}
        {orders.data?.data.map((order) => (
          <option key={order.id} value={order.id}>
            {order.orderNumber} · {order.productName || order.vendorProduct.name}
          </option>
        ))}
      </AppSelect>
      {orders.loading && <p className="text-xs text-stone-500">Memuat pesanan…</p>}
      {orders.error && (
        <div role="status" className="text-sm text-amber-700">
          Pesanan belum dapat dimuat. Catatan tugas tetap bisa disimpan.{" "}
          <button type="button" className="underline" onClick={() => void orders.reload()}>
            Coba lagi
          </button>
        </div>
      )}
      {orders.data && orders.data.total > orders.data.data.length && (
        <p className="text-xs text-stone-500">
          Menampilkan 100 pesanan pertama.{" "}
          <Link className="underline" href={ROUTES.customer.orders}>
            Lihat semua pesanan
          </Link>
          .
        </p>
      )}
      {linked && <OrderReference order={linked} />}
      {draft.orderId && !linked && (
        <Link className="text-sm text-blush underline" href={ROUTES.customer.order(draft.orderId)}>
          Buka pesanan terkait
        </Link>
      )}
      <p className="text-xs leading-5 text-stone-500">
        Penanggung jawab dicatat untuk koordinasi; belum mengirim undangan atau notifikasi.
        Menautkan pesanan tidak otomatis menyelesaikan tugas.
      </p>
      <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white py-4">
        <AppButton type="button" variant="secondary" onClick={onCancel}>
          Batal
        </AppButton>
        <AppButton type="submit">Simpan tugas</AppButton>
      </div>
    </form>
  );
}
function OrderReference({ order }: { order: Order }) {
  return (
    <div className="rounded-xl border bg-stone-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{order.vendor.businessName}</p>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-sm text-stone-600">
        Nilai pesanan: {formatCurrency(order.totalAmount)}
      </p>
      {["CANCELLED", "REJECTED_BY_VENDOR"].includes(order.status) && (
        <p className="mt-2 text-sm text-amber-700">
          Periksa kembali kebutuhan vendor pengganti untuk tugas ini.
        </p>
      )}
      <Link
        className="mt-3 inline-block text-sm font-medium text-blush"
        href={ROUTES.customer.order(order.id)}
      >
        Lihat detail dan pembayaran →
      </Link>
    </div>
  );
}
function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-7">
          <div className="mb-6 pr-9">
            <Dialog.Title className="text-xl font-semibold text-ink">{title}</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-stone-500">
              {description}
            </Dialog.Description>
          </div>
          <Dialog.Close
            aria-label="Tutup"
            className="absolute right-4 top-4 rounded-full p-2 text-stone-500 hover:bg-stone-100"
          >
            <X size={20} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function Count({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-2">
      <strong className="text-xl text-ink">{value}</strong>
      <p className="mt-1 text-[11px] text-stone-500">{label}</p>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 break-words font-medium text-ink">{value}</dd>
    </div>
  );
}
function displayDate(date: string) {
  return date
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(`${date}T00:00:00`),
      )
    : "Tanggal belum ditentukan";
}
function dueLabel(task: WeddingTask, today: string) {
  if (!task.due) return "Belum ada tenggat";
  if (!isPending(task)) return displayDate(task.due);
  if (task.due < today) return `Lewat tenggat · ${displayDate(task.due)}`;
  if (task.due === today) return "Jatuh tempo hari ini";
  if (task.due <= dateOffset(today, 7)) return `${daysUntil(task.due, today)} hari lagi`;
  return displayDate(task.due);
}
