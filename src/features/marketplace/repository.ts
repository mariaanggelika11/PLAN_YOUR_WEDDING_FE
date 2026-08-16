import { mockCategories, mockVendors } from "@/mocks/mockData";
export const marketplaceRepository = {
  categories: () => mockCategories,
  vendors: () => mockVendors,
};
