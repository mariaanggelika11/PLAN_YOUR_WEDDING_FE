"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";

import { AppInput } from "@/shared/components/ui/FormFields";
import { formatThousands, parseFormattedInteger } from "@/shared/utils/number";
import { useEffect, useState } from "react";

interface FormattedNumberInputProps {
  className?: string;
  defaultValue?: string | number | null;
  disabled?: boolean;
  helper?: string;
  label: string;
  max?: number;
  min?: number;
  name: string;
  placeholder?: string;
  required?: boolean;
  onValueChange?: (rawValue: string) => void;
}

export function FormattedNumberInput({
  className,
  defaultValue = "",
  disabled,
  helper,
  label,
  max,
  min,
  name,
  onValueChange,
  placeholder,
  required,
}: FormattedNumberInputProps) {
  const { translateText, locale } = useTranslation();
  const [rawValue, setRawValue] = useState(() => parseFormattedInteger(defaultValue));

  useEffect(() => setRawValue(parseFormattedInteger(defaultValue)), [defaultValue]);

  function changeValue(input: HTMLInputElement) {
    const nextValue = parseFormattedInteger(input.value);
    const numericValue = nextValue ? Number(nextValue) : undefined;
    input.setCustomValidity(
      numericValue !== undefined && min !== undefined && numericValue < min
        ? translateText("Nilai minimum adalah {0}.", { 0: formatThousands(min, locale) })
        : numericValue !== undefined && max !== undefined && numericValue > max
          ? translateText("Nilai maksimum adalah {0}.", { 0: formatThousands(max, locale) })
          : "",
    );
    setRawValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <div className={className}>
      <AppInput
        disabled={disabled}
        helper={helper}
        inputMode="numeric"
        label={translateText(label)}
        onChange={(event) => changeValue(event.currentTarget)}
        pattern={locale === "en" ? "[0-9,]*" : "[0-9.]*"}
        placeholder={placeholder ? formatThousands(placeholder, locale) : undefined}
        required={required}
        type="text"
        value={formatThousands(rawValue, locale)}
      />
      <input
        disabled={disabled}
        max={max}
        min={min}
        name={name}
        readOnly
        type="hidden"
        value={rawValue}
      />
    </div>
  );
}
