export const API_ROUTES = {
  cryptography: {
    encrypt: "/cryptography/encrypt",
  },
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    profile: "/auth/profile",
    forgotPassword: "/auth/forgot-password",
    verifyOtp: "/auth/verify-otp",
    resendOtp: "/auth/resend-otp",
    changePassword: "/auth/change-password",
  },
  register: {
    customer: "/register/customer",
    vendor: "/register/vendor",
  },
  profile: {
    customer: "/customer-profile",
    customerById: (id: number) => `/customer-profile/${id}`,
    customerByUserId: (userId: number) => `/customer-profile/user/${userId}`,
    customerSaveDraft: "/customer-profile/save-draft",
    vendor: "/vendor-profile",
    vendorById: (id: number) => `/vendor-profile/${id}`,
    vendorByUserId: (userId: number) => `/vendor-profile/user/${userId}`,
    vendorSaveDraft: "/vendor-profile/save-draft",
    vendorSubmit: "/vendor-profile/submit",
  },
  users: {
    root: "/users",
    byId: (id: number) => `/users/${id}`,
  },
  userRoles: {
    root: "/user-roles",
  },
  attachments: {
    root: "/attachments",
    file: (id: string) => `/attachments/${id}/file`,
    byId: (id: string) => `/attachments/${id}`,
  },
  parameters: {
    root: "/parameter",
    byId: (id: string) => `/parameter/${id}`,
  },
  contacts: {
    forUser: (userId: number) => `/contacts/user/${userId}`,
    byId: (id: string) => `/contacts/${id}`,
  },
  bankAccounts: {
    forUser: (userId: number) => `/bank-accounts/user/${userId}`,
    byId: (id: string) => `/bank-accounts/${id}`,
  },
  verificationDocuments: {
    forUser: (userId: number) => `/verification-documents/user/${userId}`,
    byId: (id: string) => `/verification-documents/${id}`,
  },
  vendorProducts: {
    root: "/vendor-products",
    byId: (id: string) => `/vendor-products/${id}`,
  },
  orders: {
    root: "/orders",
    byId: (id: string) => `/orders/${id}`,
    confirm: (id: string) => `/orders/${id}/confirm`,
    reject: (id: string) => `/orders/${id}/reject`,
    start: (id: string) => `/orders/${id}/start`,
    deliver: (id: string) => `/orders/${id}/deliver`,
    complete: (id: string) => `/orders/${id}/complete`,
  },
  vendorProductReviews: {
    root: "/vendor-product-reviews",
    byId: (id: string) => `/vendor-product-reviews/${id}`,
  },
  orderPayments: {
    root: "/order-payments",
    byId: (id: string) => `/order-payments/${id}`,
    proof: (id: string) => `/order-payments/${id}/proof`,
    verify: (id: string) => `/order-payments/${id}/verify`,
    reject: (id: string) => `/order-payments/${id}/reject`,
  },
} as const;
