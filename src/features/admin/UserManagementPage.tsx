"use client";

import { getAdminUsers, updateUserActive } from "@/features/admin/api/adminApi";
import type { AdminUser } from "@/features/admin/types";
import { ListFeedback } from "@/features/admin/VerificationPages";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { usePaginatedResource } from "@/shared/hooks/usePaginatedResource";
import { useState } from "react";

const PAGE_SIZE = 10;

export function AdminUsersPage() {
  const table = usePaginatedResource(getAdminUsers, { mapError: errorMessage });
  const action = useAsyncAction();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function toggleUser(user: AdminUser) {
    setUpdatingId(user.id);
    const result = await action.run(() => updateUserActive(user.id, !user.active), {
      errorMessage,
      successMessage: user.active
        ? "Pengguna berhasil dinonaktifkan."
        : "Pengguna diaktifkan kembali.",
    });
    if (result.success) await table.reload();
    setUpdatingId(null);
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Permintaan gagal diproses.";
}
