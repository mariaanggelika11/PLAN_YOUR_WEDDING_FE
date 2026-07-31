import Link from "next/link";
import { AuthForm } from "@/components/forms/AuthForm";
import { AuthPage } from "@/components/layout/AuthPage";
export default function LoginPage() {
  return (
    <AuthPage
      title="Selamat datang kembali"
      description="Masuk untuk melanjutkan persiapan hari istimewa Anda."
    >
      <AuthForm type="login" />
      <p className="text-center text-sm text-stone-500">
        Belum punya akun?{" "}
        <Link className="font-semibold text-blush" href="/register">
          Daftar
        </Link>
      </p>
    </AuthPage>
  );
}
