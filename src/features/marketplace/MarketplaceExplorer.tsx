"use client";
import { Pagination } from "@/shared/components/navigation/Pagination";
import Link from "next/link";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { useMasterParameters } from "@/features/parameters/useMasterParameters";
import { MASTER_PARAMETER_CODES } from "@/features/parameters/constants";
import { getMarketplaceOptions } from "./api";
import { marketplaceLocations } from "@/features/locations/serviceAreas";
import { SearchableSelect } from "@/shared/components/ui/SearchableSelect";
import { useCallback, useState } from "react";
import { Clock3, ImageIcon, Star, Users } from "lucide-react";
import { getVendorProducts } from "@/features/products/api";
import type { VendorProduct, VendorProductQuery } from "@/features/products/types";
import { getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { useImageUpload } from "@/features/profile/hooks/useImageUpload";
import { compactCount } from "@/features/reviews/metrics";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput, AppSelect } from "@/shared/components/ui/FormFields";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { usePaginatedResource, type PaginationQuery } from "@/shared/hooks/usePaginatedResource";
import { ROUTES } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/utils/formatCurrency";

export function MarketplaceExplorer({ role = "customer" }: { role?: "customer" | "vendor" }) {
  const [filters, setFilters] = useState<VendorProductQuery>({ sortBy: "newest" });
  const applied = useDebounce(filters);
  const options = useAsyncResource(getMarketplaceOptions, { initialData: null });
  const categories = useMasterParameters([MASTER_PARAMETER_CODES.vendorCategory]);
  const loader = useCallback(
    (query: PaginationQuery) => getVendorProducts({ ...query, ...applied, marketplace: true }),
    [applied],
  );
  const list = usePaginatedResource(loader, { pageSize: 12 });
  function changeFilter(key: keyof VendorProductQuery, value: string | number | undefined) {
    setFilters((current) => ({ ...current, [key]: value }));
    list.setPage(1);
  }
  return (
    <div className="grid gap-5">
      <AppInput
        label="Cari paket, kategori, atau toko"
        placeholder="Contoh: fotografi atau catering"
        value={list.search}
        onChange={(event) => list.changeSearch(event.target.value)}
      />
      <details className="rounded-xl border bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold">Filter dan urutan</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AppSelect
            label="Kategori"
            value={filters.category ?? ""}
            onChange={(e) => changeFilter("category", e.target.value || undefined)}
          >
            <option value="">Semua kategori</option>
            {categories.getOptions(MASTER_PARAMETER_CODES.vendorCategory).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AppSelect>
          <SearchableSelect
            label="Lokasi acara / area layanan"
            placeholder="Semua lokasi"
            loading={options.loading}
            disabled={Boolean(options.error)}
            options={marketplaceLocations(options.data?.locations ?? []).map((location) => ({
              value: location,
              label: location,
            }))}
            value={filters.location ?? ""}
            onChange={(value) => changeFilter("location", value || undefined)}
          />
          <AppSelect
            label="Urutkan"
            value={filters.sortBy ?? "newest"}
            onChange={(e) => changeFilter("sortBy", e.target.value)}
          >
            {(
              options.data?.sortOptions ?? [
                "newest",
                "price_asc",
                "price_desc",
                "rating",
                "popular",
              ]
            ).map((value) => (
              <option key={value} value={value}>
                {
                  {
                    newest: "Terbaru",
                    price_asc: "Harga terendah",
                    price_desc: "Harga tertinggi",
                    rating: "Rating tertinggi",
                    popular: "Terlaris",
                  }[value]
                }
              </option>
            ))}
          </AppSelect>
          <AppInput
            label="Harga minimum"
            placeholder={options.data ? String(options.data.priceRange.min) : undefined}
            type="number"
            min={0}
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              changeFilter("minPrice", e.target.value ? Number(e.target.value) : undefined)
            }
          />
          <AppInput
            label="Harga maksimum"
            placeholder={options.data ? String(options.data.priceRange.max) : undefined}
            type="number"
            min={0}
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              changeFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)
            }
          />
          <AppInput
            label="Minimal kapasitas tamu"
            helper={
              options.data?.maxCapacity
                ? `Kapasitas terbesar tersedia: ${options.data.maxCapacity} tamu`
                : undefined
            }
            type="number"
            min={1}
            value={filters.minCapacity ?? ""}
            onChange={(e) =>
              changeFilter("minCapacity", e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </div>
        {(options.error || categories.error) && (
          <p className="mt-3 text-sm text-amber-700">
            Opsi filter belum berhasil dimuat.{" "}
            <button
              type="button"
              onClick={() => {
                void options.reload();
                categories.reload();
              }}
            >
              Coba lagi
            </button>
          </p>
        )}
        <AppButton
          variant="secondary"
          className="mt-3"
          onClick={() => {
            setFilters({ sortBy: "newest" });
            list.changeSearch("");
            list.setPage(1);
          }}
        >
          Reset filter
        </AppButton>
      </details>
      {list.loading ? (
        <LoadingSkeleton />
      ) : list.error ? (
        <ErrorState description={list.error} retry={() => void list.reload()} />
      ) : (
        <>
          <p className="text-sm text-stone-500">{list.total} paket ditemukan</p>
          {list.data.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.data
                .filter((product) => product.active && product.status === "ACTIVE")
                .map((product) => (
                  <MarketplaceProductCard key={product.id} product={product} role={role} />
                ))}
            </div>
          ) : (
            <EmptyState title="Paket tidak ditemukan" description="Coba kata pencarian lain." />
          )}
          <Pagination
            label="Halaman marketplace"
            page={list.page}
            totalPages={Math.ceil(list.total / list.pageSize)}
            disabled={filters !== applied}
            onPageChange={list.setPage}
          />
        </>
      )}
    </div>
  );
}

