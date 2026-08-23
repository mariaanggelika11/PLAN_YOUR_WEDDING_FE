import type { ParameterDetail, SystemParameter } from "@/features/parameters/types";
import { AppIconButton } from "@/shared/components/ui/AppIconButton";
import { StatusToggle } from "@/shared/components/ui/StatusToggle";
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
            <AppIconButton label="Edit parameter" onClick={onEdit}>
              <Pencil size={15} />
            </AppIconButton>
            <AppIconButton label="Hapus parameter" onClick={onRemove} variant="danger">
              <Trash2 size={15} />
            </AppIconButton>
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
  return <StatusToggle {...{ active, disabled, label, onChange, showText }} />;
}
