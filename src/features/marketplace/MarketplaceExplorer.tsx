"use client";

import { getVendorProducts } from "@/features/products/api";
import type { VendorProduct } from "@/features/products/types";
import { MASTER_PARAMETER_CODES } from "@/features/parameters/constants";
import { useMasterParameters } from "@/features/parameters/useMasterParameters";
import { getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { useImageUpload } from "@/features/profile/hooks/useImageUpload";
import { ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { AppButton } from "@/shared/components/ui/AppButton";
import { FormattedNumberInput } from "@/shared/components/ui/FormattedNumberInput";
import { AppSelect } from "@/shared/components/ui/FormFields";
import { ROUTES } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronDown,
  Clock3,
  ImageIcon,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export function MarketplaceExplorer() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [minimumCapacity, setMinimumCapacity] = useState("");
  const [sort, setSort] = useState("Terbaru");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const masterParameters = useMasterParameters([MASTER_PARAMETER_CODES.vendorCategory]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getVendorProducts({ status: "ACTIVE", pageNumber: 1, pageSize: 100 });
      setProducts(result.data.filter((product) => product.active && product.status === "ACTIVE"));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Produk marketplace gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void load(), [load]);

  const categories = masterParameters.getOptions(MASTER_PARAMETER_CODES.vendorCategory);
  const locations = useMemo(
    () =>
      [
        ...new Set(
          products
            .map((product) => product.serviceArea?.trim())
            .filter((area): area is string => Boolean(area)),
        ),
      ].sort((left, right) => left.localeCompare(right)),
    [products],
  );
  const featuredCategories = categories.slice(0, 7);
  const visibleCategoryOptions = categories.filter((option) =>
    normalizeSearchValue(option.label).includes(normalizeSearchValue(categorySearch)),
  );
  const results = useMemo(() => {
    const normalizedKeyword = normalizeSearchValue(keyword);
    const selectedCategory = categories.find((option) => option.value === category);
    const filtered = products.filter((product) => {
      const searchable =
        `${product.name} ${product.description ?? ""} ${product.category ?? ""} ${product.vendor.businessName} ${product.serviceArea ?? ""}`.toLowerCase();
      return (
        searchable.includes(normalizedKeyword) &&
        (!selectedCategory || categoryMatches(product.category, selectedCategory)) &&
        (!location || product.serviceArea === location) &&
        (!minimumPrice || product.price >= Number(minimumPrice)) &&
        (!maximumPrice || product.price <= Number(maximumPrice)) &&
        (!minimumCapacity || (product.guestCapacity ?? 0) >= Number(minimumCapacity))
      );
    });
    return [...filtered].sort((left, right) =>
      sort === "Harga terendah"
        ? left.price - right.price
        : sort === "Harga tertinggi"
          ? right.price - left.price
          : right.id.localeCompare(left.id),
    );
  }, [
    categories,
    category,
    keyword,
    location,
    maximumPrice,
    minimumCapacity,
    minimumPrice,
    products,
    sort,
  ]);

  const hasFilters = Boolean(
    keyword || category || location || minimumPrice || maximumPrice || minimumCapacity,
  );
  const advancedFilterCount = [location, minimumPrice, maximumPrice, minimumCapacity].filter(
    Boolean,
  ).length;
  function resetFilters() {
    setKeyword("");
    setCategory("");
    setLocation("");
    setMinimumPrice("");
    setMaximumPrice("");
    setMinimumCapacity("");
  }

  if (loading || masterParameters.loading) return <LoadingSkeleton />;
  if (error) return <ErrorState retry={() => void load()} />;
  if (masterParameters.error) return <ErrorState retry={() => window.location.reload()} />;
  return (
    <div className="grid gap-5">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blush" size={19} />
        <input
          className="h-12 w-full rounded-2xl border bg-white pl-11 pr-11 text-sm shadow-sm outline-none transition focus:border-blush focus:ring-4 focus:ring-rose-100"
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Cari paket atau nama vendor..."
          value={keyword}
        />
        {keyword && (
          <button
            aria-label="Hapus pencarian"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-ink"
            onClick={() => setKeyword("")}
          >
            <X size={17} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${!category ? "border-blush bg-blush text-white" : "bg-white"}`}
          onClick={() => setCategory("")}
        >
          Semua kategori
        </button>
        {featuredCategories.map((item) => (
          <button
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${category === item.value ? "border-blush bg-blush text-white" : "bg-white hover:border-rose-300"}`}
            key={item.value}
            onClick={() => setCategory(item.value)}
          >
            {item.label}
          </button>
        ))}
        {categories.length > featuredCategories.length && (
          <button
            className="flex items-center gap-1 rounded-full border bg-white px-4 py-2 text-xs font-semibold hover:border-rose-300"
            onClick={() => setCategoryDialogOpen(true)}
          >
            Kategori lainnya <ChevronDown size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-y py-4">
        <p className="text-sm text-stone-500">
          <strong className="text-ink">{results.length} paket</strong>
          {products.length > 0 && hasFilters ? ` dari ${products.length} tersedia` : " tersedia"}
        </p>
        <div className="flex items-end gap-2">
          <AppButton onClick={() => setFilterDialogOpen(true)} variant="secondary">
            <SlidersHorizontal size={16} /> Filter
            {advancedFilterCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-blush text-[10px] text-white">
                {advancedFilterCount}
              </span>
            )}
          </AppButton>
          {results.length > 0 && (
            <div className="min-w-44">
              <AppSelect
                aria-label="Urutkan produk"
                label="Urutkan"
                onChange={(event) => setSort(event.target.value)}
                value={sort}
              >
                <option>Terbaru</option>
                <option>Harga terendah</option>
                <option>Harga tertinggi</option>
              </AppSelect>
            </div>
          )}
        </div>
      </div>
      {hasFilters && (
        <ActiveFilterChips
          category={categories.find((option) => option.value === category)?.label}
          keyword={keyword}
          location={location}
          maximumPrice={maximumPrice}
          minimumCapacity={minimumCapacity}
          minimumPrice={minimumPrice}
          onClearCategory={() => setCategory("")}
          onClearKeyword={() => setKeyword("")}
          onClearLocation={() => setLocation("")}
          onClearMaximumPrice={() => setMaximumPrice("")}
          onClearMinimumCapacity={() => setMinimumCapacity("")}
          onClearMinimumPrice={() => setMinimumPrice("")}
        />
      )}
      {results.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {results.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <CompactMarketplaceEmptyState hasProducts={products.length > 0} onReset={resetFilters} />
      )}
      <CategoryDialog
        categories={visibleCategoryOptions}
        category={category}
        onCategoryChange={(value) => {
          setCategory(value);
          setCategoryDialogOpen(false);
          setCategorySearch("");
        }}
        onOpenChange={setCategoryDialogOpen}
        onSearchChange={setCategorySearch}
        open={categoryDialogOpen}
        search={categorySearch}
      />
      <FilterDialog
        location={location}
        locations={locations}
        maximumPrice={maximumPrice}
        minimumCapacity={minimumCapacity}
        minimumPrice={minimumPrice}
        onLocationChange={setLocation}
        onMaximumPriceChange={setMaximumPrice}
        onMinimumCapacityChange={setMinimumCapacity}
        onMinimumPriceChange={setMinimumPrice}
        onOpenChange={setFilterDialogOpen}
        onReset={() => {
          setLocation("");
          setMinimumPrice("");
          setMaximumPrice("");
          setMinimumCapacity("");
        }}
        open={filterDialogOpen}
      />
    </div>
  );
}

