"use client";

import {
  createParameter,
  deleteParameter,
  getParameters,
  updateParameter,
} from "@/features/parameters/api";
import { ParameterForm } from "@/features/parameters/ParameterForm";
import { ParameterRow, ParameterTableMessage } from "@/features/parameters/ParameterTable";
import type {
  ParameterDetail,
  ParameterPayload,
  SystemParameter,
} from "@/features/parameters/types";
import { useParameterManager } from "@/features/parameters/useParameterManager";
import { PopupMessage, usePopup } from "@/shared/components/feedback/Popup";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/FormFields";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const PAGE_SIZE = 10;
export function ParameterManager() {
  const { confirm } = usePopup();
  const [parameters, setParameters] = useState<SystemParameter[]>([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const {
    details,
    editing,
    formOpen,
    openForm,
    parameterActive,
    setDetails,
    setEditing,
    setFormOpen,
    setParameterActive,
  } = useParameterManager();
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
    const result = await confirm({
      confirmLabel: "Hapus",
      message: `Parameter ${parameter.code} beserta seluruh detailnya akan dihapus permanen.`,
      title: "Hapus parameter?",
      variant: "error",
    });
    if (!result.confirmed) return;
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

      {error && <PopupMessage message={error} variant="error" />}
      {message && <PopupMessage message={message} />}

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
                <ParameterTableMessage message="Memuat parameter..." />
              ) : parameters.length === 0 ? (
                <ParameterTableMessage message="Parameter tidak ditemukan." />
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
