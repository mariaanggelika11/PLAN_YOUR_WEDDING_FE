import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { ROUTES } from "@/shared/config/routes";
import Link from "next/link";
export default function LoginPage() {
  return (
    <AuthPageLayout
      title="Selamat datang kembali"
      description="Masuk untuk melanjutkan persiapan hari istimewa Anda."
    >
      <LoginForm />
      <p className="text-center text-sm text-stone-500">
        Belum punya akun?{" "}
        <Link className="font-semibold text-blush" href={ROUTES.register}>
          Daftar
        </Link>
      </p>
    </AuthPageLayout>
  );
}
