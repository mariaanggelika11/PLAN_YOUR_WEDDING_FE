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
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
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
          <AppButton asChild className="mt-8">
            <Link href={ROUTES.customer.marketplace}>
              Jelajahi paket vendor <ArrowRight size={16} />
            </Link>
          </AppButton>
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
          <h2 className="text-2xl font-semibold">Persiapan pernikahan dalam satu tempat</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-stone-300">
            Bandingkan paket vendor, pantau pesanan dan pembayaran, serta susun tugas persiapan
            sesuai kebutuhan acara Anda.
          </p>
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
