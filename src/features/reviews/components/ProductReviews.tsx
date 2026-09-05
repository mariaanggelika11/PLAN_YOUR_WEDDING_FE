"use client";

import { getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { getVendorProductReviews } from "@/features/reviews/api";
import type { VendorProduct } from "@/features/products/types";
import { compactCount } from "@/features/reviews/metrics";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { formatDate } from "@/shared/utils/formatDate";
import { Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function ProductReviews({ product }: { product: VendorProduct }) {
  const productId = product.id;
  const [pageNumber, setPageNumber] = useState(1);
  const loader = useCallback(
    () => getVendorProductReviews({ vendorProductId: productId, pageNumber, pageSize: 10 }),
    [productId, pageNumber],
  );
  const reviews = useAsyncResource(loader, { initialData: null });
  if (reviews.loading) return <LoadingSkeleton />;
  if (reviews.error) return <ErrorState retry={() => void reviews.reload()} />;
  if (!reviews.data?.data.length)
    return (
      <EmptyState
        title="Belum ada ulasan"
        description="Ulasan akan muncul setelah customer menyelesaikan pesanan untuk produk ini."
      />
    );
  const metrics = {
    average: product.averageRating ?? 0,
    count: product.reviewCount ?? 0,
    distribution: reviews.data.ratingBreakdown,
  };
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-lg font-semibold text-ink">Penilaian produk</h2>
          <p className="text-xs text-stone-500">{compactCount(product.soldCount ?? 0)} terjual</p>
          <p className="mt-1 text-sm text-stone-500">
            <strong className="text-amber-600">{metrics.average.toFixed(1)}</strong> bintang dari{" "}
            {compactCount(metrics.count)} penilaian produk
          </p>
        </div>
        <div className="rounded-2xl bg-amber-50 px-5 py-3 text-center">
          <strong className="text-2xl text-amber-600">{metrics.average.toFixed(1)}</strong>
          <RatingStars rating={Math.round(metrics.average)} />
          <p className="text-xs text-stone-500">{compactCount(metrics.count)} penilaian</p>
        </div>
      </div>
      <div className="grid gap-2 border-b py-5 sm:max-w-xl">
        {([5, 4, 3, 2, 1] as const).map((rating) => (
          <div className="grid grid-cols-[38px_1fr_40px] items-center gap-3 text-xs" key={rating}>
            <span className="flex items-center gap-1 font-medium">
              {rating}
              <Star className="fill-amber-400 text-amber-400" size={12} />
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{
                  width: `${metrics.count ? (metrics.distribution[rating] / metrics.count) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-right text-stone-500">{metrics.distribution[rating]}</span>
          </div>
        ))}
      </div>
      <div className="divide-y">
        {reviews.data.data
          .filter((review) => review.active !== false)
          .map((review) => (
            <article className="py-5" key={review.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {review.customer?.fullName ?? "Customer"}
                  </p>
                  <p className="text-xs text-stone-500">
                    {review.order?.orderNumber
                      ? `Pesanan ${review.order.orderNumber}`
                      : "Pembelian terverifikasi"}
                  </p>
                </div>
                <div className="text-right">
                  <RatingStars rating={review.rating} />
                  {review.createdAt && (
                    <p className="mt-1 text-xs text-stone-400">{formatDate(review.createdAt)}</p>
                  )}
                </div>
              </div>
              {review.comment && (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-700">
                  {review.comment}
                </p>
              )}
              {!!review.imageAttachmentIds.length && (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {review.imageAttachmentIds.map((id) => (
                    <ReviewImage attachmentId={id} key={id} />
                  ))}
                </div>
              )}
            </article>
          ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <button
          className="rounded-lg border px-3 py-2 disabled:opacity-40"
          disabled={pageNumber === 1}
          onClick={() => setPageNumber((page) => page - 1)}
        >
          Sebelumnya
        </button>
        <span>Halaman {pageNumber}</span>
        <button
          className="rounded-lg border px-3 py-2 disabled:opacity-40"
          disabled={pageNumber * reviews.data.pageSize >= reviews.data.total}
          onClick={() => setPageNumber((page) => page + 1)}
        >
          Selanjutnya
        </button>
      </div>
    </section>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div aria-label={`${rating} dari 5 bintang`} className="flex justify-end gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          className={value <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}
          key={value}
          size={17}
        />
      ))}
    </div>
  );
}

function ReviewImage({ attachmentId }: { attachmentId: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    void getAttachmentBlob(attachmentId)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(""));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId]);
  if (!url) return <div className="aspect-square animate-pulse rounded-xl bg-stone-100" />;
  return (
    <a href={url} rel="noreferrer" target="_blank">
      <img
        alt="Foto ulasan customer"
        className="aspect-square w-full rounded-xl border object-cover"
        src={url}
      />
    </a>
  );
}
