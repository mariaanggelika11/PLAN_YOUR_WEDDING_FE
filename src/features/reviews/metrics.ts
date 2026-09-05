import type { VendorProductReview } from "@/features/reviews/api";

/** Never substitute another purchase's review when an order has no review. */
export function findOrderReview<T extends Pick<VendorProductReview, "order">>(
  reviews: T[],
  orderId: string,
) {
  return reviews.find((review) => review.order?.id === orderId) ?? null;
}

export function compactCount(value: number) {
  return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}
