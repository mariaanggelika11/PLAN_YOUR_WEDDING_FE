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
    vendor: "/vendor-profile",
    vendorById: (id: number) => `/vendor-profile/${id}`,
  },
  users: {
    byId: (id: number) => `/users/${id}`,
  },
} as const;
