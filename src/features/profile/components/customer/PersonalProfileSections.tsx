"use client";

import { useCallback } from "react";
import { usePopup } from "@/components/common/Popup";
import { FormSection } from "@/features/profile/components/shared/ProfileFormFields";
import { ImageUploadPreview } from "@/features/profile/components/shared/ImageUploadPreview";
import { RegionFields } from "@/components/forms/RegionFields";
import { AppInput, AppSelect, AppTextarea } from "@/components/ui/FormFields";
import { useImageUpload } from "@/hooks/useImageUpload";
import { deleteCustomerAvatar, getAttachmentBlob } from "@/services/attachmentService";
import type { CustomerApiProfile } from "@/types/profile";
import { customerProfileToForm } from "@/features/profile/mappers/profileMappers";

export function CustomerPersonalSections({
  activeStep,
  onDataChanged,
  profile,
}: {
  activeStep: number;
  onDataChanged: () => void;
  profile: CustomerApiProfile | null;
}) {
  const values = customerProfileToForm(profile);
  return (
    <>
      <FormSection
        active={activeStep === 0}
        description="Informasi dasar yang digunakan pada akun customer Anda."
        step={0}
        title="Data pribadi"
      >
        <AppInput
          defaultValue={values.fullName}
          label="Nama lengkap"
          maxLength={200}
          name="fullName"
          required
        />
        <AppSelect defaultValue={values.gender} label="Gender" name="gender">
          <option value="">Pilih gender</option>
          <option value="1">Laki-laki</option>
          <option value="2">Perempuan</option>
        </AppSelect>
        <AppInput
          defaultValue={values.birthDate}
          label="Tanggal lahir"
          name="birthDate"
          type="date"
        />
      </FormSection>
      <FormSection
        active={activeStep === 1}
        description="Pilih provinsi terlebih dahulu agar daftar kota sesuai."
        step={1}
        title="Alamat tempat tinggal"
      >
        <RegionFields initialCity={values.city} initialProvince={values.province} />
        <div className="md:col-span-2">
          <AppTextarea defaultValue={values.address} label="Alamat lengkap" name="address" />
        </div>
      </FormSection>
      <FormSection
        active={activeStep === 2}
        description="Unggah foto profile yang akan ditampilkan pada akun customer Anda."
        step={2}
        title="Foto profile"
      >
        <CustomerAvatarUpload
          attachmentId={profile?.avatarAttachmentId ?? null}
          onDeleted={onDataChanged}
          profileId={profile?.id ?? null}
        />
      </FormSection>
    </>
  );
}

function CustomerAvatarUpload({
  attachmentId,
  onDeleted,
  profileId,
}: {
  attachmentId: string | null;
  onDeleted: () => void;
  profileId: number | null;
}) {
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

  async function removeAvatar() {
    if (!profileId) return;
    const result = await confirm({
      confirmLabel: "Hapus",
      message: "Foto profile Anda akan dihapus.",
      title: "Hapus foto profile?",
      variant: "error",
    });
    if (!result.confirmed) return;
    image.setLoading(true);
    image.setError("");
    try {
      await deleteCustomerAvatar(profileId);
      image.clearPreview();
      onDeleted();
    } catch (error) {
      image.setError(error instanceof Error ? error.message : "Foto profile gagal dihapus.");
    } finally {
      image.setLoading(false);
    }
  }

  return (
    <ImageUploadPreview
      alt="Foto profile"
      emptyLabel="Belum ada gambar"
      error={image.error}
      helper="JPG, PNG, atau WebP maksimal 5 MB."
      inputLabel={image.previewUrl ? "Ganti foto profile" : "Upload foto profile"}
      inputName="avatarPhoto"
      isLoading={image.loading}
      note="Foto akan diunggah saat profile disimpan."
      onChange={image.selectImage}
      onRemove={attachmentId ? () => void removeAvatar() : undefined}
      previewUrl={image.previewUrl}
    />
  );
}
