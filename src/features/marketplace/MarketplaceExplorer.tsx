"use client";
import { marketplaceRepository } from "@/features/marketplace/repository";
import { VendorCard } from "@/shared/components/data-display/Cards";
import { EmptyState } from "@/shared/components/feedback/AsyncStates";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppSelect } from "@/shared/components/ui/FormFields";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarDays,
  Check,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
// MOCK DATA: Daftar kota sementara untuk filter lokasi
// TODO API: Ambil daftar provinsi dan kota dari backend
const cities = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Yogyakarta",
  "Semarang",
  "Palembang",
  "Medan",
  "Denpasar",
  "Makassar",
  "Bandar Lampung",
  "Tangerang",
  "Bekasi",
  "Depok",
  "Bogor",
];
const pricePresets = [
  "Di bawah Rp5.000.000",
  "Rp5.000.000 - Rp10.000.000",
  "Rp10.000.000 - Rp25.000.000",
  "Rp25.000.000 - Rp50.000.000",
  "Di atas Rp50.000.000",
];

export function MarketplaceExplorer() {
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [rating, setRating] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [sort, setSort] = useState("Rekomendasi");
  // TODO API: Ambil hasil pencarian vendor berdasarkan keyword dari backend
  // TODO API: Ambil riwayat pencarian customer dari backend
  // TODO API: Filter vendor berdasarkan kota atau area layanan
  // TODO API: Filter vendor berdasarkan category_id, range harga, average_rating, dan tanggal acara
  // TODO API: Kirim parameter sort ke backend
  const results = useMemo(
    () =>
      marketplaceRepository
        .vendors()
        .filter(
          (vendor) =>
            vendor.status === "VERIFIED_ACTIVE" &&
            (!keyword ||
              `${vendor.name} ${vendor.description} ${vendor.categories.join(" ")}`
                .toLowerCase()
                .includes(keyword.toLowerCase())) &&
            (!city || vendor.city === city) &&
            (!categories.length || categories.some((item) => vendor.categories.includes(item))) &&
            (!rating || vendor.rating >= Number(rating)),
        ),
    [keyword, city, categories, rating],
  );
  const reset = () => {
    setKeyword("");
    setCity("");
    setCategories([]);
    setRating("");
    setEventDate("");
  };
  const filters = (
    <FilterContent
      city={city}
      setCity={setCity}
      categories={categories}
      setCategories={setCategories}
      rating={rating}
      setRating={setRating}
      eventDate={eventDate}
      setEventDate={setEventDate}
      reset={reset}
    />
  );
  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border bg-gradient-to-br from-white to-rose-50 p-4 shadow-soft sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blush" size={20} />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="h-14 w-full rounded-2xl border bg-white pl-12 pr-12 text-sm shadow-sm outline-none focus:border-blush"
            placeholder="Cari vendor, paket wedding, atau kategori..."
          />
          {keyword && (
            <button
              aria-label="Hapus pencarian"
              onClick={() => setKeyword("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-ink"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-stone-400">Pencarian populer:</span>
          {["Catering", "Venue Jakarta", "Photography"].map((item) => (
            <button
              onClick={() => setKeyword(item)}
              className="text-xs font-semibold text-blush hover:underline"
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {marketplaceRepository
          .categories()
          .slice(0, 10)
          .map((category) => (
            <button
              onClick={() => setCategories(toggle(categories, category.name))}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${categories.includes(category.name) ? "border-blush bg-blush text-white" : "bg-white hover:border-rose-300"}`}
              key={category.id}
            >
              {category.name}
            </button>
          ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          <strong className="text-ink">{results.length} vendor</strong> sesuai pilihan Anda
        </p>
        <div className="flex gap-2">
          <MobileFilter>{filters}</MobileFilter>
          <AppSelect
            aria-label="Urutkan vendor"
            label=""
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="min-w-44"
          >
            <option>Rekomendasi</option>
            <option>Harga terendah</option>
            <option>Harga tertinggi</option>
            <option>Rating tertinggi</option>
            <option>Review terbanyak</option>
            <option>Vendor terbaru</option>
            <option>Paling populer</option>
          </AppSelect>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden h-fit rounded-3xl border bg-white p-5 shadow-sm lg:block">
          {filters}
        </aside>
        <div>
          {results.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {results.map((vendor) => (
                <VendorCard vendor={vendor} key={vendor.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              type="search"
              title="Vendor belum ditemukan"
              description="Coba ubah kategori, lokasi, atau range harga."
              actionLabel="Reset filter"
              onAction={reset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
function FilterContent({
  city,
  setCity,
  categories,
  setCategories,
  rating,
  setRating,
  eventDate,
  setEventDate,
  reset,
}: {
  city: string;
  setCity: (v: string) => void;
  categories: string[];
  setCategories: (v: string[]) => void;
  rating: string;
  setRating: (v: string) => void;
  eventDate: string;
  setEventDate: (v: string) => void;
  reset: () => void;
}) {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filter</h3>
        <button onClick={reset} className="text-xs font-semibold text-blush">
          Reset semua
        </button>
      </div>
      <FilterGroup title="Lokasi">
        <LocationPicker value={city} onChange={setCity} />
      </FilterGroup>
      <FilterGroup title="Kategori">
        <div className="grid max-h-48 gap-2 overflow-auto pr-1">
          {marketplaceRepository.categories().map((category) => (
            <label className="flex items-center gap-2 text-sm" key={category.id}>
              <input
                checked={categories.includes(category.name)}
                onChange={() => setCategories(toggle(categories, category.name))}
                type="checkbox"
                className="accent-rose-600"
              />
              {category.name}
            </label>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Range harga">
        <div className="grid gap-2">
          {pricePresets.map((price) => (
            <label className="flex gap-2 text-xs" key={price}>
              <input name="price" type="radio" className="accent-rose-600" />
              {price}
            </label>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input className="rounded-lg border px-2 py-2 text-xs" placeholder="Harga min" />
          <input className="rounded-lg border px-2 py-2 text-xs" placeholder="Harga max" />
        </div>
      </FilterGroup>
      <FilterGroup title="Rating">
        <div className="grid gap-2">
          {[5, 4, 3].map((value) => (
            <button
              onClick={() => setRating(String(value))}
              className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs ${rating === String(value) ? "border-amber-300 bg-amber-50" : ""}`}
              key={value}
            >
              <Star size={13} className="fill-amber-400 text-amber-400" /> {value}{" "}
              {value < 5 && "ke atas"}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Tanggal acara">
        <label className="relative block">
          <CalendarDays className="absolute left-3 top-3 text-stone-400" size={16} />
          <input
            min={new Date().toISOString().split("T")[0]}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            type="date"
            className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-xs"
          />
        </label>
        {eventDate && (
          <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[11px] text-blue-700">
            Tanggal acara: {eventDate}
          </span>
        )}
      </FilterGroup>
    </div>
  );
}
function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-400">{title}</h4>
      {children}
    </section>
  );
}
function LocationPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm"
      >
        <span className="flex items-center gap-2">
          <MapPin size={15} className="text-blush" />
          {value || "Pilih kota"}
        </span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border bg-white p-2 shadow-2xl">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-xs"
            placeholder="Cari kota..."
          />
          <div className="mt-2 max-h-48 overflow-auto">
            {cities
              .filter((item) => item.toLowerCase().includes(search.toLowerCase()))
              .map((item) => (
                <button
                  onClick={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-rose-50"
                  key={item}
                >
                  {item}
                  {value === item && <Check size={14} className="text-blush" />}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
function MobileFilter({ children }: { children: React.ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <AppButton variant="secondary" className="lg:hidden">
          <SlidersHorizontal size={16} /> Filter
        </AppButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-auto rounded-t-[2rem] bg-white p-6 shadow-2xl">
          <Dialog.Title className="text-lg font-semibold text-ink">Filter vendor</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-stone-500">
            Sesuaikan kategori, lokasi, harga, dan rating vendor.
          </Dialog.Description>
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-stone-200" />
          {children}
          <Dialog.Close asChild>
            <AppButton className="sticky bottom-0 mt-6 w-full">Terapkan Filter</AppButton>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
