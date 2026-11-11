"use client";
import { AttachmentImage } from "@/shared/components/ui/AttachmentImage";
import { useTranslation } from "@/shared/i18n/useTranslation";
import { useUnsavedChanges } from "@/shared/hooks/useUnsavedChanges";
import { ServiceAreaField } from "@/features/locations/ServiceAreaField";

import {
  createVendorProduct,
  deleteVendorProduct,
  getVendorProduct,
  getVendorProducts,
  updateVendorProduct,
} from "@/features/products/api";
import { productFormToPayload } from "@/features/products/mapper";
import type { VendorProduct } from "@/features/products/types";
import { MASTER_PARAMETER_CODES } from "@/features/parameters/constants";
import { useMasterParameters } from "@/features/parameters/useMasterParameters";
import { deleteAttachment, getAttachmentBlob } from "@/features/profile/api/attachmentApi";
import { useImageUpload } from "@/features/profile/hooks/useImageUpload";
import { ProductReviews } from "@/features/reviews/components/ProductReviews";
import { useVendorProfile } from "@/features/profile/hooks/useVendorProfile";
import {
  canVendorSell,
  parameterOptionLabels,
  vendorProfileStatus,
} from "@/features/profile/rules";
import { DashboardCard } from "@/shared/components/data-display/Cards";
import { DataTable } from "@/shared/components/data-display/DataTable";
import { DetailGrid } from "@/shared/components/data-display/DetailBlocks";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";
import { usePopup } from "@/shared/components/feedback/Popup";
import { StatusBadge } from "@/shared/components/feedback/StatusBadge";
import { EntityForm, type FormField } from "@/shared/components/forms/EntityForm";
import { FeaturePage as Page } from "@/shared/components/layout/FeaturePage";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppIconButton } from "@/shared/components/ui/AppIconButton";
import { AppInput, AppSelect } from "@/shared/components/ui/FormFields";
import { StatusToggle } from "@/shared/components/ui/StatusToggle";
import { ROUTES } from "@/shared/config/routes";
import type { ProductStatus } from "@/shared/types/models";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

const PRODUCT_FORM_STEPS = ["Informasi Layanan", "Harga & Publikasi"];
const PRODUCT_PAGE_SIZE = 10;
const PRODUCT_FIELDS: FormField[] = [
  { label: "Nama produk atau paket", name: "name", required: true, step: 0 },
  { label: "Deskripsi layanan", name: "description", type: "textarea", required: true, step: 0 },
  { label: "Durasi layanan", name: "duration", placeholder: "Contoh: 8 jam", step: 0 },
  { label: "Kapasitas tamu", name: "capacity", type: "number", min: 1, step: 0 },
  {
    label: "Area layanan",
    name: "area",
    required: true,
    step: 0,
  },
  { label: "Harga", name: "price", type: "number", min: 0, required: true, step: 1 },
  {
    label: "Maksimal pesanan per tanggal",
    name: "maxOrdersPerDay",
    type: "number",
    min: 1,
    required: true,
    step: 1,
    helper: "Jumlah acara yang dapat dilayani produk ini dalam satu hari.",
  },
  { label: "Minimal DP", name: "dp", type: "number", min: 0, step: 1 },
  {
    label: "Foto atau portofolio paket",
    name: "images",
    type: "images",
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
    helper: "Pilih beberapa foto JPG, PNG, atau WebP.",
    step: 1,
  },
  { label: "Syarat dan ketentuan", name: "terms", type: "textarea", required: true, step: 1 },
];

