"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { cn } from "@/shared/utils/cn";
import { ChevronDown } from "lucide-react";
import {
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

interface FieldBase {
  label: string;
  error?: string;
  helper?: string;
}
function descriptionIds(external: string | undefined, messageId: string, hasMessage: boolean) {
  return [external, hasMessage ? messageId : undefined].filter(Boolean).join(" ") || undefined;
}

export function AppInput({
  label,
  error,
  helper,
  className,
  placeholder,
  id,
  "aria-describedby": describedBy,
  type = "text",
  ...props
}: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const { locale, translateText } = useTranslation();
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const messageId = `${controlId}-message`;
  const translatedLabel = translateText(label);
  const generatedPlaceholder = supportsPlaceholder(type)
    ? `${locale === "en" ? "Enter" : "Masukkan"} ${translatedLabel.toLowerCase()}`
    : undefined;
  return (
    <div className="grid min-w-0 gap-2 text-sm font-medium">
      <label id={`${controlId}-label`} htmlFor={controlId}>
        {translatedLabel}
        {props.required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </label>
      <input
        {...props}
        id={controlId}
        aria-labelledby={`${controlId}-label`}
        aria-describedby={descriptionIds(describedBy, messageId, Boolean(error || helper))}
        aria-invalid={error ? true : undefined}
        className={cn("field-control", error && "border-red-500", className)}
        placeholder={placeholder ? translateText(placeholder) : generatedPlaceholder}
        type={type}
      />
      {error ? (
        <span id={messageId} role="alert" className="text-xs text-red-600">
          {translateText(error)}
        </span>
      ) : helper ? (
        <span id={messageId} className="text-xs text-stone-600">
          {translateText(helper)}
        </span>
      ) : null}
    </div>
  );
}

export function AppTextarea({
  label,
  error,
  helper,
  className,
  placeholder,
  id,
  "aria-describedby": describedBy,
  ...props
}: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { locale, translateText } = useTranslation();
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const messageId = `${controlId}-message`;
  const translatedLabel = translateText(label);
  return (
    <div className="grid min-w-0 gap-2 text-sm font-medium">
      <label id={`${controlId}-label`} htmlFor={controlId}>
        {translatedLabel}
        {props.required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </label>
      <textarea
        {...props}
        id={controlId}
        aria-labelledby={`${controlId}-label`}
        aria-describedby={descriptionIds(describedBy, messageId, Boolean(error || helper))}
        aria-invalid={error ? true : undefined}
        className={cn("field-control min-h-28 resize-y", error && "border-red-500", className)}
        placeholder={
          placeholder
            ? translateText(placeholder)
            : `${locale === "en" ? "Enter" : "Masukkan"} ${translatedLabel.toLowerCase()}`
        }
      />
      {error ? (
        <span id={messageId} role="alert" className="text-xs text-red-600">
          {translateText(error)}
        </span>
      ) : helper ? (
        <span id={messageId} className="text-xs text-stone-600">
          {translateText(helper)}
        </span>
      ) : null}
    </div>
  );
}

export function AppSelect({
  label,
  error,
  helper,
  children,
  className,
  id,
  "aria-describedby": describedBy,
  ...props
}: FieldBase & SelectHTMLAttributes<HTMLSelectElement>) {
  const { translateText } = useTranslation();
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const messageId = `${controlId}-message`;
  return (
    <div className="grid min-w-0 gap-2 text-sm font-medium">
      <label id={`${controlId}-label`} htmlFor={controlId}>
        {translateText(label)}
        {props.required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </label>
      <span className="relative block min-w-0">
        <select
          {...props}
          id={controlId}
          aria-labelledby={`${controlId}-label`}
          aria-describedby={descriptionIds(describedBy, messageId, Boolean(error || helper))}
          aria-invalid={error ? true : undefined}
          className={cn(
            "field-control appearance-none pr-11",
            "hover:border-stone-300 focus:border-blush focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-600",
            error && "border-red-500 focus:border-red-500 focus:ring-red-100",
            className,
          )}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-600"
          size={18}
          strokeWidth={2}
        />
      </span>
      {error ? (
        <span id={messageId} role="alert" className="text-xs text-red-600">
          {translateText(error)}
        </span>
      ) : helper ? (
        <span id={messageId} className="text-xs text-stone-600">
          {translateText(helper)}
        </span>
      ) : null}
    </div>
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
