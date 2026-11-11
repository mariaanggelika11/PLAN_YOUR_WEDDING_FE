import React, { useRef, useState } from "react";
import { View } from "react-native";
import { useAuth } from "../auth/Provider";
import { useI18n, money } from "../i18n";
import type {
  CustomerApiProfile,
  VendorApiProfile,
  VendorProduct,
  Page,
  Order,
} from "../domain/contracts";
import { positiveId } from "../domain/rules";
import { ApiError, jsonBody, query } from "../api/client";
import { useGo } from "../navigation";
import { useAction, useResource } from "../components/hooks";
import { AttachmentImage, appendFile, chooseFile, type NativeFile } from "../components/Attachment";
import {
  Screen,
  Card,
  H1,
  H2,
  P,
  Field,
  Select,
  Button,
  Badge,
  Detail,
  Empty,
  Loading,
  Feedback,
  RowLink,
  Pagination,
  DateField,
  useConfirm,
  styles,
} from "../components/ui";

const sorts = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  rating: "Top rated",
  popular: "Most popular",
};
const vendorCanSell = (profile: VendorApiProfile | null) =>
  Boolean(profile?.isVerified && profile.active !== false && ![5, 6].includes(profile.status ?? 0));
export function ProductsScreen({ marketplace = false }: { marketplace?: boolean }) {
  const { api, session } = useAuth();
  const { t, locale } = useI18n();
  const go = useGo();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const own = session!.user.role === "VENDOR" && !marketplace;
  const resource = useResource(async () => {
    let vendor: VendorApiProfile | null = null;
    if (own) {
      try {
        vendor = await api<VendorApiProfile>(`/vendor-profile/user/${session!.user.id}`);
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) throw error;
      }
      if (!vendorCanSell(vendor)) return { blocked: true, page: null };
    }
    return {
      blocked: false,
      page: await api<Page<VendorProduct>>(
        `/vendor-products${query({ marketplace: marketplace || undefined, status: marketplace ? "ACTIVE" : undefined, vendorId: vendor?.id, pageNumber: page, pageSize: 10, filter, category: marketplace ? category : undefined, location: marketplace ? location : undefined, sortBy: marketplace ? sort : undefined })}`,
      ),
    };
  }, [api, page, filter, sort, category, location, own, session!.user.id, marketplace]);
  return (
    <Screen
      onRefresh={() => void resource.reload()}
      refreshing={resource.loading && Boolean(resource.data)}
    >
      <H1>{t(marketplace ? "Marketplace" : "Products")}</H1>
      {own && (
        <Button
          title={t("Create package")}
          disabled={resource.loading || resource.data?.blocked}
          onPress={() => go("product-edit")}
        />
      )}
      <Field
        label={t("Search")}
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => {
          setFilter(search.trim());
          setPage(1);
        }}
        returnKeyType="search"
      />
      <Button
        title={t("Search")}
        variant="secondary"
        onPress={() => {
          setFilter(search.trim());
          setPage(1);
        }}
      />
      {marketplace && (
        <>
          <Select
            label={t("Ordering")}
            value={sort}
            onChange={(value) => {
              setSort(value);
              setPage(1);
            }}
            options={Object.entries(sorts).map(([value, label]) => ({ value, label: t(label) }))}
          />
          <Field
            label={t("Category")}
            value={category}
            onChangeText={(value) => {
              setCategory(value);
              setPage(1);
            }}
          />
          <Field
            label={t("Location")}
            value={location}
            onChangeText={(value) => {
              setLocation(value);
              setPage(1);
            }}
          />
        </>
      )}
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : resource.data?.blocked ? (
        <Card>
          <P>{t("Your vendor account must be verified and active before selling.")}</P>
          <Button title={t("Business profile")} onPress={() => go("profile")} />
        </Card>
      ) : (
        <>
          {resource.data?.page?.data.length ? (
            resource.data.page.data.map((product) => (
              <Card key={product.id}>
                {product.imageAttachmentIds?.[0] && (
                  <AttachmentImage id={product.imageAttachmentIds[0]} />
                )}
                <H2>{product.name}</H2>
                <P muted>
                  {product.vendor.businessName} · {product.category}
                </P>
                <P>{money(product.price, locale)}</P>
                <Badge value={product.status} />
                <Button
                  title={t("Details")}
                  variant="secondary"
                  onPress={() => go("product", product.id)}
                />
              </Card>
            ))
          ) : (
            <Empty />
          )}
          <Pagination page={page} total={resource.data?.page?.total ?? 0} onChange={setPage} />
        </>
      )}
    </Screen>
  );
}
export function ProductScreen({ id }: { id: string }) {
  const { api, session } = useAuth();
  const { t, locale } = useI18n();
  const go = useGo();
  const action = useAction();
  const confirm = useConfirm();
  const resource = useResource(async () => {
    const product = await api<VendorProduct>(`/vendor-products/${positiveId(id)}`);
    const profile =
      session!.user.role === "VENDOR"
        ? await api<VendorApiProfile>(`/vendor-profile/user/${session!.user.id}`)
        : null;
    return { product, owned: profile?.id === product.vendor.id && vendorCanSell(profile) };
  }, [api, id, session!.user.id, session!.user.role]);
  const product = resource.data?.product;
  return (
    <Screen
      refreshing={resource.loading && Boolean(product)}
      onRefresh={() => void resource.reload()}
    >
      {resource.loading && !product ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        product && (
          <>
            <H1>{product.name}</H1>
            <Badge value={product.status} />
            {product.imageAttachmentIds?.map((attachment) => (
              <AttachmentImage key={attachment} id={attachment} height={230} />
            ))}
            <Card>
              <Detail label={t("Vendor")} value={product.vendor.businessName} />
              <Detail label={t("Price")} value={money(product.price, locale)} />
              <Detail
                label={t("Minimum deposit")}
                value={money(product.minimumDp ?? product.price, locale)}
              />
              <Detail label={t("Description")} value={product.description || "—"} />
              <Detail label={t("Duration")} value={product.duration || "—"} />
              <Detail label={t("Guest capacity")} value={product.guestCapacity ?? "—"} />
              <Detail label={t("Service area")} value={product.serviceArea || "—"} />
              <Detail label={t("Package terms")} value={product.terms || "—"} />
              <P muted>
                {product.averageRating} / 5 · {product.reviewCount} {t("Reviews")}
              </P>
            </Card>
            {session!.user.role !== "ADMIN" && (
              <Button
                title={t("View store")}
                variant="secondary"
                onPress={() => go("store", String(product.vendor.id))}
              />
            )}
            {session!.user.role === "CUSTOMER" && product.active && product.status === "ACTIVE" && (
              <Button title={t("Book this package")} onPress={() => go("checkout", product.id)} />
            )}
            {resource.data?.owned && (
              <>
                <Button
                  title={t("Edit package")}
                  variant="secondary"
                  onPress={() => go("product-edit", product.id)}
                />
                <Feedback error={action.error} />
                <Button
                  title={t("Delete")}
                  variant="danger"
                  busy={action.busy}
                  onPress={() =>
                    confirm(
                      t("Delete"),
                      () =>
                        void action.run(
                          () => api(`/vendor-products/${product.id}`, { method: "DELETE" }),
                          () => go("products"),
                        ),
                    )
                  }
                />
              </>
            )}
          </>
        )
      )}
    </Screen>
  );
}
interface Availability {
  vendorProductId: string;
  eventDate: string;
  available: boolean;
  remaining: number;
}
export function CheckoutScreen({ id }: { id: string }) {
  const { api, session } = useAuth();
  const resource = useResource(async () => {
    const product = await api<VendorProduct>(`/vendor-products/${positiveId(id)}`);
    let profile: CustomerApiProfile | null = null;
    try {
      profile = await api<CustomerApiProfile>(`/customer-profile/user/${session!.user.id}`);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    }
    return { product, profile };
  }, [api, id, session!.user.id]);
  return (
    <Screen>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        resource.data && <CheckoutForm key={id} {...resource.data} />
      )}
    </Screen>
  );
}
function CheckoutForm({
  product,
  profile,
}: {
  product: VendorProduct;
  profile: CustomerApiProfile | null;
}) {
  const { api } = useAuth();
  const { t, locale } = useI18n();
  const go = useGo();
  const action = useAction();
  const check = useAction();
  const confirm = useConfirm();
  const [date, setDate] = useState(profile?.weddingDate?.slice(0, 10) || "");
  const dateRef = useRef(date);
  dateRef.current = date;
  const [location, setLocation] = useState(profile?.weddingLocation || "");
  const [guests, setGuests] = useState(String(profile?.estimatedGuests || ""));
  const [notes, setNotes] = useState("");
  const [paymentType, setPaymentType] = useState("FULL");
  const [availability, setAvailability] = useState<Availability | null>(null);
  async function availabilityFor(eventDate: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) throw new Error("INVALID_DATE");
    const result = await api<Availability>(
      `/vendor-products/${product.id}/availability?eventDate=${encodeURIComponent(eventDate)}`,
    );
    if (String(result.vendorProductId) !== String(product.id) || result.eventDate !== eventDate)
      throw new Error("INVALID_RESPONSE");
    return result;
  }
  async function submit() {
    if (!location.trim() || !date) throw new Error("REQUIRED");
    if (
      guests &&
      (!Number.isSafeInteger(Number(guests)) ||
        Number(guests) <= 0 ||
        (product.guestCapacity && Number(guests) > product.guestCapacity))
    )
      throw new Error("INVALID_NUMBER");
    const latest = await availabilityFor(date);
    if (!latest.available || dateRef.current !== date) {
      setAvailability(null);
      throw new Error("CONFLICT");
    }
    const order = await api<Order>(
      "/orders",
      jsonBody({
        vendorProductId: positiveId(product.id),
        eventDate: date,
        eventLocation: location.trim(),
        ...(guests ? { guestCount: Number(guests) } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        paymentType,
      }),
    );
    go("order", order.id);
  }
  if (!product.active || product.status !== "ACTIVE")
    return <Feedback error={new Error("FORBIDDEN")} />;
  return (
    <>
      <H1>{t("Create order")}</H1>
      <Card>
        <H2>{product.name}</H2>
        <P>{product.vendor.businessName}</P>
        <P>{money(product.price, locale)}</P>
        {product.terms && <P muted>{product.terms}</P>}
      </Card>
      <Card>
        <DateField
          label={t("Event date")}
          value={date}
          onChange={(value) => {
            dateRef.current = value;
            setDate(value);
            setAvailability(null);
          }}
        />
        <Button
          title={t("Check availability")}
          variant="secondary"
          busy={check.busy}
          disabled={!date}
          onPress={() =>
            void check.run(async () => {
              const current = date;
              const result = await availabilityFor(current);
              if (dateRef.current === current) setAvailability(result);
            })
          }
        />
        <Feedback error={check.error} />
        {availability && <Badge value={availability.available ? "Available" : "Unavailable"} />}
        <Field label={t("Event location")} required value={location} onChangeText={setLocation} />
        <Field
          label={t("Guest count")}
          value={guests}
          onChangeText={setGuests}
          keyboardType="number-pad"
        />
        <Field label={t("Notes")} value={notes} onChangeText={setNotes} multiline />
        <Select
          label={t("Payment type")}
          value={paymentType}
          onChange={setPaymentType}
          options={[
            { value: "FULL", label: `${t("Full payment")} · ${money(product.price, locale)}` },
            {
              value: "DP",
              label: `${t("Deposit")} · ${money(product.minimumDp && product.minimumDp > 0 ? product.minimumDp : product.price, locale)}`,
            },
          ]}
        />
        <Feedback error={action.error} />
        <Button
          title={t("Create order")}
          busy={action.busy}
          disabled={!availability?.available || availability.eventDate !== date || !location.trim()}
          onPress={() => confirm(t("Create order"), () => void action.run(submit))}
        />
      </Card>
    </>
  );
}
export function ProductEditScreen({ id }: { id?: string }) {
  const { api, session } = useAuth();
  const { t } = useI18n();
  const resource = useResource(async () => {
    const profile = await api<VendorApiProfile>(`/vendor-profile/user/${session!.user.id}`);
    if (!vendorCanSell(profile)) throw new Error("FORBIDDEN");
    const product = id ? await api<VendorProduct>(`/vendor-products/${positiveId(id)}`) : null;
    if (product && product.vendor.id !== profile.id) throw new Error("FORBIDDEN");
    return { profile, product };
  }, [api, id, session!.user.id]);
  return (
    <Screen>
      <H1>{t(id ? "Edit package" : "Create package")}</H1>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        resource.data && <ProductForm key={id || "new"} {...resource.data} />
      )}
    </Screen>
  );
}
function ProductForm({
  product,
  profile,
}: {
  product: VendorProduct | null;
  profile: VendorApiProfile;
}) {
  const { api } = useAuth();
  const { t } = useI18n();
  const go = useGo();
  const action = useAction();
  const [values, setValues] = useState<Record<string, string>>({
    name: product?.name || "",
    category: product?.category || "",
    description: product?.description || "",
    price: String(product?.price ?? ""),
    minimumDp: String(product?.minimumDp ?? ""),
    duration: product?.duration || "",
    guestCapacity: String(product?.guestCapacity ?? ""),
    serviceArea: product?.serviceArea || "",
    terms: product?.terms || "",
    maxOrdersPerDay: String(product?.maxOrdersPerDay ?? 1),
    status: product?.status || "DRAFT",
  });
  const [image, setImage] = useState<NativeFile | null>(null);
  const fields = {
    name: "Name",
    category: "Category",
    description: "Description",
    price: "Price",
    minimumDp: "Minimum deposit",
    duration: "Duration",
    guestCapacity: "Guest capacity",
    serviceArea: "Service area",
    terms: "Package terms",
    maxOrdersPerDay: "Maximum orders per day",
  };
  const numeric = new Set(["price", "minimumDp", "guestCapacity", "maxOrdersPerDay"]);
  async function save(status: string) {
    if (
      !values.name.trim() ||
      !values.category.trim() ||
      (status === "ACTIVE" && (!values.description.trim() || !values.price.trim()))
    )
      throw new Error("REQUIRED");
    const payload: Record<string, string | number | boolean> = {
      status,
      active: true,
      ...(product ? {} : { vendorId: profile.id }),
    };
    Object.keys(fields).forEach((key) => {
      const value = values[key].trim();
      if (numeric.has(key)) {
        if (
          value &&
          (!Number.isSafeInteger(Number(value)) ||
            Number(value) < (key === "maxOrdersPerDay" ? 1 : 0))
        )
          throw new Error("INVALID_NUMBER");
        if (value) payload[key] = Number(value);
      } else payload[key] = value;
    });
    if (Number(payload.minimumDp ?? 0) > Number(payload.price ?? 0))
      throw new Error("INVALID_NUMBER");
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => body.append(key, String(value)));
    if (image) appendFile(body, "images", image);
    const result = await api<VendorProduct>(
      product ? `/vendor-products/${product.id}` : "/vendor-products",
      { method: product ? "PUT" : "POST", body: image ? body : JSON.stringify(payload) },
    );
    go("product", result.id);
  }
  return (
    <Card>
      {Object.entries(fields).map(([key, label]) => (
        <Field
          key={key}
          label={t(label)}
          value={values[key]}
          onChangeText={(value) => setValues((previous) => ({ ...previous, [key]: value }))}
          keyboardType={numeric.has(key) ? "number-pad" : "default"}
          multiline={["description", "terms"].includes(key)}
          required={["name", "category", "price"].includes(key)}
        />
      ))}
      <Button
        title={image?.name || t("Add photo")}
        variant="secondary"
        onPress={() => void action.run(async () => setImage(await chooseFile(true)))}
      />
      <Feedback error={action.error} />
      <Button
        title={t("Save draft")}
        variant="secondary"
        busy={action.busy}
        onPress={() => void action.run(() => save("DRAFT"))}
      />
      <Button
        title={t("Save")}
        busy={action.busy}
        onPress={() => void action.run(() => save("ACTIVE"))}
      />
    </Card>
  );
}
interface StoreData {
  id: number;
  businessName: string;
  description: string;
  city: string;
  province: string;
  serviceArea: string;
  categories: string[];
  isVerified: boolean;
  logoAttachmentId?: string;
  portfolioAttachmentIds: string[];
}
export function StoreScreen({ id }: { id: string }) {
  const { api } = useAuth();
  const { t, locale } = useI18n();
  const go = useGo();
  const [tab, setTab] = useState("Products");
  const [page, setPage] = useState(1);
  const resource = useResource(async () => {
    const store = await api<StoreData>(`/vendor-profile/${positiveId(id)}/store`);
    if (store.id !== Number(id)) throw new Error("INVALID_RESPONSE");
    const products =
      tab === "Products"
        ? await api<Page<VendorProduct>>(
            `/vendor-products${query({ vendorId: Number(id), marketplace: true, status: "ACTIVE", pageNumber: page, pageSize: 10 })}`,
          )
        : null;
    if (products?.data.some((product) => product.vendor.id !== Number(id)))
      throw new Error("INVALID_RESPONSE");
    const reviews =
      tab === "Reviews"
        ? await api<
            Page<{
              id: string;
              rating: number;
              comment: string;
              customer?: { fullName: string };
              vendor?: { id: number };
            }>
          >(
            `/vendor-product-reviews${query({ vendorId: Number(id), pageNumber: page, pageSize: 10 })}`,
          )
        : null;
    return { store, products, reviews };
  }, [api, id, tab, page]);
  return (
    <Screen>
      <H1>{resource.data?.store.businessName || t("Vendor")}</H1>
      <View style={styles.row}>
        {["Products", "Portfolio", "Reviews", "Description"].map((label) => (
          <Button
            key={label}
            title={t(label)}
            variant={tab === label ? "primary" : "secondary"}
            onPress={() => {
              setTab(label);
              setPage(1);
            }}
          />
        ))}
      </View>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        resource.data && (
          <>
            {tab === "Products" ? (
              <>
                {resource.data.products?.data.map((product) => (
                  <RowLink
                    key={product.id}
                    title={product.name}
                    subtitle={money(product.price, locale)}
                    onPress={() => go("product", product.id)}
                  />
                ))}
                {!resource.data.products?.data.length && <Empty />}
                <Pagination
                  page={page}
                  total={resource.data.products?.total ?? 0}
                  onChange={setPage}
                />
              </>
            ) : tab === "Portfolio" ? (
              resource.data.store.portfolioAttachmentIds?.length ? (
                resource.data.store.portfolioAttachmentIds.map((attachment) => (
                  <AttachmentImage key={attachment} id={attachment} height={240} />
                ))
              ) : (
                <Empty />
              )
            ) : tab === "Reviews" ? (
              <>
                {resource.data.reviews?.data.map((review) => (
                  <Card key={review.id}>
                    <P>
                      {review.customer?.fullName} · {review.rating} / 5
                    </P>
                    <P>{review.comment}</P>
                  </Card>
                ))}
                {!resource.data.reviews?.data.length && <Empty />}
                <Pagination
                  page={page}
                  total={resource.data.reviews?.total ?? 0}
                  onChange={setPage}
                />
              </>
            ) : (
              <Card>
                <P>{resource.data.store.description}</P>
                <Detail
                  label={t("Location")}
                  value={[resource.data.store.city, resource.data.store.province]
                    .filter(Boolean)
                    .join(", ")}
                />
                <Detail label={t("Service area")} value={resource.data.store.serviceArea} />
              </Card>
            )}
          </>
        )
      )}
    </Screen>
  );
}
