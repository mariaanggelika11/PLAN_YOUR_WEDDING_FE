import type { MasterParameterOption } from "@/features/parameters/useMasterParameters";
import type { VendorRelatedData } from "@/features/profile/api/profileApi";
import { eventTypeApiValue, serializeCategoryValues } from "@/features/profile/rules";
import type {
  CustomerApiProfile,
  VendorApiProfile,
  VendorProfileUpdatePayload,
} from "@/features/profile/types";

export type VendorContactField = "instagramUrl" | "tiktokUrl" | "websiteUrl" | "whatsappNumber";

export const VENDOR_CONTACT_OPTIONS = [
  { field: "whatsappNumber", label: "WhatsApp", placeholder: "Contoh: 081234567890", type: "tel" },
  {
    field: "instagramUrl",
    label: "Instagram",
    placeholder: "https://instagram.com/nama-vendor",
    type: "url",
  },
  {
    field: "tiktokUrl",
    label: "TikTok",
    placeholder: "https://tiktok.com/@nama-vendor",
    type: "url",
  },
  { field: "websiteUrl", label: "Website", placeholder: "https://vendor.com", type: "url" },
] as const satisfies ReadonlyArray<{
  field: VendorContactField;
  label: string;
  placeholder: string;
  type: "tel" | "url";
}>;

export function customerProfileToForm(profile: CustomerApiProfile | null) {
  return {
    fullName: profile?.fullName ?? "",
    gender: profile?.gender ?? "",
    birthDate: dateInputValue(profile?.birthDate),
    address: profile?.address ?? "",
    city: profile?.city ?? "",
    province: profile?.province ?? "",
    weddingDate: dateInputValue(profile?.weddingDate),
    weddingLocation: profile?.weddingLocation ?? "",
    weddingCity: profile?.weddingCity ?? "",
    weddingProvince: profile?.weddingProvince ?? "",
    eventType: profile?.eventType ?? "",
    weddingTheme: profile?.weddingTheme ?? "",
    estimatedGuests: profile?.estimatedGuests ?? "",
    neededVendorCategories: profile?.neededVendorCategories ?? [],
    preferredVendorLocation: profile?.preferredVendorLocation ?? "",
    packagePreference: profile?.packagePreference ?? "",
    estimatedBudget: profile?.estimatedBudget ?? "",
    budgetRangeMin: profile?.budgetRangeMin ?? "",
    budgetRangeMax: profile?.budgetRangeMax ?? "",
    budgetPriorities: profile?.budgetPriorities ?? [],
  };
}

export function vendorProfileToForm(profile: VendorApiProfile | null) {
  return {
    ownerName: profile?.ownerName ?? "",
    businessName: profile?.businessName ?? "",
    businessEmail: profile?.businessEmail ?? "",
    businessPhone: profile?.businessPhone ?? "",
    businessAddress: profile?.businessAddress ?? "",
    city: profile?.city ?? "",
    province: profile?.province ?? "",
    latitude: profile?.latitude ?? "",
    longitude: profile?.longitude ?? "",
    description: profile?.description ?? "",
    serviceArea: profile?.serviceArea ?? "",
    categories: profile?.categories ?? [],
  };
}

export function customerFormToPayload(
  form: HTMLFormElement,
  eventTypeOptions: MasterParameterOption[],
) {
  const data = new FormData();
  const fields = [
    "fullName",
    "gender",
    "birthDate",
    "address",
    "city",
    "province",
    "weddingDate",
    "eventType",
    "weddingProvince",
    "weddingCity",
    "weddingLocation",
    "weddingTheme",
    "estimatedGuests",
    "preferredVendorLocation",
    "packagePreference",
    "estimatedBudget",
    "budgetRangeMin",
    "budgetRangeMax",
    "removeAvatarPhoto",
  ] as const;
  fields.forEach((field) => {
    const value = formValue(form, field);
    if (!value) return;
    data.set(field, field === "eventType" ? eventTypeApiValue(value, eventTypeOptions) : value);
  });
  data.set(
    "neededVendorCategories",
    serializeCategoryValues(formValues(form, "neededVendorCategories")),
  );
  data.set("budgetPriorities", serializeCategoryValues(formValues(form, "budgetPriorities")));
  const avatar = formFile(form, "avatarPhoto");
  if (avatar) data.set("avatarPhoto", avatar);
  return data;
}

