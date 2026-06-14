import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { AppButton } from "@/components/ui/AppButton";
import { SectionHeader } from "@/components/common/Headers";
import { VendorCard } from "@/components/cards/Cards";
import { mockCategories, mockVendors } from "@/constants/mockData";
import { APP_BRAND } from "@/constants/menu";

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

      <section className="relative min-h-[720px] overflow-hidden bg-ink px-5 pb-24 pt-20 text-white">
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=80"
          alt="Pernikahan premium"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/50 to-ink" />
        <div className="absolute -left-24 top-20 size-80 rounded-full bg-blush/30 blur-3xl" />
        <div className="absolute -right-24 bottom-10 size-96 rounded-full bg-amber-200/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-rose-200" /> Marketplace wedding terpercaya di
            Indonesia
          </div>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Hari istimewa dimulai dari rencana yang terasa mudah.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-stone-200 md:text-lg">
            Temukan vendor terverifikasi, bandingkan paket, kelola budget, dan pantau seluruh
            persiapan wedding dalam satu tempat.
          </p>
          <div className="mx-auto mt-10 grid max-w-4xl gap-3 rounded-3xl border border-white/20 bg-white/95 p-3 text-left text-ink shadow-2xl backdrop-blur-xl md:grid-cols-[1fr_1fr_auto]">
            <label className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-stone-50">
              <Search className="text-blush" size={19} />
              <span>
                <span className="block text-xs font-semibold text-stone-400">Layanan</span>
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Catering, dekorasi, venue..."
                />
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-stone-50">
              <MapPin className="text-blush" size={19} />
              <span>
                <span className="block text-xs font-semibold text-stone-400">Lokasi</span>
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Jakarta, Bandung..."
                />
              </span>
            </label>
            <AppButton asChild className="rounded-2xl px-8">
              <Link href="/customer/marketplace">
                Cari Vendor <ArrowRight size={16} />
              </Link>
            </AppButton>
          </div>
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 divide-x divide-white/20">
            {stats.map(([value, label]) => (
              <div key={label}>
                <p className="text-xl font-semibold md:text-2xl">{value}</p>
                <p className="mt-1 text-xs text-stone-300 md:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeader
            title="Semua kebutuhan dalam satu marketplace"
            description="Mulai dari venue hingga detail terakhir perayaan Anda."
          />
          <Link className="text-sm font-semibold text-blush" href="/customer/marketplace">
            Lihat semua kategori →
          </Link>
        </div>
        <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {mockCategories.slice(0, 12).map((category, index) => (
            <Link
              className="group rounded-3xl border bg-white p-5 text-sm font-medium shadow-sm hover:-translate-y-1 hover:border-rose-200 hover:bg-rose-50 hover:text-blush hover:shadow-lg"
              href="/customer/marketplace"
              key={category.id}
            >
              <span className="mb-5 grid size-10 place-items-center rounded-2xl bg-stone-100 text-stone-500 group-hover:bg-white group-hover:text-blush">
                {index % 2 ? <Heart size={17} /> : <Sparkles size={17} />}
              </span>
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionHeader
              title="Vendor pilihan untuk momen terbaik"
              description="Vendor berkualitas dengan reputasi dan layanan yang telah diverifikasi."
            />
            <AppButton asChild variant="secondary" className="rounded-full">
              <Link href="/customer/marketplace">Jelajahi marketplace</Link>
            </AppButton>
          </div>
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {mockVendors.map((vendor) => (
              <VendorCard vendor={vendor} key={vendor.id} />
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="relative mx-auto max-w-7xl px-5 py-24">
        <div className="absolute left-1/2 top-24 -z-10 size-80 -translate-x-1/2 rounded-full bg-rose-100 blur-3xl" />
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
              className="group rounded-[2rem] border bg-white p-7 shadow-soft transition hover:-translate-y-2"
              key={String(title)}
            >
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-blush">
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
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-ink px-7 py-16 text-center text-white shadow-2xl md:px-16">
          <div className="absolute left-0 top-0 size-56 rounded-full bg-blush/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 size-56 rounded-full bg-amber-200/10 blur-3xl" />
          <Star className="relative mx-auto fill-rose-300 text-rose-300" />
          <blockquote className="relative mx-auto mt-6 max-w-3xl text-2xl font-medium leading-relaxed md:text-3xl">
            &ldquo;Kami bisa fokus menikmati prosesnya karena semua vendor dan pembayaran tersusun
            rapi.&rdquo;
          </blockquote>
          <p className="relative mt-5 text-sm text-stone-300">Sinta & Raka, Jakarta</p>
        </div>
      </section>

      <section id="daftar" className="scroll-mt-24 px-5 py-24">
        <div className="mx-auto max-w-7xl text-center">
          <span className="text-sm font-bold uppercase tracking-[.2em] text-blush">
            Mulai perjalanan Anda
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
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
              href="/register/customer"
              button="Daftar sebagai customer"
              accent="bg-gradient-to-br from-rose-100 to-white"
            />
            <RegisterCard
              icon={<Building2 />}
              eyebrow="Untuk bisnis wedding"
              title="Tumbuhkan bisnis vendor Anda"
              text="Tampilkan paket layanan, terima booking, dan bangun reputasi bersama customer."
              href="/register/vendor"
              button="Daftar sebagai vendor"
              accent="bg-gradient-to-br from-emerald-100 to-white"
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
      className={`group relative overflow-hidden rounded-[2rem] border p-8 shadow-soft transition duration-300 hover:-translate-y-2 hover:shadow-2xl ${accent}`}
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-white text-blush shadow-sm transition group-hover:rotate-6">
        {icon}
      </span>
      <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-blush">{eyebrow}</p>
      <h3 className="mt-3 text-3xl font-semibold">{title}</h3>
      <p className="mt-4 max-w-md text-sm leading-6 text-stone-600">{text}</p>
      <AppButton asChild className="mt-8 rounded-full">
        <Link href={href}>
          {button} <ArrowRight size={16} />
        </Link>
      </AppButton>
    </article>
  );
}
