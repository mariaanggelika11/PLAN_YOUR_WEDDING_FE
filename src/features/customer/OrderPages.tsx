import { orderRepository } from "@/features/orders/repository";
import { reviewRepository } from "@/features/reviews/repository";
import { OrderTimeline } from "@/shared/components/data-display/Commerce";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { DetailGrid } from "@/shared/components/data-display/DetailBlocks";
import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage } from "@/shared/components/layout/FeaturePage";
import { ROUTES } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDate } from "@/shared/utils/formatDate";
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

export function Orders() {
  return (
    <Page title="Pesanan Saya" description="Pantau status booking dan pembayaran vendor.">
      <DataTable
        title="Pesanan terbaru"
        columns={["Nomor", "Vendor", "Paket", "Tanggal acara", "Total", "Status", "Aksi"]}
        rows={orderRepository.list().map((o) => [
          o.number,
          o.vendorName,
          o.productName,
          formatDate(o.eventDate),
          formatCurrency(o.total),
          <StatusBadge status={o.status} />,
          <Link className="font-semibold text-blush" href={ROUTES.customer.order(o.id)}>
            Detail
          </Link>,
        ])}
      />
    </Page>
  );
}
export function OrderDetail() {
  const o = orderRepository.list()[0];
  return (
    <Page
      title={`Pesanan ${o.number}`}
      description="Detail acara, pembayaran, dan perkembangan pesanan."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <DetailGrid
          items={[
            ["Vendor", o.vendorName],
            ["Paket", o.productName],
            ["Tanggal acara", formatDate(o.eventDate)],
            ["Lokasi", o.location],
            ["Total", formatCurrency(o.total)],
            ["Pembayaran", <StatusBadge status={o.paymentStatus} />],
          ]}
        />
        <section className="rounded-3xl border bg-white p-6">
          <SectionHeader title="Timeline pesanan" />
          <div className="mt-5">
            <OrderTimeline
              items={[
                "Pesanan dibuat",
                "Pembayaran diterima",
                "Vendor mengonfirmasi",
                "Acara selesai",
              ]}
            />
          </div>
        </section>
      </div>
    </Page>
  );
}
export function ReviewList() {
  return (
    <section>
      <SectionHeader title="Ulasan customer" />
      {reviewRepository.list().map((r) => (
        <p className="mt-3 rounded-2xl border bg-white p-4 text-sm" key={r.id}>
          <span className="font-semibold text-amber-500">★ {r.rating}</span>
          <span className="mx-2 text-stone-300">·</span>
          {r.comment}
        </p>
      ))}
    </section>
  );
}
