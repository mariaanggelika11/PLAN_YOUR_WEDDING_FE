"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput, AppTextarea } from "@/components/ui/FormFields";
import {
  createParameter,
  deleteParameter,
  getParameters,
  updateParameter,
} from "@/services/parameterService";
import type { ParameterDetail, ParameterPayload, SystemParameter } from "@/types/parameter";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 10;
const emptyDetail = (): ParameterDetail => ({
  code: "",
  description: "",
  ordering: 0,
  active: true,
});

export function ParameterManager() {
  const [parameters, setParameters] = useState<SystemParameter[]>([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<SystemParameter | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [details, setDetails] = useState<ParameterDetail[]>([emptyDetail()]);
  const [parameterActive, setParameterActive] = useState(true);
  const [updatingStatusIds, setUpdatingStatusIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getParameters(filter, page, PAGE_SIZE);
      setParameters(result.data);
      setTotal(result.total);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Parameter gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }, [filter, page]);

  useEffect(() => void load(), [load]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setFilter(String(new FormData(event.currentTarget).get("filter") ?? "").trim());
  }

  function openForm(parameter?: SystemParameter) {
    setEditing(parameter ?? null);
    setParameterActive(parameter?.active ?? true);
    setDetails(
      parameter?.details.length
        ? [...parameter.details]
            .sort((a, b) => a.ordering - b.ordering)
            .map((item) => ({ ...item }))
        : [emptyDetail()],
    );
    setFormOpen(true);
    setError("");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") ?? "")
      .trim()
      .toUpperCase();
    if (!code) return setError("Kode parameter wajib diisi.");

    const duplicateCodes = details
      .map((item) => item.code.trim().toUpperCase())
      .filter((item, index, items) => item && items.indexOf(item) !== index);
    if (duplicateCodes.length)
      return setError(`Kode detail tidak boleh duplikat: ${duplicateCodes.join(", ")}.`);

    const payload: ParameterPayload = {
      code,
      description: String(form.get("description") ?? "").trim() || undefined,
      active: parameterActive,
      details: details.flatMap((detail, index) => {
        const detailCode = detail.code.trim().toUpperCase();
        return detailCode
          ? [
              {
                ...detail,
                code: detailCode,
                description: detail.description?.trim() || null,
                ordering: index + 1,
              },
            ]
          : [];
      }),
    };

    setIsSaving(true);
    setError("");
    try {
      if (editing) await updateParameter(editing.id, payload);
      else await createParameter(payload);
      setMessage(editing ? "Parameter berhasil diperbarui." : "Parameter berhasil ditambahkan.");
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Parameter gagal disimpan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(parameter: SystemParameter) {
    if (!window.confirm(`Hapus parameter ${parameter.code} beserta seluruh detailnya?`)) return;
    try {
      await deleteParameter(parameter.id);
      setMessage("Parameter berhasil dihapus.");
      if (parameters.length === 1 && page > 1) setPage((current) => current - 1);
      else await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Parameter gagal dihapus.");
    }
  }

  async function changeParameterStatus(parameter: SystemParameter, active: boolean) {
    if (parameter.active === active || updatingStatusIds.includes(parameter.id)) return;

    setUpdatingStatusIds((current) => [...current, parameter.id]);
    setError("");
    setMessage("");
    setParameters((current) =>
      current.map((item) => (item.id === parameter.id ? { ...item, active } : item)),
    );

    try {
      await updateParameter(parameter.id, { active });
      setMessage(
        `Parameter ${parameter.code} berhasil ${active ? "diaktifkan" : "dinonaktifkan"}.`,
      );
    } catch (statusError) {
      setParameters((current) =>
        current.map((item) =>
          item.id === parameter.id ? { ...item, active: parameter.active } : item,
        ),
      );
      setError(
        statusError instanceof Error ? statusError.message : "Status parameter gagal diubah.",
      );
    } finally {
      setUpdatingStatusIds((current) => current.filter((id) => id !== parameter.id));
    }
  }

  async function changeDetailStatus(
    parameter: SystemParameter,
    detail: ParameterDetail,
    active: boolean,
  ) {
    const statusId = `${parameter.id}:${detail.id ?? detail.code}`;
    if (detail.active === active || updatingStatusIds.includes(statusId)) return;

    const updatedDetails = parameter.details.map((item) =>
      (item.id ?? item.code) === (detail.id ?? detail.code) ? { ...item, active } : item,
    );
    setUpdatingStatusIds((current) => [...current, statusId]);
    setError("");
    setMessage("");
    setParameters((current) =>
      current.map((item) =>
        item.id === parameter.id ? { ...item, details: updatedDetails } : item,
      ),
    );

    try {
      await updateParameter(parameter.id, { details: updatedDetails });
      setMessage(`Detail ${detail.code} berhasil ${active ? "diaktifkan" : "dinonaktifkan"}.`);
    } catch (statusError) {
      setParameters((current) =>
        current.map((item) => (item.id === parameter.id ? parameter : item)),
      );
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Status detail parameter gagal diubah.",
      );
    } finally {
      setUpdatingStatusIds((current) => current.filter((id) => id !== statusId));
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <form className="flex flex-1 items-end gap-2" onSubmit={search}>
          <div className="max-w-md flex-1">
            <AppInput
              label="Cari kode parameter"
              name="filter"
              placeholder="Contoh: GENDER, SMTP, OTP"
            />
          </div>
          <AppButton type="submit" variant="secondary">
            <Search size={16} /> Cari
          </AppButton>
        </form>
        <AppButton onClick={() => openForm()} type="button">
          <Plus size={16} /> Tambah parameter
        </AppButton>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>
      )}

      {formOpen && (
        <ParameterForm
          details={details}
          editing={editing}
          isSaving={isSaving}
          parameterActive={parameterActive}
          onClose={() => setFormOpen(false)}
          onDetailsChange={setDetails}
          onParameterActiveChange={setParameterActive}
          onSubmit={submit}
        />
      )}

      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Daftar Parameter</h2>
          <p className="mt-1 text-xs text-stone-500">{total} parameter ditemukan</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="w-12 p-4" />
                <th className="p-4">Kode</th>
                <th className="p-4">Deskripsi</th>
                <th className="p-4">Detail</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableMessage message="Memuat parameter..." />
              ) : parameters.length === 0 ? (
                <TableMessage message="Parameter tidak ditemukan." />
              ) : (
                parameters.map((parameter) => {
                  const expanded = expandedIds.includes(parameter.id);
                  return (
                    <ParameterRow
                      key={parameter.id}
                      expanded={expanded}
                      parameter={parameter}
                      onEdit={() => openForm(parameter)}
                      onRemove={() => void remove(parameter)}
                      statusUpdating={updatingStatusIds.some(
                        (id) => id === parameter.id || id.startsWith(`${parameter.id}:`),
                      )}
                      onStatusChange={(active) => void changeParameterStatus(parameter, active)}
                      onDetailStatusChange={(detail, active) =>
                        void changeDetailStatus(parameter, detail, active)
                      }
                      onToggle={() =>
                        setExpandedIds((current) =>
                          current.includes(parameter.id)
                            ? current.filter((id) => id !== parameter.id)
                            : [...current, parameter.id],
                        )
                      }
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t px-5 py-4 text-sm text-stone-500">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <AppButton
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => current - 1)}
              type="button"
              variant="secondary"
            >
              <ChevronLeft size={16} />
            </AppButton>
            <AppButton
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((current) => current + 1)}
              type="button"
              variant="secondary"
            >
              <ChevronRight size={16} />
            </AppButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function ParameterRow({
  parameter,
  expanded,
  onToggle,
  onEdit,
  onRemove,
  onStatusChange,
  onDetailStatusChange,
  statusUpdating,
}: {
  parameter: SystemParameter;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onStatusChange: (active: boolean) => void;
  onDetailStatusChange: (detail: ParameterDetail, active: boolean) => void;
  statusUpdating: boolean;
}) {
  return (
    <>
      <tr className="border-t">
        <td className="p-4">
          <button
            aria-label="Tampilkan detail"
            className="rounded-lg p-2 hover:bg-stone-100"
            onClick={onToggle}
            type="button"
          >
            <ChevronDown className={cn("transition", expanded && "rotate-180")} size={16} />
          </button>
        </td>
        <td className="p-4 font-semibold text-ink">{parameter.code}</td>
        <td className="p-4 text-stone-600">{parameter.description || "-"}</td>
        <td className="p-4">{parameter.details.length}</td>
        <td className="p-4">
          <StatusToggle
            active={parameter.active}
            disabled={statusUpdating}
            label={`Status parameter ${parameter.code}`}
            onChange={onStatusChange}
          />
        </td>
        <td className="p-4">
          <div className="flex justify-end gap-2">
            <AppButton
              aria-label="Edit parameter"
              onClick={onEdit}
              type="button"
              variant="secondary"
            >
              <Pencil size={15} /> Edit
            </AppButton>
            <AppButton
              aria-label="Hapus parameter"
              onClick={onRemove}
              type="button"
              variant="danger"
            >
              <Trash2 size={15} />
            </AppButton>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-t bg-stone-50/70">
          <td colSpan={6} className="p-4">
            <div className="ml-10 grid gap-2">
              {parameter.details.length === 0 ? (
                <p className="text-sm text-stone-500">Belum ada detail.</p>
              ) : (
                [...parameter.details]
                  .sort((a, b) => a.ordering - b.ordering)
                  .map((detail) => (
                    <div
                      className="grid grid-cols-[40px_1fr_1fr_auto] gap-3 rounded-xl border bg-white px-3 py-2 text-xs"
                      key={detail.id}
                    >
                      <span className="text-stone-400">{detail.ordering}</span>
                      <strong>{detail.code}</strong>
                      <span className="text-stone-600">{detail.description || "-"}</span>
                      <StatusToggle
                        active={detail.active}
                        disabled={statusUpdating}
                        label={`Status detail ${detail.code}`}
                        onChange={(active) => onDetailStatusChange(detail, active)}
                      />
                    </div>
                  ))
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ParameterForm({
  editing,
  details,
  isSaving,
  parameterActive,
  onDetailsChange,
  onParameterActiveChange,
  onClose,
  onSubmit,
}: {
  editing: SystemParameter | null;
  details: ParameterDetail[];
  isSaving: boolean;
  parameterActive: boolean;
  onDetailsChange: (details: ParameterDetail[]) => void;
  onParameterActiveChange: (active: boolean) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function updateDetail(index: number, patch: Partial<ParameterDetail>) {
    onDetailsChange(
      details.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  }
  return (
    <form className="grid gap-5 rounded-3xl border bg-white p-5 shadow-sm" onSubmit={onSubmit}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{editing ? "Edit Parameter" : "Tambah Parameter"}</h2>
          <p className="mt-1 text-xs text-stone-500">
            Satu parameter dapat memiliki banyak detail pilihan.
          </p>
        </div>
        <button aria-label="Tutup" onClick={onClose} type="button">
          <X size={18} />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <AppInput
          defaultValue={editing?.code ?? ""}
          label="Kode parameter"
          maxLength={200}
          name="code"
          placeholder="Contoh: GENDER"
          required
        />
        <div className="flex items-center justify-between self-end rounded-xl border px-4 py-3 text-sm">
          <span>Parameter aktif</span>
          <StatusToggle
            active={parameterActive}
            label="Status parameter"
            onChange={onParameterActiveChange}
            showText={false}
          />
        </div>
        <div className="md:col-span-2">
          <AppTextarea
            defaultValue={editing?.description ?? ""}
            label="Deskripsi"
            name="description"
          />
        </div>
      </div>
      <div className="grid gap-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Detail Parameter</h3>
          <AppButton
            onClick={() => onDetailsChange([...details, emptyDetail()])}
            type="button"
            variant="secondary"
          >
            <Plus size={15} /> Tambah detail
          </AppButton>
        </div>
        {details.length === 0 && (
          <p className="rounded-xl border border-dashed p-4 text-center text-sm text-stone-500">
            Detail bersifat opsional.
          </p>
        )}
        {details.map((detail, index) => (
          <div
            className="grid gap-3 rounded-2xl border bg-stone-50 p-3 md:grid-cols-[44px_1fr_1fr_auto_auto] md:items-end"
            key={detail.id ?? index}
          >
            <span className="pb-3 text-center text-sm font-semibold text-stone-400">
              {index + 1}
            </span>
            <AppInput
              label="Kode detail"
              maxLength={200}
              value={detail.code}
              onChange={(event) => updateDetail(index, { code: event.target.value })}
            />
            <AppInput
              label="Deskripsi"
              maxLength={200}
              value={detail.description ?? ""}
              onChange={(event) => updateDetail(index, { description: event.target.value })}
            />
            <label className="flex min-h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm">
              <input
                checked={detail.active}
                onChange={(event) => updateDetail(index, { active: event.target.checked })}
                type="checkbox"
              />{" "}
              Aktif
            </label>
            <button
              aria-label="Hapus detail"
              className="grid size-11 place-items-center rounded-xl text-red-600 hover:bg-red-50"
              onClick={() => onDetailsChange(details.filter((_, itemIndex) => itemIndex !== index))}
              type="button"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 border-t pt-4">
        <AppButton onClick={onClose} type="button" variant="secondary">
          Batal
        </AppButton>
        <AppButton loading={isSaving} type="submit">
          Simpan parameter
        </AppButton>
      </div>
    </form>
  );
}

function TableMessage({ message }: { message: string }) {
  return (
    <tr>
      <td className="p-8 text-center text-stone-500" colSpan={6}>
        {message}
      </td>
    </tr>
  );
}

function StatusToggle({
  active,
  disabled = false,
  label,
  onChange,
  showText = true,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onChange: (active: boolean) => void;
  showText?: boolean;
}) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2",
        disabled ? "cursor-wait opacity-60" : "cursor-pointer",
      )}
    >
      <input
        aria-label={label}
        checked={active}
        className="peer sr-only"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="relative h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-rose-400 peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
      {showText && (
        <span
          className={cn("text-xs font-semibold", active ? "text-emerald-700" : "text-stone-500")}
        >
          {active ? "Aktif" : "Nonaktif"}
        </span>
      )}
    </label>
  );
}
