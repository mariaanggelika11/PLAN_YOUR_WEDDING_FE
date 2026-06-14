import { AuthForm } from "@/components/forms/AuthForm";
import { AuthPage } from "@/components/layout/AuthPage";
export default function RegisterVendorPage() {
  return (
    <AuthPage
      title="Daftar sebagai vendor"
      description="Lengkapi informasi awal bisnis untuk membuka Seller Center."
    >
      <AuthForm type="vendor" />
    </AuthPage>
  );
}
