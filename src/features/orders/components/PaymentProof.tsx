"use client";

import { getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export function PaymentProof({ attachmentId }: { attachmentId: string }) {
  const [url, setUrl] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setUrl("");
    setError("");
    void getAttachmentBlob(attachmentId)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setMimeType(blob.type);
        setUrl(objectUrl);
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Bukti pembayaran gagal dimuat.");
        }
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId]);

  if (error) return <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!url) return <div className="h-48 animate-pulse rounded-2xl bg-stone-100" />;

  return (
    <div className="overflow-hidden rounded-2xl border bg-stone-50">
      {mimeType.startsWith("image/") ? (
        <img alt="Bukti pembayaran customer" className="max-h-[520px] w-full object-contain" src={url} />
      ) : (
        <div className="grid min-h-48 place-items-center p-6 text-center text-sm text-stone-600">
          Bukti pembayaran tersedia dalam format dokumen.
        </div>
      )}
      <div className="border-t bg-white p-3">
        <a className="inline-flex items-center gap-2 text-sm font-semibold text-blush" href={url} rel="noreferrer" target="_blank">
          <ExternalLink size={16} /> Buka bukti ukuran penuh
        </a>
      </div>
    </div>
  );
}
