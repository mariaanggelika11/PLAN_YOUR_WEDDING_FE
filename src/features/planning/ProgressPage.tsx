"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Download, Plus, Settings2 } from "lucide-react";
import { useProfileData } from "@/features/profile/context/ProfileProvider";
import type { CustomerApiProfile } from "@/features/profile/types";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput, AppSelect } from "@/shared/components/ui/FormFields";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { ROUTES } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import {
  categories,
  dateOffset,
  daysUntil,
  statuses,
  todayDate,
  type PlanSettings,
  type TaskStatus,
  type WeddingTask,
} from "./model";

import { toTaskPayload } from "./adapters";
import {
  getWeddingTask,
  createWeddingTask,
  updateWeddingTask,
  deleteWeddingTask,
  saveWeddingPlan,
} from "./repository";
import { planningService, useWeddingProgress } from "./useWeddingProgress";

import { usePlanningMutation } from "./usePlanningMutation";
import { PlanningModal as Modal } from "./components/PlanningModal";
import { SettingsForm } from "./components/SettingsForm";
import { TaskEditor } from "./components/TaskEditor";
import { displayDate } from "./format";
import { PlanningCalendar } from "./components/PlanningCalendar";
import { OverdueReminder } from "./components/OverdueReminder";
import { upcomingTasks } from "./calendar";

export function ProgressPage() {
  const { translateText } = useTranslation();
  const profile = useProfileData("customer");
  if (profile.loading) return <LoadingSkeleton />;
  if (profile.error) return <ErrorState retry={() => void profile.reload()} />;
  if (!profile.data)
    return (
      <div>
        <EmptyState
          title={translateText("Lengkapi profil pernikahan")}
          description={translateText(
            "Isi profil customer untuk mulai menyiapkan rencana pernikahan.",
          )}
        />
        <AppButton asChild>
          <Link href={ROUTES.customer.profile}>{translateText("Lengkapi profil")}</Link>
        </AppButton>
      </div>
    );
  return <Planner key={profile.data.user.id} profile={profile.data} />;
}

