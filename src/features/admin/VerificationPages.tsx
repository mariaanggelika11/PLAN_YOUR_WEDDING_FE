"use client";

import { getAdminVendor, getAdminVendors, verifyVendor } from "@/features/admin/api/adminApi";
import type { VendorAdminProfile } from "@/features/admin/types";
import { paymentRepository } from "@/features/payments/repository";
import { getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { DetailGrid, PlaceholderPanel } from "@/shared/components/data-display/DetailBlocks";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { PopupConfirm, PopupMessage } from "@/shared/components/feedback/Popup";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { usePaginatedResource } from "@/shared/hooks/usePaginatedResource";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDate } from "@/shared/utils/formatDate";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

export function AdminVendorVerificationPage() {
  const list = usePaginatedResource(getAdminVendors, {
    mapError: errorMessage,
    pageSize: 1000,
  });
  const pending = useMemo(() => list.data.filter((vendor) => vendor.status === 2), [list.data]);
  const start = (list.page - 1) * PAGE_SIZE;
  const visible = pending.slice(start, start + PAGE_SIZE);

  return (
    <Page title="Verifikasi Vendor" description="Periksa bisnis yang menunggu persetujuan.">
      <ListFeedback {...list} />
      {!list.loading && !list.error && (
        <DataTable
          columns={["Vendor", "Pemilik", "Kategori", "Lokasi", "Diajukan", "Status", "Aksi"]}
          onPageChange={list.setPage}
          onSearchChange={list.changeSearch}
          page={list.page}
          pageSize={PAGE_SIZE}
          searchValue={list.search}
          total={pending.length}
          rows={visible.map((vendor) => [
            vendor.businessName || "Belum dilengkapi",
            vendor.ownerName || vendor.user?.fullname || "—",
            categoriesLabel(vendor.categories),
            locationLabel(vendor),
            vendor.updatedAt || vendor.createdAt
              ? formatDate(vendor.updatedAt ?? vendor.createdAt!)
              : "—",
            <StatusBadge status={vendorStatus(vendor.status)} key={`status-${vendor.id}`} />,
            <Link
              className="font-semibold text-blush"
              href={ROUTES.admin.vendorVerification(String(vendor.id))}
              key={vendor.id}
            >
              Periksa
            </Link>,
          ])}
          title="Antrean verifikasi"
        />
      )}
    </Page>
  );
}

export function AdminVendorVerificationDetailPage({ vendorId }: { vendorId: string }) {
  const id = Number(vendorId);
  const [vendor, setVendor] = useState<VendorAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!Number.isInteger(id)) return setError("ID vendor tidak valid.");
    setLoading(true);
    setError("");
    try {
      setVendor(await getAdminVendor(id));
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => void load(), [load]);

  async function decide(decision: "approve" | "reject", reason?: string) {
    if (!vendor) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await verifyVendor(vendor, decision, reason);
      setMessage(
        decision === "approve" ? "Vendor berhasil diverifikasi." : "Vendor berhasil ditolak.",
      );
      await load();
    } catch (decisionError) {
      setError(errorMessage(decisionError));
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <Page title="Detail Vendor" description="Memuat data vendor...">
        <LoadingSkeleton />
      </Page>
    );
  if (error && !vendor)
    return (
      <Page title="Detail Vendor" description="Data vendor tidak tersedia.">
        <ErrorState retry={() => void load()} />
      </Page>
    );
  if (!vendor) return null;

  return (
    <Page
      title={`Verifikasi ${vendor.businessName || "Vendor"}`}
      description="Periksa profil dan dokumen bisnis."
    >
      {error ? (
        <PopupMessage message={error} variant="error" />
      ) : (
        message && <PopupMessage message={message} />
      )}
      <DetailGrid
        items={[
          ["Nama bisnis", vendor.businessName || "—"],
          ["Pemilik", vendor.ownerName || vendor.user?.fullname || "—"],
          ["Email bisnis", vendor.businessEmail || vendor.user?.email || "—"],
          ["Kategori", categoriesLabel(vendor.categories)],
          ["Lokasi", locationLabel(vendor)],
          ["Area layanan", vendor.serviceArea || "—"],
          ["Deskripsi", vendor.description || "—"],
          ["Status", <StatusBadge status={vendorStatus(vendor.status)} key="status" />],
        ]}
      />
      <VendorDocuments vendor={vendor} />
      {vendor.status === 2 && (
        <div className="flex flex-wrap gap-3">
          <AppButton disabled={saving} onClick={() => void decide("approve")} variant="success">
            Setujui vendor
          </AppButton>
          <PopupConfirm
            description="Masukkan alasan yang akan diterima vendor."
            onConfirm={(reason) => void decide("reject", reason)}
            requireReason
            title="Tolak vendor?"
            trigger={
              <AppButton disabled={saving} variant="danger">
                Tolak vendor
              </AppButton>
            }
          />
        </div>
      )}
    </Page>
  );
}

