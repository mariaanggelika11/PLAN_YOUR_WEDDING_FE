"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { ROUTES } from "@/shared/config/routes";
import Link from "next/link";
export default function LoginPage() {
  const { translateText } = useTranslation();
  return (
    <AuthPageLayout
      title={translateText("Selamat datang kembali")}
      description={translateText("Masuk untuk melanjutkan persiapan hari istimewa Anda.")}
    >
      <LoginForm />
      <p className="text-center text-sm text-stone-600">
        {translateText("Belum punya akun?")}{" "}
        <Link className="font-semibold text-blush" href={ROUTES.register}>
          {translateText("Daftar")}{" "}
        </Link>
      </p>
    </AuthPageLayout>
  );
}
