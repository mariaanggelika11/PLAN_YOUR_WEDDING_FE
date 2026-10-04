/** Complete paginated reads for small account-scoped aggregates, never marketplace search. */
export async function readAllPages<T extends { id: string | number }>(
  load: (pageNumber: number) => Promise<{ data: T[]; total: number; pageSize: number }>,
): Promise<T[]> {
  const items: T[] = [];
  const ids = new Set<string>();
  let expected: number | undefined;
  for (let page = 1; page <= 100; page++) {
    const result = await load(page);
    if (
      !Number.isSafeInteger(result.total) ||
      result.total < 0 ||
      result.pageSize <= 0 ||
      (expected !== undefined && result.total !== expected)
    )
      throw new Error("Data berubah saat dimuat. Silakan coba lagi.");
    expected = result.total;
    for (const item of result.data) {
      const id = String(item.id);
      if (ids.has(id)) throw new Error("Data halaman berulang. Silakan muat ulang.");
      ids.add(id);
      items.push(item);
    }
    if (items.length === expected) return items;
    if (!result.data.length || items.length > expected)
      throw new Error("Data belum lengkap. Silakan muat ulang.");
  }
  throw new Error("Data terlalu besar untuk diringkas. Hubungi dukungan.");
}
