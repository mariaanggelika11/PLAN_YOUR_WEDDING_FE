import { mockProducts, mockVendors } from "@/constants/mockData";
// TODO API: Ambil daftar vendor marketplace dari backend dengan filter dan pagination
export async function searchMarketplace() {
  return { vendors: mockVendors, products: mockProducts };
}
