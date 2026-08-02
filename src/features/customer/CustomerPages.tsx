import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  Copy,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  UploadCloud,
  WalletCards,
} from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { DashboardCard, ProductCard, VendorCard } from "@/components/cards/Cards";
import { SectionHeader } from "@/components/common/Headers";
import { OrderTimeline, PriceBreakdown } from "@/components/common/Commerce";
import { EntityForm, type FormField } from "@/components/forms/EntityForm";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { DataTable } from "@/components/tables/DataTable";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/states/States";
import { DetailGrid, PlaceholderPanel } from "@/features/shared/DetailBlocks";
import { MarketplaceExplorer } from "@/features/marketplace/MarketplaceExplorer";
import { Accordion, DragDropUpload, Stepper, Tabs } from "@/components/common/Interactive";
import {
  mockCustomers,
  mockNotifications,
  mockOrders,
  mockProducts,
  mockReviews,
  mockVendors,
} from "@/constants/mockData";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { ROUTES } from "@/constants/routes";
import { FeaturePage } from "@/features/shared/FeaturePage";

const checkoutFields: FormField[] = [
  { label: "Tanggal acara", name: "date", type: "date", required: true },
  { label: "Lokasi acara", name: "location", required: true },
  { label: "Jumlah tamu", name: "guests", type: "number", required: true },
  { label: "Catatan untuk vendor", name: "notes", type: "textarea" },
];

export function CustomerPage({ slug }: { slug: string[] }) {
  const page = slug[0] ?? "dashboard";
  // TODO API: Tampilkan loading, error, empty, dan success state sesuai hasil request
  if (page === "dashboard") return <CustomerDashboard />;
  if (page === "profile")
    return (
      <Page title="Profil Wedding" description="Kelola informasi profile customer Anda.">
        <ProfileForm type="customer" />
      </Page>
    );
  if (page === "marketplace")
    return (
      <Page
        title="Marketplace Vendor"
        description="Temukan vendor yang sesuai dengan kebutuhan dan budget Anda."
      >
        <MarketplaceExplorer />
        <div className="hidden">
          <LoadingSkeleton />
          <ErrorState />
        </div>
      </Page>
    );
  if (page === "vendors") return <VendorDetail />;
  if (page === "products") return <ProductDetail />;
  if (page === "checkout") return <CheckoutPage />;
  if (page === "payment") return <PaymentPage />;
  if (page === "orders" && slug[1]) return <OrderDetail />;
  if (page === "orders") return <Orders />;
  if (page === "review")
    return (
      <Page title="Beri Ulasan" description="Bagikan pengalaman Anda setelah pesanan selesai.">
        <EntityForm
          fields={[
            { label: "Rating (1-5)", name: "rating", type: "number", required: true },
            { label: "Komentar ulasan", name: "comment", type: "textarea", required: true },
            { label: "Foto ulasan (opsional)", name: "image", type: "file" },
          ]}
          submitLabel="Kirim ulasan"
        />
      </Page>
    );
  if (page === "progress") return <ProgressPage />;
  if (page === "budget") return <BudgetPage />;
  if (page === "notifications") return <NotificationPage />;
  return <EmptyState title="Halaman tidak ditemukan" />;
}

function Page({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <FeaturePage title={title} description={description} showHeader={false}>
      {children}
    </FeaturePage>
  );
}

