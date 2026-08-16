import { API_ROUTES } from "@/constants/apiRoutes";
import { ApiError } from "@/services/api";
import {
  authenticatedDataRequest,
  authenticatedFetch,
  authenticatedRequest,
} from "@/services/authenticatedApi";

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
  const response = await authenticatedFetch(API_ROUTES.attachments.file(attachmentId), {
    headers: { Accept: "image/*,application/pdf" },
  });

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

async function deleteAttachment(attachmentId: string) {
  return authenticatedRequest(API_ROUTES.attachments.byId(attachmentId), {
    method: "DELETE",
  });
}
