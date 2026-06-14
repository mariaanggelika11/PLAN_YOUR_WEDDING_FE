import { mockPayments } from "@/constants/mockData";
// TODO API: Upload bukti pembayaran ke backend/storage
export async function uploadPaymentProof() {
  return mockPayments[0];
}
// TODO API: Ambil status pembayaran dari backend
export async function getPaymentStatus() {
  return mockPayments[0].status;
}
// TODO API: Ambil daftar payment waiting verification dari backend
export async function getPendingPayments() {
  return mockPayments;
}
// TODO API: Admin approve atau reject bukti pembayaran manual
export async function verifyPayment() {
  return true;
}
