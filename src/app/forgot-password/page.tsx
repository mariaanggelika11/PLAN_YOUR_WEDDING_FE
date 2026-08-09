import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { AuthPage } from "@/components/layout/AuthPage";
export default function ForgotPasswordPage() {
  return (
    <AuthPage
      title="Atur ulang password"
      description="Masukkan email akun Anda. Kami akan mengirim kode OTP untuk mengatur ulang password."
    >
      <ForgotPasswordForm />
    </AuthPage>
  );
}
