import {
  FormGroupHeader,
  MasterParameterCheckboxGroup,
  MasterParameterSelect,
} from "@/features/profile/components/shared/ProfileFormFields";
import { WeddingDetailsSection } from "@/features/profile/components/shared/StepSectionLayouts";
import { resolveEventTypeOption } from "@/features/profile/mappers/profileMappers";
import { RegionFields } from "@/components/forms/RegionFields";
import { AppInput, AppSelect, AppTextarea } from "@/components/ui/FormFields";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import { MASTER_PARAMETER_CODES } from "@/constants/parameters";
import { useMasterParameters } from "@/hooks/useMasterParameters";
import type { CustomerApiProfile } from "@/types/profile";

export function CustomerWeddingDetailsSection({
  active,
  masterParameters,
  profile,
}: {
  active: boolean;
  masterParameters: ReturnType<typeof useMasterParameters>;
  profile: CustomerApiProfile | null;
}) {
  const eventTypeOptions = masterParameters.getOptions(MASTER_PARAMETER_CODES.customerEventType);
  const vendorCategoryOptions = masterParameters.getOptions(MASTER_PARAMETER_CODES.vendorCategory);
  return (
    <WeddingDetailsSection active={active}>
      <FormGroupHeader
        description="Informasi utama mengenai waktu, tempat, dan konsep acara."
        title="Data Pernikahan"
      />
      <AppInput
        defaultValue={profile?.weddingDate?.slice(0, 10) ?? ""}
        label="Tanggal acara"
        name="weddingDate"
        type="date"
      />
      <MasterParameterSelect
        emptyMessage={
          masterParameters.loading
            ? "Memuat pilihan jenis acara..."
            : masterParameters.emptyMessage(MASTER_PARAMETER_CODES.customerEventType)
        }
        label="Jenis acara"
        name="eventType"
        options={eventTypeOptions}
        placeholder="Pilih jenis acara"
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
          label="Lokasi atau venue acara"
          name="weddingLocation"
          placeholder="Contoh: The Glass House, Jl. Gatot Subroto No. 10"
        />
      </div>
      <div className="md:col-span-2">
        <AppTextarea
          defaultValue={profile?.weddingTheme ?? ""}
          label="Konsep atau tema pernikahan"
          name="weddingTheme"
          placeholder="Contoh: Modern romantic dengan nuansa putih dan dusty pink"
        />
      </div>
      <FormGroupHeader
        description="Bantu sistem memahami skala acara dan vendor yang sedang dicari."
        title="Data Kebutuhan Acara"
      />
      <FormattedNumberInput
        defaultValue={profile?.estimatedGuests ?? ""}
        label="Estimasi jumlah tamu"
        min={1}
        name="estimatedGuests"
      />
      <AppInput
        defaultValue={profile?.preferredVendorLocation ?? ""}
        label="Preferensi lokasi vendor"
        name="preferredVendorLocation"
        placeholder="Contoh: Jakarta dan sekitarnya"
      />
      <AppSelect
        defaultValue={profile?.packagePreference ?? ""}
        label="Preferensi paket wedding"
        name="packagePreference"
      >
        <option value="">Belum ada preferensi</option>
        <option value="FULL_SERVICE">Paket lengkap / full service</option>
        <option value="PER_SERVICE">Paket per layanan</option>
        <option value="CUSTOM">Paket custom</option>
      </AppSelect>
      <MasterParameterCheckboxGroup
        emptyMessage={masterParameters.emptyMessage(MASTER_PARAMETER_CODES.vendorCategory)}
        initialValues={masterParameters.resolveValues(
          MASTER_PARAMETER_CODES.vendorCategory,
          profile?.neededVendorCategories,
        )}
        label="Kebutuhan vendor"
        name="neededVendorCategories"
        options={vendorCategoryOptions}
      />
      <FormGroupHeader
        description="Tentukan rencana biaya agar pengeluaran dapat dipantau sejak awal."
        title="Data Budget"
      />
      <FormattedNumberInput
        defaultValue={profile?.estimatedBudget ?? ""}
        label="Estimasi total budget"
        min={0}
        name="estimatedBudget"
        placeholder="Contoh: 250.000.000"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormattedNumberInput
          defaultValue={profile?.budgetRangeMin ?? ""}
          label="Budget minimum"
          min={0}
          name="budgetRangeMin"
        />
        <FormattedNumberInput
          defaultValue={profile?.budgetRangeMax ?? ""}
          label="Budget maksimum"
          min={0}
          name="budgetRangeMax"
        />
      </div>
      <MasterParameterCheckboxGroup
        emptyMessage={masterParameters.emptyMessage(MASTER_PARAMETER_CODES.vendorCategory)}
        initialValues={masterParameters.resolveValues(
          MASTER_PARAMETER_CODES.vendorCategory,
          profile?.budgetPriorities,
        )}
        label="Prioritas budget"
        name="budgetPriorities"
        options={vendorCategoryOptions}
      />
    </WeddingDetailsSection>
  );
}
