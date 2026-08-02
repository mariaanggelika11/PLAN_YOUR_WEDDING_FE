"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/FormFields";
import { SuccessState } from "@/components/states/States";
import { AuthError, getDashboardRoute, login } from "@/services/authService";
import { ROUTES } from "@/constants/routes";

export function AuthForm({ type }: { type: "login" | "forgot" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!form.get("email")) return setError("Email wajib diisi.");
    if (type === "login" && String(form.get("password") ?? "").length < 8)
      return setError("Password minimal 8 karakter.");
    setError("");
    setIsLoading(true);
    try {
      if (type === "login") {
        const session = await login({
          email: String(form.get("email")),
          password: String(form.get("password")),
          rememberMe: form.get("rememberMe") === "on",
        });
        setSuccess("Login berhasil. Mengarahkan ke dashboard...");
        router.replace(getDashboardRoute(session.user.role));
        router.refresh();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setSuccess(
          type === "forgot" ? "Tautan reset password telah dikirim." : "Data berhasil disimpan.",
        );
        // TODO API: Hubungkan permintaan reset password saat endpoint backend tersedia.
      }
    } catch (submitError) {
      setError(
        submitError instanceof AuthError
          ? submitError.message
          : "Login gagal. Silakan coba kembali.",
      );
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <form className="grid gap-4" onSubmit={submit}>
      {type === "login" ? (
        <AppInput
          label="Email"
          name="email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          error={error}
          required
        />
      ) : (
        <AppInput
          label="Email"
          name="email"
          type="email"
          placeholder="nama@email.com"
          error={error}
          required
        />
      )}
      {type !== "forgot" && (
        <PasswordInput
          label="Password"
          name="password"
          placeholder="Masukkan password"
          helper="Minimal 8 karakter."
          autoComplete="current-password"
          required
        />
      )}
      {type === "login" && (
        <div className="flex justify-between text-sm">
          <label className="flex gap-2">
            <input name="rememberMe" type="checkbox" className="accent-rose-600" /> Ingat saya
          </label>
          <Link className="text-blush" href={ROUTES.forgotPassword}>
            Lupa password?
          </Link>
        </div>
      )}
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
        {type === "login" ? "Masuk" : "Kirim tautan reset"}
      </AppButton>
    </form>
  );
}
