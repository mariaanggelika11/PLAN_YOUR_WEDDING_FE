import { AppButton } from "@/components/ui/AppButton";
import {
  AppDatePicker,
  AppFileUpload,
  AppInput,
  AppSelect,
  AppTextarea,
} from "@/components/ui/FormFields";
import { Stepper } from "@/components/common/Interactive";

export type FormField = {
  label: string;
  name: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select" | "file";
  options?: string[];
  required?: boolean;
  helper?: string;
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
  return (
    <form className="grid gap-5 rounded-3xl border bg-white p-5 shadow-sm sm:p-7" action="#">
      {steps && <Stepper steps={steps} />}
      {note && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{note}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) =>
          field.type === "textarea" ? (
            <AppTextarea key={field.name} {...field} />
          ) : field.type === "select" ? (
            <AppSelect key={field.name} {...field}>
              <option value="">Pilih {field.label.toLowerCase()}</option>
              {field.options?.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </AppSelect>
          ) : field.type === "file" ? (
            <AppFileUpload key={field.name} {...field} />
          ) : field.type === "date" ? (
            <AppDatePicker key={field.name} {...field} />
          ) : (
            <AppInput key={field.name} {...field} />
          ),
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <AppButton type="button" variant="secondary">
          Simpan draft
        </AppButton>
        <AppButton type="submit">{submitLabel}</AppButton>
      </div>
      {/* TODO API: Kirim data form ke backend saat submit */}
      {/* TODO API: Simpan data sebagai draft */}
    </form>
  );
}