function CustomerDashboard() {
  // TODO API: Ambil ringkasan dashboard customer dari backend
  return (
    <Page title="Dashboard Wedding" description="Ringkasan persiapan pernikahan Alya & Dimas.">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink to-slate-700 p-7 text-white shadow-2xl">
        <div className="absolute right-0 top-0 size-64 rounded-full bg-blush/30 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
              Wedding Anda semakin dekat
            </span>
            <h2 className="mt-4 text-3xl font-semibold">167 hari menuju hari istimewa</h2>
            <p className="mt-2 text-sm text-stone-300">
              {formatDate(mockCustomers[0].wedding.weddingDate)} · The Glass House, Jakarta
            </p>
          </div>
          <div className="grid size-32 place-items-center rounded-full border-[10px] border-white/20 border-t-rose-300 text-center">
            <span>
              <strong className="block text-2xl">68%</strong>
              <small className="text-stone-300">progress</small>
            </span>
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Pesanan aktif" value="2 pesanan" />
        <DashboardCard label="Pembayaran perlu aksi" value="1 pembayaran" />
        <DashboardCard label="Vendor booked" value="6 vendor" />
        <DashboardCard label="Sisa budget" value={formatCurrency(82000000)} />
      </div>
      <section>
        <SectionHeader title="Aksi cepat" />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            [Sparkles, "Cari Vendor", "/customer/marketplace"],
            [CheckCircle2, "Lihat Order", "/customer/orders"],
            [UploadCloud, "Upload Pembayaran", "/customer/payment"],
            [WalletCards, "Atur Budget", "/customer/budget"],
          ].map(([Icon, label, href]) => (
            <Link
              className="rounded-2xl border bg-white p-4 text-sm font-semibold shadow-sm hover:-translate-y-1 hover:border-rose-200 hover:text-blush"
              href={String(href)}
              key={String(label)}
            >
              <Icon className="mb-3 text-blush" size={20} />
              {String(label)}
            </Link>
          ))}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <PlaceholderPanel
          title="Progress persiapan"
          description="Target berikutnya: finalisasi menu catering."
        />
        <section>
          <SectionHeader title="Rekomendasi vendor" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {mockVendors.slice(0, 2).map((vendor) => (
              <VendorCard vendor={vendor} key={vendor.id} />
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
function VendorDetail() {
  const vendor = mockVendors[0];
  // TODO API: Ambil detail vendor, daftar package, dan review vendor
  return (
    <div className="grid gap-6">
      <section className="relative h-72 overflow-hidden rounded-[2rem]">
        <Image src={vendor.image} alt={vendor.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
        <div className="absolute bottom-6 left-6 text-white">
          <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold">
            Terverifikasi
          </span>
          <h1 className="mt-3 text-4xl font-semibold">{vendor.name}</h1>
          <p className="mt-2 text-sm text-stone-200">
            {vendor.city} · ★ {vendor.rating}
          </p>
        </div>
        <div className="absolute right-5 top-5 flex gap-2">
          <AppButton aria-label="Bagikan vendor" variant="secondary" className="px-3">
            <Share2 size={17} />
          </AppButton>
          <AppButton aria-label="Simpan vendor" variant="secondary" className="px-3">
            <Heart size={17} />
          </AppButton>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
        <Tabs
          items={[
            {
              label: "Overview",
              content: (
                <DetailGrid
                  items={[
                    ["Kategori", vendor.categories.join(", ")],
                    ["Area layanan", vendor.city],
                    ["Deskripsi", vendor.description],
                    ["Rating", `${vendor.rating} / 5`],
                  ]}
                />
              ),
            },
            {
              label: "Packages",
              content: (
                <div className="grid gap-4 md:grid-cols-2">
                  {mockProducts.map((p) => (
                    <ProductCard product={p} key={p.id} />
                  ))}
                </div>
              ),
            },
            {
              label: "Portfolio",
              content: (
                <PlaceholderPanel
                  title="Portfolio gallery"
                  description="Dokumentasi karya terbaru vendor."
                />
              ),
            },
            { label: "Reviews", content: <ReviewList /> },
            {
              label: "Terms",
              content: (
                <PlaceholderPanel
                  title="Ketentuan vendor"
                  description="Ketentuan booking, revisi, dan pembatalan."
                />
              ),
            },
          ]}
        />
        <aside className="h-fit rounded-3xl border bg-white p-5 shadow-soft lg:sticky lg:top-24">
          <p className="text-xs text-stone-400">Harga paket mulai</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(mockProducts[0].price)}</p>
          <div className="mt-5 grid gap-2">
            <AppButton asChild>
              <Link href={ROUTES.customer.checkout}>Book sekarang</Link>
            </AppButton>
            <AppButton variant="secondary">
              <MessageCircle size={16} /> Chat vendor
            </AppButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
function ProductDetail() {
  const product = mockProducts[0];
  // TODO API: Ambil detail product/package berdasarkan product_id
  return (
    <Page title={product.name} description={product.description}>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <div className="relative h-80 overflow-hidden rounded-[2rem]">
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div className="relative h-20 overflow-hidden rounded-xl" key={item}>
                <Image src={product.image} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
          <DetailGrid
            items={[
              ["Vendor", mockVendors[0].name],
              ["Kategori", product.category],
              ["Kapasitas", `${product.guestCapacity} tamu`],
              ["Durasi", product.duration],
              ["Area layanan", product.serviceArea],
              ["Minimum DP", formatCurrency(product.minimumDp)],
            ]}
          />
          <Accordion
            items={[
              { title: "Deskripsi layanan", content: product.description },
              {
                title: "Fasilitas yang termasuk",
                content: "Tim profesional, konsultasi konsep, instalasi, dan dokumentasi proses.",
              },
              {
                title: "Syarat dan ketentuan",
                content: "Jadwal dan revisi mengikuti kesepakatan tertulis dengan vendor.",
              },
              {
                title: "Kebijakan pembatalan",
                content: "Pembatalan dan refund mengikuti waktu pembatalan serta ketentuan vendor.",
              },
            ]}
          />
          <ReviewList />
        </div>
        <aside className="h-fit lg:sticky lg:top-24">
          <PriceBreakdown subtotal={product.price} />
          <AppButton asChild className="mt-3 w-full">
            <Link href={ROUTES.customer.checkout}>Booking sekarang</Link>
          </AppButton>
        </aside>
      </div>
    </Page>
  );
}
function CheckoutPage() {
  // TODO API: Kirim data checkout ke backend untuk membuat order
  return (
    <Page title="Konfirmasi Booking" description="Periksa detail acara sebelum membuat pesanan.">
      <Stepper steps={["Detail Acara", "Ringkasan Paket", "Pembayaran"]} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <EntityForm fields={checkoutFields} submitLabel="Lanjutkan ke pembayaran" />
        <aside className="h-fit rounded-3xl border bg-white p-5 shadow-soft lg:sticky lg:top-24">
          <div className="flex gap-3">
            <div className="relative size-16 overflow-hidden rounded-xl">
              <Image src={mockProducts[0].image} alt="" fill className="object-cover" />
            </div>
            <div>
              <p className="text-xs text-stone-400">{mockVendors[0].name}</p>
              <h3 className="text-sm font-semibold">{mockProducts[0].name}</h3>
            </div>
          </div>
          <div className="mt-5">
            <PriceBreakdown subtotal={mockProducts[0].price} fee={250000} />
          </div>
        </aside>
      </div>
    </Page>
  );
}
function PaymentPage() {
  // TODO API: Ambil detail payment instruction dan update countdown berdasarkan expired_at dari backend
  // TODO API: Upload bukti pembayaran ke backend/storage
  return (
    <Page title="Instruksi Pembayaran" description="Selesaikan pembayaran sebelum batas waktu.">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Selesaikan pembayaran dalam <strong>23:45:18</strong> agar pesanan tidak kedaluwarsa.
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">Total pembayaran</span>
            <StatusBadge status={mockOrders[1].paymentStatus} />
          </div>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(25000000)}</p>
          <div className="mt-6 rounded-2xl bg-stone-50 p-5">
            <p className="text-xs text-stone-400">Transfer ke Bank BCA</p>
            <p className="mt-2 text-xl font-semibold">1234 5678 901</p>
            <p className="text-sm text-stone-500">a.n. Plan Your Wedding</p>
            <AppButton className="mt-4" variant="secondary">
              <Copy size={15} /> Salin nomor rekening
            </AppButton>
          </div>
        </section>
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <SectionHeader
            title="Upload bukti pembayaran"
            description="Pastikan nominal dan informasi transfer terlihat jelas."
          />
          <div className="mt-5">
            <DragDropUpload />
          </div>
          <AppButton className="mt-5 w-full">Kirim bukti pembayaran</AppButton>
        </section>
      </div>
    </Page>
  );
}
function Orders() {
  return (
    <Page title="Pesanan Saya" description="Pantau status booking dan pembayaran vendor.">
      <DataTable
        title="Pesanan terbaru"
        columns={["Nomor", "Vendor", "Paket", "Tanggal acara", "Total", "Status", "Aksi"]}
        rows={mockOrders.map((o) => [
          o.number,
          o.vendorName,
          o.productName,
          formatDate(o.eventDate),
          formatCurrency(o.total),
          <StatusBadge status={o.status} />,
          <Link className="font-semibold text-blush" href={ROUTES.customer.order(o.id)}>
            Detail
          </Link>,
        ])}
      />
    </Page>
  );
}
function OrderDetail() {
  const o = mockOrders[0];
  return (
    <Page
      title={`Pesanan ${o.number}`}
      description="Detail acara, pembayaran, dan perkembangan pesanan."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <DetailGrid
          items={[
            ["Vendor", o.vendorName],
            ["Paket", o.productName],
            ["Tanggal acara", formatDate(o.eventDate)],
            ["Lokasi", o.location],
            ["Total", formatCurrency(o.total)],
            ["Pembayaran", <StatusBadge status={o.paymentStatus} />],
          ]}
        />
        <section className="rounded-3xl border bg-white p-6">
          <SectionHeader title="Timeline pesanan" />
          <div className="mt-5">
            <OrderTimeline
              items={[
                "Pesanan dibuat",
                "Pembayaran diterima",
                "Vendor mengonfirmasi",
                "Acara selesai",
              ]}
            />
          </div>
        </section>
      </div>
    </Page>
  );
}
function ProgressPage() {
  return (
    <Page title="Wedding Progress" description="Pantau tugas penting menjelang hari pernikahan.">
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard label="Progress" value="68%" />
        <DashboardCard label="Selesai" value="17 tugas" />
        <DashboardCard label="Pending" value="7 tugas" />
        <DashboardCard label="Terlambat" value="1 tugas" />
      </div>
      <DataTable
        columns={["Tugas", "Kategori", "Tenggat", "Status"]}
        rows={[
          [
            "Finalisasi menu catering",
            "Catering",
            "20 Juni 2026",
            <StatusBadge status="IN_PROGRESS" />,
          ],
          ["Konfirmasi dekorasi", "Decoration", "1 Juli 2026", <StatusBadge status="COMPLETED" />],
        ]}
      />
    </Page>
  );
}
function BudgetPage() {
  return (
    <Page title="Budget Management" description="Bandingkan rencana dan realisasi biaya wedding.">
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard label="Total budget" value={formatCurrency(250000000)} />
        <DashboardCard label="Rencana" value={formatCurrency(210000000)} />
        <DashboardCard label="Aktual" value={formatCurrency(168000000)} />
        <DashboardCard label="Sisa" value={formatCurrency(82000000)} />
      </div>
      <DataTable
        columns={["Kategori", "Rencana", "Aktual", "Terkait pesanan"]}
        rows={[
          ["Decoration", formatCurrency(50000000), formatCurrency(45000000), "PYW-260601"],
          ["Catering", formatCurrency(90000000), formatCurrency(85000000), "PYW-260602"],
        ]}
      />
    </Page>
  );
}
function ReviewList() {
  return (
    <section>
      <SectionHeader title="Ulasan customer" />
      {mockReviews.map((r) => (
        <p className="mt-3 rounded-2xl border bg-white p-4 text-sm" key={r.id}>
          <span className="font-semibold text-amber-500">★ {r.rating}</span>
          <span className="mx-2 text-stone-300">·</span>
          {r.comment}
        </p>
      ))}
    </section>
  );
}
function NotificationPage() {
  /* TODO API: Ambil daftar notifikasi user dan tandai notifikasi sebagai read */ return (
    <Page title="Notifikasi" description="Pembaruan penting mengenai booking dan pembayaran.">
      <div className="grid gap-3">
        {mockNotifications.map((n) => (
          <article className="flex gap-4 rounded-3xl border bg-white p-5 shadow-sm" key={n.id}>
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-rose-50 text-blush">
              <Sparkles size={18} />
            </span>
            <div>
              <h3 className="font-semibold">{n.title}</h3>
              <p className="mt-1 text-sm text-stone-500">{n.message}</p>
              <button className="mt-2 text-xs font-semibold text-blush">Tandai sudah dibaca</button>
            </div>
          </article>
        ))}
      </div>
    </Page>
  );
}
