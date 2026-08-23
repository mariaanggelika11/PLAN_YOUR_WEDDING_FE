"use client";
import { reviewRepository } from "@/features/reviews/repository";

import { DataTable } from "@/shared/components/data-display/DataTable";
import { EmptyState } from "@/shared/components/feedback/AsyncStates";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { EntityForm } from "@/shared/components/forms/EntityForm";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";

import { notificationRepository } from "@/features/notifications/repository";
import { VendorProfileForm } from "@/features/profile/components/vendor/VendorProfileForm";
import { VendorDashboard } from "@/features/vendor/DashboardPage";
import { OrderDetail, OrdersPage } from "@/features/vendor/OrderPages";
import {
  ProductAccessGate,
  ProductDetailPage,
  PRODUCT_FORM_STEPS,
  ProductsPage,
  productFields,
} from "@/features/vendor/ProductPages";

export function VendorPage({ slug }: { slug: string[] }) {
  const page = slug[0] ?? "dashboard";
  // TODO API: Tampilkan loading, error, empty, dan success state sesuai hasil request.
  if (page === "dashboard") return <VendorDashboard />;
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
          <EntityForm
            fields={productFields}
            steps={PRODUCT_FORM_STEPS}
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
          <EntityForm
            fields={productFields}
            steps={PRODUCT_FORM_STEPS}
            note="Perubahan harga hanya berlaku untuk pesanan baru dan tidak mengubah nilai pesanan yang sudah dibuat."
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
  if (page === "orders" && slug[1]) return <OrderDetail />;
  if (page === "orders") return <OrdersPage />;
  if (page === "reviews")
    return (
      <Page title="Ulasan Customer" description="Masukan customer terhadap layanan Anda.">
        <DataTable
          columns={["Customer", "Rating", "Komentar", "Status"]}
          rows={reviewRepository
            .list()
            .map((r) => [
              r.customerName,
              `★ ${r.rating}`,
              r.comment,
              <StatusBadge status={r.status} />,
            ])}
        />
      </Page>
    );
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
