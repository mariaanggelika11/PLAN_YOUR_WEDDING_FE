import { API_ROUTES } from "@/constants/apiRoutes";
import { apiRequest } from "@/services/api";
import type { ApiResponse } from "@/types/api";

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
