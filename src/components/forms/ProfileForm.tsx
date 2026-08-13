"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { Landmark, Plus, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { Stepper } from "@/components/common/Interactive";
import { RegionFields } from "@/components/forms/RegionFields";
import { ErrorState, LoadingSkeleton, SuccessState } from "@/components/states/States";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput, AppSelect, AppTextarea } from "@/components/ui/FormFields";
import { categoryLabels } from "@/constants/menu";
import {
  deleteVendorLogo,
  getAttachmentBlob,
  getVendorLogo,
  replaceVendorLogo,
} from "@/services/attachmentService";
import {
  deleteVendorBankAccount,
  deleteVendorContact,
  deleteVendorVerificationDocument,
  getCustomerProfile,
  getVendorProfile,
  ProfileError,
  saveCustomerProfile,
  saveVendorRelatedData,
  saveVendorProfileDraft,
  submitVendorProfile,
} from "@/services/profileService";
import type { CustomerApiProfile, CustomerProfilePayload, VendorApiProfile } from "@/types/profile";
import { cn } from "@/utils/cn";

type ProfileType = "customer" | "vendor";
type ProfileData = CustomerApiProfile | VendorApiProfile;

export function ProfileForm({ type }: { type: ProfileType }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingAction, setSavingAction] = useState<"draft" | "submit" | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const vendorProfile = type === "vendor" ? (profile as VendorApiProfile | null) : null;
  const vendorCanEdit =
    type !== "vendor" || !vendorProfile?.status || [1, 4].includes(vendorProfile.status);
  const steps =
    type === "customer"
      ? ["Data Pribadi", "Alamat", "Foto Profile", "Detail Pernikahan"]
      : ["Pemilik", "Informasi Bisnis", "Kontak & Rekening", "Dokumen Verifikasi"];

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
    if (type === "vendor") return;
    const form = new FormData(event.currentTarget);
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const saved = await saveCustomerProfile(profile?.id ?? null, customerPayload(form));
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

  async function saveVendor(action: "draft" | "submit", form: HTMLFormElement | null) {
    if (!form) return;
    const vendorProfile = profile as VendorApiProfile | null;

    if (action === "submit") {
      const validation = validateVendorSubmission(form, vendorProfile);
      if (validation) {
        setActiveStep(validation.step);
        setMessage("");
        setError(validation.message);
        return;
      }
    } else {
      const validation = validateVendorDraft(form);
      if (validation) {
        setActiveStep(validation.step);
        setMessage("");
        setError(validation.message);
        return;
      }
    }

    setError("");
    setMessage("");
    setIsSaving(true);
    setSavingAction(action);
    try {
      const data = vendorFormData(form, vendorProfile);
      const saved =
        action === "draft" ? await saveVendorProfileDraft(data) : await submitVendorProfile(data);
      const related = vendorRelatedData(form, vendorProfile);
      const savedWithRelations = await saveVendorRelatedData(related);
      setProfile(savedWithRelations ?? saved);
      const logoFile = formFile(form, "logoFile");
      if (logoFile) {
        try {
          await replaceVendorLogo(saved.id, logoFile);
        } catch {
          setError(
            "Profile berhasil disimpan, tetapi logo bisnis gagal diunggah. Silakan coba lagi.",
          );
        }
      }
      setMessage(
        action === "draft"
          ? "Draft profile berhasil disimpan."
          : "Profile berhasil dikirim untuk verifikasi.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof ProfileError
          ? submitError.message
          : "Profile vendor gagal disimpan. Silakan coba kembali.",
      );
    } finally {
      setIsSaving(false);
      setSavingAction(null);
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
      {type === "vendor" && <VendorProfileStatus profile={vendorProfile} />}
      <Stepper active={activeStep} onStepChange={setActiveStep} steps={steps} />

      {type === "customer" ? (
        <CustomerFields activeStep={activeStep} profile={profile as CustomerApiProfile | null} />
      ) : (
        <fieldset className="contents" disabled={!vendorCanEdit}>
          <VendorFields
            activeStep={activeStep}
            onDataChanged={() => void loadProfile()}
            profile={profile as VendorApiProfile | null}
          />
        </fieldset>
      )}
      {type === "vendor" &&
        activeStep === 3 &&
        primaryVerificationDocument(vendorProfile)?.attachmentId && (
          <DocumentAttachmentActions
            attachmentId={primaryVerificationDocument(vendorProfile)!.attachmentId!}
            canDelete={vendorCanEdit}
            documentId={primaryVerificationDocument(vendorProfile)!.id}
            documentType={primaryVerificationDocument(vendorProfile)?.documentType ?? "dokumen"}
            onDeleted={() => void loadProfile()}
          />
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

      <div className="flex flex-wrap justify-between gap-3">
        <AppButton
          disabled={activeStep === 0 || isSaving}
          onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
          type="button"
          variant="secondary"
        >
          Kembali
        </AppButton>
        {type === "vendor" ? (
          <div className="ml-auto flex flex-wrap gap-2">
            <AppButton
              loading={savingAction === "draft"}
              disabled={!vendorCanEdit}
              onClick={(event) => void saveVendor("draft", event.currentTarget.form)}
              type="button"
              variant="secondary"
            >
              Simpan draft
            </AppButton>
            {activeStep < steps.length - 1 ? (
              <AppButton disabled={isSaving} onClick={continueToNextStep} type="button">
                Lanjutkan
              </AppButton>
            ) : (
              <AppButton
                loading={savingAction === "submit"}
                disabled={!vendorCanEdit}
                onClick={(event) => void saveVendor("submit", event.currentTarget.form)}
                type="button"
              >
                Kirim untuk verifikasi
              </AppButton>
            )}
          </div>
        ) : activeStep < steps.length - 1 ? (
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
  onDataChanged,
  profile,
}: {
  activeStep: number;
  onDataChanged: () => void;
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
        description="Lengkapi identitas bisnis, lokasi, cakupan layanan, kategori, dan logo brand."
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
        <FormGroupHeader
          description="Lokasi operasional dan wilayah yang dapat dilayani."
          title="Lokasi dan layanan"
        />
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
        <FormGroupHeader
          description="Pilih kategori yang paling sesuai dengan jasa utama vendor."
          title="Kategori vendor"
        />
        <CheckboxGroup
          initialValues={profile?.categories ?? []}
          label="Kategori layanan"
          name="categories"
          options={categoryLabels}
        />
        <FormGroupHeader
          description="Gunakan logo yang mudah dikenali customer."
          title="Logo brand"
        />
        <VendorLogoUpload onDeleted={onDataChanged} profileId={profile?.id ?? null} />
      </ProfileSection>
      <ProfileSection
        active={activeStep === 2}
        description="Kelola kanal kontak bisnis dan rekening pencairan dalam satu tempat."
        step={2}
        title="Kontak dan rekening"
      >
        <VendorContactRows onDeleted={onDataChanged} profile={profile} />
        <VendorBankAccountCards onDeleted={onDataChanged} profile={profile} />
      </ProfileSection>
      <ProfileSection
        active={activeStep === 3}
        description="Unggah dokumen legal agar admin dapat memverifikasi bisnis Anda."
        step={3}
        title="Dokumen verifikasi"
      >
        <AppSelect
          defaultValue={primaryVerificationDocument(profile)?.documentType ?? ""}
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
          defaultValue={primaryVerificationDocument(profile)?.documentNumber ?? ""}
          label="Nomor dokumen"
          name="legalDocumentNumber"
        />
        {primaryVerificationDocument(profile)?.status && (
          <div className="flex items-start justify-between gap-3 rounded-xl border bg-stone-50 p-3 md:col-span-2">
            <div>
              <p className="text-sm font-semibold text-ink">Status dokumen</p>
              {primaryVerificationDocument(profile)?.rejectReason && (
                <p className="mt-1 text-sm text-red-700">
                  Alasan: {primaryVerificationDocument(profile)?.rejectReason}
                </p>
              )}
            </div>
            <StatusBadge status={statusDetails(primaryVerificationDocument(profile)?.status).key} />
          </div>
        )}
        <div className="md:col-span-2">
          <AppInput
            accept=".jpg,.jpeg,.png,.pdf"
            helper="JPG, PNG, atau PDF maksimal 5 MB. File diunggah saat draft disimpan atau profile dikirim."
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

type ContactField = "instagramUrl" | "tiktokUrl" | "websiteUrl" | "whatsappNumber";

interface ContactOption {
  field: ContactField;
  label: string;
  placeholder: string;
  type: "tel" | "url";
}

const CONTACT_OPTIONS: readonly ContactOption[] = [
  {
    field: "whatsappNumber",
    label: "WhatsApp",
    placeholder: "Contoh: 081234567890",
    type: "tel",
  },
  {
    field: "instagramUrl",
    label: "Instagram",
    placeholder: "https://instagram.com/nama-vendor",
    type: "url",
  },
  {
    field: "tiktokUrl",
    label: "TikTok",
    placeholder: "https://tiktok.com/@nama-vendor",
    type: "url",
  },
  {
    field: "websiteUrl",
    label: "Website",
    placeholder: "https://vendor.com",
    type: "url",
  },
];

function VendorContactRows({
  onDeleted,
  profile,
}: {
  onDeleted: () => void;
  profile: VendorApiProfile | null;
}) {
  const initialFields = CONTACT_OPTIONS.filter(({ field }) =>
    Boolean(contactValue(profile, field)),
  ).map(({ field }) => field);
  const [fields, setFields] = useState<ContactField[]>(
    initialFields.length > 0 ? initialFields : ["whatsappNumber"],
  );
  const [deleteError, setDeleteError] = useState("");

  const availableOptions = CONTACT_OPTIONS.filter(({ field }) => !fields.includes(field));

  function addContact() {
    const nextOption = availableOptions[0];
    if (nextOption) setFields((current) => [...current, nextOption.field]);
  }

  async function removeContact(field: ContactField) {
    const contact = savedContact(profile, field);
    if (contact && !window.confirm(`Hapus kontak ${contact.contactType}?`)) return;
    try {
      if (contact) await deleteVendorContact(contact.id);
      setDeleteError("");
      onDeleted();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Kontak gagal dihapus.");
      return;
    }
    setFields((current) => current.filter((item) => item !== field));
  }

  return (
    <div className="grid gap-4 md:col-span-2">
      <SectionHeading
        action={
          <AppButton
            disabled={availableOptions.length === 0}
            onClick={addContact}
            type="button"
            variant="secondary"
          >
            <Plus size={16} /> Tambah kontak
          </AppButton>
        }
        description="Tambahkan kanal resmi yang dapat digunakan customer untuk mengenal bisnis Anda."
        title="Kontak bisnis"
      />

      {fields.length === 0 ? (
        <EmptyCollection message="Belum ada kontak bisnis. Tambahkan setidaknya satu kanal kontak." />
      ) : (
        <div className="grid gap-3">
          {fields.map((field) => {
            const option = CONTACT_OPTIONS.find((item) => item.field === field)!;
            return (
              <div
                className="grid gap-3 rounded-2xl border bg-stone-50/60 p-4 sm:grid-cols-[150px_1fr_auto] sm:items-end"
                key={field}
              >
                <AppSelect
                  aria-label="Jenis kontak"
                  label="Jenis kontak"
                  onChange={(event) => {
                    const nextField = event.target.value as ContactField;
                    setFields((current) =>
                      current.map((item) => (item === field ? nextField : item)),
                    );
                  }}
                  value={field}
                >
                  {CONTACT_OPTIONS.map((contactOption) => (
                    <option
                      disabled={
                        fields.includes(contactOption.field) && contactOption.field !== field
                      }
                      key={contactOption.field}
                      value={contactOption.field}
                    >
                      {contactOption.label}
                    </option>
                  ))}
                </AppSelect>
                <AppInput
                  defaultValue={contactValue(profile, field)}
                  key={field}
                  label="Detail kontak"
                  name={field}
                  placeholder={option.placeholder}
                  type={option.type}
                />
                <button
                  aria-label={`Hapus kontak ${option.label}`}
                  className="grid size-11 place-items-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
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
      {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}
    </div>
  );
}

function VendorBankAccountCards({
  onDeleted,
  profile,
}: {
  onDeleted: () => void;
  profile: VendorApiProfile | null;
}) {
  const savedAccount = primaryBankAccount(profile);
  const hasSavedAccount = Boolean(savedAccount);
  const [hasAccount, setHasAccount] = useState(hasSavedAccount);
  const [deleteError, setDeleteError] = useState("");

  async function removeAccount() {
    if (savedAccount && !window.confirm("Hapus rekening pencairan ini?")) return;
    try {
      if (savedAccount) await deleteVendorBankAccount(savedAccount.id);
      setHasAccount(false);
      setDeleteError("");
      onDeleted();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Rekening gagal dihapus.");
    }
  }

  return (
    <div className="mt-3 grid gap-4 border-t border-rose-100 pt-6 md:col-span-2">
      <SectionHeading
        action={
          <AppButton
            disabled={hasAccount}
            onClick={() => setHasAccount(true)}
            type="button"
            variant="secondary"
          >
            <Plus size={16} /> Tambah rekening
          </AppButton>
        }
        description="Rekening digunakan untuk pencairan transaksi dan tidak ditampilkan pada profil publik."
        title="Rekening pencairan"
      />

      {hasAccount ? (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b bg-rose-50/70 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-blush shadow-sm">
                <Landmark size={19} />
              </span>
              <div>
                <p className="font-semibold text-ink">Rekening utama</p>
                <p className="text-xs text-stone-500">Digunakan sebagai tujuan pencairan dana</p>
              </div>
            </div>
            <button
              aria-label="Hapus rekening"
              className="grid size-10 place-items-center rounded-xl text-red-600 transition hover:bg-red-50"
              onClick={() => void removeAccount()}
              title="Hapus rekening"
              type="button"
            >
              <Trash2 size={17} />
            </button>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <AppInput
              defaultValue={savedAccount?.bankName ?? ""}
              label="Nama bank"
              name="bankName"
              placeholder="Contoh: BCA"
            />
            <AppInput
              defaultValue={savedAccount?.accountNumber ?? ""}
              inputMode="numeric"
              label="Nomor rekening"
              name="bankAccountNumber"
              pattern="[0-9]+"
              placeholder="Masukkan nomor rekening"
            />
            <div className="md:col-span-2">
              <AppInput
                defaultValue={savedAccount?.accountHolderName ?? ""}
                label="Nama pemilik rekening"
                name="bankAccountHolder"
                placeholder="Sesuai dengan nama pada rekening"
              />
            </div>
          </div>
        </div>
      ) : (
        <EmptyCollection message="Belum ada rekening pencairan. Tambahkan rekening ketika Anda siap menerima pembayaran." />
      )}
      {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        Untuk keamanan, data rekening hanya dapat dilihat oleh pemilik akun dan admin yang
        berwenang. API saat ini mendukung satu rekening utama.
      </p>
    </div>
  );
}

function SectionHeading({
  action,
  description,
  title,
}: {
  action: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyCollection({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-stone-50 px-5 py-8 text-center text-sm text-stone-500">
      {message}
    </div>
  );
}

function contactValue(profile: VendorApiProfile | null, field: ContactField) {
  return savedContact(profile, field)?.contactValue ?? "";
}

function savedContact(profile: VendorApiProfile | null, field: ContactField) {
  const option = CONTACT_OPTIONS.find((item) => item.field === field);
  if (!option) return undefined;

  const aliases = new Set(
    [field, option.label].map((value) => value.toLowerCase().replace(/[^a-z0-9]/g, "")),
  );
  return profile?.contacts?.find((contact) =>
    aliases.has(contact.contactType.toLowerCase().replace(/[^a-z0-9]/g, "")),
  );
}

function primaryBankAccount(profile: VendorApiProfile | null) {
  return profile?.bankAccounts?.find((account) => account.isPrimary) ?? profile?.bankAccounts?.[0];
}

function primaryVerificationDocument(profile: VendorApiProfile | null) {
  return (
    profile?.verificationDocuments?.find((document) => document.active) ??
    profile?.verificationDocuments?.[0]
  );
}

function DocumentAttachmentActions({
  attachmentId,
  canDelete,
  documentId,
  documentType,
  onDeleted,
}: {
  attachmentId: string;
  canDelete: boolean;
  documentId: string;
  documentType: string;
  onDeleted: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function openAttachment(download: boolean) {
    setIsLoading(true);
    setError("");
    try {
      const blob = await getAttachmentBlob(attachmentId);
      const url = URL.createObjectURL(blob);
      if (download) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${documentType}-${attachmentId}`;
        link.click();
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError("Dokumen tidak dapat dimuat.");
    } finally {
      setIsLoading(false);
    }
  }

  async function removeDocument() {
    if (!window.confirm(`Hapus dokumen ${documentType} beserta file terkait?`)) return;
    setIsLoading(true);
    setError("");
    try {
      await deleteVendorVerificationDocument(documentId);
      onDeleted();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Dokumen gagal dihapus.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-stone-50 p-3 md:col-span-2">
      <span className="mr-auto text-sm font-medium">Dokumen {documentType} sudah tersimpan.</span>
      <AppButton
        disabled={isLoading}
        onClick={() => void openAttachment(false)}
        type="button"
        variant="secondary"
      >
        Lihat
      </AppButton>
      <AppButton
        disabled={isLoading}
        onClick={() => void openAttachment(true)}
        type="button"
        variant="outline"
      >
        Unduh
      </AppButton>
      {canDelete && (
        <AppButton
          disabled={isLoading}
          onClick={() => void removeDocument()}
          type="button"
          variant="danger"
        >
          Hapus
        </AppButton>
      )}
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </div>
  );
}

const VENDOR_STATUS = {
  1: { key: "DRAFT", label: "Draft", description: "Profile masih dapat dilengkapi dan disimpan." },
  2: {
    key: "PENDING_VERIFICATION",
    label: "Pending Verification",
    description: "Profile sedang menunggu pemeriksaan admin.",
  },
  3: { key: "VERIFIED", label: "Verified", description: "Profile telah diverifikasi." },
  4: {
    key: "REJECTED",
    label: "Rejected",
    description: "Profile perlu diperbaiki sebelum dikirim ulang.",
  },
  5: {
    key: "SUSPENDED",
    label: "Suspended",
    description: "Profile untuk sementara ditangguhkan.",
  },
  6: { key: "INACTIVE", label: "Inactive", description: "Profile sedang tidak aktif." },
} as const;

function VendorProfileStatus({ profile }: { profile: VendorApiProfile | null }) {
  if (!profile?.status) return null;
  const status = statusDetails(profile.status);
  if (!status) return null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-stone-50 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="font-semibold text-ink">Status profile: {status.label}</p>
        <p className="mt-1 text-sm text-stone-600">{status.description}</p>
        {profile.rejectReason && (
          <p className="mt-2 text-sm font-medium text-red-700">Alasan: {profile.rejectReason}</p>
        )}
      </div>
      <StatusBadge status={status.key} />
    </div>
  );
}

function statusDetails(status?: number | null) {
  return (
    VENDOR_STATUS[status as keyof typeof VENDOR_STATUS] ?? {
      key: "INACTIVE",
      label: "Unknown",
      description: "Status belum dikenali.",
    }
  );
}

interface VendorValidationError {
  step: number;
  message: string;
}

function validateVendorDraft(form: HTMLFormElement): VendorValidationError | null {
  const controls = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input, select, textarea",
    ),
  );
  const invalid = controls.find((control) => Boolean(control.value) && !control.checkValidity());
  if (invalid) {
    return {
      step: controlStep(invalid),
      message: `Periksa kembali field “${fieldLabel(invalid)}” sebelum menyimpan draft.`,
    };
  }

  const logoFile = formFile(form, "logoFile");
  if (logoFile && logoFile.size > 5 * 1024 * 1024) {
    return { step: 1, message: "Ukuran logo bisnis maksimal 5 MB." };
  }
  if (logoFile && !["image/jpeg", "image/png", "image/webp"].includes(logoFile.type)) {
    return { step: 1, message: "Format logo harus JPG, PNG, atau WebP." };
  }

  const bankValues = ["bankName", "bankAccountNumber", "bankAccountHolder"].filter((name) =>
    formValue(form, name),
  );
  if (bankValues.length > 0 && bankValues.length < 3) {
    return { step: 2, message: "Lengkapi nama bank, nomor rekening, dan nama pemilik rekening." };
  }

  const documentFile = formFile(form, "legalDocumentFile");
  if (
    (formValue(form, "legalDocumentNumber") || documentFile) &&
    !formValue(form, "legalDocumentType")
  ) {
    return { step: 3, message: "Pilih jenis dokumen untuk data dokumen yang ingin disimpan." };
  }
  return null;
}

function validateVendorSubmission(
  form: HTMLFormElement,
  profile: VendorApiProfile | null,
): VendorValidationError | null {
  const draftError = validateVendorDraft(form);
  if (draftError) return draftError;

  const requirements: Array<{ step: number; label: string; valid: boolean }> = [
    { step: 0, label: "nama pemilik", valid: Boolean(formValue(form, "ownerName")) },
    { step: 1, label: "nama bisnis", valid: Boolean(formValue(form, "businessName")) },
    { step: 1, label: "email bisnis", valid: Boolean(formValue(form, "businessEmail")) },
    { step: 1, label: "nomor telepon bisnis", valid: Boolean(formValue(form, "businessPhone")) },
    { step: 1, label: "provinsi", valid: Boolean(formValue(form, "province")) },
    { step: 1, label: "kota/kabupaten", valid: Boolean(formValue(form, "city")) },
    { step: 1, label: "alamat bisnis", valid: Boolean(formValue(form, "businessAddress")) },
    { step: 1, label: "area layanan", valid: Boolean(formValue(form, "serviceArea")) },
    {
      step: 1,
      label: "minimal satu kategori",
      valid: formValues(form, "categories").length > 0,
    },
    {
      step: 2,
      label: "minimal satu kontak bisnis",
      valid: CONTACT_OPTIONS.some(({ field }) => Boolean(formValue(form, field))),
    },
    {
      step: 3,
      label: "jenis dokumen verifikasi",
      valid: Boolean(formValue(form, "legalDocumentType")),
    },
    {
      step: 3,
      label: "file dokumen verifikasi",
      valid: Boolean(
        formFile(form, "legalDocumentFile") ||
        profile?.verificationDocuments?.some((document) => document.attachmentId),
      ),
    },
  ];
  const missing = requirements.filter((item) => !item.valid);
  if (!missing.length) return null;

  const firstStep = Math.min(...missing.map((item) => item.step));
  return {
    step: firstStep,
    message: `Profile belum dapat dikirim. Lengkapi: ${missing.map((item) => item.label).join(", ")}.`,
  };
}

function vendorFormData(form: HTMLFormElement, profile: VendorApiProfile | null) {
  const data = new FormData();
  const plainFields = [
    "businessName",
    "ownerName",
    "businessEmail",
    "businessPhone",
    "businessAddress",
    "city",
    "province",
    "latitude",
    "longitude",
    "description",
    "serviceArea",
    "logoUrl",
  ] as const;
  plainFields.forEach((field) => {
    const value = formValue(form, field);
    if (value) data.set(field, field === "businessEmail" ? value.toLowerCase() : value);
  });

  data.set("categories", JSON.stringify(formValues(form, "categories")));
  return data;
}

function vendorRelatedData(form: HTMLFormElement, profile: VendorApiProfile | null) {
  const contacts = CONTACT_OPTIONS.flatMap((option) => {
    const contactValue = formValue(form, option.field);
    return contactValue ? [{ contactType: option.label, contactValue }] : [];
  });
  const bankName = formValue(form, "bankName");
  const accountNumber = formValue(form, "bankAccountNumber");
  const accountHolderName = formValue(form, "bankAccountHolder");
  const documentType = formValue(form, "legalDocumentType");
  const documentNumber = formValue(form, "legalDocumentNumber");
  const documentFile = formFile(form, "legalDocumentFile");

  return {
    contacts,
    bankAccount:
      bankName && accountNumber && accountHolderName
        ? { bankName, accountNumber, accountHolderName }
        : undefined,
    bankAccountId: primaryBankAccount(profile)?.id,
    verificationDocument:
      documentType && documentFile
        ? { documentType, documentNumber, file: documentFile }
        : undefined,
  };
}

function formValue(form: HTMLFormElement, field: string) {
  return String(new FormData(form).get(field) ?? "").trim();
}

function formValues(form: HTMLFormElement, field: string) {
  return new FormData(form)
    .getAll(field)
    .map(String)
    .map((value) => value.trim())
    .filter(Boolean);
}

function formFile(form: HTMLFormElement, field: string) {
  const value = new FormData(form).get(field);
  return value instanceof File && value.size > 0 ? value : null;
}

function controlStep(control: HTMLElement) {
  return Number(control.closest<HTMLElement>("[data-profile-step]")?.dataset.profileStep ?? 0);
}

function fieldLabel(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  return control.labels?.[0]?.textContent?.trim() || control.name;
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
  const [selectedValues, setSelectedValues] = useState(initialValues);

  useEffect(() => {
    setSelectedValues(initialValues);
  }, [initialValues]);

  function toggleValue(option: string, checked: boolean) {
    setSelectedValues((current) =>
      checked ? [...new Set([...current, option])] : current.filter((value) => value !== option),
    );
  }

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
              checked={selectedValues.includes(option)}
              name={name}
              onChange={(event) => toggleValue(option, event.target.checked)}
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

function VendorLogoUpload({
  onDeleted,
  profileId,
}: {
  onDeleted: () => void;
  profileId: number | null;
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(profileId));
  const [loadFailed, setLoadFailed] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const selectedUrlRef = useRef("");
  const hasSelectionRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let loadedUrl = "";
    hasSelectionRef.current = false;

    async function loadLogo() {
      if (!profileId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setLoadFailed(false);
      try {
        const attachment = await getVendorLogo(profileId);
        if (!attachment || cancelled) return;
        const blob = await getAttachmentBlob(attachment.id);
        if (cancelled) return;
        loadedUrl = URL.createObjectURL(blob);
        if (!hasSelectionRef.current) setPreviewUrl(loadedUrl);
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadLogo();
    return () => {
      cancelled = true;
      if (loadedUrl) URL.revokeObjectURL(loadedUrl);
    };
  }, [profileId]);

  useEffect(
    () => () => {
      if (selectedUrlRef.current) URL.revokeObjectURL(selectedUrlRef.current);
    },
    [],
  );

  function selectLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (selectedUrlRef.current) URL.revokeObjectURL(selectedUrlRef.current);
    selectedUrlRef.current = URL.createObjectURL(file);
    hasSelectionRef.current = true;
    setPreviewUrl(selectedUrlRef.current);
    setLoadFailed(false);
  }

  async function removeLogo() {
    if (!profileId || !window.confirm("Hapus logo bisnis ini?")) return;
    setIsLoading(true);
    setDeleteError("");
    try {
      await deleteVendorLogo(profileId);
      setPreviewUrl("");
      onDeleted();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Logo gagal dihapus.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-4 md:col-span-2 md:grid-cols-[180px_1fr] md:items-center">
      <div className="grid aspect-square place-items-center overflow-hidden rounded-3xl border-2 border-dashed bg-stone-50">
        {isLoading ? (
          <div className="size-full animate-pulse bg-stone-100" />
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Logo bisnis" className="size-full object-cover" src={previewUrl} />
        ) : (
          <span className="px-4 text-center text-xs text-stone-400">
            {loadFailed ? "Logo gagal dimuat" : "Belum ada logo"}
          </span>
        )}
      </div>
      <div className="grid gap-2">
        <AppInput
          accept="image/jpeg,image/png,image/webp"
          helper="JPG, PNG, atau WebP maksimal 5 MB. Disarankan gambar persegi."
          label={previewUrl ? "Ganti logo bisnis" : "Upload logo bisnis"}
          name="logoFile"
          onChange={selectLogo}
          type="file"
        />
        <p className="text-xs leading-5 text-stone-500">
          Logo akan diunggah saat draft disimpan atau profile dikirim untuk verifikasi.
        </p>
        {previewUrl && (
          <AppButton
            className="w-fit"
            onClick={() => void removeLogo()}
            type="button"
            variant="danger"
          >
            Hapus logo
          </AppButton>
        )}
        {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}
      </div>
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

function compact<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function dateValue(value?: string | null) {
  return value?.slice(0, 10) ?? "";
}
