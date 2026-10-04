"use client";

import { useVendorProfile } from "@/features/profile/hooks/useVendorProfile";
import { canVendorSell, vendorDisplayStatus } from "@/features/profile/rules";
import type { VendorApiProfile } from "@/features/profile/types";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { cn } from "@/shared/utils/cn";
import Link from "next/link";
import { OrderDashboard } from "@/features/dashboard/OrderDashboard";

export function VendorDashboard() {
  const vendor = useVendorProfile();
  if (vendor.loading)
    return (
      <Page title="Seller Center" description="Memuat informasi bisnis Anda...">
        <LoadingSkeleton />
      </Page>
    );
  if (vendor.error)
    return (
      <Page title="Seller Center" description="Informasi bisnis tidak dapat dimuat.">
        <ErrorState retry={() => void vendor.reload()} />
      </Page>
    );

  const profile = vendor.profile;
  const canSell = canVendorSell(profile);
  const businessName =
    profile?.businessName?.trim() ||
    profile?.ownerName?.trim() ||
    profile?.user?.fullname?.trim() ||
    "Vendor";

  return (
    <Page title="Seller Center" description="Pantau performa bisnis dan pesanan terbaru.">
      <section
        className={cn(
          "rounded-xl border p-5 sm:p-6",
          canSell ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50",
        )}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <StatusBadge status={vendorDisplayStatus(profile)} />
            <h2 className="mt-3 text-2xl font-semibold">Selamat datang, {businessName}</h2>
            <p className="mt-1 text-sm text-stone-500">{vendorDashboardMessage(profile)}</p>
          </div>
          <AppButton asChild variant={canSell ? "primary" : "secondary"}>
            <Link href={canSell ? ROUTES.vendor.createProduct : ROUTES.vendor.profile}>
              {canSell ? "Buat paket baru" : "Lengkapi profil"}
            </Link>
          </AppButton>
        </div>
      </section>
      <OrderDashboard role="vendor" />
    </Page>
  );
}
export function vendorDashboardMessage(profile: VendorApiProfile | null) {
  if (canVendorSell(profile)) return "Profil Anda aktif dan dapat menerima pesanan baru.";
  if (!profile) return "Lengkapi profil bisnis untuk memulai proses verifikasi.";
  if (profile.active === false || profile.status === 6)
    return "Profil bisnis sedang tidak aktif. Hubungi admin jika Anda memerlukan bantuan.";
  if (profile.status === 5)
    return "Profil bisnis sedang ditangguhkan. Hubungi admin untuk informasi lebih lanjut.";
  if (profile.status === 4)
    return profile.rejectReason?.trim()
      ? `Verifikasi ditolak: ${profile.rejectReason}`
      : "Verifikasi bisnis ditolak. Periksa kembali data dan dokumen Anda.";
  if (profile.status === 2) return "Profil bisnis sedang menunggu pemeriksaan admin.";
  return "Lengkapi profil dan dokumen bisnis untuk mulai berjualan.";
}
