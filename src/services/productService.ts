import { mockProducts } from "@/constants/mockData";
// TODO API: Ambil detail paket layanan berdasarkan product ID
export async function getProductById(id: string) {
  return mockProducts.find((product) => product.id === id);
}
// TODO API: Ambil daftar product vendor dari backend
export async function getVendorProducts() {
  return mockProducts;
}
// TODO API: Buat product/service package ke backend
export async function createProduct() {
  return mockProducts[0];
}
// TODO API: Update product/service package ke backend
export async function updateProduct() {
  return mockProducts[0];
}
// TODO API: Ubah status product active/inactive/deleted
export async function updateProductStatus() {
  return true;
}
