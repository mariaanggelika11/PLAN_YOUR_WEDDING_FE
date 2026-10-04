"use client";
import Link from "next/link";
import { OrderDashboard } from "@/features/dashboard/OrderDashboard";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
export function AdminDashboard() {
  return (
    <FeaturePage title="Admin Dashboard" description="Ringkasan operasional Plan Your Wedding.">
      <div className="flex flex-wrap gap-4 text-sm font-semibold text-blush">
        <Link href="/admin/vendor-verification">Periksa verifikasi vendor</Link>
        <Link href="/admin/payment-verification">Periksa pembayaran</Link>
      </div>
      <OrderDashboard role="admin" />
    </FeaturePage>
  );
}
