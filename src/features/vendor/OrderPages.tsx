"use client";
import { orderRepository } from "@/features/orders/repository";

import { DataTable } from "@/shared/components/data-display/DataTable";
import { DetailGrid } from "@/shared/components/data-display/DetailBlocks";
import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";
import { PopupConfirm } from "@/shared/components/feedback/Popup";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { formatDate } from "@/shared/utils/formatDate";
import Link from "next/link";

export function OrdersPage() {
  return (
    <Page title="Pesanan Vendor" description="Tinjau pesanan masuk dan status pelaksanaan.">
      <DataTable
        columns={[
          "Nomor",
          "Customer",
          "Paket",
          "Tanggal",
          "Lokasi",
          "Pembayaran",
          "Status",
          "Aksi",
        ]}
        rows={orderRepository.list().map((o) => [
          o.number,
          o.customerName,
          o.productName,
          formatDate(o.eventDate),
          o.location,
          <StatusBadge status={o.paymentStatus} />,
          <StatusBadge status={o.status} />,
          <Link className="font-semibold text-blush" href={ROUTES.vendor.order(o.id)}>
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
      description="Tinjau kebutuhan customer sebelum menerima pesanan."
    >
      <DetailGrid
        items={[
          ["Customer", o.customerName],
          ["Paket", o.productName],
          ["Tanggal", formatDate(o.eventDate)],
          ["Lokasi", o.location],
          ["Jumlah tamu", "500 tamu"],
          ["Pembayaran", <StatusBadge status={o.paymentStatus} />],
          ["Catatan customer", "Mohon gunakan palet warna rose dan ivory."],
        ]}
      />
      <div className="flex gap-3">
        <AppButton>Terima pesanan</AppButton>
        <PopupConfirm
          requireReason
          trigger={<AppButton variant="danger">Tolak pesanan</AppButton>}
          title="Tolak pesanan?"
          description="Alasan penolakan wajib disampaikan kepada customer."
        />
      </div>
      <section className="rounded-2xl border bg-white p-6">
        <SectionHeader
          title="Update progress"
          description="Placeholder pembaruan progres layanan untuk customer."
        />
      </section>
    </Page>
  );
}
