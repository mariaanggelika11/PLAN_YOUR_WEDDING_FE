import { mockReviews } from "@/constants/mockData";
// TODO API: Customer mengirim review setelah order completed
export async function createReview() {
  return mockReviews[0];
}
// TODO API: Ambil daftar review dari backend
export async function getReviews() {
  return mockReviews;
}
