import { AuthForm } from "@/components/forms/AuthForm";
import { AuthPage } from "@/components/layout/AuthPage";
export default function RegisterCustomerPage() {
  return (
    <AuthPage
      title="Daftar sebagai customer"
      description="Mulai susun rencana wedding bersama vendor terpercaya."
    >
      <AuthForm type="customer" />
    </AuthPage>
  );
}
