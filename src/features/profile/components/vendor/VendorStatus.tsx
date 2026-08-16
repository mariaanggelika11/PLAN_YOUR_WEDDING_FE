import { StatusBadge } from "@/components/badges/StatusBadge";
import type { VendorApiProfile } from "@/types/profile";

const VENDOR_STATUS = {
  1: { key: "DRAFT", label: "Draft", description: "Profile masih dapat dilengkapi dan disimpan." },
  2: {
    key: "PENDING_VERIFICATION",
    label: "Pending Verification",
    description: "Profile sedang menunggu pemeriksaan admin.",
  },
  3: { key: "VERIFIED", label: "Verified", description: "Profile telah diverifikasi." },
  4: {
    key: "REJECTED",
    label: "Rejected",
    description: "Profile perlu diperbaiki sebelum dikirim ulang.",
  },
  5: { key: "SUSPENDED", label: "Suspended", description: "Profile untuk sementara ditangguhkan." },
  6: { key: "INACTIVE", label: "Inactive", description: "Profile sedang tidak aktif." },
} as const;

export function vendorStatusDetails(status?: number | null) {
  return (
    VENDOR_STATUS[status as keyof typeof VENDOR_STATUS] ?? {
      key: "INACTIVE",
      label: "Unknown",
      description: "Status belum dikenali.",
    }
  );
}

export function VendorProfileStatus({ profile }: { profile: VendorApiProfile | null }) {
  if (!profile?.status) return null;
  const status = vendorStatusDetails(profile.status);
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-stone-50 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="font-semibold text-ink">Status profile: {status.label}</p>
        <p className="mt-1 text-sm text-stone-600">{status.description}</p>
        {profile.rejectReason && (
          <p className="mt-2 text-sm font-medium text-red-700">Alasan: {profile.rejectReason}</p>
        )}
      </div>
      <StatusBadge status={status.key} />
    </div>
  );
}
