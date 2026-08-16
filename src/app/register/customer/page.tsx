import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout";
import { RegistrationForm } from "@/features/auth/components/RegistrationForm";
export default function RegisterCustomerPage() {
  return (
    <AuthPageLayout
      title="Daftar sebagai customer"
      description="Mulai susun rencana wedding bersama vendor terpercaya."
    >
      <RegistrationForm type="customer" />
    </AuthPageLayout>
  );
}
