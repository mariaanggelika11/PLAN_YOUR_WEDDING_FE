import type { ParameterDetail, SystemParameter } from "@/features/parameters/types";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppIconButton } from "@/shared/components/ui/AppIconButton";
import { AppInput, AppTextarea } from "@/shared/components/ui/FormFields";
import { Plus, Trash2, X } from "lucide-react";
import { type FormEvent } from "react";

import { ParameterStatusToggle } from "@/features/parameters/ParameterTable";
const emptyDetail = (): ParameterDetail => ({
  code: "",
  description: "",
  ordering: 0,
  active: true,
});

export function ParameterForm({
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
          <ParameterStatusToggle
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
            <div className="flex min-h-11 items-center rounded-xl border bg-white px-3">
              <ParameterStatusToggle
                active={detail.active}
                label={`Status detail ${index + 1}`}
                onChange={(active) => updateDetail(index, { active })}
                showText
              />
            </div>
            <AppIconButton
              label="Hapus detail"
              onClick={() => onDetailsChange(details.filter((_, itemIndex) => itemIndex !== index))}
              type="button"
              variant="danger"
            >
              <Trash2 size={17} />
            </AppIconButton>
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
