"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import {
  AppDatePicker,
  AppFileUpload,
  AppInput,
  AppSelect,
  AppTextarea,
} from "@/components/ui/FormFields";
import { Stepper } from "@/components/common/Interactive";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import { cn } from "@/utils/cn";

export type FormField = {
  label: string;
  name: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select" | "file";
  options?: string[];
  required?: boolean;
  helper?: string;
  step?: number;
  multiple?: boolean;
  accept?: string;
  min?: number;
  max?: number;
  placeholder?: string;
};
export function EntityForm({
  fields,
  submitLabel = "Simpan perubahan",
  note,
  steps,
}: {
  fields: FormField[];
  submitLabel?: string;
  note?: string;
  steps?: string[];
}) {
  const [activeStep, setActiveStep] = useState(0);
  const lastStep = (steps?.length ?? 1) - 1;

  return (
    <form
      className="grid gap-5 rounded-3xl border bg-white p-5 shadow-sm sm:p-7"
      action="#"
      noValidate
    >
      {steps && <Stepper active={activeStep} onStepChange={setActiveStep} steps={steps} />}
      {note && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{note}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(({ step: fieldStep, ...field }) => (
          <div
            className={cn(
              field.type === "textarea" && "md:col-span-2",
              steps && (fieldStep ?? 0) !== activeStep && "hidden",
            )}
            key={field.name}
          >
            {field.type === "textarea" ? (
              <AppTextarea {...field} />
            ) : field.type === "select" ? (
              <AppSelect {...field}>
                <option value="">Pilih {field.label.toLowerCase()}</option>
                {field.options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </AppSelect>
            ) : field.type === "file" ? (
              <AppFileUpload {...field} />
            ) : field.type === "date" ? (
              <AppDatePicker {...field} />
            ) : field.type === "number" ? (
              <FormattedNumberInput
                defaultValue=""
                helper={field.helper}
                label={field.label}
                max={field.max}
                min={field.min}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : (
              <AppInput {...field} />
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-5">
        <AppButton
          disabled={!steps || activeStep === 0}
          onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
          type="button"
          variant="secondary"
        >
          Kembali
        </AppButton>
        <div className="flex flex-wrap gap-2">
          <AppButton type="button" variant="outline">
            Simpan draft
          </AppButton>
          {steps && activeStep < lastStep ? (
            <AppButton
              onClick={() => setActiveStep((current) => Math.min(lastStep, current + 1))}
              type="button"
            >
              Lanjutkan
            </AppButton>
          ) : (
            <AppButton type="submit">{submitLabel}</AppButton>
          )}
        </div>
      </div>
      {/* TODO API: Kirim data form ke backend saat submit */}
      {/* TODO API: Simpan data sebagai draft */}
    </form>
  );
}
