"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";

import { MASTER_PARAMETER_CODES } from "@/features/parameters/constants";
import { useMasterParameters } from "@/features/parameters/useMasterParameters";
import { getAttachmentBlob, getVendorLogo } from "@/features/profile/api/attachmentApi";
import { ImageUploadPreview } from "@/features/profile/components/shared/ImageUploadPreview";
import { LocationPicker } from "@/features/profile/components/location/LocationPicker";
import {
  FormGroupHeader,
  MasterParameterCheckboxGroup,
} from "@/features/profile/components/shared/ProfileFormFields";
import { RegionFields } from "@/features/profile/components/shared/RegionFields";
import { ServiceAreaField } from "@/features/locations/ServiceAreaField";
import { BusinessInformationSection } from "@/features/profile/components/shared/StepSectionLayouts";
import { useImageUpload } from "@/features/profile/hooks/useImageUpload";
import { vendorProfileToForm } from "@/features/profile/mappers";
import type { VendorApiProfile } from "@/features/profile/types";
import { usePopup } from "@/shared/components/feedback/Popup";
import { AppInput, AppTextarea } from "@/shared/components/ui/FormFields";
import { useCallback, useState, type ChangeEvent } from "react";

export function VendorBusinessInformationSection({
  active,
  canEditBusiness,
  canEditOperations,
  masterParameters,
  profile,
}: {
  active: boolean;
  canEditBusiness: boolean;
  canEditOperations: boolean;
  masterParameters: ReturnType<typeof useMasterParameters>;
  profile: VendorApiProfile | null;
}) {
  const { translateText } = useTranslation();
  const values = vendorProfileToForm(profile);
  const options = masterParameters.getOptions(MASTER_PARAMETER_CODES.vendorCategory);
  return (
    <BusinessInformationSection active={active}>
      <fieldset className="contents" disabled={!canEditBusiness}>
        <AppInput
          defaultValue={values.businessName}
          label={translateText("Nama bisnis")}
          maxLength={100}
          name="businessName"
          required
        />
        <AppInput
          defaultValue={values.businessEmail}
          label={translateText("Email bisnis")}
          maxLength={100}
          name="businessEmail"
          required
          type="email"
        />
        <AppInput
          defaultValue={values.businessPhone}
          label={translateText("Nomor telepon bisnis")}
          maxLength={100}
          name="businessPhone"
          required
          type="tel"
        />
        <div className="md:col-span-2">
          <AppTextarea
            defaultValue={values.description}
            label={translateText("Deskripsi bisnis")}
            name="description"
          />
        </div>
        <FormGroupHeader
          description={translateText(
            "Alamat kantor atau tempat usaha Anda. Wilayah yang dilayani dipilih secara terpisah di bawah.",
          )}
          title={translateText("Lokasi bisnis")}
        />
        <RegionFields initialCity={values.city} initialProvince={values.province} />
        <LocationPicker initialLatitude={values.latitude} initialLongitude={values.longitude} />
        <div className="md:col-span-2">
          <ServiceAreaField
            name="serviceArea"
            initialValue={values.serviceArea}
            disabled={!canEditBusiness}
          />
        </div>
        <div className="md:col-span-2">
          <AppTextarea
            defaultValue={values.businessAddress}
            label={translateText("Alamat bisnis")}
            name="businessAddress"
            required
          />
        </div>
      </fieldset>
      <fieldset className="contents" disabled={!canEditBusiness}>
        <FormGroupHeader
          description={translateText(
            "Pilih satu atau beberapa kategori layanan yang disediakan bisnis Anda.",
          )}
          title={translateText("Kategori layanan")}
        />
        <MasterParameterCheckboxGroup
          emptyMessage={masterParameters.emptyMessage(MASTER_PARAMETER_CODES.vendorCategory)}
          initialValues={masterParameters.resolveValues(
            MASTER_PARAMETER_CODES.vendorCategory,
            profile?.categories,
          )}
          label={translateText("Kategori layanan")}
          name="categories"
          options={options}
        />
      </fieldset>
      <FormGroupHeader
        description={translateText("Gunakan logo yang mudah dikenali customer.")}
        title={translateText("Logo brand")}
      />
      <fieldset className="contents" disabled={!canEditOperations}>
        <VendorLogoUpload profileId={profile?.id ?? null} />
      </fieldset>
    </BusinessInformationSection>
  );
}

function VendorLogoUpload({ profileId }: { profileId: number | null }) {
  const { translateText } = useTranslation();
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
  const [removePending, setRemovePending] = useState(false);
  async function removeLogo() {
    if (!profileId) return;
    const result = await confirm({
      confirmLabel: "Hapus",
      message: "Logo akan dihapus dari profile bisnis Anda.",
      title: "Hapus logo bisnis?",
      variant: "error",
    });
    if (!result.confirmed) return;
    image.clearPreview();
    setRemovePending(true);
  }
  function selectLogo(event: ChangeEvent<HTMLInputElement>) {
    setRemovePending(false);
    image.selectImage(event);
  }
  return (
    <>
      <ImageUploadPreview
        alt={translateText("Logo bisnis")}
        emptyLabel={
          image.error ? translateText("Logo gagal dimuat") : translateText("Belum ada logo")
        }
        error={image.error}
        helper={translateText("JPG, PNG, atau WebP maksimal 5 MB. Disarankan gambar persegi.")}
        inputLabel={
          image.previewUrl
            ? translateText("Ganti logo bisnis")
            : translateText("Upload logo bisnis")
        }
        inputName="logoFile"
        isLoading={image.loading}
        note={
          removePending
            ? translateText("Logo akan dihapus saat perubahan disimpan.")
            : translateText("Logo akan diunggah saat profile vendor disimpan.")
        }
        onChange={selectLogo}
        onRemove={profileId ? () => void removeLogo() : undefined}
        previewUrl={image.previewUrl}
      />
      <input name="removeVendorLogo" type="hidden" value={String(removePending)} />
    </>
  );
}
