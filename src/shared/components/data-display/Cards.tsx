import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import type { Product, Vendor } from "@/shared/types/models";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { BadgeCheck, Clock3, Heart, MapPin, MessageCircle, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function DashboardCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <article className="group rounded-3xl border bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{label}</p>
        <span className="size-2 rounded-full bg-blush/70 transition group-hover:scale-150" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {note && <p className="mt-2 text-xs text-stone-500">{note}</p>}
    </article>
  );
}
export function VendorCard({ vendor }: { vendor: Vendor }) {
  if (vendor.status !== "VERIFIED_ACTIVE") return null;
  // TODO API: Data vendor card berasal dari endpoint marketplace vendor list
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-soft transition duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-100">
      <div className="relative h-52 overflow-hidden">
        <Image
          src={vendor.image}
          alt={vendor.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <button
          aria-label="Simpan vendor"
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-stone-600 backdrop-blur hover:text-blush"
        >
          <Heart size={17} />
        </button>
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {vendor.categories.slice(0, 2).map((category) => (
            <span
              className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur"
              key={category}
            >
              {category}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-1.5 font-semibold">
              {vendor.name}
              <BadgeCheck size={16} className="fill-blue-500 text-white" />
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
              <MapPin size={13} /> {vendor.city}
            </p>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold">
            <Star size={14} className="fill-amber-400 text-amber-400" /> {vendor.rating}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">{vendor.description}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <div className="relative h-12 overflow-hidden rounded-lg" key={item}>
              <Image src={vendor.image} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-stretch gap-2 pt-5">
          <AppButton asChild className="h-11 min-h-11 flex-1 whitespace-nowrap">
            <Link href={ROUTES.customer.vendor(vendor.id)}>Lihat Detail</Link>
          </AppButton>
          <AppButton
            aria-label="Chat vendor"
            variant="secondary"
            className="h-11 min-h-11 w-11 shrink-0 px-0"
          >
            <MessageCircle size={17} />
          </AppButton>
        </div>
      </div>
    </article>
  );
}
export function ProductCard({ product }: { product: Product }) {
  // TODO API: Ambil daftar package aktif dari backend
  return (
    <article className="group flex h-full flex-col rounded-3xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-40 overflow-hidden rounded-2xl">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3">
          <StatusBadge status={product.status} />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-blush">
        {product.category}
      </p>
      <h3 className="mt-1 font-semibold">{product.name}</h3>
      <p className="mt-2 text-lg font-semibold">{formatCurrency(product.price)}</p>
      <p className="mt-2 flex flex-wrap gap-3 text-xs text-stone-500">
        <span className="flex items-center gap-1">
          <Users size={13} /> {product.guestCapacity} tamu
        </span>
        <span className="flex items-center gap-1">
          <Clock3 size={13} /> {product.duration}
        </span>
        <span className="flex items-center gap-1">
          <Star size={13} className="fill-amber-400 text-amber-400" /> 4.9
        </span>
      </p>
      <div className="mt-auto flex items-stretch gap-2 pt-4">
        <AppButton
          asChild
          variant="secondary"
          className="h-11 min-h-11 flex-1 whitespace-nowrap px-3"
        >
          <Link href={ROUTES.customer.product(product.id)}>Lihat Paket</Link>
        </AppButton>
        <AppButton asChild className="h-11 min-h-11 flex-1 whitespace-nowrap px-3">
          <Link href={ROUTES.customer.checkout}>Booking</Link>
        </AppButton>
      </div>
    </article>
  );
}
