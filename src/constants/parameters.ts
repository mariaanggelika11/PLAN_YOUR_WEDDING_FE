export const MASTER_PARAMETER_CODES = {
  customerEventType: "JENIS ACARA",
  vendorCategory: "KATEGORI VENDOR",
} as const;

export const CUSTOMER_PROFILE_PARAMETER_CODES = [
  MASTER_PARAMETER_CODES.customerEventType,
  MASTER_PARAMETER_CODES.vendorCategory,
] as const;

export const VENDOR_PROFILE_PARAMETER_CODES = [MASTER_PARAMETER_CODES.vendorCategory] as const;
