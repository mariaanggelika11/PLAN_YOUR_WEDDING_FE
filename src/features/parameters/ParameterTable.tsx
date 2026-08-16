import type { ParameterDetail, SystemParameter } from "@/features/parameters/types";
import { AppButton } from "@/shared/components/ui/AppButton";
import { cn } from "@/shared/utils/cn";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";

export function ParameterRow({
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
          <ParameterStatusToggle
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
                      <ParameterStatusToggle
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

export function ParameterTableMessage({ message }: { message: string }) {
  return (
    <tr>
      <td className="p-8 text-center text-stone-500" colSpan={6}>
        {message}
      </td>
    </tr>
  );
}

export function ParameterStatusToggle({
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
