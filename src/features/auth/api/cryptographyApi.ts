import { apiRequest } from "@/shared/api/apiClient";
import { API_ROUTES } from "@/shared/config/apiRoutes";
import type { ApiResponse } from "@/shared/types/api";

export async function encryptText(plainText: string): Promise<string> {
  const response = await apiRequest<ApiResponse<{ cipherText: string }>>(
    API_ROUTES.cryptography.encrypt,
    {
      method: "POST",
      body: JSON.stringify({ plainText }),
    },
  );

  return response.data.cipherText;
}
