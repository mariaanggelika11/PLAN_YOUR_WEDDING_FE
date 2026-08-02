"use client";

import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { Stepper } from "@/components/common/Interactive";
import { RegionFields } from "@/components/forms/RegionFields";
import { ErrorState, LoadingSkeleton, SuccessState } from "@/components/states/States";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput, AppSelect, AppTextarea } from "@/components/ui/FormFields";
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
      ? ["Data Pribadi", "Alamat", "Foto Profile"]
      : ["Pemilik", "Informasi Bisnis", "Lokasi & Layanan", "Logo"];

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
      <Stepper active={activeStep} steps={steps} />

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
        description="Upload file memerlukan endpoint storage backend. Untuk sementara gunakan URL logo."
        step={3}
        title="Logo bisnis"
      >
        <ImageUrlField initialUrl={profile?.logoUrl ?? ""} label="URL logo bisnis" name="logoUrl" />
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

function compact<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function dateValue(value?: string | null) {
  return value?.slice(0, 10) ?? "";
}
