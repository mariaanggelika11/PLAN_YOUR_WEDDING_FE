"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/FormFields";
import { SuccessState } from "@/components/states/States";
import { AuthError, getDashboardRoute, login } from "@/services/authService";

export function AuthForm({ type }: { type: "login" | "customer" | "vendor" | "forgot" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!form.get("email")) return setError("Email wajib diisi.");
    if (type !== "forgot" && String(form.get("password") ?? "").length < 8)
      return setError("Password minimal 8 karakter.");
    if (
      (type === "customer" || type === "vendor") &&
      form.get("password") !== form.get("confirmPassword")
    )
      return setError("Konfirmasi password tidak sama.");
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
        // TODO API: Kirim data registrasi atau reset password ke backend
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
      {type === "vendor" && (
        <>
          <AppInput label="Nama pemilik" name="ownerName" required />
          <AppInput label="Nama bisnis" name="businessName" required />
        </>
      )}
      {type === "customer" && <AppInput label="Nama lengkap" name="name" required />}
      <AppInput
        label="Email"
        name="email"
        type="email"
        placeholder="nama@email.com"
        error={error}
        required
      />
      {(type === "customer" || type === "vendor") && (
        <AppInput
          label={type === "vendor" ? "Nomor telepon bisnis" : "Nomor HP"}
          name="phone"
          type="tel"
          required
        />
      )}
      {type === "vendor" && <AppInput label="Alamat bisnis" name="address" required />}
      {type !== "forgot" && (
        <div className="relative">
          <AppInput
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            helper="Minimal 8 karakter."
            required
          />
          <button
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute right-3 top-9 text-stone-400 hover:text-blush"
            onClick={() => setShowPassword(!showPassword)}
            type="button"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      )}
      {(type === "customer" || type === "vendor") && (
        <AppInput label="Konfirmasi password" name="confirmPassword" type="password" required />
      )}
      {type === "login" && (
        <div className="flex justify-between text-sm">
          <label className="flex gap-2">
            <input name="rememberMe" type="checkbox" className="accent-rose-600" /> Ingat saya
          </label>
          <Link className="text-blush" href="/forgot-password">
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
        {type === "login" ? "Masuk" : type === "forgot" ? "Kirim tautan reset" : "Daftar sekarang"}
      </AppButton>
    </form>
  );
}
