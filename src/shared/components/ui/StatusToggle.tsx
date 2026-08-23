import { cn } from "@/shared/utils/cn";

export function StatusToggle({
  active,
  disabled = false,
  label,
  onChange,
  showText = false,
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
      title={active ? "Nonaktifkan" : "Aktifkan"}
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
