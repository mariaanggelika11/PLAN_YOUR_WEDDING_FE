import { AuthForm } from "@/components/forms/AuthForm";
import { AuthPage } from "@/components/layout/AuthPage";
export default function ForgotPasswordPage() {
  return (
    <AuthPage
      title="Atur ulang password"
      description="Kami akan mengirim tautan reset ke email Anda."
    >
      <AuthForm type="forgot" />
    </AuthPage>
  );
}
