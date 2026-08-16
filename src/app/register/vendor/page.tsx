import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout";
import { RegistrationForm } from "@/features/auth/components/RegistrationForm";
export default function RegisterVendorPage() {
  return (
    <AuthPageLayout
      title="Daftar sebagai vendor"
      description="Lengkapi informasi awal bisnis untuk membuka Seller Center."
    >
      <RegistrationForm type="vendor" />
    </AuthPageLayout>
  );
}
