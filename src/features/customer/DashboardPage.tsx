import { CustomerDashboardProfile } from "./CustomerDashboardProfile";
import { OrderDashboard } from "@/features/dashboard/OrderDashboard";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import Link from "next/link";

export function CustomerDashboard() {
  return (
    <FeaturePage
      title="Dashboard Wedding"
      description="Ringkasan pesanan dan persiapan pernikahan Anda."
      showHeader={false}
    >
      <CustomerDashboardProfile />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Cari vendor", "/customer/marketplace"],
          ["Pesanan saya", "/customer/orders"],
          ["Persiapan pernikahan", "/customer/progress"],
          ["Lihat budget", "/customer/budget"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border bg-white p-4 text-sm font-semibold hover:text-blush"
          >
            {label}
          </Link>
        ))}
      </div>
      <OrderDashboard role="customer" />
    </FeaturePage>
  );
}
