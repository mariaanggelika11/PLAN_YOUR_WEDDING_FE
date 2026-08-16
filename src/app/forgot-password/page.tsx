import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
export default function ForgotPasswordPage() {
  return (
    <AuthPageLayout
      title="Atur ulang password"
      description="Masukkan email akun Anda. Kami akan mengirim kode OTP untuk mengatur ulang password."
    >
      <ForgotPasswordForm />
    </AuthPageLayout>
  );
}
