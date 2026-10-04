"use client";
import { Pagination } from "@/shared/components/navigation/Pagination";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Store } from "lucide-react";
import { PortfolioGallery } from "@/features/profile/components/portfolio/Portfolio";
import { getStore, getStoreProducts, getStoreReviews } from "./storeApi";
import { MarketplaceProductCard } from "./MarketplaceExplorer";
import { ReviewImage, RatingStars } from "@/features/reviews/components/ProductReviews";
import { getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { useImageUpload } from "@/features/profile/hooks/useImageUpload";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { Tabs } from "@/shared/components/navigation/Interactive";
import { ROUTES } from "@/shared/config/routes";
import { formatDate } from "@/shared/utils/formatDate";

type MarketplaceRole = "customer" | "vendor";

export function StorePage({
  vendorId,
  role = "customer",
}: {
  vendorId: string;
  role?: MarketplaceRole;
}) {
  const loader = useCallback(() => getStore(vendorId), [vendorId]);
  const resource = useAsyncResource(loader, { initialData: null });
  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error)
    return <ErrorState description={resource.error} retry={() => void resource.reload()} />;
  const store = resource.data;
  if (!store) return <EmptyState title="Toko tidak ditemukan" />;
  return (
    <div className="grid min-w-0 gap-5">
      <Link
        href={ROUTES[role].marketplace}
        className="flex w-fit items-center gap-2 text-sm text-stone-500 hover:text-blush"
      >
        <ArrowLeft size={16} /> Kembali ke marketplace
      </Link>
      <section className="flex items-start gap-4 rounded-xl border bg-white p-5 sm:p-6">
        <StoreLogo attachmentId={store.logoAttachmentId} url={store.logoUrl} name={store.name} />
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold sm:text-2xl">{store.name}</h1>
          {store.verified && (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
              <BadgeCheck size={14} /> Terverifikasi
            </p>
          )}
          <p className="mt-2 text-sm text-stone-500">
            {store.stats.productCount} produk ·{" "}
            {store.stats.reviewCount
              ? `${Number(store.stats.averageRating).toFixed(1)} / 5 (${store.stats.reviewCount} ulasan)`
              : "Belum ada ulasan"}{" "}
            · {store.stats.soldCount} terjual
          </p>
          {store.location && <p className="mt-2 text-sm text-stone-500">{store.location}</p>}
          {store.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
              {store.description}
            </p>
          )}
        </div>
      </section>
      <Tabs
        key={store.id}
        items={[
          { label: "Produk", content: <StoreProducts vendorId={store.id} role={role} /> },
          { label: "Portofolio", content: <PortfolioGallery ids={store.portfolioAttachmentIds} /> },
          { label: "Ulasan", content: <StoreReviews vendorId={store.id} role={role} /> },
          {
            label: "Tentang toko",
            content: (
              <section className="grid gap-5 rounded-xl border bg-white p-5 sm:p-6">
                <div>
                  <h2 className="font-semibold">Tentang {store.name}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">
                    {store.description || "Vendor belum menambahkan deskripsi toko."}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Kategori layanan</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {store.categories.join(", ") || "Belum dicantumkan"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Area layanan</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {store.serviceArea || "Belum dicantumkan"}
                  </p>
                </div>
              </section>
            ),
          },
        ]}
      />
    </div>
  );
}

function StoreLogo({
  attachmentId,
  url,
  name,
}: {
  attachmentId?: string | null;
  url?: string | null;
  name: string;
}) {
  const load = useCallback(
    () => (attachmentId ? getAttachmentBlob(attachmentId) : Promise.resolve(null)),
    [attachmentId],
  );
  const image = useImageUpload({
    enabled: Boolean(attachmentId),
    load,
    loadErrorMessage: "Logo gagal dimuat.",
  });
  const [failed, setFailed] = useState(false);
  const src = image.previewUrl || url;
  return (
    <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-stone-100 sm:size-20">
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="size-full object-contain"
        />
      ) : (
        <Store className="text-stone-400" size={28} />
      )}
    </div>
  );
}

function StoreProducts({ vendorId, role }: { vendorId: number; role: MarketplaceRole }) {
  const [page, setPage] = useState(1);
  const loader = useCallback(() => getStoreProducts(vendorId, page), [vendorId, page]);
  const resource = useAsyncResource(loader, { initialData: null });
  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error) return <ErrorState retry={() => void resource.reload()} />;
  const result = resource.data;
  return (
    <div className="grid gap-5">
      {result?.data.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.data.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} role={role} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada produk"
          description="Belum ada paket aktif untuk ditampilkan pada halaman ini."
        />
      )}
      {result && (
        <Pagination
          className="pt-4"
          label="Halaman hasil toko"
          page={page}
          totalPages={Math.ceil(result.total / result.pageSize)}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function StoreReviews({ vendorId, role }: { vendorId: number; role: MarketplaceRole }) {
  const [page, setPage] = useState(1);
  const loader = useCallback(() => getStoreReviews(vendorId, page), [vendorId, page]);
  const resource = useAsyncResource(loader, { initialData: null });
  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error) return <ErrorState retry={() => void resource.reload()} />;
  const result = resource.data;
  const breakdown: Record<number, number> = result?.ratingBreakdown ?? {};
  const count = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const average = count
    ? Object.entries(breakdown).reduce((sum, [rating, value]) => sum + Number(rating) * value, 0) /
      count
    : 0;
  return (
    <section className="rounded-xl border bg-white p-5 sm:p-6">
      <h2 className="font-semibold">Ulasan toko</h2>
      <p className="mt-1 text-sm text-stone-500">
        {count
          ? `${average.toFixed(1)} / 5 · ${count} penilaian seluruh produk`
          : "Belum ada penilaian"}
      </p>
      <div className="mt-4 divide-y">
        {result?.data.map((review) => (
          <article className="py-4" key={review.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{review.customer?.fullName || "Customer"}</p>
                {review.createdAt && (
                  <p className="mt-1 text-xs text-stone-500">{formatDate(review.createdAt)}</p>
                )}
              </div>
              <RatingStars rating={review.rating} />
            </div>
            {review.vendorProduct && (
              <Link
                className="mt-2 inline-block text-sm font-medium text-blush hover:underline"
                href={
                  role === "vendor"
                    ? ROUTES.vendor.marketplaceProduct(review.vendorProduct.id)
                    : ROUTES.customer.product(review.vendorProduct.id)
                }
              >
                {review.vendorProduct.name}
              </Link>
            )}
            {review.comment && (
              <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-stone-600">
                {review.comment}
              </p>
            )}
            {!!review.imageAttachmentIds?.length && (
              <div className="mt-3 grid max-w-lg grid-cols-3 gap-2 sm:grid-cols-5">
                {review.imageAttachmentIds.map((id) => (
                  <ReviewImage key={id} attachmentId={id} />
                ))}
              </div>
            )}
          </article>
        ))}
        {!result?.data.length && (
          <EmptyState
            title="Belum ada ulasan"
            description="Ulasan akan muncul setelah customer memberikan penilaian."
          />
        )}
      </div>
      {result && (
        <Pagination
          className="pt-4"
          label="Halaman hasil toko"
          page={page}
          totalPages={Math.ceil(result.total / result.pageSize)}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
