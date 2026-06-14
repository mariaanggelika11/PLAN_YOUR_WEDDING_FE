import { mockCustomers } from "@/constants/mockData";
// TODO API: Ambil data customer profile dari backend
export async function getCustomerProfile() {
  return mockCustomers[0];
}
// TODO API: Simpan customer profile ke backend
export async function saveCustomerProfile() {
  return mockCustomers[0];
}
