"use client";

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
  const [rawValue, setRawValue] = useState(() => parseFormattedInteger(defaultValue));

  useEffect(() => setRawValue(parseFormattedInteger(defaultValue)), [defaultValue]);

  function changeValue(input: HTMLInputElement) {
    const nextValue = parseFormattedInteger(input.value);
    const numericValue = nextValue ? Number(nextValue) : undefined;
    input.setCustomValidity(
      numericValue !== undefined && min !== undefined && numericValue < min
        ? `Nilai minimum adalah ${formatThousands(min)}.`
        : numericValue !== undefined && max !== undefined && numericValue > max
          ? `Nilai maksimum adalah ${formatThousands(max)}.`
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
        label={label}
        onChange={(event) => changeValue(event.currentTarget)}
        pattern="[0-9.]*"
        placeholder={placeholder ? formatThousands(placeholder) : undefined}
        required={required}
        type="text"
        value={formatThousands(rawValue)}
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
