"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getOrders } from "@/features/orders/repository";
import type { Order } from "@/features/orders/types";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppDatePicker, AppInput, AppSelect, AppTextarea } from "@/shared/components/ui/FormFields";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { ROUTES } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import {
  categories,
  statuses,
  setTaskStatus,
  toggleSubtask,
  type TaskStatus,
  type WeddingTask,
} from "../model";
import { dueGuidance } from "../format";
import { usePlanningMutation } from "../usePlanningMutation";
import { usePlanningModalBusy } from "./PlanningModal";

const orderLoader = () => getOrders({ pageNumber: 1, pageSize: 100 });
export function TaskEditor({
  task,
  weddingDate,
  today,
  onSave,
  onCancel,
}: {
  task: WeddingTask;
  weddingDate: string;
  today: string;
  onSave: (task: WeddingTask) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(task);
  const mutation = usePlanningMutation();
  usePlanningModalBusy(mutation.busy);
  const [subtask, setSubtask] = useState("");
  const orders = useAsyncResource(orderLoader, { initialData: null });
  const linked = orders.data?.data.find((order) => String(order.id) === draft.orderId);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (draft.title.trim())
      void mutation.run(() => onSave({ ...draft, title: draft.title.trim() }));
  }
  return (
    <form onSubmit={submit} className="grid gap-5">
      {mutation.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {mutation.error}
        </p>
      )}
      <fieldset disabled={mutation.busy} className="contents">
        <AppInput
          className="h-12 min-w-0 w-full"
          label="Nama tugas"
          required
          maxLength={200}
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        {draft.guide && (
          <p className="rounded-xl bg-rose-50 p-4 text-sm leading-6 text-stone-700">
            {draft.guide}
          </p>
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
            helper={dueGuidance(draft, weddingDate, today)}
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
        <section className="rounded-xl border p-4">
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
          <Link
            className="text-sm text-blush underline"
            href={ROUTES.customer.order(draft.orderId)}
          >
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
          <AppButton type="submit" disabled={mutation.busy}>
            {mutation.busy ? "Menyimpan…" : "Simpan tugas"}
          </AppButton>
        </div>
      </fieldset>
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
