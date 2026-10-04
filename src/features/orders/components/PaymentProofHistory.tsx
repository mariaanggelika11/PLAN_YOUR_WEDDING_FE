"use client";
import { useState } from "react";
import type { PaymentProofRecord } from "../types";
import { PaymentProof } from "./PaymentProof";
import { formatDateTime } from "@/shared/utils/formatDate";
function ProofEntry({ proof }: { proof: PaymentProofRecord }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="rounded-lg border bg-white p-3"
    >
      <summary className="cursor-pointer text-sm">
        {formatDateTime(proof.submittedAt)} ·{" "}
        {
          { PAID: "Diterima", REJECTED: "Ditolak", WAITING_VERIFICATION: "Menunggu verifikasi" }[
            proof.status
          ]
        }
      </summary>
      {proof.rejectReason && (
        <p className="my-2 text-sm text-red-700">Alasan penolakan: {proof.rejectReason}</p>
      )}
      {proof.reviewedAt && (
        <p className="my-2 text-xs text-stone-500">Diperiksa: {formatDateTime(proof.reviewedAt)}</p>
      )}
      {open && <PaymentProof attachmentId={proof.attachmentId} />}
    </details>
  );
}
export function PaymentProofHistory({ proofs }: { proofs?: PaymentProofRecord[] }) {
  if (!proofs?.length) return null;
  return (
    <section className="mt-3 grid gap-2">
      <h3 className="text-sm font-semibold">Riwayat bukti pembayaran</h3>
      {proofs.map((proof) => (
        <ProofEntry key={proof.id} proof={proof} />
      ))}
    </section>
  );
}
