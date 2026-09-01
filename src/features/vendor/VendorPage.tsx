"use client";
import { EmptyState } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";

import { notificationRepository } from "@/features/notifications/repository";
import { VendorProfileForm } from "@/features/profile/components/vendor/VendorProfileForm";
import { VendorDashboard } from "@/features/vendor/DashboardPage";
import { OrderDetail, OrdersPage } from "@/features/vendor/OrderPages";
import { MarketplaceExplorer } from "@/features/marketplace/MarketplaceExplorer";
import { ProductDetail as MarketplaceProductDetail } from "@/features/customer/MarketplacePages";
import {
  ProductAccessGate,
  ProductDetailPage,
  ProductsPage,
  VendorProductForm,
} from "@/features/vendor/ProductPages";

export function VendorPage({ slug }: { slug: string[] }) {
  const page = slug[0] ?? "dashboard";
  // TODO API: Tampilkan loading, error, empty, dan success state sesuai hasil request.
  if (page === "dashboard") return <VendorDashboard />;
  if (page === "marketplace" && slug[1] === "products" && slug[2]) return <MarketplaceProductDetail canBook={false} productId={slug[2]} />;
  if (page === "marketplace") return <Page title="Marketplace Vendor" description="Lihat produk aktif dan posisi layanan Anda di marketplace."><MarketplaceExplorer role="vendor" /></Page>;
  if (page === "profile")
    return (
      <Page title="Profil Bisnis" description="Informasi ini tampil di halaman toko vendor.">
        <VendorProfileForm />
      </Page>
    );
  if (page === "products" && slug[1] === "create")
    return (
      <ProductAccessGate>
        <Page
          title="Buat Paket Layanan"
          description="Buat paket yang jelas agar customer mudah membandingkan."
        >
          <VendorProductForm
            note="Simpan sebagai draft jika informasi paket belum lengkap, atau publikasikan setelah semua data siap."
            submitLabel="Publish paket"
          />
        </Page>
      </ProductAccessGate>
    );
  if (page === "products" && slug.includes("edit"))
    return (
      <ProductAccessGate>
        <Page title="Edit Paket Layanan" description="Perbarui detail dan status paket.">
          <VendorProductForm
            note="Perubahan harga hanya berlaku untuk pesanan baru dan tidak mengubah nilai pesanan yang sudah dibuat."
            productId={slug[1]}
            submitLabel="Simpan perubahan"
          />
        </Page>
      </ProductAccessGate>
    );
  if (page === "products" && slug[1])
    return (
      <ProductAccessGate>
        <ProductDetailPage productId={slug[1]} />
      </ProductAccessGate>
    );
  if (page === "products")
    return (
      <ProductAccessGate>
        <ProductsPage />
      </ProductAccessGate>
    );
  if (page === "orders" && slug[1]) return <OrderDetail orderId={slug[1]} />;
  if (page === "orders") return <OrdersPage />;
  if (page === "notifications")
    return (
      <Page title="Notifikasi" description="Pembaruan pesanan dan akun vendor.">
        <div className="grid gap-3">
          {notificationRepository.list().map((n) => (
            <article className="rounded-2xl border bg-white p-5" key={n.id}>
              <h3 className="font-semibold">{n.title}</h3>
              <p className="text-sm text-stone-500">{n.message}</p>
            </article>
          ))}
        </div>
      </Page>
    );
  return <EmptyState title="Halaman tidak ditemukan" />;
}
