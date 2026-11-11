"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { Store, Users } from "lucide-react";
import Link from "next/link";
export default function RegisterPage() {
  const { translateText } = useTranslation();
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="grid min-h-screen place-items-center px-5 py-12"
    >
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="text-center text-4xl font-semibold">
          {translateText("Bergabung dengan Plan Your Wedding")}
        </h1>
        <p className="mt-3 text-center text-stone-600">
          {translateText("Pilih peran yang sesuai untuk memulai.")}
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <RoleCard
            icon={<Users />}
            title="Customer / Couple"
            text={translateText(
              "Cari vendor, booking paket, dan kelola seluruh persiapan wedding.",
            )}
            href={ROUTES.registerCustomer}
          />
          <RoleCard
            icon={<Store />}
            title="Vendor / Seller"
            text={translateText("Tampilkan layanan, terima booking, dan kembangkan bisnis Anda.")}
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
  const { translateText } = useTranslation();

  return (
    <article className="rounded-xl border bg-white p-7 shadow-soft">
      {icon}
      <h2 className="mt-5 text-xl font-semibold">{translateText(title)}</h2>
      <p className="mb-6 mt-2 text-sm text-stone-600">{translateText(text)}</p>
      <AppButton asChild className="w-full">
        <Link href={href}>{translateText("Lanjut")}</Link>
      </AppButton>
    </article>
  );
}
