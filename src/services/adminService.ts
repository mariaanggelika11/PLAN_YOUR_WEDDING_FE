import { mockAdminSummary, mockVendors } from "@/constants/mockData";
// TODO API: Ambil ringkasan dashboard admin dari backend
export async function getAdminSummary() {
  return mockAdminSummary;
}
// TODO API: Ambil daftar vendor pending verification dari backend
export async function getPendingVendors() {
  return mockVendors.filter((vendor) => vendor.status === "PENDING_VERIFICATION");
}
// TODO API: Admin approve atau reject vendor
export async function verifyVendor() {
  return true;
}
// TODO API: Admin mengambil audit log dari backend
export async function getAuditLogs() {
  return [];
}
