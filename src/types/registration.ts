export interface CustomerRegistrationData {
  fullname: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface VendorRegistrationData {
  ownerName: string;
  businessName: string;
  email: string;
  businessPhone: string;
  businessAddress: string;
  password: string;
  confirmPassword: string;
}

export interface RegisteredUser {
  id: number;
  fullname: string;
  email: string;
}

export interface RegistrationResult<TProfile = Record<string, unknown>> {
  user: RegisteredUser;
  profile: TProfile;
}
