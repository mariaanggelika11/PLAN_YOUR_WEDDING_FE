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
      <DemoAccounts />
      <p className="text-center text-sm text-stone-500">
        Belum punya akun?{" "}
        <Link className="font-semibold text-blush" href="/register">
          Daftar
        </Link>
      </p>
    </AuthPage>
  );
}

function DemoAccounts() {
  return (
    <section className="rounded-2xl border bg-stone-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Akun demo</p>
      <div className="mt-3 grid gap-2 text-xs text-stone-600">
        <p>
          <strong>Customer:</strong> alya@example.com
        </p>
        <p>
          <strong>Vendor:</strong> vendor@example.com
        </p>
        <p>
          <strong>Admin:</strong> admin@example.com
        </p>
        <p>
          <strong>Password:</strong> Wedding123
        </p>
      </div>
    </section>
  );
}
