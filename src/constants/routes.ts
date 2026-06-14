export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  customer: {
    dashboard: "/customer/dashboard",
    marketplace: "/customer/marketplace",
    orders: "/customer/orders",
    profile: "/customer/profile",
  },
  vendor: {
    dashboard: "/vendor/dashboard",
    products: "/vendor/products",
    orders: "/vendor/orders",
    profile: "/vendor/profile",
  },
  admin: {
    dashboard: "/admin/dashboard",
    vendors: "/admin/vendor-verification",
    payments: "/admin/payment-verification",
  },
} as const;