function VendorDocuments({ vendor }: { vendor: VendorAdminProfile }) {
  const documents = vendor.verificationDocuments ?? [];
  const [error, setError] = useState("");
  async function open(attachmentId: string) {
    setError("");
    try {
      const blob = await getAttachmentBlob(attachmentId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (openError) {
      setError(errorMessage(openError));
    }
  }
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      {error && <PopupMessage message={error} variant="error" />}
      <h2 className="font-semibold">Dokumen verifikasi</h2>
      <div className="mt-4 grid gap-3">
        {documents.length ? (
          documents.map((document) => (
            <div
              className="flex flex-wrap items-center gap-3 rounded-2xl border bg-stone-50 p-4"
              key={document.id}
            >
              <div className="mr-auto">
                <p className="font-medium">{document.documentType}</p>
                <p className="text-sm text-stone-500">
                  {document.documentNumber || "Tanpa nomor dokumen"}
                </p>
              </div>
              <StatusBadge status={vendorStatus(document.status)} />
              {document.attachmentId && (
                <AppButton onClick={() => void open(document.attachmentId!)} variant="secondary">
                  Lihat
                </AppButton>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-stone-500">Belum ada dokumen.</p>
        )}
      </div>
    </section>
  );
}

export function ListFeedback({
  loading,
  error,
  actionError = "",
  message = "",
  reload,
}: {
  loading: boolean;
  error: string;
  actionError?: string;
  message?: string;
  reload: () => Promise<void>;
}) {
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState retry={() => void reload()} />;
  return (
    <>
      {actionError ? (
        <PopupMessage message={actionError} variant="error" />
      ) : (
        message && <PopupMessage message={message} />
      )}
    </>
  );
}

function categoriesLabel(categories: VendorAdminProfile["categories"]) {
  if (Array.isArray(categories)) return categories.filter(Boolean).join(", ") || "—";
  return (
    categories
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ") || "—"
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
export function PaymentVerification() {
  return (
    <Page title="Verifikasi Pembayaran" description="Periksa bukti transfer manual dari customer.">
      <DataTable
        columns={[
          "Payment ID",
          "Order",
          "Customer",
          "Vendor",
          "Jumlah",
          "Status",
          "Tanggal",
          "Aksi",
        ]}
        rows={paymentRepository.list().map((p) => [
          p.id,
          p.orderNumber,
          p.customerName,
          p.vendorName,
          formatCurrency(p.amount),
          <StatusBadge status={p.status} />,
          formatDate(p.uploadedAt),
          <Link className="font-semibold text-blush" href={ROUTES.admin.paymentVerification(p.id)}>
            Detail
          </Link>,
        ])}
      />
    </Page>
  );
}
export function PaymentDetail() {
  const p = paymentRepository.list()[0];
  return (
    <Page
      title={`Verifikasi ${p.id}`}
      description="Bandingkan bukti transfer dengan informasi pesanan."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <PlaceholderPanel
          title="Preview bukti pembayaran"
          description="Gambar bukti transfer dari customer."
        />
        <DetailGrid
          items={[
            ["Order", p.orderNumber],
            ["Customer", p.customerName],
            ["Vendor", p.vendorName],
            ["Jumlah tagihan", formatCurrency(p.amount)],
            ["Jumlah transfer", formatCurrency(p.amount)],
            ["Status", <StatusBadge status={p.status} />],
          ]}
        />
      </div>
      <div className="flex gap-3">
        <AppButton>Approve pembayaran</AppButton>
        <PopupConfirm
          requireReason
          trigger={<AppButton variant="danger">Reject pembayaran</AppButton>}
          title="Tolak pembayaran?"
          description="Alasan penolakan wajib diisi."
        />
        <AppButton variant="secondary">Minta upload ulang</AppButton>
      </div>
    </Page>
  );
}
