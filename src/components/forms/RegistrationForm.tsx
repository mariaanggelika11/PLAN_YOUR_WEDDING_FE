"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { SuccessState } from "@/components/states/States";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/FormFields";
import { ROUTES } from "@/constants/routes";
import {
  registerCustomer,
  RegistrationError,
  registerVendor,
} from "@/services/registrationService";
import type { CustomerRegistrationData, VendorRegistrationData } from "@/types/registration";
import { PASSWORD_REGEX, validationMessages } from "@/utils/validation";

type RegistrationType = "customer" | "vendor";

export function RegistrationForm({ type }: { type: RegistrationType }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = value(form, "password");
    const confirmPassword = value(form, "confirmPassword");

    if (!PASSWORD_REGEX.test(password)) return setError(validationMessages.password);
    if (password !== confirmPassword) return setError(validationMessages.confirmPassword);

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (type === "customer") {
        await registerCustomer(customerData(form, password, confirmPassword));
      } else {
        await registerVendor(vendorData(form, password, confirmPassword));
      }

      setSuccess("Registrasi berhasil. Mengarahkan ke halaman masuk...");
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.replace(ROUTES.login);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof RegistrationError
          ? submitError.message
          : "Registrasi gagal. Silakan coba kembali.",
      );
    } finally {
      setIsLoading(false);
    }
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

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {success && <SuccessState message={success} />}

      <AppButton loading={isLoading} type="submit">
        Daftar sekarang
      </AppButton>
    </form>
  );
}

function customerData(
  form: FormData,
  password: string,
  confirmPassword: string,
): CustomerRegistrationData {
  return {
    fullname: value(form, "fullname"),
    email: value(form, "email"),
    phoneNumber: value(form, "phoneNumber"),
    password,
    confirmPassword,
  };
}

function vendorData(
  form: FormData,
  password: string,
  confirmPassword: string,
): VendorRegistrationData {
  return {
    ownerName: value(form, "ownerName"),
    businessName: value(form, "businessName"),
    email: value(form, "email"),
    businessPhone: value(form, "businessPhone"),
    businessAddress: value(form, "businessAddress"),
    password,
    confirmPassword,
  };
}

function value(form: FormData, field: string) {
  return String(form.get(field) ?? "").trim();
}
