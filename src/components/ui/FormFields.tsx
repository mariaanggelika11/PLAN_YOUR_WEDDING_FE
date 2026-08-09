import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

interface FieldBase {
  label: string;
  error?: string;
  helper?: string;
}
export function AppInput({
  label,
  error,
  helper,
  className,
  placeholder,
  type = "text",
  ...props
}: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const generatedPlaceholder = supportsPlaceholder(type)
    ? `Masukkan ${label.toLowerCase()}`
    : undefined;

  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>
        {label}
        {props.required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <input
        className={cn(
          "rounded-xl border bg-white px-3.5 py-3 font-normal shadow-sm hover:border-stone-300 focus:border-blush",
          error && "border-red-500",
          className,
        )}
        placeholder={placeholder ?? generatedPlaceholder}
        type={type}
        {...props}
      />
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : helper ? (
        <span className="text-xs text-stone-500">{helper}</span>
      ) : null}
    </label>
  );
}
export function AppTextarea({
  label,
  error,
  helper,
  className,
  placeholder,
  ...props
}: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>
        {label}
        {props.required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <textarea
        className={cn(
          "min-h-28 rounded-xl border bg-white px-3.5 py-3 font-normal shadow-sm",
          error && "border-red-500",
          className,
        )}
        placeholder={placeholder ?? `Masukkan ${label.toLowerCase()}`}
        {...props}
      />
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : helper ? (
        <span className="text-xs text-stone-500">{helper}</span>
      ) : null}
    </label>
  );
}
export function AppSelect({
  label,
  error,
  helper,
  children,
  className,
  ...props
}: FieldBase & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>
        {label}
        {props.required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <span className="relative block">
        <select
          aria-invalid={error ? true : undefined}
          className={cn(
            "min-h-12 w-full appearance-none rounded-xl border border-stone-200 bg-white px-3.5 py-3 pr-11 font-normal text-ink shadow-sm outline-none transition",
            "hover:border-stone-300",
            "focus:border-blush focus:ring-2 focus:ring-rose-100",
            "disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500",
            error && "border-red-500 focus:border-red-500 focus:ring-red-100",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500"
          size={18}
          strokeWidth={2}
        />
      </span>
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : helper ? (
        <span className="text-xs text-stone-500">{helper}</span>
      ) : null}
    </label>
  );
}
export function AppDatePicker(props: Omit<React.ComponentProps<typeof AppInput>, "type">) {
  return <AppInput type="date" {...props} />;
}
export function AppFileUpload({
  label,
  helper = "Format JPG, PNG, atau PDF. Maksimal 5 MB.",
  ...props
}: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <AppInput label={label} helper={helper} type="file" accept=".jpg,.jpeg,.png,.pdf" {...props} />
  );
}

function supportsPlaceholder(type: InputHTMLAttributes<HTMLInputElement>["type"]) {
  return !["checkbox", "color", "date", "file", "hidden", "radio", "range", "submit"].includes(
    type ?? "text",
  );
}