type CategoryOption = { label: string; value: string };

interface MarketplaceFiltersProps {
  location: string;
  locations: string[];
  maximumPrice: string;
  minimumCapacity: string;
  minimumPrice: string;
  onLocationChange: (value: string) => void;
  onMaximumPriceChange: (value: string) => void;
  onMinimumCapacityChange: (value: string) => void;
  onMinimumPriceChange: (value: string) => void;
  onReset: () => void;
}

function MarketplaceFilters(props: MarketplaceFiltersProps) {
  return (
    <div className="grid gap-5">
      <AppSelect
        label="Area layanan"
        onChange={(event) => props.onLocationChange(event.target.value)}
        value={props.location}
      >
        <option value="">Semua area</option>
        {props.locations.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </AppSelect>
      <div className="grid grid-cols-2 gap-3">
        <FormattedNumberInput
          label="Harga minimum"
          name="minimumPriceFilter"
          onValueChange={props.onMinimumPriceChange}
          placeholder="0"
          defaultValue={props.minimumPrice}
        />
        <FormattedNumberInput
          label="Harga maksimum"
          name="maximumPriceFilter"
          onValueChange={props.onMaximumPriceChange}
          placeholder="50.000.000"
          defaultValue={props.maximumPrice}
        />
      </div>
      <FormattedNumberInput
        label="Kapasitas minimum"
        name="minimumCapacityFilter"
        onValueChange={props.onMinimumCapacityChange}
        placeholder="100"
        defaultValue={props.minimumCapacity}
      />
    </div>
  );
}

function DialogFrame({ children }: { children: React.ReactNode }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[85vh] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border bg-white p-6 shadow-2xl">
        {children}
        <Dialog.Close className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-ink">
          <X size={18} />
          <span className="sr-only">Tutup</span>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function CategoryDialog({
  categories,
  category,
  onCategoryChange,
  onOpenChange,
  onSearchChange,
  open,
  search,
}: {
  categories: CategoryOption[];
  category: string;
  onCategoryChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSearchChange: (value: string) => void;
  open: boolean;
  search: string;
}) {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <DialogFrame>
        <Dialog.Title className="text-lg font-semibold">Pilih kategori</Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-stone-500">
          Cari dan pilih kategori layanan yang Anda butuhkan.
        </Dialog.Description>
        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
          <input
            autoFocus
            className="h-11 w-full rounded-xl border bg-stone-50 pl-10 pr-3 text-sm outline-none focus:border-blush"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari kategori..."
            value={search}
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            className={`rounded-xl border px-4 py-3 text-left text-sm ${!category ? "border-blush bg-rose-50 font-semibold text-blush" : "hover:bg-stone-50"}`}
            onClick={() => onCategoryChange("")}
          >
            Semua kategori
          </button>
          {categories.map((option) => (
            <button
              className={`rounded-xl border px-4 py-3 text-left text-sm ${category === option.value ? "border-blush bg-rose-50 font-semibold text-blush" : "hover:bg-stone-50"}`}
              key={option.value}
              onClick={() => onCategoryChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {categories.length === 0 && (
          <p className="mt-5 text-center text-sm text-stone-500">Kategori tidak ditemukan.</p>
        )}
      </DialogFrame>
    </Dialog.Root>
  );
}

function FilterDialog(
  props: MarketplaceFiltersProps & {
    onOpenChange: (open: boolean) => void;
    open: boolean;
  },
) {
  const active = Boolean(
    props.location || props.minimumPrice || props.maximumPrice || props.minimumCapacity,
  );
  return (
    <Dialog.Root onOpenChange={props.onOpenChange} open={props.open}>
      <DialogFrame>
        <Dialog.Title className="text-lg font-semibold">Filter produk</Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-stone-500">
          Sesuaikan lokasi, rentang harga, dan kapasitas layanan.
        </Dialog.Description>
        <div className="mt-6">
          <MarketplaceFilters {...props} />
        </div>
        <div className="mt-6 flex justify-between gap-3 border-t pt-5">
          <AppButton disabled={!active} onClick={props.onReset} variant="ghost">
            <RotateCcw size={15} /> Reset
          </AppButton>
          <AppButton onClick={() => props.onOpenChange(false)}>Tampilkan hasil</AppButton>
        </div>
      </DialogFrame>
    </Dialog.Root>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
      onClick={onRemove}
    >
      {label} <X size={13} />
    </button>
  );
}

function ActiveFilterChips(props: {
  category?: string;
  keyword: string;
  location: string;
  maximumPrice: string;
  minimumCapacity: string;
  minimumPrice: string;
  onClearCategory: () => void;
  onClearKeyword: () => void;
  onClearLocation: () => void;
  onClearMaximumPrice: () => void;
  onClearMinimumCapacity: () => void;
  onClearMinimumPrice: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-stone-500">Filter aktif:</span>
      {props.keyword && <FilterChip label={`“${props.keyword}”`} onRemove={props.onClearKeyword} />}
      {props.category && <FilterChip label={props.category} onRemove={props.onClearCategory} />}
      {props.location && <FilterChip label={props.location} onRemove={props.onClearLocation} />}
      {props.minimumPrice && (
        <FilterChip
          label={`Min. ${formatCurrency(Number(props.minimumPrice))}`}
          onRemove={props.onClearMinimumPrice}
        />
      )}
      {props.maximumPrice && (
        <FilterChip
          label={`Maks. ${formatCurrency(Number(props.maximumPrice))}`}
          onRemove={props.onClearMaximumPrice}
        />
      )}
      {props.minimumCapacity && (
        <FilterChip
          label={`Min. ${Number(props.minimumCapacity).toLocaleString("id-ID")} tamu`}
          onRemove={props.onClearMinimumCapacity}
        />
      )}
    </div>
  );
}

function CompactMarketplaceEmptyState({
  hasProducts,
  onReset,
}: {
  hasProducts: boolean;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-white px-5 py-8 text-center shadow-sm">
      <h3 className="font-semibold text-ink">
        {hasProducts ? "Tidak ada produk yang sesuai filter" : "Produk belum tersedia"}
      </h3>
      <p className="mt-1 text-sm text-stone-500">
        {hasProducts
          ? "Coba ubah kata kunci atau filter pencarian Anda."
          : "Belum ada produk aktif yang dapat ditampilkan."}
      </p>
      {hasProducts && (
        <AppButton className="mt-4" onClick={onReset} variant="secondary">
          Reset filter
        </AppButton>
      )}
    </div>
  );
}

function normalizeSearchValue(value: string | null | undefined) {
  return (value ?? "").trim().toLocaleLowerCase("id-ID");
}

function categoryMatches(category: string | null | undefined, option: CategoryOption) {
  const normalizedCategory = normalizeSearchValue(category).replace(/[_-]+/g, " ");
  return [option.value, option.label].some(
    (value) => normalizeSearchValue(value).replace(/[_-]+/g, " ") === normalizedCategory,
  );
}

function MarketplaceProductCard({ product }: { product: VendorProduct }) {
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
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
      <div className="grid h-48 place-items-center overflow-hidden bg-stone-100">
        {image.previewUrl ? (
          <img
            alt={product.name}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
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
          <Link href={ROUTES.customer.product(product.id)}>Lihat paket</Link>
        </AppButton>
      </div>
    </article>
  );
}
