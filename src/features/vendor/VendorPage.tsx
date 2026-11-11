"use client";
import dynamic from "next/dynamic";
import { useTranslation } from "@/shared/i18n/useTranslation";

import { EmptyState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";

const StorePage = dynamic(
  () => import("@/features/marketplace/StorePage").then((module) => module.StorePage),
  { loading: () => <LoadingSkeleton /> },
);
const NotificationPage = dynamic(
  () =>
    import("@/features/notifications/NotificationPage").then((module) => module.NotificationPage),
  { loading: () => <LoadingSkeleton /> },
);
const VendorProfileForm = dynamic(
  () =>
    import("@/features/profile/components/vendor/VendorProfileForm").then(
      (module) => module.VendorProfileForm,
    ),
  { loading: () => <LoadingSkeleton /> },
);
const VendorDashboard = dynamic(
  () => import("@/features/vendor/DashboardPage").then((module) => module.VendorDashboard),
  { loading: () => <LoadingSkeleton /> },
);
const OrderDetail = dynamic(
  () => import("@/features/vendor/OrderPages").then((module) => module.OrderDetail),
  { loading: () => <LoadingSkeleton /> },
);
const OrdersPage = dynamic(
  () => import("@/features/vendor/OrderPages").then((module) => module.OrdersPage),
  { loading: () => <LoadingSkeleton /> },
);
const MarketplaceExplorer = dynamic(
  () =>
    import("@/features/marketplace/MarketplaceExplorer").then(
      (module) => module.MarketplaceExplorer,
    ),
  { loading: () => <LoadingSkeleton /> },
);
const MarketplaceProductDetail = dynamic(
  () => import("@/features/customer/MarketplacePages").then((module) => module.ProductDetail),
  { loading: () => <LoadingSkeleton /> },
);
const ProductAccessGate = dynamic(
  () => import("@/features/vendor/ProductPages").then((module) => module.ProductAccessGate),
  { loading: () => <LoadingSkeleton /> },
);
const ProductDetailPage = dynamic(
  () => import("@/features/vendor/ProductPages").then((module) => module.ProductDetailPage),
  { loading: () => <LoadingSkeleton /> },
);
const ProductsPage = dynamic(
  () => import("@/features/vendor/ProductPages").then((module) => module.ProductsPage),
  { loading: () => <LoadingSkeleton /> },
);
const VendorProductForm = dynamic(
  () => import("@/features/vendor/ProductPages").then((module) => module.VendorProductForm),
  { loading: () => <LoadingSkeleton /> },
);

export function VendorPage({ slug }: { slug: string[] }) {
  const { translateText } = useTranslation();
  const page = slug[0] ?? "dashboard";
  // TODO API: Tampilkan loading, error, empty, dan success state sesuai hasil request.
  if (page === "dashboard") return <VendorDashboard />;
  if (page === "marketplace" && slug[1] === "stores" && slug[2])
    return <StorePage key={slug[2]} vendorId={slug[2]} role="vendor" />;
  if (page === "marketplace" && slug[1] === "products" && slug[2])
    return <MarketplaceProductDetail key={slug[2]} canBook={false} productId={slug[2]} />;
  if (page === "marketplace")
    return (
      <Page
        title={translateText("Marketplace Vendor")}
        description={translateText("Lihat produk aktif dan posisi layanan Anda di marketplace.")}
      >
        <MarketplaceExplorer role="vendor" />
      </Page>
    );
  if (page === "profile")
    return (
      <Page
        title={translateText("Profil Bisnis")}
        description={translateText("Informasi ini tampil di halaman toko vendor.")}
      >
        <VendorProfileForm />
      </Page>
    );
  if (page === "products" && slug[1] === "create")
    return (
      <ProductAccessGate>
        <Page
          title={translateText("Buat Paket Layanan")}
          description={translateText("Buat paket yang jelas agar customer mudah membandingkan.")}
        >
          <VendorProductForm
            note={translateText(
              "Simpan sebagai draft jika informasi paket belum lengkap, atau publikasikan setelah semua data siap.",
            )}
            submitLabel="Publish paket"
          />
        </Page>
      </ProductAccessGate>
    );
  if (page === "products" && slug.includes("edit"))
    return (
      <ProductAccessGate>
        <Page
          title={translateText("Edit Paket Layanan")}
          description={translateText("Perbarui detail dan status paket.")}
        >
          <VendorProductForm
            note={translateText(
              "Perubahan harga hanya berlaku untuk pesanan baru dan tidak mengubah nilai pesanan yang sudah dibuat.",
            )}
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
  if (page === "notifications") return <NotificationPage />;
  return <EmptyState title={translateText("Halaman tidak ditemukan")} />;
}
