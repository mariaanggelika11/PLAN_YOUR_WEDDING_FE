import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { Store, Users } from "lucide-react";
import Link from "next/link";
export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-3xl">
        <h1 className="text-center text-4xl font-semibold">Bergabung dengan Plan Your Wedding</h1>
        <p className="mt-3 text-center text-stone-500">Pilih peran yang sesuai untuk memulai.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <RoleCard
            icon={<Users />}
            title="Customer / Couple"
            text="Cari vendor, booking paket, dan kelola seluruh persiapan wedding."
            href={ROUTES.registerCustomer}
          />
          <RoleCard
            icon={<Store />}
            title="Vendor / Seller"
            text="Tampilkan layanan, terima booking, dan kembangkan bisnis Anda."
            href={ROUTES.registerVendor}
          />
        </div>
      </div>
    </main>
  );
}
function RoleCard({
  icon,
  title,
  text,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <article className="rounded-3xl border bg-white p-7 shadow-soft">
      {icon}
      <h2 className="mt-5 text-xl font-semibold">{title}</h2>
      <p className="mb-6 mt-2 text-sm text-stone-500">{text}</p>
      <AppButton asChild className="w-full">
        <Link href={href}>Lanjut</Link>
      </AppButton>
    </article>
  );
}