export function MarketplaceProductCard({
  product,
  role,
}: {
  product: VendorProduct;
  role: "customer" | "vendor";
}) {
  const attachmentId = product.imageAttachmentIds[0];
  const load = useCallback(
    () => (attachmentId ? getAttachmentBlob(attachmentId) : Promise.resolve(null)),
    [attachmentId],
  );
  const image = useImageUpload({
    enabled: Boolean(attachmentId),
    load,
    loadErrorMessage: "Gambar gagal dimuat.",
  });
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border bg-white transition-colors hover:border-stone-300">
      <div className="grid h-48 place-items-center overflow-hidden bg-stone-100">
        {image.previewUrl ? (
          <img
            alt={product.name}
            className="size-full object-cover transition duration-500 "
            src={image.previewUrl}
          />
        ) : (
          <ImageIcon className="text-stone-300" size={36} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blush">
          {product.category ?? "Layanan Wedding"}
        </p>
        <h3 className="mt-1 font-semibold text-ink">{product.name}</h3>
        <p className="mt-1 text-xs text-stone-500">oleh {product.vendor.businessName}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <Star
            className={product.reviewCount ? "fill-amber-400 text-amber-400" : "text-stone-300"}
            size={15}
          />
          <strong className="text-amber-600">
            {product.reviewCount ? product.averageRating.toFixed(1) : "Baru"}
          </strong>
          <span className="text-stone-400">·</span>
          <span className="text-stone-500">
            {product.reviewCount
              ? `${compactCount(product.reviewCount)} penilaian`
              : "Belum ada penilaian"}
          </span>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          {compactCount(product.soldCount ?? 0)} terjual
        </p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">
          {product.description ?? "Detail layanan tersedia pada halaman produk."}
        </p>
        <p className="mt-3 text-lg font-semibold">{formatCurrency(product.price)}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-500">
          {product.guestCapacity && (
            <span className="flex items-center gap-1">
              <Users size={13} />
              {product.guestCapacity} tamu
            </span>
          )}
          {product.duration && (
            <span className="flex items-center gap-1">
              <Clock3 size={13} />
              {product.duration}
            </span>
          )}
        </div>
        <AppButton asChild className="mt-5 w-full">
          <Link
            href={
              role === "vendor"
                ? ROUTES.vendor.marketplaceProduct(product.id)
                : ROUTES.customer.product(product.id)
            }
          >
            Lihat paket
          </Link>
        </AppButton>
      </div>
    </article>
  );
}