function Planner({ profile }: { profile: CustomerApiProfile }) {
  const { translateText, locale } = useTranslation();
  const progress = useWeddingProgress();
  const mutation = usePlanningMutation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState("");
  const [showDeadlineGuide, setShowDeadlineGuide] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [today, setToday] = useState(todayDate);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayDate()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const detailLoader = useCallback(
    () => (selected ? getWeddingTask(selected) : Promise.resolve(null)),
    [selected],
  );
  const detail = useAsyncResource(detailLoader, { initialData: null, autoLoad: Boolean(selected) });
  const { query, search, setSearch, changeFilters } = progress;
  const category = query.category ?? "";
  const filter = query.overdue ? "LATE" : (query.status ?? "ALL");
  const sortOrder = query.sortBy ?? "due_asc";
  async function patch(task: WeddingTask) {
    await mutation.run(async () => {
      await updateWeddingTask(task.id, { status: task.status, subtasks: task.subtasks });
      await progress.refresh();
    });
  }
  async function download() {
    await mutation.run(async () => {
      setExporting(true);
      try {
        const tasks = await planningService.getAllTasks();
        const { downloadPlanningPdf } = await import("./exportPdf");
        await downloadPlanningPdf({
          settings: defaultSettings,
          tasks,
          exportedOn: today,
          locale,
        });
      } finally {
        setExporting(false);
      }
    });
  }
  const defaultSettings: PlanSettings = {
    date: dateOffset(profile.weddingDate?.slice(0, 10) ?? "", 0),
    event: profile.eventType ?? "",
    guests: profile.estimatedGuests ?? 0,
    budget: profile.estimatedBudget ?? 0,
    location: profile.weddingLocation ?? "",
    traditional: progress.plan.data?.traditional ?? false,
    outdoor: progress.plan.data?.outdoor ?? false,
    useWo: progress.plan.data?.useWo ?? false,
  };
  if (
    (!progress.plan.data && progress.plan.loading) ||
    (!progress.summary.data && progress.summary.loading)
  )
    return <LoadingSkeleton />;
  if (!progress.plan.data || !progress.summary.data)
    return (
      <ErrorState
        retry={() => {
          void progress.plan.reload();
          void progress.summary.reload();
        }}
      />
    );
  const summary = progress.summary.data;
  const hasTasks = summary.taskCount > 0;
  const settings = defaultSettings;
  const days = settings.date ? daysUntil(settings.date, today) : null;
  const selectedTask = detail.data?.id === selected ? detail.data : null;
  return (
    <FeaturePage
      title="Wedding Progress"
      description={translateText("Langkah kecil menuju hari istimewa.")}
      showHeader={false}
    >
      <div className="grid gap-6">
        {mutation.error && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {mutation.error}
          </div>
        )}
        {progress.summary.error && <ErrorState retry={() => void progress.summary.reload()} />}
        <section className="overflow-hidden rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50/70 via-white to-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h2 className="text-lg font-semibold text-ink sm:text-2xl">
                {days === null
                  ? translateText("Hari istimewamu dimulai dari sini")
                  : days > 0
                    ? translateText("{0} hari menuju hari istimewa", { 0: days })
                    : days === 0
                      ? translateText("Selamat menikmati hari pernikahanmu!")
                      : translateText("Lengkapi langkah setelah pernikahan")}
              </h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                <CalendarDays size={16} />
                {displayDate(settings.date, locale)}
                {settings.event && ` · ${settings.event.replaceAll("_", " ")}`}
              </p>
            </div>
            <AppButton variant="secondary" onClick={() => setSettingsOpen(true)}>
              <Settings2 size={16} />{" "}
              {hasTasks
                ? translateText("Atur rencana")
                : translateText("Buat checklist pernikahanku")}
            </AppButton>
          </div>
          <div className="mt-5 grid items-center gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{translateText("Tugas selesai")}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    {summary.completed} {translateText("dari")} {summary.total}{" "}
                    {translateText("tugas yang diperlukan")}{" "}
                  </p>
                </div>
                <strong className="text-3xl font-semibold text-blush">{summary.percent}%</strong>
              </div>
              <div
                role="progressbar"
                aria-label={translateText("Tugas persiapan selesai")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={summary.percent}
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-rose-100"
              >
                <div
                  className="h-full rounded-full bg-blush transition-colors"
                  style={{ width: `${summary.percent}%` }}
                />
              </div>
            </div>
            <p className="text-xs leading-6 text-stone-600">
              {summary.pending} {translateText("perlu dikerjakan ·")} {summary.important}{" "}
              {translateText("tugas penting")}{" "}
            </p>
          </div>
        </section>
        {!progress.globalTasks.data && progress.globalTasks.loading ? (
          <p role="status" className="text-xs text-stone-600">
            {translateText("Memeriksa tugas terlambat…")}{" "}
          </p>
        ) : progress.globalTasks.error ? (
          <ErrorState
            description={translateText("Pengingat tugas terlambat belum dapat dimuat.")}
            retry={() => void progress.globalTasks.reload()}
          />
        ) : (
          <OverdueReminder
            tasks={progress.globalTasks.data ?? []}
            today={today}
            busy={mutation.busy}
            onOpen={setSelected}
            onUpdate={patch}
          />
        )}
        <div className="grid items-start gap-5">
          <div className="grid min-w-0 gap-6">
            <section className="overflow-hidden rounded-xl border bg-white">
              <div className="grid gap-4 border-b p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">
                      {translateText("Kalender persiapan")}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <AppButton
                      variant="ghost"
                      disabled={progress.tasks.loading}
                      onClick={() => void progress.refresh()}
                    >
                      {translateText("Segarkan")}{" "}
                    </AppButton>
                    <AppButton
                      variant="secondary"
                      onClick={() => {
                        setNewTaskDate("");
                        setAdding(true);
                      }}
                    >
                      <Plus size={16} /> {translateText("Tambah tugas")}{" "}
                    </AppButton>
                  </div>
                </div>
                <p className="text-xs text-stone-600">
                  {progress.tasks.loading
                    ? translateText("Memuat jadwal…")
                    : progress.tasks.error
                      ? translateText("Jadwal belum dapat dimuat.")
                      : translateText("{0} tugas akan datang · {1} tanpa tenggat", {
                          0: upcomingTasks(progress.allTasks, today),
                          1: progress.allTasks.filter((task) => !task.due).length,
                        })}
                  {query.filter || category || filter !== "ALL"
                    ? translateText(" · sesuai filter")
                    : ""}
                </p>
                <details className="rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-stone-600">
                    {translateText("Cari dan filter tugas")}{" "}
                    {query.filter || category || filter !== "ALL"
                      ? translateText(" · Filter aktif")
                      : ""}
                  </summary>
                  <div className="mt-4 grid items-start gap-3 sm:grid-cols-2 [&>label]:min-w-0">
                    <AppInput
                      className="h-12 min-w-0 w-full"
                      label={translateText("Cari tugas")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={translateText("Nama tugas, PIC, catatan")}
                    />
                    <AppSelect
                      className="h-12 min-w-0 w-full"
                      label={translateText("Kategori")}
                      value={category}
                      onChange={(e) => changeFilters({ category: e.target.value || undefined })}
                    >
                      <option value="">{translateText("Semua kategori")}</option>
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {translateText(item)}
                        </option>
                      ))}
                    </AppSelect>
                    <AppSelect
                      className="h-12 min-w-0 w-full"
                      label={translateText("Status")}
                      value={filter}
                      onChange={(e) =>
                        changeFilters({
                          status:
                            e.target.value === "ALL" || e.target.value === "LATE"
                              ? undefined
                              : (e.target.value as TaskStatus),
                          overdue: e.target.value === "LATE" ? true : undefined,
                        })
                      }
                    >
                      <option value="ALL">{translateText("Semua status")}</option>
                      <option value="LATE">{translateText("Lewat tenggat")}</option>
                      {Object.entries(statuses).map(([value, label]) => (
                        <option value={value} key={value}>
                          {translateText(label)}
                        </option>
                      ))}
                    </AppSelect>
                    <AppSelect
                      className="h-12 min-w-0 w-full"
                      label={translateText("Urutkan")}
                      value={sortOrder}
                      onChange={(e) =>
                        changeFilters({ sortBy: e.target.value as "due_asc" | "due_desc" })
                      }
                    >
                      <option value="due_asc">{translateText("Tenggat terdekat")}</option>
                      <option value="due_desc">{translateText("Tenggat terjauh")}</option>
                    </AppSelect>
                  </div>
                  <AppButton variant="ghost" className="mt-3" onClick={progress.resetFilters}>
                    {translateText("Reset filter")}{" "}
                  </AppButton>
                </details>
              </div>
              {progress.tasks.loading && (
                <div className="p-5" role="status">
                  {translateText("Memuat tugas…")}{" "}
                </div>
              )}
              {progress.tasks.error && <ErrorState retry={() => void progress.tasks.reload()} />}
              {!progress.tasks.error && (
                <div
                  className={progress.tasks.loading ? "pointer-events-none opacity-50" : ""}
                  aria-busy={progress.tasks.loading}
                  inert={progress.tasks.loading}
                >
                  <PlanningCalendar
                    tasks={progress.tasks.loading ? [] : progress.allTasks}
                    today={today}
                    busy={mutation.busy || progress.tasks.loading}
                    onOpen={setSelected}
                    onUpdate={patch}
                    onAdd={(date) => {
                      setNewTaskDate(date);
                      setAdding(true);
                    }}
                  />
                </div>
              )}
              {!progress.tasks.loading &&
                !progress.tasks.error &&
                progress.allTasks.length === 0 && (
                  <div className="border-t p-5 text-center text-sm text-stone-600">
                    <p>
                      {hasTasks
                        ? translateText("Tidak ada tugas yang cocok dengan filter.")
                        : translateText(
                            "Belum ada tugas. Tambahkan persiapanmu atau mulai dari template melalui Buat checklist pernikahanku.",
                          )}
                    </p>
                    {hasTasks && (
                      <AppButton variant="ghost" onClick={progress.resetFilters}>
                        {translateText("Tampilkan semua tugas")}{" "}
                      </AppButton>
                    )}
                  </div>
                )}
            </section>
          </div>
          <aside className="grid gap-5">
            <details className="group">
              <summary className="cursor-pointer rounded-xl border bg-white p-4 text-sm font-semibold text-ink">
                {translateText("Detail acara & alat bantu")}{" "}
              </summary>
              <div className="mt-3 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
                <section className="rounded-xl border bg-white p-5">
                  <h2 className="font-semibold text-ink">{translateText("Rencana acaramu")}</h2>
                  <dl className="mt-4 grid gap-4 text-sm">
                    <Info
                      label={translateText("Lokasi")}
                      value={settings.location || translateText("Belum ditentukan")}
                    />
                    <Info
                      label={translateText("Perkiraan tamu")}
                      value={
                        settings.guests
                          ? translateText("{0} orang", {
                              0: settings.guests.toLocaleString(
                                locale === "en" ? "en-GB" : "id-ID",
                              ),
                            })
                          : translateText("Belum ditentukan")
                      }
                    />
                    <Info
                      label={translateText("Target anggaran")}
                      value={
                        settings.budget
                          ? formatCurrency(settings.budget, locale)
                          : translateText("Belum ditentukan")
                      }
                    />
                    <Info
                      label={translateText("Koordinasi")}
                      value={
                        settings.useWo ? "Dibantu wedding organizer" : "Mandiri / bersama keluarga"
                      }
                    />
                  </dl>
                  <p className="mt-5 border-t pt-4 text-xs leading-5 text-stone-600">
                    {translateText(
                      "Tenggat template adalah panduan. Sesuaikan dengan kebutuhan dan kesepakatan vendormu.",
                    )}{" "}
                  </p>
                </section>
                <section className="rounded-xl bg-rose-50 p-5">
                  <h2 className="font-semibold text-ink">
                    {translateText("Lengkapi tim pernikahanmu")}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {translateText(
                      "Temukan vendor, lalu tautkan pesanan ke tugas yang ditangani. Vendor di luar aplikasi juga bisa dicatat.",
                    )}{" "}
                  </p>
                  <AppButton asChild variant="secondary" className="mt-4 w-full">
                    <Link href={ROUTES.customer.marketplace}>
                      {translateText("Cari vendor")} <ArrowRight size={16} />
                    </Link>
                  </AppButton>
                  <Link
                    className="mt-4 block text-center text-sm font-medium text-blush"
                    href={ROUTES.customer.orders}
                  >
                    {translateText("Lihat pesanan & pembayaran")}{" "}
                  </Link>
                </section>
                <section className="rounded-xl border border-dashed p-5">
                  <p className="text-xs leading-5 text-stone-600">
                    {translateText(
                      "Unduh ringkasan acara, seluruh tugas, dan catatan dalam PDF yang bisa dibaca, dibagikan, atau dicetak.",
                    )}{" "}
                  </p>
                  <AppButton
                    variant="ghost"
                    className="mt-2 px-0"
                    disabled={mutation.busy}
                    onClick={() => void download()}
                  >
                    <Download size={16} />{" "}
                    {exporting ? translateText("Menyiapkan unduhan…") : translateText("Unduh PDF")}
                  </AppButton>
                </section>
              </div>
            </details>
          </aside>
        </div>
      </div>
      {settingsOpen && (
        <Modal
          title={
            hasTasks
              ? translateText("Atur rencana pernikahan")
              : translateText("Buat rencana pernikahanmu")
          }
          description={translateText("Sesuaikan template dengan acara dan kebutuhanmu.")}
          onClose={() => setSettingsOpen(false)}
        >
          <SettingsForm
            initial={defaultSettings}
            autoReschedule={progress.plan.data.autoReschedule}
            existing={hasTasks}
            onSave={async (settings, autoReschedule) => {
              const saved = await saveWeddingPlan({
                traditional: settings.traditional,
                outdoor: settings.outdoor,
                useWo: settings.useWo,
                autoReschedule,
              });
              progress.plan.setData(saved);
              await planningService.addTemplateTasks(settings);
              await progress.refresh();
              setSettingsOpen(false);
              if (!hasTasks) setShowDeadlineGuide(true);
            }}
          />
        </Modal>
      )}
      {showDeadlineGuide && (
        <Modal
          title={translateText("Checklist berhasil dibuat")}
          description={translateText("Tentang tenggat tugas")}
          dismissible={false}
          onClose={() => setShowDeadlineGuide(false)}
        >
          <div className="grid gap-4 text-sm leading-6 text-stone-600">
            <p>
              {translateText(
                "Tenggat awal tugas template dihitung otomatis dari tanggal pernikahanmu berdasarkan panduan persiapan. Kamu bisa mengubahnya sesuai kebutuhan atau kesepakatan vendor dengan membuka detail tugas.",
              )}{" "}
            </p>
            <p>
              {translateText(
                "Kalau tanggal panduan sudah terlewati, sesuaikan tenggat dengan waktu persiapanmu. Jika tanggal pernikahan belum diisi, lengkapi dulu di profil.",
              )}{" "}
            </p>
            <AppButton className="w-full" onClick={() => setShowDeadlineGuide(false)}>
              {translateText("Oke, mengerti")}{" "}
            </AppButton>
          </div>
        </Modal>
      )}
      {selected && (
        <Modal
          title={translateText("Detail persiapan")}
          description={translateText("Atur langkah, penanggung jawab, dan kebutuhan tugas ini.")}
          onClose={() => setSelected(null)}
        >
          {detail.loading ? (
            <LoadingSkeleton />
          ) : detail.error ? (
            <ErrorState retry={() => void detail.reload()} />
          ) : (
            selectedTask && (
              <TaskEditor
                key={selectedTask.id}
                task={selectedTask}
                weddingDate={settings.date}
                today={today}
                onSave={async (task) => {
                  await updateWeddingTask(task.id, toTaskPayload(task));
                  await progress.refresh();
                  setSelected(null);
                }}
                onCancel={() => setSelected(null)}
                onDelete={async () => {
                  await deleteWeddingTask(selectedTask.id);
                  await progress.refresh();
                  setSelected(null);
                }}
              />
            )
          )}
        </Modal>
      )}
      {adding && (
        <Modal
          title={translateText("Tambah tugas persiapan")}
          description={translateText("Tambahkan kebutuhan yang belum ada di template.")}
          onClose={() => setAdding(false)}
        >
          <TaskEditor
            weddingDate={settings.date}
            today={today}
            task={{
              id: "",
              title: "",
              category: "Lainnya",
              guide: "",
              daysBefore: null,
              due: newTaskDate,
              customDue: true,
              important: false,
              status: "TODO",
              assignee: "Saya",
              notes: "",
              vendor: "",
              orderId: "",
              subtasks: [],
            }}
            onSave={async (task) => {
              await createWeddingTask(task);
              await progress.refresh();
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </Modal>
      )}
    </FeaturePage>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const { translateText } = useTranslation();
  return (
    <div>
      <dt className="text-xs text-stone-600">{translateText(label)}</dt>
      <dd className="mt-1 break-words font-medium text-ink">{value}</dd>
    </div>
  );
}
