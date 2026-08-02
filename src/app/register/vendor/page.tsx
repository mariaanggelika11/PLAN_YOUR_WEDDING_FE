import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { AuthPage } from "@/components/layout/AuthPage";
export default function RegisterVendorPage() {
  return (
    <AuthPage
      title="Daftar sebagai vendor"
      description="Lengkapi informasi awal bisnis untuk membuka Seller Center."
    >
      <RegistrationForm type="vendor" />
    </AuthPage>
  );
}
