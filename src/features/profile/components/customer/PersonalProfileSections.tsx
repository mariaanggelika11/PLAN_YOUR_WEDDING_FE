"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";

import { getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { ImageUploadPreview } from "@/features/profile/components/shared/ImageUploadPreview";
import { FormSection } from "@/features/profile/components/shared/ProfileFormFields";
import { RegionFields } from "@/features/profile/components/shared/RegionFields";
import { useImageUpload } from "@/features/profile/hooks/useImageUpload";
import { customerProfileToForm } from "@/features/profile/mappers";
import type { CustomerApiProfile } from "@/features/profile/types";
import { usePopup } from "@/shared/components/feedback/Popup";
import { AppInput, AppSelect, AppTextarea } from "@/shared/components/ui/FormFields";
import { useCallback, useState, type ChangeEvent } from "react";

export function CustomerPersonalSections({
  activeStep,
  profile,
}: {
  activeStep: number;
  profile: CustomerApiProfile | null;
}) {
  const { translateText } = useTranslation();
  const values = customerProfileToForm(profile);
  return (
    <>
      <FormSection
        active={activeStep === 0}
        description={translateText("Informasi dasar yang digunakan pada akun customer Anda.")}
        step={0}
        title={translateText("Data pribadi")}
      >
        <AppInput
          defaultValue={values.fullName}
          label={translateText("Nama lengkap")}
          maxLength={200}
          name="fullName"
          required
        />
        <AppSelect defaultValue={values.gender} label="Gender" name="gender">
          <option value="">{translateText("Pilih gender")}</option>
          <option value="1">{translateText("Laki-laki")}</option>
          <option value="2">{translateText("Perempuan")}</option>
        </AppSelect>
        <AppInput
          defaultValue={values.birthDate}
          label={translateText("Tanggal lahir")}
          name="birthDate"
          type="date"
        />
      </FormSection>
      <FormSection
        active={activeStep === 1}
        description={translateText("Pilih provinsi terlebih dahulu agar daftar kota sesuai.")}
        step={1}
        title={translateText("Alamat tempat tinggal")}
      >
        <RegionFields initialCity={values.city} initialProvince={values.province} />
        <div className="md:col-span-2">
          <AppTextarea
            defaultValue={values.address}
            label={translateText("Alamat lengkap")}
            name="address"
          />
        </div>
      </FormSection>
      <FormSection
        active={activeStep === 2}
        description={translateText(
          "Unggah foto profile yang akan ditampilkan pada akun customer Anda.",
        )}
        step={2}
        title={translateText("Foto profile")}
      >
        <CustomerAvatarUpload attachmentId={profile?.avatarAttachmentId ?? null} />
      </FormSection>
    </>
  );
}

function CustomerAvatarUpload({ attachmentId }: { attachmentId: string | null }) {
  const { translateText } = useTranslation();
  const { confirm } = usePopup();
  const load = useCallback(
    () => (attachmentId ? getAttachmentBlob(attachmentId) : Promise.resolve(null)),
    [attachmentId],
  );
  const image = useImageUpload({
    enabled: Boolean(attachmentId),
    load,
    loadErrorMessage: "Foto profile gagal dimuat.",
  });
  const [removePending, setRemovePending] = useState(false);

  async function removeAvatar() {
    const result = await confirm({
      confirmLabel: "Hapus",
      message: "Foto profile Anda akan dihapus.",
      title: "Hapus foto profile?",
      variant: "error",
    });
    if (!result.confirmed) return;
    image.clearPreview();
    setRemovePending(true);
  }

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    setRemovePending(false);
    image.selectImage(event);
  }

  return (
    <>
      <ImageUploadPreview
        alt={translateText("Foto profile")}
        emptyLabel="Belum ada gambar"
        error={image.error}
        helper={translateText("JPG, PNG, atau WebP maksimal 5 MB.")}
        inputLabel={image.previewUrl ? "Ganti foto profile" : "Upload foto profile"}
        inputName="avatarPhoto"
        isLoading={image.loading}
        note={
          removePending
            ? translateText("Foto akan dihapus saat perubahan disimpan.")
            : translateText("Foto akan diunggah saat profile disimpan.")
        }
        onChange={selectAvatar}
        onRemove={attachmentId ? () => void removeAvatar() : undefined}
        previewUrl={image.previewUrl}
      />
      <input name="removeAvatarPhoto" type="hidden" value={String(removePending)} />
    </>
  );
}
