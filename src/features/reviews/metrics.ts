import type { VendorProductReview } from "@/features/reviews/api";

export function calculateReviewMetrics(reviews: Array<Pick<VendorProductReview, "rating">>) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  let totalRating = 0;
  reviews.forEach((review) => {
    const rating = Math.min(5, Math.max(1, Number(review.rating) || 0));
    if (!rating) return;
    totalRating += rating;
    distribution[rating] += 1;
  });
  const count = Object.values(distribution).reduce((total, value) => total + value, 0);
  return { average: count ? totalRating / count : 0, count, distribution };
}

export function compactCount(value: number) {
  return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
