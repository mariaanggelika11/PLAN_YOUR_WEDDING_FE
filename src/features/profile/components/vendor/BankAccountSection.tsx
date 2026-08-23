"use client";

import { deleteVendorBankAccount } from "@/features/profile/api/profileApi";
import {
  EmptyCollection,
  SectionHeading,
} from "@/features/profile/components/shared/CollectionState";
import { BankAccountSection } from "@/features/profile/components/shared/StepSectionLayouts";
import { useProfileCollectionDelete } from "@/features/profile/hooks/useProfileCollectionDelete";
import { primaryBankAccount } from "@/features/profile/mappers";
import type { VendorApiProfile } from "@/features/profile/types";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppIconButton } from "@/shared/components/ui/AppIconButton";
import { AppInput } from "@/shared/components/ui/FormFields";
import { Landmark, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function VendorBankAccountSection({
  onDeleted,
  profile,
}: {
  onDeleted: () => void;
  profile: VendorApiProfile | null;
}) {
  const deletion = useProfileCollectionDelete();
  const savedAccount = primaryBankAccount(profile);
  const [hasAccount, setHasAccount] = useState(Boolean(savedAccount));
  async function removeAccount() {
    await deletion.remove({
      action: savedAccount ? () => deleteVendorBankAccount(savedAccount.id) : undefined,
      confirmMessage: "Rekening pencairan ini akan dihapus dari profile vendor.",
      confirmTitle: "Hapus rekening?",
      errorMessage: "Rekening gagal dihapus.",
      onDeleted: () => {
        setHasAccount(false);
        onDeleted();
      },
    });
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
              <AppIconButton
                disabled={deletion.deleting}
                label="Hapus rekening"
                onClick={() => void removeAccount()}
                type="button"
                variant="danger"
              >
                <Trash2 size={17} />
              </AppIconButton>
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
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          Untuk keamanan, data rekening hanya dapat dilihat oleh pemilik akun dan admin yang
          berwenang. API saat ini mendukung satu rekening utama.
        </p>
      </div>
    </BankAccountSection>
  );
}
