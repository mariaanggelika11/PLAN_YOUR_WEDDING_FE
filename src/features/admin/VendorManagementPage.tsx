"use client";

import { getAdminVendors } from "@/features/admin/api/adminApi";
import type { VendorAdminProfile } from "@/features/admin/types";
import { ListFeedback } from "@/features/admin/VerificationPages";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { usePaginatedResource } from "@/shared/hooks/usePaginatedResource";
import Link from "next/link";

const PAGE_SIZE = 10;

export function AdminVendorsPage() {
  const table = usePaginatedResource(getAdminVendors, { mapError: errorMessage });
  return (
    <Page title="Manajemen Vendor" description="Tinjau seluruh akun bisnis.">
      <ListFeedback {...table} />
      {!table.loading && !table.error && (
        <DataTable
          columns={["Vendor", "Pemilik", "Lokasi", "Status", "Aksi"]}
          onPageChange={table.setPage}
          onSearchChange={table.changeSearch}
          page={table.page}
          pageSize={PAGE_SIZE}
          searchValue={table.search}
          total={table.total}
          rows={table.data.map((vendor) => [
            vendor.businessName || "Belum dilengkapi",
            vendor.ownerName || vendor.user?.fullname || "—",
            locationLabel(vendor),
            <StatusBadge status={vendorStatus(vendor.status)} key={`status-${vendor.id}`} />,
            <AppButton asChild key={vendor.id} variant="secondary">
              <Link href={ROUTES.admin.vendorVerification(String(vendor.id))}>Detail</Link>
            </AppButton>,
          ])}
          title="Daftar vendor"
        />
      )}
    </Page>
  );
}

function locationLabel(vendor: VendorAdminProfile) {
  return [vendor.city, vendor.province].filter(Boolean).join(", ") || "—";
}
function vendorStatus(status?: number | null) {
  return (
    (
      {
        1: "DRAFT",
        2: "PENDING_VERIFICATION",
        3: "VERIFIED",
        4: "REJECTED",
        5: "SUSPENDED",
        6: "INACTIVE",
      } as const
    )[status as 1] ?? "INACTIVE"
  );
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Permintaan gagal diproses.";
}
