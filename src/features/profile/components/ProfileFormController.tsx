"use client";

import {
  CUSTOMER_PROFILE_PARAMETER_CODES,
  MASTER_PARAMETER_CODES,
  VENDOR_PROFILE_PARAMETER_CODES,
} from "@/features/parameters/constants";
import { useMasterParameters } from "@/features/parameters/useMasterParameters";
import { ProfileError } from "@/features/profile/api/profileApi";
import { CustomerProfileSections } from "@/features/profile/components/customer/CustomerProfileSections";
import {
  ProfileNavigation,
  ProfileStepIndicator,
} from "@/features/profile/components/shared/ProfileFormFields";
import { VendorProfileSections } from "@/features/profile/components/vendor/VendorProfileSections";
import { VendorProfileStatus } from "@/features/profile/components/vendor/VendorStatus";
import { useCustomerProfileEditor } from "@/features/profile/hooks/useCustomerProfileEditor";
import { useVendorProfileEditor } from "@/features/profile/hooks/useVendorProfileEditor";
import type { CustomerApiProfile, VendorApiProfile } from "@/features/profile/types";
import { validateCustomerProfile } from "@/features/profile/validation/customerValidation";
import {
  validateVendorDraft,
  validateVendorSubmission,
} from "@/features/profile/validation/vendorValidation";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { PopupMessage } from "@/shared/components/feedback/Popup";
import { AppButton } from "@/shared/components/ui/AppButton";
import { useState, type FormEvent, type MouseEvent } from "react";

type ProfileType = "customer" | "vendor";

