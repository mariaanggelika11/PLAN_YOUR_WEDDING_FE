"use client";

import type { MasterParameterOption } from "@/features/parameters/useMasterParameters";
import { parameterOptionLabels } from "@/features/profile/rules";
import { Stepper } from "@/shared/components/navigation/Interactive";
import { AppSelect } from "@/shared/components/ui/FormFields";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { cn } from "@/shared/utils/cn";
import { useEffect, useState, type ReactNode } from "react";

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
      <div className="rounded-2xl bg-rose-50 p-4">
        <h2 className="font-semibold text-ink">{translateText(title)}</h2>
        <p className="mt-1 text-sm text-stone-500">{translateText(description)}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function FormGroupHeader({ title, description }: { title: string; description: string }) {
  const { translateText } = useTranslation();
  return (
    <div className="border-b border-rose-100 pb-3 md:col-span-2">
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
}: {
  emptyMessage?: string;
  initialValues: string[];
  label: string;
  name: string;
  options: MasterParameterOption[];
}) {
  const [selectedValues, setSelectedValues] = useState(() =>
    parameterOptionLabels(initialValues, options),
  );
  const initialValuesKey = initialValues.join("\u0000");
  const optionsKey = options.map((option) => `${option.value}:${option.label}`).join("\u0000");

  useEffect(
    () => setSelectedValues(parameterOptionLabels(initialValues, options)),
    // Array props dapat terbentuk ulang setiap render; gunakan isi datanya sebagai dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialValuesKey, optionsKey],
  );

  return (
    <fieldset className="md:col-span-2">
      <legend className="text-sm font-medium">{label}</legend>
      {options.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed bg-stone-50 p-4 text-sm text-stone-500">
          {emptyMessage ?? "Belum ada pilihan aktif."}
        </p>
      ) : (
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((option) => (
            <label
              className="flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm font-normal hover:border-rose-200 hover:bg-rose-50"
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
