import { marketplaceRepository } from "@/features/marketplace/repository";
import { VendorCard } from "@/shared/components/data-display/Cards";
import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";
import { PublicNavbar } from "@/shared/components/layout/PublicNavbar";
import { AppButton } from "@/shared/components/ui/AppButton";
import { APP_BRAND } from "@/shared/config/navigation";
import { ROUTES } from "@/shared/config/routes";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const stats = [
  ["800+", "Vendor terverifikasi"],
  ["12.000+", "Couple bergabung"],
  ["4,9/5", "Rating pengalaman"],
];

export default function HomePage() {
  // TODO API: Ambil featured categories, featured vendors, statistik, dan testimonial dari backend
  return (
    <main className="overflow-hidden">
      <PublicNavbar />

      <section className="relative overflow-hidden bg-ink px-4 py-14 text-white sm:px-6 sm:py-20 lg:py-24">
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=80"
          alt="Pernikahan premium"
          fill
          priority
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/20" />
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-rose-200" /> Marketplace wedding terpercaya di
            Indonesia
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-medium leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
            Hari istimewa dimulai dari rencana yang terasa mudah.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-200 md:text-lg">
            Temukan vendor terverifikasi, bandingkan paket, kelola budget, dan pantau seluruh
            persiapan wedding dalam satu tempat.
          </p>
          <div className="mt-8 grid max-w-3xl gap-2 rounded-xl border border-white/20 bg-white p-3 text-left text-ink md:grid-cols-[1fr_1fr_auto]">
            <label className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-stone-50">
              <Search className="text-blush" size={19} />
              <span>
                <span className="block text-xs font-semibold text-stone-400">Layanan</span>
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Catering, dekorasi, venue..."
                />
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-stone-50">
              <MapPin className="text-blush" size={19} />
              <span>
                <span className="block text-xs font-semibold text-stone-400">Lokasi</span>
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Jakarta, Bandung..."
                />
              </span>
            </label>
            <AppButton asChild className="rounded-xl px-8">
              <Link href={ROUTES.customer.marketplace}>
                Cari Vendor <ArrowRight size={16} />
              </Link>
            </AppButton>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            {stats.map(([value, label]) => (
              <div key={label}>
                <p className="text-xl font-semibold md:text-2xl">{value}</p>
                <p className="mt-1 text-xs text-stone-300 md:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeader
            title="Semua kebutuhan dalam satu marketplace"
            description="Mulai dari venue hingga detail terakhir perayaan Anda."
          />
          <Link className="text-sm font-semibold text-blush" href={ROUTES.customer.marketplace}>
            Lihat semua kategori →
          </Link>
        </div>
        <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {marketplaceRepository
            .categories()
            .slice(0, 12)
            .map((category, index) => (
              <Link
                className="group rounded-xl border bg-white p-5 text-sm font-medium shadow-sm hover:border-rose-200 hover:bg-rose-50 hover:text-blush hover:shadow-soft"
                href={ROUTES.customer.marketplace}
                key={category.id}
              >
                <span className="mb-5 grid size-10 place-items-center rounded-xl bg-stone-100 text-stone-500 group-hover:bg-white group-hover:text-blush">
                  {index % 2 ? <Heart size={17} /> : <Sparkles size={17} />}
                </span>
                {category.name}
              </Link>
            ))}
        </div>
      </section>

      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionHeader
              title="Vendor pilihan untuk momen terbaik"
              description="Vendor berkualitas dengan reputasi dan layanan yang telah diverifikasi."
            />
            <AppButton asChild variant="secondary" className="rounded-lg">
              <Link href={ROUTES.customer.marketplace}>Jelajahi marketplace</Link>
            </AppButton>
          </div>
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {marketplaceRepository.vendors().map((vendor) => (
              <VendorCard vendor={vendor} key={vendor.id} />
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <SectionHeader
            title="Lebih tenang di setiap langkah"
            description="Alur yang sederhana dari inspirasi hingga hari pernikahan."
          />
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            [
              <Users key="users" />,
              "Ceritakan wedding impian Anda",
              "Lengkapi profil, tanggal, lokasi, tema, dan estimasi budget.",
            ],
            [
              <BadgeCheck key="badge" />,
              "Pilih vendor dengan yakin",
              "Bandingkan vendor terverifikasi, paket, harga, dan ulasan asli.",
            ],
            [
              <CalendarCheck2 key="calendar" />,
              "Pantau semua dalam satu tempat",
              "Kelola booking, pembayaran, budget, dan progress persiapan.",
            ],
          ].map(([icon, title, text], index) => (
            <article
              className="group rounded-xl border bg-white p-7 shadow-soft transition "
              key={String(title)}
            >
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-rose-50 text-blush">
                  {icon}
                </span>
                <span className="text-4xl font-semibold text-stone-100">0{index + 1}</span>
              </div>
              <h3 className="mt-7 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-stone-500">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="tentang" className="scroll-mt-24 px-5 py-12">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-xl bg-ink px-7 py-16 text-center text-white shadow-soft md:px-16">
          <Star className="relative mx-auto fill-rose-300 text-rose-300" />
          <blockquote className="relative mx-auto mt-6 max-w-3xl text-2xl font-medium leading-relaxed md:text-3xl">
            &ldquo;Kami bisa fokus menikmati prosesnya karena semua vendor dan pembayaran tersusun
            rapi.&rdquo;
          </blockquote>
          <p className="relative mt-5 text-sm text-stone-300">Sinta & Raka, Jakarta</p>
        </div>
      </section>

      <section id="daftar" className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[.2em] text-blush">
            Mulai perjalanan Anda
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
            Pilih cara Anda menggunakan {APP_BRAND.name}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-stone-500">
            Daftar gratis dan gunakan ruang kerja yang dirancang khusus untuk kebutuhan Anda.
          </p>
          <div className="mt-12 grid gap-6 text-left md:grid-cols-2">
            <RegisterCard
              icon={<Heart />}
              eyebrow="Untuk couple"
              title="Rencanakan wedding impian"
              text="Temukan vendor, kelola budget, booking layanan, dan pantau progress persiapan."
              href={ROUTES.registerCustomer}
              button="Daftar sebagai customer"
              accent="bg-white"
            />
            <RegisterCard
              icon={<Building2 />}
              eyebrow="Untuk bisnis wedding"
              title="Tumbuhkan bisnis vendor Anda"
              text="Tampilkan paket layanan, terima booking, dan bangun reputasi bersama customer."
              href={ROUTES.registerVendor}
              button="Daftar sebagai vendor"
              accent="bg-white"
            />
          </div>
        </div>
      </section>

      <footer className="border-t bg-white px-5 py-10 text-center text-sm text-stone-500">
        &copy; 2026 {APP_BRAND.name}. Rencanakan dengan tenang.
      </footer>
    </main>
  );
}

function RegisterCard({
  icon,
  eyebrow,
  title,
  text,
  href,
  button,
  accent,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  button: string;
  accent: string;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-xl border p-5 transition-colors hover:border-stone-300 sm:p-8 ${accent}`}
    >
      <span className="grid size-12 place-items-center rounded-xl bg-white text-blush shadow-sm transition ">
        {icon}
      </span>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[.2em] text-blush">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
      <p className="mt-4 max-w-md text-sm leading-6 text-stone-600">{text}</p>
      <AppButton asChild className="mt-8 rounded-lg">
        <Link href={href}>
          {button} <ArrowRight size={16} />
        </Link>
      </AppButton>
    </article>
  );
}
