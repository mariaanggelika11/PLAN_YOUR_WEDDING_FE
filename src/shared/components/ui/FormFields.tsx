"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { cn } from "@/shared/utils/cn";
import { ChevronDown } from "lucide-react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

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
  const { locale, translateText } = useTranslation();
  const translatedLabel = translateText(label);
  const generatedPlaceholder = supportsPlaceholder(type)
    ? `${locale === "en" ? "Enter" : "Masukkan"} ${translatedLabel.toLowerCase()}`
    : undefined;

  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      <span>
        {translatedLabel}
        {props.required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <input
        aria-invalid={error ? true : undefined}
        className={cn("field-control", error && "border-red-500", className)}
        placeholder={placeholder ? translateText(placeholder) : generatedPlaceholder}
        type={type}
        {...props}
      />
      {error ? (
        <span className="text-xs text-red-600">{translateText(error)}</span>
      ) : helper ? (
        <span className="text-xs text-stone-500">{translateText(helper)}</span>
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
  const { locale, translateText } = useTranslation();
  const translatedLabel = translateText(label);
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      <span>
        {translatedLabel}
        {props.required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <textarea
        aria-invalid={error ? true : undefined}
        className={cn("field-control min-h-28 resize-y", error && "border-red-500", className)}
        placeholder={
          placeholder
            ? translateText(placeholder)
            : `${locale === "en" ? "Enter" : "Masukkan"} ${translatedLabel.toLowerCase()}`
        }
        {...props}
      />
      {error ? (
        <span className="text-xs text-red-600">{translateText(error)}</span>
      ) : helper ? (
        <span className="text-xs text-stone-500">{translateText(helper)}</span>
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
  const { translateText } = useTranslation();
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      <span>
        {translateText(label)}
        {props.required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <span className="relative block min-w-0">
        <select
          aria-invalid={error ? true : undefined}
          className={cn(
            "field-control appearance-none pr-11",
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
        <span className="text-xs text-red-600">{translateText(error)}</span>
      ) : helper ? (
        <span className="text-xs text-stone-500">{translateText(helper)}</span>
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
