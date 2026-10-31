"use client";

import {
  registerCustomer,
  registerVendor,
  RegistrationError,
} from "@/features/auth/api/registrationApi";
import { OtpVerificationForm } from "@/features/auth/components/OtpVerificationForm";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import type {
  CustomerRegistrationData,
  VendorRegistrationData,
} from "@/features/auth/types/registration";
import { PASSWORD_REGEX, validationMessages } from "@/features/auth/validation";
import { SuccessState } from "@/shared/components/feedback/AsyncStates";
import { PopupMessage } from "@/shared/components/feedback/Popup";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/FormFields";
import { ROUTES } from "@/shared/config/routes";
import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { RegistrationTerms } from "@/features/auth/components/RegistrationTerms";
import { getActiveTerms } from "@/features/terms/api";
import type { TermsDocument } from "@/features/terms/types";
import { isTermsOutdated } from "@/shared/api/errorCodes";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";

type RegistrationType = "customer" | "vendor";
type RegistrationStep = "details" | "otp" | "success";

export function RegistrationForm({ type }: { type: RegistrationType }) {
  const [step, setStep] = useState<RegistrationStep>("details");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const loadTerms = useCallback(() => getActiveTerms(type), [type]);
  const termsResource = useAsyncResource<TermsDocument | null>(loadTerms, {
    initialData: null,
    mapError: () => "Syarat dan ketentuan gagal dimuat.",
  });
  const terms = termsResource.data;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    if (!terms) return setError("Syarat dan ketentuan belum berhasil dimuat. Silakan muat ulang.");
    if (!acceptedTerms) {
      return setError("Anda wajib membaca dan menyetujui syarat dan ketentuan sebelum mendaftar.");
    }
    const form = new FormData(event.currentTarget);
    const password = value(form, "password");
    const confirmPassword = value(form, "confirmPassword");

    if (!PASSWORD_REGEX.test(password)) return setError(validationMessages.password);
    if (password !== confirmPassword) return setError(validationMessages.confirmPassword);

    setError("");
    setIsLoading(true);

    try {
      const result =
        type === "customer"
          ? await registerCustomer(customerData(form, password, confirmPassword, terms.id))
          : await registerVendor(vendorData(form, password, confirmPassword, terms.id));

      setRegisteredEmail(result.user.email);
      setStep("otp");
    } catch (submitError) {
      // S&K diperbarui saat user mengisi form: muat versi terbaru dan minta persetujuan ulang.
      if (submitError instanceof RegistrationError && isTermsOutdated(submitError)) {
        setAcceptedTerms(false);
        void termsResource.reload();
      }
      setError(
        submitError instanceof RegistrationError
          ? submitError.message
          : "Registrasi gagal. Silakan coba kembali.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <div className="grid gap-4">
        <SuccessState message="Registrasi berhasil. Verifikasi email Anda untuk menyelesaikan pendaftaran." />
        <OtpVerificationForm
          email={registeredEmail}
          purpose="register"
          onVerified={() => setStep("success")}
        />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="grid gap-4">
        <SuccessState message="Email berhasil diverifikasi. Akun Anda siap digunakan." />
        <AppButton asChild>
          <Link href={ROUTES.login}>Masuk ke akun</Link>
        </AppButton>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      {type === "vendor" ? (
        <>
          <AppInput label="Nama pemilik" name="ownerName" autoComplete="name" required />
          <AppInput label="Nama bisnis" name="businessName" required />
        </>
      ) : (
        <AppInput label="Nama lengkap" name="fullname" autoComplete="name" required />
      )}

      <AppInput
        label="Email"
        name="email"
        type="email"
        placeholder="nama@email.com"
        autoComplete="email"
        required
      />

      <AppInput
        label={type === "vendor" ? "Nomor telepon bisnis" : "Nomor HP"}
        name={type === "vendor" ? "businessPhone" : "phoneNumber"}
        type="tel"
        autoComplete="tel"
        required
      />

      {type === "vendor" && (
        <AppInput
          label="Alamat bisnis"
          name="businessAddress"
          autoComplete="street-address"
          required
        />
      )}

      <PasswordInput
        label="Password"
        name="password"
        placeholder="Buat password yang kuat"
        helper={validationMessages.password}
        autoComplete="new-password"
        required
      />

      <PasswordInput
        label="Konfirmasi password"
        name="confirmPassword"
        placeholder="Masukkan kembali password"
        autoComplete="new-password"
        required
      />

      <div className="grid gap-3 rounded-xl border p-4 text-sm">
        {terms ? (
          <RegistrationTerms type={type} terms={terms} />
        ) : termsResource.loading ? (
          <p role="status" className="text-stone-500">
            Memuat syarat dan ketentuan…
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-red-700">
            <span>{termsResource.error || "Syarat dan ketentuan gagal dimuat."}</span>
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => void termsResource.reload()}
            >
              Muat ulang
            </AppButton>
          </div>
        )}
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="acceptedTerms"
            required
            checked={acceptedTerms}
            disabled={isLoading || !terms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-1 size-4 shrink-0 accent-blush"
          />
          <span>Saya telah membaca dan menyetujui syarat dan ketentuan Plan Your Wedding.</span>
        </label>
      </div>

      {error && <PopupMessage message={error} variant="error" />}
      <AppButton loading={isLoading} disabled={!acceptedTerms || !terms} type="submit">
        Daftar sekarang
      </AppButton>
    </form>
  );
}

function customerData(
  form: FormData,
  password: string,
  confirmPassword: string,
  termsVersionId: number,
): CustomerRegistrationData {
  return {
    fullname: value(form, "fullname"),
    email: value(form, "email"),
    phoneNumber: value(form, "phoneNumber"),
    password,
    confirmPassword,
    termsVersionId,
  };
}

function vendorData(
  form: FormData,
  password: string,
  confirmPassword: string,
  termsVersionId: number,
): VendorRegistrationData {
  return {
    ownerName: value(form, "ownerName"),
    businessName: value(form, "businessName"),
    email: value(form, "email"),
    businessPhone: value(form, "businessPhone"),
    businessAddress: value(form, "businessAddress"),
    password,
    confirmPassword,
    termsVersionId,
  };
}

function value(form: FormData, field: string) {
  return String(form.get(field) ?? "").trim();
}