export function ProfileFormController({ type }: { type: ProfileType }) {
  const masterParameters = useMasterParameters(
    type === "customer" ? CUSTOMER_PROFILE_PARAMETER_CODES : VENDOR_PROFILE_PARAMETER_CODES,
  );
  const customerResource = useCustomerProfileEditor(type === "customer");
  const vendorResource = useVendorProfileEditor(type === "vendor");
  const resource = type === "customer" ? customerResource : vendorResource;
  const profile = resource.data;
  const [isSaving, setIsSaving] = useState(false);
  const [savingAction, setSavingAction] = useState<"draft" | "submit" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const vendorProfile = type === "vendor" ? (profile as VendorApiProfile | null) : null;
  const vendorIsVerified = Boolean(vendorProfile?.isVerified);
  const vendorCanEdit =
    type !== "vendor" || !vendorProfile?.status || [1, 4].includes(vendorProfile.status);
  const vendorCanEditOperations = vendorCanEdit || vendorIsVerified;
  const steps =
    type === "customer"
      ? ["Data Pribadi", "Alamat", "Foto Profile", "Detail Pernikahan"]
      : ["Pemilik", "Informasi Bisnis", "Kontak & Rekening", "Dokumen Verifikasi"];

  async function saveCustomer(form: HTMLFormElement | null) {
    if (!form) return;
    const validation = validateCustomerProfile(form);
    if (validation) return showValidation(validation);
    startSaving("draft");
    try {
      await customerResource.saveProfile(
        form,
        masterParameters.getOptions(MASTER_PARAMETER_CODES.customerEventType),
      );
      setMessage("Profile berhasil disimpan.");
    } catch (submitError) {
      setError(
        submitError instanceof ProfileError
          ? submitError.message
          : "Profile gagal disimpan. Silakan coba kembali.",
      );
    } finally {
      finishSaving();
    }
  }

  async function saveVendor(action: "draft" | "submit", form: HTMLFormElement | null) {
    if (!form) return;
    const current = profile as VendorApiProfile | null;
    const validation =
      action === "submit" ? validateVendorSubmission(form, current) : validateVendorDraft(form);
    if (validation) return showValidation(validation);
    startSaving(action);
    try {
      const result = await vendorResource.saveProfile(action, form, current);
      if (result.uploadedDocument) {
        const input = form.elements.namedItem("legalDocumentFile");
        if (input instanceof HTMLInputElement) input.value = "";
      }
      if (result.logoUploadFailed)
        setError(
          "Profile berhasil disimpan, tetapi perubahan logo bisnis gagal diproses. Silakan coba lagi.",
        );
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
      finishSaving();
    }
  }

  async function saveVerifiedVendor(form: HTMLFormElement | null) {
    if (!form || !vendorProfile) return;
    startSaving("draft");
    try {
      await vendorResource.saveVerifiedProfile(activeStep, form, vendorProfile);
      setMessage("Perubahan berhasil disimpan tanpa mengubah status verifikasi.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Perubahan gagal disimpan.");
    } finally {
      finishSaving();
    }
  }

  function showValidation(validation: { step: number; message: string }) {
    setActiveStep(validation.step);
    setMessage("");
    setError(validation.message);
  }

  function startSaving(action: "draft" | "submit") {
    setError("");
    setMessage("");
    setIsSaving(true);
    setSavingAction(action);
  }

  function finishSaving() {
    setIsSaving(false);
    setSavingAction(null);
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
    const invalid = controls.find((control) => !control.checkValidity());
    if (invalid) return invalid.reportValidity();
    setActiveStep((current) => Math.min(steps.length - 1, current + 1));
  }

  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error) return <ErrorState retry={() => void resource.reload()} />;

  return (
    <form
      className="grid gap-5 rounded-3xl border bg-white p-5 shadow-sm sm:p-7"
      onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}
    >
      {type === "vendor" && <VendorProfileStatus profile={vendorProfile} />}
      <ProfileStepIndicator activeStep={activeStep} onStepChange={setActiveStep} steps={steps} />
      {type === "customer" ? (
        <CustomerProfileSections
          activeStep={activeStep}
          masterParameters={masterParameters}
          profile={profile as CustomerApiProfile | null}
        />
      ) : (
        <VendorProfileSections
          activeStep={activeStep}
          canEditBusiness={vendorCanEditOperations}
          canEditCore={vendorCanEdit}
          canEditOperations={vendorCanEditOperations}
          masterParameters={masterParameters}
          onDataChanged={() => void vendorResource.reloadAndNotify()}
          profile={vendorProfile}
        />
      )}
      {error ? (
        <PopupMessage message={error} variant="error" />
      ) : (
        message && <PopupMessage message={message} />
      )}
      <ProfileNavigation>
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
            {vendorIsVerified && [1, 2].includes(activeStep) ? (
              <AppButton
                loading={savingAction === "draft"}
                onClick={(event) => void saveVerifiedVendor(event.currentTarget.form)}
                type="button"
                variant="secondary"
              >
                Simpan perubahan
              </AppButton>
            ) : !vendorIsVerified ? (
              <AppButton
                disabled={!vendorCanEdit}
                loading={savingAction === "draft"}
                onClick={(event) => void saveVendor("draft", event.currentTarget.form)}
                type="button"
                variant="secondary"
              >
                Simpan draft
              </AppButton>
            ) : null}
            {activeStep < steps.length - 1 ? (
              <AppButton disabled={isSaving} onClick={continueToNextStep} type="button">
                Lanjutkan
              </AppButton>
            ) : !vendorIsVerified ? (
              <AppButton
                disabled={!vendorCanEdit}
                loading={savingAction === "submit"}
                onClick={(event) => void saveVendor("submit", event.currentTarget.form)}
                type="button"
              >
                Kirim untuk verifikasi
              </AppButton>
            ) : null}
          </div>
        ) : (
          <div className="ml-auto flex flex-wrap gap-2">
            {activeStep < steps.length - 1 ? (
              <AppButton disabled={isSaving} onClick={continueToNextStep} type="button">
                Lanjutkan
              </AppButton>
            ) : (
              <AppButton
                loading={savingAction === "draft"}
                onClick={(event) => void saveCustomer(event.currentTarget.form)}
                type="button"
              >
                Simpan perubahan
              </AppButton>
            )}
          </div>
        )}
      </ProfileNavigation>
    </form>
  );
}
