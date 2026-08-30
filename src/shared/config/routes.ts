export const ROUTES = {
  home: "/",
  homeRegister: "/#daftar",
  howItWorks: "/#cara-kerja",
  about: "/#tentang",
  login: "/login",
  forgotPassword: "/forgot-password",
  register: "/register",
  registerCustomer: "/register/customer",
  registerVendor: "/register/vendor",
  customer: {
    dashboard: "/customer/dashboard",
    marketplace: "/customer/marketplace",
    orders: "/customer/orders",
    profile: "/customer/profile",
    progress: "/customer/progress",
    budget: "/customer/budget",
    notifications: "/customer/notifications",
    checkout: (productId: string) => `/customer/checkout/${productId}`,
    payment: (orderId: string) => `/customer/payment/${orderId}`,
    vendor: (id: string) => `/customer/vendors/${id}`,
    product: (id: string) => `/customer/products/${id}`,
    order: (id: string) => `/customer/orders/${id}`,
  },
  vendor: {
    dashboard: "/vendor/dashboard",
    products: "/vendor/products",
    orders: "/vendor/orders",
    profile: "/vendor/profile",
    verificationStatus: "/vendor/verification-status",
    category: "/vendor/category",
    reviews: "/vendor/reviews",
    notifications: "/vendor/notifications",
    settings: "/vendor/settings",
    createProduct: "/vendor/products/create",
    product: (id: string) => `/vendor/products/${id}`,
    editProduct: (id: string) => `/vendor/products/${id}/edit`,
    order: (id: string) => `/vendor/orders/${id}`,
  },
  admin: {
    dashboard: "/admin/dashboard",
    vendors: "/admin/vendor-verification",
    payments: "/admin/payment-verification",
    users: "/admin/users",
    vendorManagement: "/admin/vendors",
    categories: "/admin/categories",
    products: "/admin/products",
    orders: "/admin/orders",
    reviews: "/admin/reviews",
    disputes: "/admin/disputes",
    reports: "/admin/reports",
    auditLogs: "/admin/audit-logs",
    parameters: "/admin/parameters",
    vendorVerification: (id: string) => `/admin/vendor-verification/${id}`,
    paymentVerification: (id: string) => `/admin/payment-verification/${id}`,
  },
} as const;

export type AppRole = "customer" | "vendor" | "admin";

export function dashboardRoute(role: AppRole) {
  return ROUTES[role].dashboard;
}

export function roleRoute(role: AppRole, path: string) {
  return `/${role}/${path}`;
}
