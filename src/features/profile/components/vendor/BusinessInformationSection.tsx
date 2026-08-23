"use client";

import { MASTER_PARAMETER_CODES } from "@/features/parameters/constants";
import { useMasterParameters } from "@/features/parameters/useMasterParameters";
import {
  deleteVendorLogo,
  getAttachmentBlob,
  getVendorLogo,
} from "@/features/profile/api/attachmentApi";
import { ImageUploadPreview } from "@/features/profile/components/shared/ImageUploadPreview";
import { LocationPicker } from "@/features/profile/components/location/LocationPicker";
import {
  FormGroupHeader,
  MasterParameterCheckboxGroup,
} from "@/features/profile/components/shared/ProfileFormFields";
import { RegionFields } from "@/features/profile/components/shared/RegionFields";
import { BusinessInformationSection } from "@/features/profile/components/shared/StepSectionLayouts";
import { useImageUpload } from "@/features/profile/hooks/useImageUpload";
import { vendorProfileToForm } from "@/features/profile/mappers";
import type { VendorApiProfile } from "@/features/profile/types";
import { usePopup } from "@/shared/components/feedback/Popup";
import { AppInput, AppTextarea } from "@/shared/components/ui/FormFields";
import { useCallback } from "react";

export function VendorBusinessInformationSection({
  active,
  canEditBusiness,
  canEditCore,
  canEditOperations,
  masterParameters,
  onDataChanged,
  profile,
}: {
  active: boolean;
  canEditBusiness: boolean;
  canEditCore: boolean;
  canEditOperations: boolean;
  masterParameters: ReturnType<typeof useMasterParameters>;
  onDataChanged: () => void;
  profile: VendorApiProfile | null;
}) {
  const values = vendorProfileToForm(profile);
  const options = masterParameters.getOptions(MASTER_PARAMETER_CODES.vendorCategory);
  return (
    <BusinessInformationSection active={active}>
      <fieldset className="contents" disabled={!canEditBusiness}>
        <AppInput
          defaultValue={values.businessName}
          label="Nama bisnis"
          maxLength={100}
          name="businessName"
          required
        />
        <AppInput
          defaultValue={values.businessEmail}
          label="Email bisnis"
          maxLength={100}
          name="businessEmail"
          required
          type="email"
        />
        <AppInput
          defaultValue={values.businessPhone}
          label="Nomor telepon bisnis"
          maxLength={100}
          name="businessPhone"
          required
          type="tel"
        />
        <div className="md:col-span-2">
          <AppTextarea
            defaultValue={values.description}
            label="Deskripsi bisnis"
            name="description"
          />
        </div>
        <FormGroupHeader
          description="Lokasi operasional dan wilayah yang dapat dilayani."
          title="Lokasi dan layanan"
        />
        <RegionFields initialCity={values.city} initialProvince={values.province} />
        <LocationPicker initialLatitude={values.latitude} initialLongitude={values.longitude} />
        <AppInput defaultValue={values.serviceArea} label="Area layanan" name="serviceArea" />
        <div className="md:col-span-2">
          <AppTextarea
            defaultValue={values.businessAddress}
            label="Alamat bisnis"
            name="businessAddress"
            required
          />
        </div>
      </fieldset>
      <fieldset className="contents" disabled={!canEditCore}>
        <FormGroupHeader
          description="Pilih kategori yang paling sesuai dengan jasa utama vendor."
          title="Kategori vendor"
        />
        <MasterParameterCheckboxGroup
          emptyMessage={masterParameters.emptyMessage(MASTER_PARAMETER_CODES.vendorCategory)}
          initialValues={masterParameters.resolveValues(
            MASTER_PARAMETER_CODES.vendorCategory,
            profile?.categories,
          )}
          label="Kategori layanan"
          name="categories"
          options={options}
        />
      </fieldset>
      <FormGroupHeader
        description="Gunakan logo yang mudah dikenali customer."
        title="Logo brand"
      />
      <fieldset className="contents" disabled={!canEditOperations}>
        <VendorLogoUpload onDeleted={onDataChanged} profileId={profile?.id ?? null} />
      </fieldset>
    </BusinessInformationSection>
  );
}

function VendorLogoUpload({
  onDeleted,
  profileId,
}: {
  onDeleted: () => void;
  profileId: number | null;
}) {
  const { confirm } = usePopup();
  const load = useCallback(async () => {
    if (!profileId) return null;
    const attachment = await getVendorLogo(profileId);
    return attachment ? getAttachmentBlob(attachment.id) : null;
  }, [profileId]);
  const image = useImageUpload({
    enabled: Boolean(profileId),
    load,
    loadErrorMessage: "Logo gagal dimuat.",
  });
  async function removeLogo() {
    if (!profileId) return;
    const result = await confirm({
      confirmLabel: "Hapus",
      message: "Logo akan dihapus dari profile bisnis Anda.",
      title: "Hapus logo bisnis?",
      variant: "error",
    });
    if (!result.confirmed) return;
    await image.run(
      () => deleteVendorLogo(profileId),
      "Logo gagal dihapus.",
      () => {
        image.clearPreview();
        onDeleted();
      },
    );
  }
  return (
    <ImageUploadPreview
      alt="Logo bisnis"
      emptyLabel={image.error ? "Logo gagal dimuat" : "Belum ada logo"}
      error={image.error}
      helper="JPG, PNG, atau WebP maksimal 5 MB. Disarankan gambar persegi."
      inputLabel={image.previewUrl ? "Ganti logo bisnis" : "Upload logo bisnis"}
      inputName="logoFile"
      isLoading={image.loading}
      note="Logo akan diunggah saat profile vendor disimpan."
      onChange={image.selectImage}
      onRemove={profileId ? () => void removeLogo() : undefined}
      previewUrl={image.previewUrl}
    />
  );
}
