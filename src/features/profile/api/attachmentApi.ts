import { ApiError } from "@/shared/api/apiClient";
import {
  authenticatedDataRequest,
  authenticatedFetch,
  authenticatedRequest,
} from "@/shared/api/authenticatedApiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";

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
const MAX_CACHED_ATTACHMENTS = 24;
const attachmentBlobCache = new Map<string, Promise<Blob>>();
let cacheResetListenerRegistered = false;

export function getAttachmentBlob(attachmentId: string): Promise<Blob> {
  registerAttachmentCacheReset();
  const cached = attachmentBlobCache.get(attachmentId);
  if (cached) {
    attachmentBlobCache.delete(attachmentId);
    attachmentBlobCache.set(attachmentId, cached);
    return cached;
  }

  const request = fetchAttachmentBlob(attachmentId).catch((error) => {
    attachmentBlobCache.delete(attachmentId);
    throw error;
  });
  attachmentBlobCache.set(attachmentId, request);
  while (attachmentBlobCache.size > MAX_CACHED_ATTACHMENTS) {
    const oldestKey = attachmentBlobCache.keys().next().value;
    if (oldestKey) attachmentBlobCache.delete(oldestKey);
    else break;
  }
  return request;
}

function registerAttachmentCacheReset() {
  if (cacheResetListenerRegistered || typeof window === "undefined") return;
  window.addEventListener("pyw-auth-change", () => attachmentBlobCache.clear());
  cacheResetListenerRegistered = true;
}

async function fetchAttachmentBlob(attachmentId: string) {
  const response = await authenticatedFetch(API_ROUTES.attachments.file(attachmentId), {
    headers: { Accept: "image/*,application/pdf" },
  });
  if (!response.ok) throw new ApiError("File attachment tidak dapat dimuat.", response.status);
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
  const data = new FormData();
  data.set("file", file);
  data.set("referenceTable", VENDOR_PROFILE_REFERENCE);
  data.set("referenceId", String(vendorProfileId));
  data.set("category", VENDOR_LOGO_CATEGORY);
  data.set("description", "Logo bisnis vendor");
  const attachment = await authenticatedDataRequest<AttachmentRecord>(API_ROUTES.attachments.root, {
    method: "POST",
    body: data,
  });

  await Promise.allSettled(previous.map((attachment) => deleteAttachment(attachment.id)));
  return attachment;
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
  const query = new URLSearchParams({
    referenceTable,
    referenceId: String(referenceId),
    category,
    pageNumber: "1",
    pageSize: "10",
  });
  const page = await authenticatedDataRequest<AttachmentPage>(
    `${API_ROUTES.attachments.root}?${query}`,
  );
  return page.data;
}

export async function deleteAttachment(attachmentId: string) {
  await authenticatedRequest(API_ROUTES.attachments.byId(attachmentId), {
    method: "DELETE",
  });
  attachmentBlobCache.delete(attachmentId);
}
