"use client";
import Link from "next/link";
import { useCallback } from "react";
import { getOrders } from "@/features/orders/repository";
import { getVendorProducts } from "@/features/products/api";
import { getVendorProductReviews } from "@/features/reviews/api";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { usePaginatedResource, type PaginationQuery } from "@/shared/hooks/usePaginatedResource";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import type { ReactNode } from "react";

type Kind = "products" | "orders" | "reviews" | "disputes";
const titles = {
  products: "Monitoring Produk",
  orders: "Monitoring Pesanan",
  reviews: "Ulasan Customer",
  disputes: "Pesanan Bersengketa",
};
const columns = {
  products: ["Produk", "Vendor", "Harga", "Status"],
  orders: ["Nomor", "Customer", "Vendor", "Total", "Status"],
  reviews: ["Customer", "Vendor", "Produk", "Rating", "Komentar"],
  disputes: ["Nomor", "Customer", "Vendor", "Total", "Status"],
};
export function LiveMonitoring({ kind }: { kind: Kind }) {
  const loader = useCallback(
    async (query: PaginationQuery): Promise<{ data: ReactNode[][]; total: number }> => {
      if (kind === "products") {
        const result = await getVendorProducts(query);
        return {
          ...result,
          data: result.data.map((item) => [
            item.name,
            item.vendor.businessName,
            formatCurrency(item.price),
            <StatusBadge key="status" status={item.status} />,
          ]),
        };
      }
      if (kind === "reviews") {
        const result = await getVendorProductReviews({
          pageNumber: query.pageNumber,
          pageSize: query.pageSize,
        });
        return {
          ...result,
          data: result.data.map((item) => [
            item.customer?.fullName || "Customer",
            item.vendor?.businessName || "—",
            item.vendorProduct?.name || "—",
            `${item.rating} / 5`,
            item.comment || "—",
          ]),
        };
      }
      const result = await getOrders({
        ...query,
        ...(kind === "disputes" ? { status: "DISPUTED" as const } : {}),
      });
      return {
        ...result,
        data: result.data.map((item) => [
          <Link key={item.id} className="text-blush" href={`/admin/orders/${item.id}`}>
            {item.orderNumber}
          </Link>,
          item.customer.fullName,
          item.vendor.businessName,
          formatCurrency(item.totalAmount),
          <StatusBadge key="status" status={item.status} />,
        ]),
      };
    },
    [kind],
  );
  const list = usePaginatedResource(loader);
  return (
    <FeaturePage title={titles[kind]} description="Data yang tercatat pada aplikasi.">
      {list.loading ? (
        <LoadingSkeleton />
      ) : list.error ? (
        <ErrorState retry={() => void list.reload()} />
      ) : (
        <DataTable
          columns={columns[kind]}
          rows={list.data}
          total={list.total}
          page={list.page}
          pageSize={10}
          onPageChange={list.setPage}
          searchValue={list.search}
          onSearchChange={kind === "reviews" ? undefined : list.changeSearch}
        />
      )}
    </FeaturePage>
  );
}
