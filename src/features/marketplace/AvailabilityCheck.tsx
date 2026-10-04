"use client";
import { useEffect, useState } from "react";
import { getAvailability, type Availability } from "./api";
export function localDateToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function AvailabilityCheck({
  productId,
  date,
  revision,
  onResult,
}: {
  productId: string;
  date: string;
  revision: number;
  onResult: (result: Availability | null) => void;
}) {
  const [result, setResult] = useState<Availability | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setResult(null);
    setError("");
    onResult(null);
    if (!date) return;
    if (date < localDateToday()) {
      setError("Tanggal acara tidak boleh sudah lewat.");
      return;
    }
    void getAvailability(productId, date)
      .then((value) => {
        if (active) {
          setResult(value);
          onResult(value);
        }
      })
      .catch((reason) => {
        if (active)
          setError(reason instanceof Error ? reason.message : "Jadwal belum dapat diperiksa.");
      });
    return () => {
      active = false;
    };
  }, [productId, date, revision, retry, onResult]);
  return (
    <div role="status" className="mt-2 rounded-lg bg-stone-50 p-3 text-xs leading-5">
      {!date ? (
        "Pilih tanggal untuk memeriksa ketersediaan."
      ) : error ? (
        <>
          <p className="text-red-700">{error}</p>
          <button
            type="button"
            className="mt-1 font-semibold text-blush"
            onClick={() => setRetry((value) => value + 1)}
          >
            Coba lagi
          </button>
        </>
      ) : !result ? (
        "Memeriksa jadwal…"
      ) : (
        <p className={result.available ? "text-emerald-700" : "text-red-700"}>{result.message}</p>
      )}
    </div>
  );
}
