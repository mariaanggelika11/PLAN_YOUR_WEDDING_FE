"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { MASTER_PARAMETER_CODES } from "@/features/parameters/constants";
import { useMasterParameters } from "@/features/parameters/useMasterParameters";
import {
  FormGroupHeader,
  MasterParameterCheckboxGroup,
  MasterParameterSelect,
} from "@/features/profile/components/shared/ProfileFormFields";
import { RegionFields } from "@/features/profile/components/shared/RegionFields";
import { WeddingDetailsSection } from "@/features/profile/components/shared/StepSectionLayouts";
import { resolveEventTypeOption } from "@/features/profile/mappers";
import type { CustomerApiProfile } from "@/features/profile/types";
import { AppInput, AppSelect, AppTextarea } from "@/shared/components/ui/FormFields";
import { FormattedNumberInput } from "@/shared/components/ui/FormattedNumberInput";

export function CustomerWeddingDetailsSection({
  active,
  masterParameters,
  profile,
}: {
  active: boolean;
  masterParameters: ReturnType<typeof useMasterParameters>;
  profile: CustomerApiProfile | null;
}) {
  const { translateText } = useTranslation();
  const eventTypeOptions = masterParameters.getOptions(MASTER_PARAMETER_CODES.customerEventType);
  const vendorCategoryOptions = masterParameters.getOptions(MASTER_PARAMETER_CODES.vendorCategory);
  return (
    <WeddingDetailsSection active={active}>
      <FormGroupHeader
        description={translateText("Informasi utama mengenai waktu, tempat, dan konsep acara.")}
        title={translateText("Data Pernikahan")}
      />
      <AppInput
        defaultValue={profile?.weddingDate?.slice(0, 10) ?? ""}
        label={translateText("Tanggal acara")}
        name="weddingDate"
        type="date"
      />
      <MasterParameterSelect
        emptyMessage={
          masterParameters.loading
            ? translateText("Memuat pilihan jenis acara...")
            : masterParameters.emptyMessage(MASTER_PARAMETER_CODES.customerEventType)
        }
        label={translateText("Jenis acara")}
        name="eventType"
        options={eventTypeOptions}
        placeholder={translateText("Pilih jenis acara")}
        value={
          resolveEventTypeOption(profile?.eventType, eventTypeOptions) ||
          masterParameters.resolveValue(
            MASTER_PARAMETER_CODES.customerEventType,
            profile?.eventType,
          )
        }
      />
      <RegionFields
        cityLabel="Kota/Kabupaten acara"
        cityName="weddingCity"
        initialCity={profile?.weddingCity ?? ""}
        initialProvince={profile?.weddingProvince ?? ""}
        provinceLabel="Provinsi acara"
        provinceName="weddingProvince"
      />
      <div className="md:col-span-2">
        <AppTextarea
          defaultValue={profile?.weddingLocation ?? ""}
          label={translateText("Lokasi atau venue acara")}
          name="weddingLocation"
          placeholder={translateText("Contoh: The Glass House, Jl. Gatot Subroto No. 10")}
        />
      </div>
      <div className="md:col-span-2">
        <AppTextarea
          defaultValue={profile?.weddingTheme ?? ""}
          label={translateText("Konsep atau tema pernikahan")}
          name="weddingTheme"
          placeholder={translateText("Contoh: Modern romantic dengan nuansa putih dan dusty pink")}
        />
      </div>
      <FormGroupHeader
        description={translateText(
          "Bantu sistem memahami skala acara dan vendor yang sedang dicari.",
        )}
        title={translateText("Data Kebutuhan Acara")}
      />
      <FormattedNumberInput
        defaultValue={profile?.estimatedGuests ?? ""}
        label={translateText("Estimasi jumlah tamu")}
        min={1}
        name="estimatedGuests"
      />
      <AppInput
        defaultValue={profile?.preferredVendorLocation ?? ""}
        label={translateText("Preferensi lokasi vendor")}
        name="preferredVendorLocation"
        placeholder={translateText("Contoh: Jakarta dan sekitarnya")}
      />
      <AppSelect
        defaultValue={profile?.packagePreference ?? ""}
        label={translateText("Preferensi paket wedding")}
        name="packagePreference"
      >
        <option value="">{translateText("Belum ada preferensi")}</option>
        <option value="FULL_SERVICE">{translateText("Paket lengkap / full service")}</option>
        <option value="PER_SERVICE">{translateText("Paket per layanan")}</option>
        <option value="CUSTOM">{translateText("Paket custom")}</option>
      </AppSelect>
      <MasterParameterCheckboxGroup
        allowSelectAll
        emptyMessage={masterParameters.emptyMessage(MASTER_PARAMETER_CODES.vendorCategory)}
        initialValues={masterParameters.resolveValues(
          MASTER_PARAMETER_CODES.vendorCategory,
          profile?.neededVendorCategories,
        )}
        label={translateText("Kebutuhan vendor")}
        name="neededVendorCategories"
        options={vendorCategoryOptions}
      />
      <FormGroupHeader
        description={translateText(
          "Tentukan rencana biaya agar pengeluaran dapat dipantau sejak awal.",
        )}
        title={translateText("Data Budget")}
      />
      <FormattedNumberInput
        defaultValue={profile?.estimatedBudget ?? ""}
        label={translateText("Estimasi total budget")}
        min={0}
        name="estimatedBudget"
        placeholder={translateText("Contoh: 250.000.000")}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormattedNumberInput
          defaultValue={profile?.budgetRangeMin ?? ""}
          label={translateText("Budget minimum")}
          min={0}
          name="budgetRangeMin"
        />
        <FormattedNumberInput
          defaultValue={profile?.budgetRangeMax ?? ""}
          label={translateText("Budget maksimum")}
          min={0}
          name="budgetRangeMax"
        />
      </div>
      <MasterParameterCheckboxGroup
        allowSelectAll
        emptyMessage={masterParameters.emptyMessage(MASTER_PARAMETER_CODES.vendorCategory)}
        initialValues={masterParameters.resolveValues(
          MASTER_PARAMETER_CODES.vendorCategory,
          profile?.budgetPriorities,
        )}
        label={translateText("Prioritas budget")}
        name="budgetPriorities"
        options={vendorCategoryOptions}
      />
    </WeddingDetailsSection>
  );
}
