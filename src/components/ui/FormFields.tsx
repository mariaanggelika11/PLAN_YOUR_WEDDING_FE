import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
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
  ...props
}: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
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
      <select
        className={cn("rounded-xl border bg-white px-3.5 py-3 font-normal shadow-sm", className)}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
export function AppDatePicker(props: Omit<React.ComponentProps<typeof AppInput>, "type">) {
  return <AppInput type="date" {...props} />;
}
export function AppFileUpload({
  label,
  helper = "Format JPG, PNG, atau PDF. Maksimal 5 MB.",
}: FieldBase) {
  return <AppInput label={label} helper={helper} type="file" accept=".jpg,.jpeg,.png,.pdf" />;
}
