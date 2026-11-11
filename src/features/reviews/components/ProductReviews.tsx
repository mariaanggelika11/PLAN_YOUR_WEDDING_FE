"use client";
import { AttachmentImage } from "@/shared/components/ui/AttachmentImage";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { Pagination } from "@/shared/components/navigation/Pagination";

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
  const { translateText, locale } = useTranslation();
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
        title={translateText("Belum ada ulasan")}
        description={translateText(
          "Ulasan akan muncul setelah customer menyelesaikan pesanan untuk produk ini.",
        )}
      />
    );
  const metrics = {
    average: product.averageRating ?? 0,
    count: product.reviewCount ?? 0,
    distribution: reviews.data.ratingBreakdown,
  };
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-lg font-semibold text-ink">{translateText("Penilaian produk")}</h2>
          <p className="text-xs text-stone-600">
            {compactCount(product.soldCount ?? 0)} {translateText("terjual")}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            <strong className="text-amber-800">{metrics.average.toFixed(1)}</strong>{" "}
            {translateText("bintang dari")} {compactCount(metrics.count)}{" "}
            {translateText("penilaian produk")}{" "}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 px-5 py-3 text-center">
          <strong className="text-2xl text-amber-800">{metrics.average.toFixed(1)}</strong>
          <RatingStars rating={Math.round(metrics.average)} />
          <p className="text-xs text-stone-600">
            {compactCount(metrics.count)} {translateText("penilaian")}
          </p>
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
            <span className="text-right text-stone-600">{metrics.distribution[rating]}</span>
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
                  <p className="text-xs text-stone-600">
                    {review.order?.orderNumber
                      ? translateText("Pesanan {0}", { 0: review.order.orderNumber })
                      : translateText("Pembelian terverifikasi")}
                  </p>
                </div>
                <div className="text-right">
                  <RatingStars rating={review.rating} />
                  {review.createdAt && (
                    <p className="mt-1 text-xs text-stone-600">
                      {formatDate(review.createdAt, locale)}
                    </p>
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
      <Pagination
        className="mt-4"
        label={translateText("Halaman ulasan produk")}
        page={pageNumber}
        totalPages={Math.ceil(reviews.data.total / reviews.data.pageSize)}
        onPageChange={setPageNumber}
        disabled={reviews.loading}
      />
    </section>
  );
}

export function RatingStars({ rating }: { rating: number }) {
  const { translateText } = useTranslation();
  return (
    <div
      aria-label={translateText("{0} dari 5 bintang", { 0: rating })}
      className="flex justify-end gap-0.5"
    >
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

export function ReviewImage({ attachmentId }: { attachmentId: string }) {
  const { translateText } = useTranslation();
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
      <AttachmentImage
        alt={translateText("Foto ulasan customer")}
        className="aspect-square w-full rounded-xl border object-cover"
        src={url}
      />
    </a>
  );
}
