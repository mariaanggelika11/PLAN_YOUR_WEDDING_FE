"use client";
import { AttachmentImage } from "@/shared/components/ui/AttachmentImage";
import { useTranslation } from "@/shared/i18n/useTranslation";

import { PopupMessage } from "@/shared/components/feedback/Popup";
import { AppIconButton } from "@/shared/components/ui/AppIconButton";
import { AppInput } from "@/shared/components/ui/FormFields";
import { Trash2 } from "lucide-react";
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
  const { translateText } = useTranslation();
  return (
    <div className="grid min-w-0 gap-4 md:col-span-2 md:grid-cols-[180px_1fr] md:items-center">
      <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border-2 border-dashed bg-stone-50">
        {isLoading ? (
          <div className="size-full animate-pulse bg-stone-100" />
        ) : previewUrl ? (
          <AttachmentImage alt={alt} className="size-full object-cover" src={previewUrl} />
        ) : (
          <span className="px-4 text-center text-xs text-stone-600">{emptyLabel}</span>
        )}
      </div>
      <div className="grid min-w-0 gap-2">
        <AppInput
          accept="image/jpeg,image/png,image/webp"
          helper={helper}
          label={inputLabel}
          name={inputName}
          onChange={onChange}
          type="file"
        />
        <p className="text-xs leading-5 text-stone-600">{translateText(note)}</p>
        {onRemove && previewUrl && (
          <AppIconButton
            label={translateText("Hapus {0}", { 0: inputLabel.toLowerCase() })}
            onClick={onRemove}
            type="button"
            variant="danger"
          >
            <Trash2 size={17} />
          </AppIconButton>
        )}
        {error && <PopupMessage message={translateText(error)} variant="error" />}
      </div>
    </div>
  );
}