export function resolveEventTypeOption(
  savedValue: string | null | undefined,
  options: MasterParameterOption[],
) {
  if (!savedValue) return "";
  return (
    options.find((option) => eventTypeApiValue(option.value, options) === savedValue)?.value ?? ""
  );
}

export function vendorFormToPayload(form: HTMLFormElement) {
  const data = new FormData();
  const fields = [
    "businessName",
    "ownerName",
    "businessEmail",
    "businessPhone",
    "businessAddress",
    "city",
    "province",
    "latitude",
    "longitude",
    "description",
    "serviceArea",
    "logoUrl",
  ] as const;
  fields.forEach((field) => {
    const value = formValue(form, field);
    if (value) data.set(field, field === "businessEmail" ? value.toLowerCase() : value);
  });
  data.set("categories", serializeCategoryValues(formValues(form, "categories")));
  return data;
}

export function vendorFormToUpdatePayload(form: HTMLFormElement) {
  return vendorFormToPayload(form);
}

export function vendorFormToBusinessPayload(form: HTMLFormElement): VendorProfileUpdatePayload {
  const latitude = formValue(form, "latitude");
  const longitude = formValue(form, "longitude");
  return {
    businessName: formValue(form, "businessName"),
    businessEmail: formValue(form, "businessEmail").toLowerCase(),
    businessPhone: formValue(form, "businessPhone"),
    businessAddress: formValue(form, "businessAddress"),
    city: formValue(form, "city"),
    province: formValue(form, "province"),
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    description: formValue(form, "description"),
    serviceArea: formValue(form, "serviceArea"),
  };
}

export function vendorFormToRelatedData(
  form: HTMLFormElement,
  profile: VendorApiProfile | null,
): VendorRelatedData {
  const contacts = VENDOR_CONTACT_OPTIONS.flatMap((option) => {
    const value = formValue(form, option.field);
    const existing = savedVendorContact(profile, option.field);
    return value ? [{ id: existing?.id, contactType: option.label, contactValue: value }] : [];
  });
  const bankName = formValue(form, "bankName");
  const accountNumber = formValue(form, "bankAccountNumber");
  const accountHolderName = formValue(form, "bankAccountHolder");
  const documentType = formValue(form, "legalDocumentType");
  const documentNumber = formValue(form, "legalDocumentNumber");
  const documentFile = formFile(form, "legalDocumentFile");

  return {
    contacts,
    bankAccount:
      bankName && accountNumber && accountHolderName
        ? { bankName, accountNumber, accountHolderName }
        : undefined,
    bankAccountId: primaryBankAccount(profile)?.id,
    verificationDocument:
      documentType && documentFile
        ? { documentType, documentNumber, file: documentFile }
        : undefined,
  };
}

export function formValue(form: HTMLFormElement, field: string) {
  return String(new FormData(form).get(field) ?? "").trim();
}

export function formValues(form: HTMLFormElement, field: string) {
  return new FormData(form)
    .getAll(field)
    .map(String)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function formFile(form: HTMLFormElement, field: string) {
  const value = new FormData(form).get(field);
  return value instanceof File && value.size > 0 ? value : null;
}

export function savedVendorContact(profile: VendorApiProfile | null, field: VendorContactField) {
  const option = VENDOR_CONTACT_OPTIONS.find((item) => item.field === field);
  if (!option) return undefined;
  const aliases = new Set(
    [field, option.label].map((value) => value.toLowerCase().replace(/[^a-z0-9]/g, "")),
  );
  return profile?.contacts?.find((contact) =>
    aliases.has(contact.contactType.toLowerCase().replace(/[^a-z0-9]/g, "")),
  );
}

export function primaryBankAccount(profile: VendorApiProfile | null) {
  return profile?.bankAccounts?.find((account) => account.isPrimary) ?? profile?.bankAccounts?.[0];
}

export function primaryVerificationDocument(profile: VendorApiProfile | null) {
  return (
    profile?.verificationDocuments?.find((document) => document.active) ??
    profile?.verificationDocuments?.[0]
  );
}

export function dateInputValue(value?: string | null) {
  return value?.slice(0, 10) ?? "";
}
