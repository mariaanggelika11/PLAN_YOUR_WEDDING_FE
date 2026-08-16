"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { ToastMessage } from "@/components/common/Toast";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ErrorState, LoadingSkeleton } from "@/components/states/States";
import { DataTable } from "@/components/tables/DataTable";
import { AppButton } from "@/components/ui/AppButton";
import { ROUTES } from "@/constants/routes";
import { FeaturePage as Page } from "@/features/shared/FeaturePage";
import { DetailGrid } from "@/features/shared/DetailBlocks";
import { useDebounce } from "@/hooks/useDebounce";
import {
  AdminServiceError,
  getAdminUsers,
  getAdminVendor,
  getAdminVendors,
  updateUserActive,
  verifyVendor,
} from "@/services/adminService";
import { getAttachmentBlob } from "@/services/attachmentService";
import type { AdminUser, VendorAdminProfile } from "@/types/admin";
import { formatDate } from "@/utils/formatDate";

const PAGE_SIZE = 10;

export function AdminUsersPage() {
  const table = useAdminList(getAdminUsers);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function toggleUser(user: AdminUser) {
    setUpdatingId(user.id);
    table.clearMessage();
    try {
      await updateUserActive(user.id, !user.active);
      table.setMessage(
        user.active ? "Pengguna berhasil dinonaktifkan." : "Pengguna diaktifkan kembali.",
      );
      await table.reload();
    } catch (error) {
      table.setActionError(errorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Page title="Manajemen Pengguna" description="Kelola status dan akses pengguna.">
      <ListFeedback {...table} />
      {!table.loading && !table.error && (
        <DataTable
          columns={["Nama", "Email", "Role", "Verifikasi", "Status", "Aksi"]}
          onPageChange={table.setPage}
          onSearchChange={table.changeSearch}
          page={table.page}
          pageSize={PAGE_SIZE}
          searchValue={table.search}
          total={table.total}
          rows={table.data.map((user) => [
            user.fullname,
            user.email,
            user.roles?.join(", ") || "Belum ada role",
            <StatusBadge
              status={user.isEmailVerified ? "VERIFIED" : "PENDING"}
              key={`verify-${user.id}`}
            />,
            <StatusBadge status={user.active ? "ACTIVE" : "INACTIVE"} key={`status-${user.id}`} />,
            <AppButton
              disabled={updatingId === user.id}
              key={user.id}
              onClick={() => void toggleUser(user)}
              variant={user.active ? "danger" : "secondary"}
            >
              {user.active ? "Nonaktifkan" : "Aktifkan"}
            </AppButton>,
          ])}
          title="Daftar pengguna"
        />
      )}
    </Page>
  );
}

export function AdminVendorsPage() {
  const table = useAdminList(getAdminVendors);
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

export function AdminVendorVerificationPage() {
  const list = useAdminList(getAdminVendors, 1000);
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
        <ToastMessage message={error} variant="error" />
      ) : (
        message && <ToastMessage message={message} />
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
          <ConfirmModal
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
      {error && <ToastMessage message={error} variant="error" />}
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

function useAdminList<T>(
  loader: (query: {
    filter?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => Promise<{ data: T[]; total: number }>,
  pageSize = PAGE_SIZE,
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const debouncedSearch = useDebounce(search);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await loader({
        filter: debouncedSearch || undefined,
        pageNumber: page,
        pageSize,
      });
      setData(response.data);
      setTotal(response.total);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, loader, page, pageSize]);

  useEffect(() => void reload(), [reload]);
  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }
  function clearMessage() {
    setActionError("");
    setMessage("");
  }
  return {
    data,
    total,
    page,
    setPage,
    search,
    changeSearch,
    loading,
    error,
    actionError,
    setActionError,
    message,
    setMessage,
    clearMessage,
    reload,
  };
}

function ListFeedback({
  loading,
  error,
  actionError,
  message,
  reload,
}: {
  loading: boolean;
  error: string;
  actionError: string;
  message: string;
  reload: () => Promise<void>;
}) {
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState retry={() => void reload()} />;
  return (
    <>
      {actionError ? (
        <ToastMessage message={actionError} variant="error" />
      ) : (
        message && <ToastMessage message={message} />
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
  return error instanceof AdminServiceError || error instanceof Error
    ? error.message
    : "Permintaan gagal diproses.";
}
