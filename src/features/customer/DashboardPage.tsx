import { CustomerDashboardProfile } from "@/features/customer/CustomerDashboardProfile";
import { marketplaceRepository } from "@/features/marketplace/repository";
import { DashboardCard, VendorCard } from "@/shared/components/data-display/Cards";
import { PlaceholderPanel } from "@/shared/components/data-display/DetailBlocks";
import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { CheckCircle2, Sparkles, UploadCloud, WalletCards } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

function Page({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <FeaturePage title={title} description={description} showHeader={false}>
      {children}
    </FeaturePage>
  );
}

export function CustomerDashboard() {
  // TODO API: Ambil statistik order, pembayaran, dan progress dari backend.
  return (
    <Page title="Dashboard Wedding" description="Ringkasan persiapan pernikahan Alya & Dimas.">
      <CustomerDashboardProfile />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Pesanan aktif" value="2 pesanan" />
        <DashboardCard label="Pembayaran perlu aksi" value="1 pembayaran" />
        <DashboardCard label="Vendor booked" value="6 vendor" />
        <DashboardCard label="Sisa budget" value={formatCurrency(82000000)} />
      </div>
      <section>
        <SectionHeader title="Aksi cepat" />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            [Sparkles, "Cari Vendor", "/customer/marketplace"],
            [CheckCircle2, "Lihat Order", "/customer/orders"],
            [UploadCloud, "Upload Pembayaran", "/customer/orders"],
            [WalletCards, "Atur Budget", "/customer/budget"],
          ].map(([Icon, label, href]) => (
            <Link
              className="rounded-2xl border bg-white p-4 text-sm font-semibold shadow-sm hover:-translate-y-1 hover:border-rose-200 hover:text-blush"
              href={String(href)}
              key={String(label)}
            >
              <Icon className="mb-3 text-blush" size={20} />
              {String(label)}
            </Link>
          ))}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <PlaceholderPanel
          title="Progress persiapan"
          description="Target berikutnya: finalisasi menu catering."
        />
        <section>
          <SectionHeader title="Rekomendasi vendor" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {marketplaceRepository
              .vendors()
              .slice(0, 2)
              .map((vendor) => (
                <VendorCard vendor={vendor} key={vendor.id} />
              ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
