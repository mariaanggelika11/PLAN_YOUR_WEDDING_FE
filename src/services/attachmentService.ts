import { API_ROUTES } from "@/constants/apiRoutes";
import { API_BASE_URL, ApiError } from "@/services/api";
import { apiRequest } from "@/services/api";
import { getSession } from "@/services/authService";
import type { ApiResponse } from "@/types/api";

export interface AttachmentRecord {
  id: string;
  referenceTable: string;
  referenceId: number;
  category?: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

interface AttachmentPage {
  data: AttachmentRecord[];
  total: number;
  pageNumber: number;
  pageSize: number;
}

const VENDOR_PROFILE_REFERENCE = "vendor_profiles";
const VENDOR_LOGO_CATEGORY = "logo";
const CUSTOMER_PROFILE_REFERENCE = "customer_profiles";
const CUSTOMER_AVATAR_CATEGORY = "avatar";

export async function getAttachmentBlob(attachmentId: string): Promise<Blob> {
  const session = getSession();
  if (!session) throw new ApiError("Sesi login tidak ditemukan.", 401);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_ROUTES.attachments.file(attachmentId)}`, {
      headers: {
        Accept: "image/*,application/pdf",
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
  } catch {
    throw new ApiError("File attachment tidak dapat dimuat.", 0);
  }

  if (!response.ok) {
    throw new ApiError("File attachment tidak dapat dimuat.", response.status);
  }
  return response.blob();
}

export async function getVendorLogo(vendorProfileId: number) {
  const attachments = await getAttachments(
    VENDOR_PROFILE_REFERENCE,
    vendorProfileId,
    VENDOR_LOGO_CATEGORY,
  );
  return attachments[0] ?? null;
}

export async function replaceVendorLogo(vendorProfileId: number, file: File) {
  const previous = await getAttachments(
    VENDOR_PROFILE_REFERENCE,
    vendorProfileId,
    VENDOR_LOGO_CATEGORY,
  );
  const session = getSession();
  if (!session) throw new ApiError("Sesi login tidak ditemukan.", 401);

  const data = new FormData();
  data.set("file", file);
  data.set("referenceTable", VENDOR_PROFILE_REFERENCE);
  data.set("referenceId", String(vendorProfileId));
  data.set("category", VENDOR_LOGO_CATEGORY);
  data.set("description", "Logo bisnis vendor");
  const response = await apiRequest<ApiResponse<AttachmentRecord>>(API_ROUTES.attachments.root, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: data,
  });

  await Promise.allSettled(previous.map((attachment) => deleteAttachment(attachment.id)));
  return response.data;
}

export async function deleteVendorLogo(vendorProfileId: number) {
  const logos = await getAttachments(
    VENDOR_PROFILE_REFERENCE,
    vendorProfileId,
    VENDOR_LOGO_CATEGORY,
  );
  await Promise.all(logos.map((logo) => deleteAttachment(logo.id)));
}

export async function deleteCustomerAvatar(customerProfileId: number) {
  const avatars = await getAttachments(
    CUSTOMER_PROFILE_REFERENCE,
    customerProfileId,
    CUSTOMER_AVATAR_CATEGORY,
  );
  await Promise.all(avatars.map((avatar) => deleteAttachment(avatar.id)));
}

async function getAttachments(referenceTable: string, referenceId: number, category: string) {
  const session = getSession();
  if (!session) throw new ApiError("Sesi login tidak ditemukan.", 401);
  const query = new URLSearchParams({
    referenceTable,
    referenceId: String(referenceId),
    category,
    pageNumber: "1",
    pageSize: "10",
  });
  const response = await apiRequest<ApiResponse<AttachmentPage>>(
    `${API_ROUTES.attachments.root}?${query}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  );
  return response.data.data;
}

async function deleteAttachment(attachmentId: string) {
  const session = getSession();
  if (!session) throw new ApiError("Sesi login tidak ditemukan.", 401);
  return apiRequest<ApiResponse<null>>(API_ROUTES.attachments.byId(attachmentId), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
}
