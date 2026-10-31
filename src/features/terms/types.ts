export type TermsType = "CUSTOMER" | "VENDOR";

/** Same block format the backend stores in terms_versions.content (JSONB). */
export interface TermsBlock {
  kind: "paragraph" | "table";
  text?: string;
  rows?: string[][];
}

export interface TermsDocument {
  id: number;
  termsType: TermsType;
  version: string;
  title: string;
  content: TermsBlock[];
  contentHash: string;
  effectiveAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface TermsStatus {
  requiresAcceptance: boolean;
  pending: TermsDocument[];
}

export type TermsVersionSummary = Omit<TermsDocument, "content"> & { acceptanceCount: number };

export interface CreateTermsVersionInput {
  termsType: TermsType;
  version: string;
  title: string;
  content: TermsBlock[];
  effectiveAt?: string;
  activate?: boolean;
}

/** Lowercase form used in the public URL: GET /terms/active/:type */
export type TermsUserType = "customer" | "vendor";

export interface UserTermsAcceptance {
  id: number;
  userId: number;
  termsVersionId: number;
  acceptedAt: string;
}
