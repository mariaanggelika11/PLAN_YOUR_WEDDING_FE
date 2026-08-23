import type { ProductStatus } from "@/shared/types/models";

export function productFormToPayload(
  form: HTMLFormElement,
  status: ProductStatus,
  vendorId?: number,
) {
  const source = new FormData(form);
  const payload = new FormData();
  if (vendorId !== undefined) payload.set("vendorId", String(vendorId));
  const fieldMap = {
    category: "category",
    name: "name",
    description: "description",
    price: "price",
    dp: "minimumDp",
    duration: "duration",
    capacity: "guestCapacity",
    area: "serviceArea",
    terms: "terms",
  } as const;
  Object.entries(fieldMap).forEach(([formName, apiName]) => {
    const value = String(source.get(formName) ?? "").trim();
    if (value) payload.set(apiName, value);
  });
  source.getAll("images").forEach((file) => {
    if (file instanceof File && file.size > 0) payload.append("images", file);
  });
  payload.set("status", status);
  payload.set("active", String(status !== "DELETED"));
  return payload;
}
