"use client";

import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { Stepper } from "@/components/common/Interactive";
import { RegionFields } from "@/components/forms/RegionFields";
import { ErrorState, LoadingSkeleton, SuccessState } from "@/components/states/States";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput, AppSelect, AppTextarea } from "@/components/ui/FormFields";
import { categoryLabels } from "@/constants/menu";
import {
  getCustomerProfile,
  getVendorProfile,
  ProfileError,
  saveCustomerProfile,
  saveVendorProfile,
} from "@/services/profileService";
import type {
  CustomerApiProfile,
  CustomerProfilePayload,
  VendorApiProfile,
  VendorProfilePayload,
} from "@/types/profile";
import { cn } from "@/utils/cn";

type ProfileType = "customer" | "vendor";
type ProfileData = CustomerApiProfile | VendorApiProfile;

export function ProfileForm({ type }: { type: ProfileType }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const steps =
    type === "customer"
      ? ["Data Pribadi", "Alamat", "Foto Profile", "Detail Pernikahan"]
      : [
          "Pemilik",
          "Informasi Bisnis",
          "Lokasi & Layanan",
          "Kategori",
          "Brand & Portofolio",
          "Kontak & Rekening",
          "Dokumen Verifikasi",
        ];

  async function loadProfile() {
    setIsLoading(true);
    setLoadError(false);
    try {
      setProfile(type === "customer" ? await getCustomerProfile() : await getVendorProfile());
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    // Profile type is fixed for the lifetime of each role page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const saved =
        type === "customer"
          ? await saveCustomerProfile(profile?.id ?? null, customerPayload(form))
          : await saveVendorProfile(profile?.id ?? null, vendorPayload(form));
      setProfile(saved);
      setMessage("Profile berhasil disimpan.");
    } catch (submitError) {
      setError(
        submitError instanceof ProfileError
          ? submitError.message
          : "Profile gagal disimpan. Silakan coba kembali.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function continueToNextStep(event: MouseEvent<HTMLButtonElement>) {
    const section = event.currentTarget.form?.querySelector<HTMLElement>(
      `[data-profile-step="${activeStep}"]`,
    );
    const controls = Array.from(
      section?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea",
      ) ?? [],
    );
    const invalidControl = controls.find((control) => !control.checkValidity());
    if (invalidControl) return invalidControl.reportValidity();
    setActiveStep((current) => Math.min(steps.length - 1, current + 1));
  }

  if (isLoading) return <LoadingSkeleton />;
  if (loadError) return <ErrorState retry={() => void loadProfile()} />;

  return (
    <form className="grid gap-5 rounded-3xl border bg-white p-5 shadow-sm sm:p-7" onSubmit={submit}>
      <Stepper active={activeStep} onStepChange={setActiveStep} steps={steps} />

      {type === "customer" ? (
        <CustomerFields activeStep={activeStep} profile={profile as CustomerApiProfile | null} />
      ) : (
        <VendorFields activeStep={activeStep} profile={profile as VendorApiProfile | null} />
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {message && <SuccessState message={message} />}

      <div className="flex justify-between gap-3">
        <AppButton
          disabled={activeStep === 0 || isSaving}
          onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
          type="button"
          variant="secondary"
        >
          Kembali
        </AppButton>
        {activeStep < steps.length - 1 ? (
          <AppButton onClick={continueToNextStep} type="button">
            Lanjutkan
          </AppButton>
        ) : (
          <AppButton loading={isSaving} type="submit">
            Simpan perubahan
          </AppButton>
        )}
      </div>
    </form>
  );
}

function CustomerFields({
  activeStep,
  profile,
}: {
  activeStep: number;
  profile: CustomerApiProfile | null;
}) {
  return (
    <>
      <ProfileSection
        active={activeStep === 0}
        description="Informasi dasar yang digunakan pada akun customer Anda."
        step={0}
        title="Data pribadi"
      >
        <AppInput
          defaultValue={profile?.fullName ?? ""}
          label="Nama lengkap"
          maxLength={200}
          name="fullName"
          required
        />
        <AppSelect defaultValue={profile?.gender ?? ""} label="Gender" name="gender">
          <option value="">Pilih gender</option>
          <option value="1">Laki-laki</option>
          <option value="2">Perempuan</option>
        </AppSelect>
        <AppInput
          defaultValue={dateValue(profile?.birthDate)}
          label="Tanggal lahir"
          name="birthDate"
          type="date"
        />
      </ProfileSection>
      <ProfileSection
        active={activeStep === 1}
        description="Pilih provinsi terlebih dahulu agar daftar kota sesuai."
        step={1}
        title="Alamat tempat tinggal"
      >
        <RegionFields initialCity={profile?.city ?? ""} initialProvince={profile?.province ?? ""} />
        <div className="md:col-span-2">
          <AppTextarea
            defaultValue={profile?.address ?? ""}
            label="Alamat lengkap"
            name="address"
          />
        </div>
      </ProfileSection>
      <ProfileSection
        active={activeStep === 2}
        description="Upload file memerlukan endpoint storage backend. Untuk sementara gunakan URL gambar."
        step={2}
        title="Foto profile"
      >
        <ImageUrlField
          initialUrl={profile?.avatarUrl ?? ""}
          label="URL foto profile"
          name="avatarUrl"
        />
      </ProfileSection>
      <ProfileSection
        active={activeStep === 3}
        description="Lengkapi detail acara agar rekomendasi vendor dan perencanaan wedding lebih relevan."
        step={3}
        title="Detail pernikahan"
      >
        <FormGroupHeader
          description="Informasi utama mengenai waktu, tempat, dan konsep acara."
          title="Data Pernikahan"
        />
        <AppInput
          defaultValue={dateValue(profile?.weddingDate)}
          label="Tanggal acara"
          name="weddingDate"
          type="date"
        />
        <AppSelect defaultValue={profile?.eventType ?? ""} label="Jenis acara" name="eventType">
          <option value="">Pilih jenis acara</option>
          <option value="AKAD">Akad</option>
          <option value="RESEPSI">Resepsi</option>
          <option value="AKAD_DAN_RESEPSI">Akad + Resepsi</option>
          <option value="LAINNYA">Lainnya</option>
        </AppSelect>
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
        <AppInput
          defaultValue={profile?.estimatedGuests ?? ""}
          label="Estimasi jumlah tamu"
          min={1}
          name="estimatedGuests"
          type="number"
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
        <CheckboxGroup
          initialValues={profile?.neededVendorCategories ?? []}
          label="Kebutuhan vendor"
          name="neededVendorCategories"
          options={categoryLabels}
        />

        <FormGroupHeader
          description="Tentukan rencana biaya agar pengeluaran dapat dipantau sejak awal."
          title="Data Budget"
        />
        <AppInput
          defaultValue={profile?.estimatedBudget ?? ""}
          label="Estimasi total budget"
          min={0}
          name="estimatedBudget"
          placeholder="Contoh: 250000000"
          type="number"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <AppInput
            defaultValue={profile?.budgetRangeMin ?? ""}
            label="Budget minimum"
            min={0}
            name="budgetRangeMin"
            type="number"
          />
          <AppInput
            defaultValue={profile?.budgetRangeMax ?? ""}
            label="Budget maksimum"
            min={0}
            name="budgetRangeMax"
            type="number"
          />
        </div>
        <CheckboxGroup
          initialValues={profile?.budgetPriorities ?? []}
          label="Prioritas budget"
          name="budgetPriorities"
          options={categoryLabels}
        />
      </ProfileSection>
    </>
  );
}

function VendorFields({
  activeStep,
  profile,
}: {
  activeStep: number;
  profile: VendorApiProfile | null;
}) {
  return (
    <>
      <ProfileSection
        active={activeStep === 0}
        description="Data pemilik utama bisnis."
        step={0}
        title="Pemilik"
      >
        <AppInput
          defaultValue={profile?.ownerName ?? ""}
          label="Nama pemilik"
          maxLength={100}
          name="ownerName"
          required
        />
      </ProfileSection>
      <ProfileSection
        active={activeStep === 1}
        description="Informasi yang akan dilihat customer di marketplace."
        step={1}
        title="Informasi bisnis"
      >
        <AppInput
          defaultValue={profile?.businessName ?? ""}
          label="Nama bisnis"
          maxLength={100}
          name="businessName"
          required
        />
        <AppInput
          defaultValue={profile?.businessEmail ?? ""}
          label="Email bisnis"
          maxLength={100}
          name="businessEmail"
          type="email"
          required
        />
        <AppInput
          defaultValue={profile?.businessPhone ?? ""}
          label="Nomor telepon bisnis"
          maxLength={100}
          name="businessPhone"
          type="tel"
          required
        />
        <div className="md:col-span-2">
          <AppTextarea
            defaultValue={profile?.description ?? ""}
            label="Deskripsi bisnis"
            name="description"
          />
        </div>
      </ProfileSection>
      <ProfileSection
        active={activeStep === 2}
        description="Pilih wilayah bisnis dan cakupan layanan vendor."
        step={2}
        title="Lokasi dan layanan"
      >
        <RegionFields initialCity={profile?.city ?? ""} initialProvince={profile?.province ?? ""} />
        <AppInput
          defaultValue={profile?.latitude ?? ""}
          label="Latitude"
          name="latitude"
          step="any"
          type="number"
        />
        <AppInput
          defaultValue={profile?.longitude ?? ""}
          label="Longitude"
          name="longitude"
          step="any"
          type="number"
        />
        <AppInput
          defaultValue={profile?.serviceArea ?? ""}
          label="Area layanan"
          name="serviceArea"
        />
        <div className="md:col-span-2">
          <AppTextarea
            defaultValue={profile?.businessAddress ?? ""}
            label="Alamat bisnis"
            name="businessAddress"
            required
          />
        </div>
      </ProfileSection>
      <ProfileSection
        active={activeStep === 3}
        description="Pilih satu atau lebih kategori yang sesuai dengan layanan bisnis Anda."
        step={3}
        title="Kategori vendor"
      >
        <CheckboxGroup
          initialValues={profile?.selectedCategories ?? []}
          label="Kategori layanan"
          name="selectedCategories"
          options={categoryLabels}
        />
      </ProfileSection>
      <ProfileSection
        active={activeStep === 4}
        description="Tambahkan identitas visual dan contoh hasil pekerjaan terbaik vendor."
        step={4}
        title="Brand dan portofolio"
      >
        <ImageUrlField initialUrl={profile?.logoUrl ?? ""} label="URL logo bisnis" name="logoUrl" />
        <div className="md:col-span-2">
          <AppTextarea
            defaultValue={(profile?.portfolioImageUrls ?? []).join("\n")}
            helper="Masukkan satu URL gambar pada setiap baris."
            label="Gambar portofolio"
            name="portfolioImageUrls"
            placeholder={"https://contoh.com/portfolio-1.jpg\nhttps://contoh.com/portfolio-2.jpg"}
          />
        </div>
        <div className="md:col-span-2">
          <AppInput
            accept="image/jpeg,image/png,image/webp"
            helper="JPG, PNG, atau WebP. Upload memerlukan endpoint storage backend."
            label="Pilih gambar portofolio"
            multiple
            name="portfolioFiles"
            type="file"
          />
        </div>
      </ProfileSection>
      <ProfileSection
        active={activeStep === 5}
        description="Informasi sosial dapat ditampilkan ke customer, sedangkan rekening bersifat privat."
        step={5}
        title="Kontak dan rekening"
      >
        <FormGroupHeader
          description="Tambahkan kanal resmi bisnis yang dapat dikunjungi customer."
          title="Media Sosial"
        />
        <AppInput
          defaultValue={profile?.instagramUrl ?? ""}
          label="Instagram"
          name="instagramUrl"
          placeholder="https://instagram.com/nama-vendor"
          type="url"
        />
        <AppInput
          defaultValue={profile?.tiktokUrl ?? ""}
          label="TikTok"
          name="tiktokUrl"
          placeholder="https://tiktok.com/@nama-vendor"
          type="url"
        />
        <AppInput
          defaultValue={profile?.websiteUrl ?? ""}
          label="Website"
          name="websiteUrl"
          placeholder="https://vendor.com"
          type="url"
        />
        <AppInput
          defaultValue={profile?.whatsappNumber ?? ""}
          label="Nomor WhatsApp bisnis"
          name="whatsappNumber"
          placeholder="Contoh: 6281234567890"
          type="tel"
        />
        <FormGroupHeader
          description="Data rekening hanya digunakan untuk kebutuhan transaksi dan tidak ditampilkan ke publik."
          title="Informasi Rekening"
        />
        <AppInput defaultValue={profile?.bankName ?? ""} label="Nama bank" name="bankName" />
        <AppInput
          defaultValue={profile?.bankAccountNumber ?? ""}
          inputMode="numeric"
          label="Nomor rekening"
          name="bankAccountNumber"
        />
        <AppInput
          defaultValue={profile?.bankAccountHolder ?? ""}
          label="Nama pemilik rekening"
          name="bankAccountHolder"
        />
      </ProfileSection>
      <ProfileSection
        active={activeStep === 6}
        description="Unggah dokumen legal agar admin dapat memverifikasi bisnis Anda."
        step={6}
        title="Dokumen verifikasi"
      >
        <AppSelect
          defaultValue={profile?.legalDocumentType ?? ""}
          label="Jenis dokumen"
          name="legalDocumentType"
        >
          <option value="">Pilih jenis dokumen</option>
          <option value="KTP">KTP pemilik</option>
          <option value="NIB">NIB</option>
          <option value="NPWP">NPWP</option>
          <option value="SIUP">SIUP</option>
          <option value="OTHER">Dokumen lainnya</option>
        </AppSelect>
        <AppInput
          defaultValue={profile?.legalDocumentNumber ?? ""}
          label="Nomor dokumen"
          name="legalDocumentNumber"
        />
        <div className="md:col-span-2">
          <AppInput
            accept=".jpg,.jpeg,.png,.pdf"
            helper="JPG, PNG, atau PDF maksimal 5 MB. Pengiriman file memerlukan endpoint upload backend."
            label="File dokumen"
            name="legalDocumentFile"
            type="file"
          />
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 md:col-span-2">
          Setelah dokumen dikirim, profil vendor akan masuk ke proses pemeriksaan admin.
        </div>
      </ProfileSection>
    </>
  );
}

function ProfileSection({
  active,
  children,
  description,
  step,
  title,
}: {
  active: boolean;
  children: React.ReactNode;
  description: string;
  step: number;
  title: string;
}) {
  return (
    <section className={cn("grid gap-5", !active && "hidden")} data-profile-step={step}>
      <div className="rounded-2xl bg-rose-50 p-4">
        <h2 className="font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function FormGroupHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-rose-100 pb-3 md:col-span-2">
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
    </div>
  );
}

function CheckboxGroup({
  initialValues,
  label,
  name,
  options,
}: {
  initialValues: string[];
  label: string;
  name: string;
  options: readonly string[];
}) {
  return (
    <fieldset className="md:col-span-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            className="flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm font-normal hover:border-rose-200 hover:bg-rose-50"
            key={option}
          >
            <input
              className="size-4 accent-rose-500"
              defaultChecked={initialValues.includes(option)}
              name={name}
              type="checkbox"
              value={option}
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ImageUrlField({
  initialUrl,
  label,
  name,
}: {
  initialUrl: string;
  label: string;
  name: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  return (
    <div className="grid gap-4 md:col-span-2 md:grid-cols-[160px_1fr] md:items-center">
      <div className="grid aspect-square place-items-center overflow-hidden rounded-3xl border-2 border-dashed bg-stone-50">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Preview profile" className="size-full object-cover" src={url} />
        ) : (
          <span className="px-4 text-center text-xs text-stone-400">Belum ada gambar</span>
        )}
      </div>
      <AppInput
        defaultValue={initialUrl}
        label={label}
        name={name}
        onChange={(event) => setUrl(event.target.value)}
        type="url"
      />
    </div>
  );
}

function customerPayload(form: FormData): CustomerProfilePayload {
  return {
    fullName: requiredValue(form, "fullName"),
    ...compact({
      gender: optionalNumber(form, "gender"),
      birthDate: optionalValue(form, "birthDate"),
      avatarUrl: optionalValue(form, "avatarUrl"),
      address: optionalValue(form, "address"),
      city: optionalValue(form, "city"),
      province: optionalValue(form, "province"),
      weddingDate: optionalValue(form, "weddingDate"),
      weddingLocation: optionalValue(form, "weddingLocation"),
      weddingCity: optionalValue(form, "weddingCity"),
      weddingProvince: optionalValue(form, "weddingProvince"),
      eventType: optionalValue(form, "eventType"),
      weddingTheme: optionalValue(form, "weddingTheme"),
      estimatedGuests: optionalNumber(form, "estimatedGuests"),
      neededVendorCategories: values(form, "neededVendorCategories"),
      preferredVendorLocation: optionalValue(form, "preferredVendorLocation"),
      packagePreference: optionalValue(form, "packagePreference"),
      estimatedBudget: optionalNumber(form, "estimatedBudget"),
      budgetRangeMin: optionalNumber(form, "budgetRangeMin"),
      budgetRangeMax: optionalNumber(form, "budgetRangeMax"),
      budgetPriorities: values(form, "budgetPriorities"),
    }),
  };
}

function vendorPayload(form: FormData): VendorProfilePayload {
  return compact({
    ownerName: optionalValue(form, "ownerName"),
    businessName: optionalValue(form, "businessName"),
    businessEmail: optionalValue(form, "businessEmail")?.toLowerCase(),
    businessPhone: optionalValue(form, "businessPhone"),
    businessAddress: optionalValue(form, "businessAddress"),
    city: optionalValue(form, "city"),
    province: optionalValue(form, "province"),
    latitude: optionalNumber(form, "latitude"),
    longitude: optionalNumber(form, "longitude"),
    description: optionalValue(form, "description"),
    serviceArea: optionalValue(form, "serviceArea"),
    logoUrl: optionalValue(form, "logoUrl"),
    selectedCategories: values(form, "selectedCategories"),
    portfolioImageUrls: lineValues(form, "portfolioImageUrls"),
    instagramUrl: optionalValue(form, "instagramUrl"),
    tiktokUrl: optionalValue(form, "tiktokUrl"),
    websiteUrl: optionalValue(form, "websiteUrl"),
    whatsappNumber: optionalValue(form, "whatsappNumber"),
    bankName: optionalValue(form, "bankName"),
    bankAccountNumber: optionalValue(form, "bankAccountNumber"),
    bankAccountHolder: optionalValue(form, "bankAccountHolder"),
    legalDocumentType: optionalValue(form, "legalDocumentType"),
    legalDocumentNumber: optionalValue(form, "legalDocumentNumber"),
  });
}

function requiredValue(form: FormData, field: string) {
  return String(form.get(field) ?? "").trim();
}

function optionalValue(form: FormData, field: string) {
  return requiredValue(form, field) || undefined;
}

function optionalNumber(form: FormData, field: string) {
  const value = optionalValue(form, field);
  return value === undefined ? undefined : Number(value);
}

function values(form: FormData, field: string) {
  return form
    .getAll(field)
    .map(String)
    .map((value) => value.trim())
    .filter(Boolean);
}

function lineValues(form: FormData, field: string) {
  return requiredValue(form, field)
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

function compact<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function dateValue(value?: string | null) {
  return value?.slice(0, 10) ?? "";
}
