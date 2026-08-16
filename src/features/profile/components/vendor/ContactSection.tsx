"use client";

import { deleteVendorContact } from "@/features/profile/api/profileApi";
import {
  EmptyCollection,
  SectionHeading,
} from "@/features/profile/components/shared/CollectionState";
import { ContactSection } from "@/features/profile/components/shared/StepSectionLayouts";
import { useProfileCollectionDelete } from "@/features/profile/hooks/useProfileCollectionDelete";
import {
  VENDOR_CONTACT_OPTIONS,
  savedVendorContact,
  type VendorContactField,
} from "@/features/profile/mappers";
import type { VendorApiProfile } from "@/features/profile/types";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput, AppSelect } from "@/shared/components/ui/FormFields";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function VendorContactSection({
  onDeleted,
  profile,
}: {
  onDeleted: () => void;
  profile: VendorApiProfile | null;
}) {
  const deletion = useProfileCollectionDelete();
  const initialFields = VENDOR_CONTACT_OPTIONS.filter(({ field }) =>
    Boolean(savedVendorContact(profile, field)?.contactValue),
  ).map(({ field }) => field);
  const [fields, setFields] = useState<VendorContactField[]>(
    initialFields.length ? initialFields : ["whatsappNumber"],
  );
  const availableOptions = VENDOR_CONTACT_OPTIONS.filter(({ field }) => !fields.includes(field));

  async function removeContact(field: VendorContactField) {
    const contact = savedVendorContact(profile, field);
    await deletion.remove({
      action: contact ? () => deleteVendorContact(contact.id) : undefined,
      confirmMessage: `Kontak ${contact?.contactType ?? "ini"} akan dihapus dari profile vendor.`,
      confirmTitle: "Hapus kontak?",
      errorMessage: "Kontak gagal dihapus.",
      onDeleted: () => {
        setFields((current) => current.filter((item) => item !== field));
        onDeleted();
      },
    });
  }

  return (
    <ContactSection>
      <div className="grid gap-4 md:col-span-2">
        <SectionHeading
          action={
            <AppButton
              disabled={!availableOptions.length}
              onClick={() =>
                availableOptions[0] &&
                setFields((current) => [...current, availableOptions[0].field])
              }
              type="button"
              variant="secondary"
            >
              <Plus size={16} /> Tambah kontak
            </AppButton>
          }
          description="Tambahkan kanal resmi yang dapat digunakan customer untuk mengenal bisnis Anda."
          title="Kontak bisnis"
        />
        {!fields.length ? (
          <EmptyCollection message="Belum ada kontak bisnis. Tambahkan setidaknya satu kanal kontak." />
        ) : (
          <div className="grid gap-3">
            {fields.map((field) => {
              const option = VENDOR_CONTACT_OPTIONS.find((item) => item.field === field)!;
              return (
                <div
                  className="grid gap-3 rounded-2xl border bg-stone-50/60 p-4 sm:grid-cols-[150px_1fr_auto] sm:items-end"
                  key={field}
                >
                  <AppSelect
                    aria-label="Jenis kontak"
                    label="Jenis kontak"
                    onChange={(event) => {
                      const next = event.target.value as VendorContactField;
                      setFields((current) => current.map((item) => (item === field ? next : item)));
                    }}
                    value={field}
                  >
                    {VENDOR_CONTACT_OPTIONS.map((item) => (
                      <option
                        disabled={fields.includes(item.field) && item.field !== field}
                        key={item.field}
                        value={item.field}
                      >
                        {item.label}
                      </option>
                    ))}
                  </AppSelect>
                  <AppInput
                    defaultValue={savedVendorContact(profile, field)?.contactValue ?? ""}
                    label="Detail kontak"
                    name={field}
                    placeholder={option.placeholder}
                    type={option.type}
                  />
                  <button
                    aria-label={`Hapus kontak ${option.label}`}
                    className="grid size-11 place-items-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                    disabled={deletion.deleting}
                    onClick={() => void removeContact(field)}
                    title="Hapus kontak"
                    type="button"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ContactSection>
  );
}
