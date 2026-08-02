import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { AuthPage } from "@/components/layout/AuthPage";
export default function RegisterCustomerPage() {
  return (
    <AuthPage
      title="Daftar sebagai customer"
      description="Mulai susun rencana wedding bersama vendor terpercaya."
    >
      <RegistrationForm type="customer" />
    </AuthPage>
  );
}
