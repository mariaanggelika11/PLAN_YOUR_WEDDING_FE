"use client";

import { PopupMessage } from "@/shared/components/feedback/Popup";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppInput } from "@/shared/components/ui/FormFields";
import type { ChangeEvent } from "react";

interface ImageUploadPreviewProps {
  alt: string;
  emptyLabel: string;
  error?: string;
  helper: string;
  inputLabel: string;
  inputName: string;
  isLoading: boolean;
  note: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
  previewUrl: string;
}

export function ImageUploadPreview({
  alt,
  emptyLabel,
  error,
  helper,
  inputLabel,
  inputName,
  isLoading,
  note,
  onChange,
  onRemove,
  previewUrl,
}: ImageUploadPreviewProps) {
  return (
    <div className="grid gap-4 md:col-span-2 md:grid-cols-[180px_1fr] md:items-center">
      <div className="grid aspect-square place-items-center overflow-hidden rounded-3xl border-2 border-dashed bg-stone-50">
        {isLoading ? (
          <div className="size-full animate-pulse bg-stone-100" />
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={alt} className="size-full object-cover" src={previewUrl} />
        ) : (
          <span className="px-4 text-center text-xs text-stone-400">{emptyLabel}</span>
        )}
      </div>
      <div className="grid gap-2">
        <AppInput
          accept="image/jpeg,image/png,image/webp"
          helper={helper}
          label={inputLabel}
          name={inputName}
          onChange={onChange}
          type="file"
        />
        <p className="text-xs leading-5 text-stone-500">{note}</p>
        {onRemove && previewUrl && (
          <AppButton className="w-fit" onClick={onRemove} type="button" variant="danger">
            Hapus gambar
          </AppButton>
        )}
        {error && <PopupMessage message={error} variant="error" />}
      </div>
    </div>
  );
}
