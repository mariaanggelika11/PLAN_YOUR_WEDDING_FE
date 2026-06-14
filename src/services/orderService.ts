import { mockOrders } from "@/constants/mockData";
// TODO API: Kirim data booking atau checkout ke backend
export async function checkout() {
  return mockOrders[0];
}
// TODO API: Ambil daftar order customer dari backend
export async function getCustomerOrders() {
  return mockOrders;
}
// TODO API: Ambil detail order berdasarkan order ID
export async function getOrderById(id: string) {
  return mockOrders.find((order) => order.id === id);
}
// TODO API: Ambil daftar order vendor dari backend
export async function getVendorOrders() {
  return mockOrders;
}
// TODO API: Vendor menerima atau menolak order
export async function respondToOrder() {
  return true;
}
