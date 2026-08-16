"use client";

import { useState } from "react";
import { Landmark, Plus, Trash2 } from "lucide-react";
import { ToastMessage } from "@/components/common/Toast";
import { usePopup } from "@/components/common/Popup";
import { BankAccountSection } from "@/features/profile/components/shared/StepSectionLayouts";
import {
  EmptyCollection,
  SectionHeading,
} from "@/features/profile/components/shared/CollectionState";
import { primaryBankAccount } from "@/features/profile/mappers/profileMappers";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/FormFields";
import { deleteVendorBankAccount } from "@/services/profileService";
import type { VendorApiProfile } from "@/types/profile";

export function VendorBankAccountSection({
  onDeleted,
  profile,
}: {
  onDeleted: () => void;
  profile: VendorApiProfile | null;
}) {
  const { confirm } = usePopup();
  const savedAccount = primaryBankAccount(profile);
  const [hasAccount, setHasAccount] = useState(Boolean(savedAccount));
  const [deleteError, setDeleteError] = useState("");
  async function removeAccount() {
    if (savedAccount) {
      const result = await confirm({
        confirmLabel: "Hapus",
        message: "Rekening pencairan ini akan dihapus dari profile vendor.",
        title: "Hapus rekening?",
        variant: "error",
      });
      if (!result.confirmed) return;
    }
    try {
      if (savedAccount) await deleteVendorBankAccount(savedAccount.id);
      setHasAccount(false);
      setDeleteError("");
      onDeleted();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Rekening gagal dihapus.");
    }
  }
  return (
    <BankAccountSection>
      <div className="mt-3 grid gap-4 border-t border-rose-100 pt-6 md:col-span-2">
        <SectionHeading
          action={
            <AppButton
              disabled={hasAccount}
              onClick={() => setHasAccount(true)}
              type="button"
              variant="secondary"
            >
              <Plus size={16} /> Tambah rekening
            </AppButton>
          }
          description="Rekening digunakan untuk pencairan transaksi dan tidak ditampilkan pada profil publik."
          title="Rekening pencairan"
        />
        {hasAccount ? (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b bg-rose-50/70 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-white text-blush shadow-sm">
                  <Landmark size={19} />
                </span>
                <div>
                  <p className="font-semibold text-ink">Rekening utama</p>
                  <p className="text-xs text-stone-500">Digunakan sebagai tujuan pencairan dana</p>
                </div>
              </div>
              <button
                aria-label="Hapus rekening"
                className="grid size-10 place-items-center rounded-xl text-red-600 transition hover:bg-red-50"
                onClick={() => void removeAccount()}
                title="Hapus rekening"
                type="button"
              >
                <Trash2 size={17} />
              </button>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <AppInput
                defaultValue={savedAccount?.bankName ?? ""}
                label="Nama bank"
                name="bankName"
                placeholder="Contoh: BCA"
              />
              <AppInput
                defaultValue={savedAccount?.accountNumber ?? ""}
                inputMode="numeric"
                label="Nomor rekening"
                name="bankAccountNumber"
                pattern="[0-9]+"
                placeholder="Masukkan nomor rekening"
              />
              <div className="md:col-span-2">
                <AppInput
                  defaultValue={savedAccount?.accountHolderName ?? ""}
                  label="Nama pemilik rekening"
                  name="bankAccountHolder"
                  placeholder="Sesuai dengan nama pada rekening"
                />
              </div>
            </div>
          </div>
        ) : (
          <EmptyCollection message="Belum ada rekening pencairan. Tambahkan rekening ketika Anda siap menerima pembayaran." />
        )}
        {deleteError && <ToastMessage message={deleteError} variant="error" />}
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          Untuk keamanan, data rekening hanya dapat dilihat oleh pemilik akun dan admin yang
          berwenang. API saat ini mendukung satu rekening utama.
        </p>
      </div>
    </BankAccountSection>
  );
}
