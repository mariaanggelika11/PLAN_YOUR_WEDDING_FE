export function parseStoreId(id: string) {
  const value = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Toko tidak ditemukan.");
  }
  return value;
}

export function assertStoreOwnership(items: { vendor?: { id: number } }[], vendorId: number) {
  if (items.some((item) => Number(item.vendor?.id) !== vendorId)) {
    throw new Error("Data toko tidak sesuai. Silakan coba lagi.");
  }
}
