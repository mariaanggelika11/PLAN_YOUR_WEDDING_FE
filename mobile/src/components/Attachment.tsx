import React, { useState } from "react";
import { Image, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAuth } from "../auth/Provider";
import { useI18n } from "../i18n";
import { Button, Feedback } from "./ui";
import { validateFile } from "../domain/rules";
import { useAction } from "./hooks";

export type NativeFile = { uri: string; name: string; mimeType: string; size: number };
export async function chooseFile(imagesOnly = false): Promise<NativeFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: imagesOnly ? ["image/jpeg", "image/png"] : ["image/jpeg", "image/png", "application/pdf"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const file = result.assets[0];
  validateFile(file, imagesOnly);
  return { uri: file.uri, name: file.name, mimeType: file.mimeType!, size: file.size! };
}
export function appendFile(body: FormData, key: string, file: NativeFile) {
  // React Native's FormData bridge accepts a local URI object, not a browser File.
  body.append(key, { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
}
export function AttachmentImage({ id, height = 170 }: { id: string; height?: number }) {
  const { session } = useAuth();
  const [failed, setFailed] = useState(false);
  if (failed || !session) return null;
  return (
    <Image
      source={{
        uri: `${(process.env.EXPO_PUBLIC_API_URL || "https://api-planyourwedding.bulmar.tech").replace(/\/$/, "")}/attachments/${encodeURIComponent(id)}/file`,
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }}
      onError={() => setFailed(true)}
      style={{ height, width: "100%", borderRadius: 12, backgroundColor: "#F5F5F4" }}
      resizeMode="cover"
    />
  );
}
export function AttachmentButton({ id }: { id: string }) {
  const { session, api } = useAuth();
  const { t } = useI18n();
  const action = useAction();
  async function open() {
    if (!session) return;
    const base = (
      process.env.EXPO_PUBLIC_API_URL || "https://api-planyourwedding.bulmar.tech"
    ).replace(/\/$/, "");
    const metadata = await api<{ mimeType: string }>(`/attachments/${encodeURIComponent(id)}`);
    const extension = (
      {
        "application/pdf": "pdf",
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      } as Record<string, string>
    )[metadata.mimeType];
    if (!extension) throw new Error("FILE_TYPE");
    const file = await File.downloadFileAsync(
      `${base}/attachments/${encodeURIComponent(id)}/file`,
      new File(Paths.cache, `pyw-${Date.now()}.${extension}`),
      { headers: { Authorization: `Bearer ${session.accessToken}` }, idempotent: true },
    );
    try {
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(file.uri, { mimeType: metadata.mimeType });
      else throw new Error("REQUEST_FAILED");
    } finally {
      if (file.exists) file.delete();
    }
  }
  return (
    <View style={{ gap: 8 }}>
      <Button
        title={t("View attachment")}
        variant="secondary"
        busy={action.busy}
        onPress={() => void action.run(open)}
      />
      <Feedback error={action.error} />
    </View>
  );
}
