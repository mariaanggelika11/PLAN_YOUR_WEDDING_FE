import { mockVendors } from "@/constants/mockData";
// TODO API: Ambil daftar vendor marketplace dari backend
export async function getVendors() {
  return mockVendors;
}
// TODO API: Ambil detail vendor berdasarkan vendor ID
export async function getVendorById(id: string) {
  return mockVendors.find((vendor) => vendor.id === id);
}
// TODO API: Ambil status verifikasi vendor dari backend
export async function getVendorVerificationStatus() {
  return mockVendors[2].status;
}
// TODO API: Simpan profile bisnis vendor ke backend
export async function saveVendorProfile() {
  return mockVendors[0];
}
// TODO API: Simpan kategori vendor ke backend
export async function saveVendorCategories() {
  return true;
}
// TODO API: Upload dokumen verifikasi vendor ke backend/storage
export async function uploadVendorDocument() {
  return true;
}