export function VendorProductForm({
  note,
  productId,
  submitLabel,
}: {
  note: string;
  productId?: string;
  submitLabel: string;
}) {
  const { translateText } = useTranslation();
  const vendor = useVendorProfile();
  const masterParameters = useMasterParameters([MASTER_PARAMETER_CODES.vendorCategory]);
  const router = useRouter();
  const popup = usePopup();
  const unsaved = useUnsavedChanges();
  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [productLoading, setProductLoading] = useState(Boolean(productId));
  const [productError, setProductError] = useState("");
  const [saving, setSaving] = useState(false);
  const loadProduct = useCallback(async () => {
    if (!productId) return;
    setProductLoading(true);
    try {
      setProduct(await getVendorProduct(productId));
      setProductError("");
    } catch (error) {
      setProductError(error instanceof Error ? error.message : "Produk gagal dimuat.");
    } finally {
      setProductLoading(false);
    }
  }, [productId]);
  useEffect(() => void loadProduct(), [loadProduct]);
  if (vendor.loading || productLoading || masterParameters.loading) return <LoadingSkeleton />;
  if (vendor.error) return <ErrorState retry={() => void vendor.reload()} />;
  if (masterParameters.error) return <ErrorState retry={() => window.location.reload()} />;
  if (productError) return <ErrorState retry={() => void loadProduct()} />;
  const categoryOptions = masterParameters.getOptions(MASTER_PARAMETER_CODES.vendorCategory);
  const categories = parameterOptionLabels(vendor.profile?.categories ?? [], categoryOptions);

  async function save(form: HTMLFormElement, action: "draft" | "publish") {
    if (!vendor.profile) return;
    const values = new FormData(form);
    if (!String(values.get("area") ?? "").trim()) {
      popup.error("Pilih minimal satu area layanan pada langkah Informasi Layanan.");
      return;
    }
    const rawPrice = String(values.get("price") ?? "").trim();
    if (!rawPrice) {
      popup.error("Harga produk wajib diisi.");
      return;
    }
    if (Number(values.get("dp") || 0) > Number(rawPrice)) {
      popup.error("Minimal DP tidak boleh lebih besar dari harga produk.");
      return;
    }
    setSaving(true);
    try {
      const status: ProductStatus = action === "draft" ? "DRAFT" : "ACTIVE";
      const payload = productFormToPayload(form, status, productId ? undefined : vendor.profile.id);
      const saved = productId
        ? await updateVendorProduct(productId, payload)
        : await createVendorProduct(payload);
      const removedImageIds = values.getAll("removedImageIds").map(String).filter(Boolean);
      if (productId && removedImageIds.length > 0) {
        await Promise.all(removedImageIds.map(deleteAttachment));
      }
      popup.success(
        action === "draft" ? "Draft produk berhasil disimpan." : "Produk berhasil dipublikasikan.",
      );
      unsaved.markSaved();
      router.push(ROUTES.vendor.product(saved.id));
      router.refresh();
    } catch (error) {
      popup.error(error instanceof Error ? error.message : "Produk gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EntityForm
      fields={productFields(categories, product?.imageAttachmentIds ?? [])}
      initialValues={productInitialValues(product, categoryOptions)}
      renderField={(field) =>
        field.name === "area" ? (
          <ServiceAreaField
            key={product?.id ?? "new"}
            name="area"
            initialValue={product?.serviceArea}
            businessArea={vendor.profile?.serviceArea ?? ""}
            disabled={saving}
            onDirty={unsaved.markDirty}
          />
        ) : undefined
      }
      loading={saving}
      note={
        categories.length
          ? translateText(note)
          : translateText("Tambahkan kategori melalui Profil Bisnis terlebih dahulu.")
      }
      onSave={save}
      onDirty={unsaved.markDirty}
      showDraft={!productId || product?.status === "DRAFT"}
      steps={PRODUCT_FORM_STEPS}
      submitLabel={submitLabel}
    />
  );
}

export function ProductAccessGate({ children }: { children: ReactNode }) {
  const { translateText } = useTranslation();
  const vendor = useVendorProfile();
  if (vendor.loading)
    return (
      <Page
        title={translateText("Produk")}
        description={translateText("Memeriksa status vendor...")}
      >
        <LoadingSkeleton />
      </Page>
    );
  if (vendor.error)
    return (
      <Page
        title={translateText("Produk")}
        description={translateText("Status vendor tidak dapat dimuat.")}
      >
        <ErrorState retry={() => void vendor.reload()} />
      </Page>
    );
  if (!canVendorSell(vendor.profile))
    return (
      <Page
        title={translateText("Produk belum tersedia")}
        description={translateText("Selesaikan verifikasi bisnis untuk mulai berjualan.")}
      >
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-7">
          <StatusBadge status={vendorProfileStatus(vendor.profile?.status)} />
          <h2 className="mt-4 text-xl font-semibold text-ink">
            {vendor.profile?.isVerified
              ? translateText("Akses produk sedang tidak aktif")
              : translateText("Bisnis belum diverifikasi")}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            {translateText(
              "Lengkapi profil dan pastikan akun vendor aktif untuk mengelola produk.",
            )}{" "}
          </p>
          <AppButton asChild className="mt-5">
            <Link href={ROUTES.vendor.profile}>{translateText("Buka profil bisnis")}</Link>
          </AppButton>
        </div>
      </Page>
    );
  return children;
}

export function ProductsPage() {
  const { translateText, locale } = useTranslation();
  const vendor = useVendorProfile();
  const masterParameters = useMasterParameters([MASTER_PARAMETER_CODES.vendorCategory]);
  const popup = usePopup();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    if (!vendor.profile) return;
    setLoading(true);
    try {
      const page = await getVendorProducts({
        vendorId: vendor.profile.id,
        pageNumber: 1,
        pageSize: 100,
      });
      setProducts(page.data);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Produk gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [vendor.profile]);
  useEffect(() => void load(), [load]);
  const visible = useMemo(
    () =>
      products.filter(
        (product) =>
          `${product.name} ${product.category ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (!category || normalizeCategory(product.category) === normalizeCategory(category)),
      ),
    [category, products, search],
  );
  const categoryOptions = masterParameters.getOptions(MASTER_PARAMETER_CODES.vendorCategory);
  const totalPages = Math.max(1, Math.ceil(visible.length / PRODUCT_PAGE_SIZE));
  const paginatedProducts = visible.slice((page - 1) * PRODUCT_PAGE_SIZE, page * PRODUCT_PAGE_SIZE);
  useEffect(() => setPage(1), [category, search]);
  useEffect(() => setPage((current) => Math.min(current, totalPages)), [totalPages]);

  async function changeStatus(product: VendorProduct) {
    const nextStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const confirmation = await popup.confirm({
      title: translateText("{0} produk?", {
        0: nextStatus === "ACTIVE" ? "Aktifkan" : "Nonaktifkan",
      }),
      message: "Status produk akan langsung diperbarui.",
      confirmLabel: "Lanjutkan",
    });
    if (!confirmation.confirmed) return;
    const payload = new FormData();
    payload.set("status", nextStatus);
    payload.set("active", "true");
    try {
      await updateVendorProduct(product.id, payload);
      popup.success("Status produk berhasil diperbarui.");
      await load();
    } catch (actionError) {
      popup.error(
        actionError instanceof Error ? actionError.message : "Status produk gagal diperbarui.",
      );
    }
  }
  async function remove(product: VendorProduct) {
    const confirmation = await popup.confirm({
      title: "Hapus produk?",
      message: translateText("Produk {0} akan dihapus dari sistem.", { 0: product.name }),
      confirmLabel: "Hapus",
      variant: "error",
    });
    if (!confirmation.confirmed) return;
    try {
      await deleteVendorProduct(product.id);
      popup.success("Produk berhasil dihapus.");
      await load();
    } catch (actionError) {
      popup.error(actionError instanceof Error ? actionError.message : "Produk gagal dihapus.");
    }
  }

  if (loading || masterParameters.loading)
    return (
      <Page title={translateText("Kelola Produk")} description={translateText("Memuat produk...")}>
        <LoadingSkeleton />
      </Page>
    );
  if (error)
    return (
      <Page
        title={translateText("Kelola Produk")}
        description={translateText("Produk gagal dimuat.")}
      >
        <ErrorState retry={() => void load()} />
      </Page>
    );
  if (masterParameters.error)
    return (
      <Page
        title={translateText("Kelola Produk")}
        description={translateText("Kategori produk gagal dimuat.")}
      >
        <ErrorState retry={() => window.location.reload()} />
      </Page>
    );
  return (
    <Page
      title={translateText("Kelola Produk")}
      description={translateText("Kelola paket layanan, publikasi, dan status produk.")}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label={translateText("Total produk")}
          value={translateText("{0} produk", { 0: products.length })}
        />
        <DashboardCard
          label={translateText("Produk aktif")}
          value={translateText("{0} produk", {
            0: products.filter((p) => p.status === "ACTIVE").length,
          })}
        />
        <DashboardCard
          label="Draft"
          value={translateText("{0} produk", {
            0: products.filter((p) => p.status === "DRAFT").length,
          })}
        />
        <DashboardCard
          label={translateText("Nonaktif")}
          value={translateText("{0} produk", {
            0: products.filter((p) => p.status === "INACTIVE").length,
          })}
        />
      </div>
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <AppInput
            label={translateText("Cari produk")}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={translateText("Nama produk atau paket")}
            value={search}
          />
        </div>
        <AppSelect
          label={translateText("Kategori")}
          onChange={(event) => setCategory(event.target.value)}
          value={category}
        >
          <option value="">{translateText("Semua kategori")}</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.label}>
              {translateText(option.label)}
            </option>
          ))}
        </AppSelect>
        <AppButton asChild>
          <Link href={ROUTES.vendor.createProduct}>{translateText("Buat paket baru")}</Link>
        </AppButton>
      </div>
      {visible.length ? (
        <DataTable
          itemLabel="produk"
          showToolbar={false}
          title={translateText("Daftar produk")}
          columns={["Produk", "Kategori", "Harga", "Kapasitas", "Area", "Status", "Aksi"]}
          page={page}
          pageSize={PRODUCT_PAGE_SIZE}
          total={visible.length}
          onPageChange={setPage}
          showPagination
          rows={paginatedProducts.map((p) => [
            <Link
              className="font-semibold text-ink hover:text-blush"
              href={ROUTES.vendor.product(p.id)}
              key={p.id}
            >
              {p.name}
            </Link>,
            p.category ?? "-",
            formatCurrency(p.price, locale),
            p.guestCapacity ? (
              translateText("{0} tamu", { 0: p.guestCapacity })
            ) : (
              <span className="text-stone-600">{translateText("Belum diatur")}</span>
            ),
            p.serviceArea || (
              <span className="text-stone-600">{translateText("Belum diatur")}</span>
            ),
            p.status === "ACTIVE" || p.status === "INACTIVE" ? (
              <StatusToggle
                active={p.status === "ACTIVE"}
                label={translateText("Status produk {0}", { 0: p.name })}
                onChange={() => void changeStatus(p)}
                showText
              />
            ) : (
              <StatusBadge status={p.status} />
            ),
            <div className="flex items-center gap-2" key={p.id}>
              <AppIconButton asChild label={translateText("Edit {0}", { 0: p.name })}>
                <Link href={ROUTES.vendor.editProduct(p.id)}>
                  <Pencil size={16} />
                </Link>
              </AppIconButton>
              <AppIconButton
                label={translateText("Hapus {0}", { 0: p.name })}
                onClick={() => void remove(p)}
                variant="danger"
              >
                <Trash2 size={16} />
              </AppIconButton>
            </div>,
          ])}
        />
      ) : (
        <EmptyState title={translateText("Belum ada produk yang sesuai.")} />
      )}
    </Page>
  );
}

function normalizeCategory(value: string | null | undefined) {
  return (value ?? "").trim().toLocaleLowerCase("id-ID");
}

export function ProductDetailPage({ productId }: { productId: string }) {
  const { translateText, locale } = useTranslation();
  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setProduct(await getVendorProduct(productId));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Produk gagal dimuat.");
    }
  }, [productId]);
  useEffect(() => void load(), [load]);
  if (error)
    return (
      <Page
        title={translateText("Detail Produk")}
        description={translateText("Produk gagal dimuat.")}
      >
        <ErrorState retry={() => void load()} />
      </Page>
    );
  if (!product) return <LoadingSkeleton />;
  return (
    <Page
      title={product.name}
      description={translateText(
        "Detail produk atau paket layanan yang ditampilkan kepada customer.",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
        <StatusBadge key="status" status={product.status} />
        <AppButton asChild variant="secondary">
          <Link href={ROUTES.vendor.editProduct(product.id)}>{translateText("Edit produk")}</Link>
        </AppButton>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <ProductImage attachmentId={product.imageAttachmentIds[0]} name={product.name} />
        <DetailGrid
          items={[
            ["Nama paket", product.name],
            ["Kategori", product.category ?? "-"],
            ["Harga", formatCurrency(product.price, locale)],
            ["Minimal DP", formatCurrency(product.minimumDp ?? 0, locale)],
            ["Durasi layanan", product.duration ?? "-"],
            [
              "Kapasitas",
              product.guestCapacity ? translateText("{0} tamu", { 0: product.guestCapacity }) : "-",
            ],
            ["Area layanan", product.serviceArea ?? "-"],
            ["Status", <StatusBadge key="status" status={product.status} />],
            ["Deskripsi", product.description ?? "-"],
            ["Syarat dan ketentuan", product.terms ?? "-"],
          ]}
        />
      </div>
      <ProductReviews key={product.id} product={product} />
    </Page>
  );
}

function ProductImage({ attachmentId, name }: { attachmentId?: string; name: string }) {
  const { translateText } = useTranslation();
  const load = useCallback(
    () => (attachmentId ? getAttachmentBlob(attachmentId) : Promise.resolve(null)),
    [attachmentId],
  );
  const image = useImageUpload({
    enabled: Boolean(attachmentId),
    load,
    loadErrorMessage: "Gambar produk gagal dimuat.",
  });
  return (
    <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl border bg-stone-50">
      {image.previewUrl ? (
        <AttachmentImage alt={name} className="size-full object-cover" src={image.previewUrl} />
      ) : (
        <span className="text-sm text-stone-600">{translateText("Belum ada gambar")}</span>
      )}
    </div>
  );
}

function productFields(categories: string[], existingImageIds: string[]): FormField[] {
  return [
    PRODUCT_FIELDS[0],
    {
      label: "Kategori",
      name: "category",
      type: "select",
      options: categories,
      required: true,
      helper: categories.length
        ? "Sesuai kategori pada profil bisnis Anda."
        : "Tambahkan kategori melalui Profil Bisnis.",
      step: 0,
    },
    ...PRODUCT_FIELDS.slice(1).map((field) =>
      field.name === "images"
        ? { ...field, existingImageIds, loadExistingImage: getAttachmentBlob }
        : field,
    ),
  ];
}
function productInitialValues(
  product: VendorProduct | null,
  categoryOptions: Array<{ label: string; value: string }>,
) {
  return product
    ? {
        name: product.name,
        category: parameterOptionLabels(
          product.category ? [product.category] : [],
          categoryOptions,
        )[0],
        description: product.description,
        price: product.price,
        dp: product.minimumDp,
        maxOrdersPerDay: product.maxOrdersPerDay ?? 1,
        duration: product.duration,
        capacity: product.guestCapacity,
        area: product.serviceArea,
        terms: product.terms,
      }
    : { maxOrdersPerDay: 1 };
}
