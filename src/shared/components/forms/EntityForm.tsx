"use client";

import { Stepper } from "@/shared/components/navigation/Interactive";
import { AppButton } from "@/shared/components/ui/AppButton";
import { FormattedNumberInput } from "@/shared/components/ui/FormattedNumberInput";
import { MultiImageUpload } from "@/shared/components/ui/MultiImageUpload";
import {
  AppDatePicker,
  AppFileUpload,
  AppInput,
  AppSelect,
  AppTextarea,
} from "@/shared/components/ui/FormFields";
import { cn } from "@/shared/utils/cn";
import { useState, type FormEvent } from "react";

export type FormField = {
  label: string;
  name: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select" | "file" | "images";
  options?: string[];
  required?: boolean;
  helper?: string;
  step?: number;
  multiple?: boolean;
  accept?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  existingImageIds?: string[];
  loadExistingImage?: (id: string) => Promise<Blob>;
};
export function EntityForm({
  fields,
  initialValues = {},
  loading = false,
  onSave,
  showDraft = true,
  submitLabel = "Simpan perubahan",
  note,
  steps,
}: {
  fields: FormField[];
  initialValues?: Record<string, string | number | null | undefined>;
  loading?: boolean;
  onSave?: (form: HTMLFormElement, action: "draft" | "publish") => void | Promise<void>;
  showDraft?: boolean;
  submitLabel?: string;
  note?: string;
  steps?: string[];
}) {
  const [activeStep, setActiveStep] = useState(0);
  const lastStep = (steps?.length ?? 1) - 1;

  function validateStep(form: HTMLFormElement) {
    const controls = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        `[data-entity-step="${activeStep}"] input, [data-entity-step="${activeStep}"] select, [data-entity-step="${activeStep}"] textarea`,
      ),
    );
    const invalid = controls.find((control) => !control.checkValidity());
    if (invalid) invalid.reportValidity();
    return !invalid;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep(event.currentTarget)) return;
    void onSave?.(event.currentTarget, "publish");
  }

  return (
    <form className="grid gap-5 rounded-3xl border bg-white p-5 shadow-sm sm:p-7" onSubmit={submit}>
      {steps && <Stepper active={activeStep} onStepChange={setActiveStep} steps={steps} />}
      {note && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{note}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(({ options, step: fieldStep, ...field }) => (
          <div
            className={cn(
              ["images", "textarea"].includes(field.type ?? "") && "md:col-span-2",
              steps && (fieldStep ?? 0) !== activeStep && "hidden",
            )}
            data-entity-step={fieldStep ?? 0}
            key={field.name}
          >
            {field.type === "textarea" ? (
              <AppTextarea {...field} defaultValue={initialValues[field.name] ?? ""} />
            ) : field.type === "select" ? (
              <AppSelect
                {...field}
                defaultValue={initialValues[field.name] ?? ""}
                disabled={!options?.length}
              >
                <option value="">Pilih {field.label.toLowerCase()}</option>
                {options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </AppSelect>
            ) : field.type === "file" ? (
              <AppFileUpload {...field} />
            ) : field.type === "images" ? (
              <MultiImageUpload
                helper={field.helper}
                existingImageIds={field.existingImageIds}
                label={field.label}
                loadExistingImage={field.loadExistingImage}
                name={field.name}
                required={field.required}
              />
            ) : field.type === "date" ? (
              <AppDatePicker {...field} defaultValue={initialValues[field.name] ?? ""} />
            ) : field.type === "number" ? (
              <FormattedNumberInput
                defaultValue={initialValues[field.name]}
                helper={field.helper}
                label={field.label}
                max={field.max}
                min={field.min}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : (
              <AppInput {...field} defaultValue={initialValues[field.name] ?? ""} />
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
          {showDraft && (
            <AppButton
              loading={loading}
              onClick={(event) => void onSave?.(event.currentTarget.form!, "draft")}
              type="button"
              variant="outline"
            >
              Simpan draft
            </AppButton>
          )}
          {steps && activeStep < lastStep ? (
            <AppButton
              disabled={loading}
              onClick={(event) => {
                const form = event.currentTarget.form;
                if (form && validateStep(form)) {
                  setActiveStep((current) => Math.min(lastStep, current + 1));
                }
              }}
              type="button"
            >
              Lanjutkan
            </AppButton>
          ) : (
            <AppButton loading={loading} type="submit">
              {submitLabel}
            </AppButton>
          )}
        </div>
      </div>
    </form>
  );
}
