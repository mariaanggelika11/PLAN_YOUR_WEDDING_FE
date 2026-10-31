export interface CustomerRegistrationData {
  fullname: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  /** id of the active terms version shown to (and accepted by) the user */
  termsVersionId: number;
}

export interface VendorRegistrationData {
  ownerName: string;
  businessName: string;
  email: string;
  businessPhone: string;
  businessAddress: string;
  password: string;
  confirmPassword: string;
  /** id of the active terms version shown to (and accepted by) the user */
  termsVersionId: number;
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
