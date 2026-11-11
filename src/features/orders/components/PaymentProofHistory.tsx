"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { useState } from "react";
import type { PaymentProofRecord } from "../types";
import { PaymentProof } from "./PaymentProof";
import { formatDateTime } from "@/shared/utils/formatDate";
function ProofEntry({ proof }: { proof: PaymentProofRecord }) {
  const { translateText, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <details
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="rounded-lg border bg-white p-3"
    >
      <summary className="cursor-pointer text-sm">
        {formatDateTime(proof.submittedAt, locale)} ·{" "}
        {
          { PAID: "Diterima", REJECTED: "Ditolak", WAITING_VERIFICATION: "Menunggu verifikasi" }[
            proof.status
          ]
        }
      </summary>
      {proof.rejectReason && (
        <p className="my-2 text-sm text-red-700">
          {translateText("Alasan penolakan:")} {proof.rejectReason}
        </p>
      )}
      {proof.reviewedAt && (
        <p className="my-2 text-xs text-stone-600">
          {translateText("Diperiksa:")} {formatDateTime(proof.reviewedAt, locale)}
        </p>
      )}
      {open && <PaymentProof attachmentId={proof.attachmentId} />}
    </details>
  );
}
export function PaymentProofHistory({ proofs }: { proofs?: PaymentProofRecord[] }) {
  const { translateText } = useTranslation();
  if (!proofs?.length) return null;
  return (
    <section className="mt-3 grid gap-2">
      <h3 className="text-sm font-semibold">{translateText("Riwayat bukti pembayaran")}</h3>
      {proofs.map((proof) => (
        <ProofEntry key={proof.id} proof={proof} />
      ))}
    </section>
  );
}
