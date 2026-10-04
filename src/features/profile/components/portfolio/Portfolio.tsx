"use client";
import { useCallback, useState } from "react";
import { getAttachmentBlob, deleteAttachment } from "@/features/profile/api/attachmentApi";
import { updateVendorProfile } from "@/features/profile/api/profileApi";
import { useImageUpload } from "@/features/profile/hooks/useImageUpload";
import { useVendorProfile } from "@/features/profile/hooks/useVendorProfile";
import {
  PROFILE_IMAGE_TYPES,
  validateAttachment,
} from "@/features/profile/validation/attachmentValidation";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { usePopup } from "@/shared/components/feedback/Popup";
import { AppButton } from "@/shared/components/ui/AppButton";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/shared/components/feedback/AsyncStates";

export function PortfolioImage({
  id,
  alt = "Karya portofolio vendor",
}: {
  id: string;
  alt?: string;
}) {
  const load = useCallback(() => getAttachmentBlob(id), [id]);
  const image = useImageUpload({ enabled: true, load, loadErrorMessage: "Foto gagal dimuat." });
  return image.previewUrl ? (
    <a href={image.previewUrl} target="_blank" rel="noreferrer">
      <img
        src={image.previewUrl}
        alt={alt}
        className="aspect-square w-full rounded-lg object-cover"
      />
    </a>
  ) : (
    <div className="grid aspect-square place-items-center rounded-lg bg-stone-100 text-xs text-stone-500">
      Foto belum tersedia
    </div>
  );
}
export function PortfolioGallery({ ids }: { ids: string[] }) {
  return ids.length ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {ids.map((id) => (
        <PortfolioImage key={id} id={id} />
      ))}
    </div>
  ) : (
    <EmptyState
      title="Belum ada portofolio"
      description="Vendor belum menambahkan foto hasil pekerjaannya."
    />
  );
}
export function PortfolioEditor() {
  const resource = useVendorProfile();
  const action = useAsyncAction();
  const popup = usePopup();
  const [files, setFiles] = useState<File[]>([]);
  const [inputKey, setInputKey] = useState(0);
  if (resource.loading) return <LoadingSkeleton />;
  if (resource.error) return <ErrorState retry={() => void resource.reload()} />;
  const profile = resource.profile;
  if (!profile) return null;
  const canEdit =
    profile.active !== false && (profile.isVerified || [1, 4].includes(profile.status ?? 1));
  async function upload() {
    if (!profile || !canEdit || !files.length) return;
    const data = new FormData();
    data.set("keepPortfolioAttachmentIds", JSON.stringify(profile.portfolioAttachmentIds ?? []));
    for (const file of files) {
      const error = validateAttachment(file, {
        allowedTypes: PROFILE_IMAGE_TYPES,
        formatMessage: "Gunakan JPG, PNG, atau WebP.",
        sizeMessage: "Maksimal 5 MB per foto.",
      });
      if (error) return popup.error(error);
      data.append("portfolioImages", file);
    }
    const result = await action.run(() => updateVendorProfile(profile.id, data), {
      successMessage: "Portofolio berhasil ditambahkan.",
    });
    if (result.success) {
      setFiles([]);
      setInputKey((key) => key + 1);
      await resource.reload();
    }
  }
  async function remove(id: string) {
    if (!canEdit || !profile?.portfolioAttachmentIds.includes(id)) return;
    const confirmation = await popup.confirm({
      title: "Hapus foto portofolio?",
      message: "Foto ini akan dihapus dari toko.",
      variant: "warning",
    });
    if (!confirmation.confirmed) return;
    const result = await action.run(() => deleteAttachment(id), {
      successMessage: "Foto dihapus.",
    });
    if (result.success) await resource.reload();
  }
  return (
    <section className="grid gap-4 rounded-xl border bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Portofolio toko</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(profile.portfolioAttachmentIds ?? []).map((id) => (
          <div className="grid gap-2" key={id}>
            <PortfolioImage id={id} />
            {canEdit && (
              <AppButton
                variant="secondary"
                disabled={action.loading}
                onClick={() => void remove(id)}
              >
                Hapus foto
              </AppButton>
            )}
          </div>
        ))}
      </div>
      {canEdit && (
        <>
          <label className="grid gap-2 text-sm font-medium">
            Pilih foto portofolio
            <input
              key={inputKey}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={action.loading}
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className="w-full min-w-0 rounded-lg border p-3"
            />
          </label>
          <p className="text-xs text-stone-500">
            JPG, PNG, atau WebP. Maksimal 5 MB per foto. Foto baru ditambahkan tanpa menghapus foto
            yang sudah tersimpan.
          </p>
          <AppButton
            className="w-fit"
            loading={action.loading}
            disabled={!files.length}
            onClick={() => void upload()}
          >
            Simpan portofolio
          </AppButton>
        </>
      )}
    </section>
  );
}
