"use client";

import type { MasterParameterOption } from "@/features/parameters/useMasterParameters";
import { parameterOptionLabels } from "@/features/profile/rules";
import { Stepper } from "@/shared/components/navigation/Interactive";
import { AppSelect } from "@/shared/components/ui/FormFields";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { cn } from "@/shared/utils/cn";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function FormSection({
  active,
  children,
  description,
  step,
  title,
}: {
  active: boolean;
  children: ReactNode;
  description: string;
  step: number;
  title: string;
}) {
  const { translateText } = useTranslation();
  return (
    <section className={cn("grid gap-5", !active && "hidden")} data-profile-step={step}>
      <div className="border-b pb-5">
        <h2 className="font-semibold text-ink">{translateText(title)}</h2>
        <p className="mt-1 text-sm text-stone-500">{translateText(description)}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function FormGroupHeader({ title, description }: { title: string; description: string }) {
  const { translateText } = useTranslation();
  return (
    <div className="border-b border-stone-200 pb-3 md:col-span-2">
      <h3 className="font-semibold text-ink">{translateText(title)}</h3>
      <p className="mt-1 text-xs leading-5 text-stone-500">{translateText(description)}</p>
    </div>
  );
}

export function MasterParameterSelect({
  emptyMessage,
  label,
  name,
  options,
  placeholder,
  value,
}: {
  emptyMessage?: string;
  label: string;
  name: string;
  options: MasterParameterOption[];
  placeholder: string;
  value: string;
}) {
  return (
    <AppSelect
      defaultValue={value}
      disabled={options.length === 0}
      helper={options.length === 0 ? emptyMessage : undefined}
      key={`${name}-${options.map((item) => item.value).join("-")}`}
      label={label}
      name={name}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </AppSelect>
  );
}

export function MasterParameterCheckboxGroup({
  emptyMessage,
  initialValues,
  label,
  name,
  options,
  allowSelectAll = false,
}: {
  emptyMessage?: string;
  initialValues: string[];
  label: string;
  name: string;
  options: MasterParameterOption[];
  allowSelectAll?: boolean;
}) {
  const [selectedValues, setSelectedValues] = useState(() =>
    parameterOptionLabels(initialValues, options),
  );
  const initialValuesKey = initialValues.join("\u0000");
  const optionsKey = options.map((option) => `${option.value}:${option.label}`).join("\u0000");
  const allSelected =
    options.length > 0 && options.every((option) => selectedValues.includes(option.label));
  const selectedCount = options.filter((option) => selectedValues.includes(option.label)).length;
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedCount > 0 && !allSelected;
    }
  }, [selectedCount, allSelected, allowSelectAll, options.length]);

  useEffect(
    () => setSelectedValues(parameterOptionLabels(initialValues, options)),
    // Array props dapat terbentuk ulang setiap render; gunakan isi datanya sebagai dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialValuesKey, optionsKey],
  );

  return (
    <fieldset className="md:col-span-2">
      <legend className="text-sm font-medium">{label}</legend>
      {allowSelectAll && options.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3">
          <label className="flex min-h-7 cursor-pointer items-center gap-3 text-sm font-medium text-ink">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelected}
              aria-label={`Pilih semua ${label.toLowerCase()}`}
              className="size-4 cursor-pointer accent-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-500"
              onChange={(event) =>
                setSelectedValues(
                  event.target.checked ? [...new Set(options.map((option) => option.label))] : [],
                )
              }
            />
            Pilih semua
          </label>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="rounded-full border border-rose-100 bg-white px-3 py-1 text-xs font-medium tabular-nums text-rose-700"
          >
            {selectedCount} dari {options.length} terpilih
          </span>
        </div>
      )}
      {options.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed bg-stone-50 p-4 text-sm text-stone-500">
          {emptyMessage ?? "Belum ada pilihan aktif."}
        </p>
      ) : (
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((option) => (
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-normal transition-colors duration-150 focus-within:ring-2 focus-within:ring-rose-300 focus-within:ring-offset-2 hover:border-rose-300 hover:bg-rose-50",
                allowSelectAll && selectedValues.includes(option.label)
                  ? "border-rose-300 bg-rose-50 font-medium text-rose-900"
                  : "bg-white",
              )}
              key={option.value}
            >
              <input
                checked={selectedValues.includes(option.label)}
                className="size-4 accent-rose-500"
                name={name}
                onChange={(event) =>
                  setSelectedValues((current) =>
                    event.target.checked
                      ? [...new Set([...current, option.label])]
                      : current.filter((value) => value !== option.label),
                  )
                }
                type="checkbox"
                value={option.label}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

export function ProfileStepIndicator({
  activeStep,
  onStepChange,
  steps,
}: {
  activeStep: number;
  onStepChange: (step: number) => void;
  steps: string[];
}) {
  return <Stepper active={activeStep} onStepChange={onStepChange} steps={steps} />;
}

export function ProfileNavigation({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-between gap-3">{children}</div>;
}
