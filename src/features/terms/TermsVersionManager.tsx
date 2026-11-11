"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";

import {
  activateTermsVersion,
  createTermsVersion,
  getTermsVersion,
  getTermsVersions,
} from "@/features/terms/api";
import { parseTermsBlocks, TERMS_TYPE_LABELS } from "@/features/terms/content";
import { TermsDialogContent } from "@/features/terms/components/TermsDialogContent";
import type {
  TermsBlock,
  TermsDocument,
  TermsType,
  TermsVersionSummary,
} from "@/features/terms/types";
import { getErrorMessage } from "@/shared/api/apiClient";
import { usePopup } from "@/shared/components/feedback/Popup";
import { AppButton } from "@/shared/components/ui/AppButton";
import { AppIconButton } from "@/shared/components/ui/AppIconButton";
import { AppDatePicker, AppInput, AppSelect } from "@/shared/components/ui/FormFields";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { formatDate } from "@/shared/utils/formatDate";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Download, Eye, Plus } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";

const DEFAULT_TITLES: Record<TermsType, string> = {
  CUSTOMER: "Syarat & Ketentuan Pengguna",
  VENDOR: "Syarat & Ketentuan Mitra Vendor",
};

type PreviewDocument = Pick<TermsDocument, "title" | "version" | "content"> &
  Partial<Pick<TermsDocument, "effectiveAt" | "contentHash">>;

export function TermsVersionManager() {
  const { translateText, locale } = useTranslation();
  const { confirm, notify } = usePopup();
  const versions = useAsyncResource(getTermsVersions, {
    initialData: [] as TermsVersionSummary[],
  });
  const [formOpen, setFormOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewDocument | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function withVersion(id: number, action: (document: TermsDocument) => void) {
    if (busyId !== null) return;
    setBusyId(id);
    try {
      action(await getTermsVersion(id));
    } catch (error) {
      notify({ message: getErrorMessage(error, "Versi gagal dimuat."), variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  // Unduh isi versi sebagai JSON — titik awal untuk menyusun revisi berikutnya.
  function download(document: TermsDocument) {
    const blob = new Blob([JSON.stringify(document.content, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `terms-${document.termsType.toLowerCase()}-${document.version}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function activate(version: TermsVersionSummary) {
    const audience = version.termsType === "VENDOR" ? "vendor" : "customer";
    const result = await confirm({
      title: translateText("Aktifkan versi {0}?", { 0: version.version }),
      message: translateText(
        "Versi ini menggantikan S&K {0} yang sedang aktif. Seluruh {1} yang sudah terdaftar akan diminta menyetujui versi ini saat membuka aplikasi.",
        { 0: TERMS_TYPE_LABELS[version.termsType].toLowerCase(), 1: audience },
      ),
      confirmLabel: "Aktifkan",
      variant: "warning",
    });
    if (!result.confirmed) return;
    setBusyId(version.id);
    try {
      await activateTermsVersion(version.id);
      notify({
        message: translateText("Versi {0} sekarang aktif.", { 0: version.version }),
        variant: "success",
      });
      await versions.reload({ background: true });
    } catch (error) {
      notify({ message: getErrorMessage(error, "Versi gagal diaktifkan."), variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-stone-600">
          {translateText(
            "Versi yang sudah dibuat tidak dapat diubah karena menjadi bukti persetujuan pengguna. Untuk revisi, unduh JSON versi sebelumnya, ubah isinya, lalu buat versi baru.",
          )}{" "}
        </p>
        <AppButton type="button" onClick={() => setFormOpen(true)} disabled={formOpen}>
          <Plus size={16} /> {translateText("Buat versi baru")}{" "}
        </AppButton>
      </div>

      {formOpen && (
        <TermsVersionForm
          onCancel={() => setFormOpen(false)}
          onPreview={setPreview}
          onCreated={(created) => {
            setFormOpen(false);
            notify({
              message: translateText("Versi {0} berhasil dibuat{1}.", {
                0: created.version,
                1: created.isActive ? " dan diaktifkan" : "",
              }),
              variant: "success",
            });
            void versions.reload({ background: true });
          }}
        />
      )}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">{translateText("Riwayat versi syarat dan ketentuan")}</h2>
          <p className="mt-1 text-xs text-stone-600">
            {translateText(
              "Satu versi aktif per jenis. Kolom “Disetujui” menunjukkan jumlah akun yang menyetujui versi tersebut.",
            )}{" "}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-stone-50 text-xs font-medium text-stone-600 [&_th]:font-medium">
              <tr>
                <th className="p-4">{translateText("Jenis")}</th>
                <th className="p-4">{translateText("Versi")}</th>
                <th className="p-4">{translateText("Judul")}</th>
                <th className="p-4">{translateText("Berlaku sejak")}</th>
                <th className="p-4">{translateText("Disetujui")}</th>
                <th className="p-4">{translateText("Status")}</th>
                <th className="p-4 text-right">{translateText("Aksi")}</th>
              </tr>
            </thead>
            <tbody>
              {versions.loading ? (
                <TableMessage message="Memuat versi syarat dan ketentuan..." />
              ) : versions.error ? (
                <TableMessage message={versions.error} />
              ) : versions.data.length === 0 ? (
                <TableMessage message="Belum ada versi syarat dan ketentuan." />
              ) : (
                versions.data.map((version) => (
                  <tr key={version.id} className="border-t">
                    <td className="p-4 text-stone-600">{TERMS_TYPE_LABELS[version.termsType]}</td>
                    <td className="p-4 font-semibold text-ink">{version.version}</td>
                    <td className="p-4 text-stone-600">{version.title}</td>
                    <td className="p-4 text-stone-600">
                      {formatDate(version.effectiveAt, locale)}
                    </td>
                    <td className="p-4 tabular-nums">{version.acceptanceCount}</td>
                    <td className="p-4">
                      {version.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={13} /> {translateText("Aktif")}{" "}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                          {translateText("Tidak aktif")}{" "}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <AppIconButton
                          label={translateText("Lihat versi {0}", { 0: version.version })}
                          disabled={busyId !== null}
                          onClick={() => void withVersion(version.id, setPreview)}
                        >
                          <Eye size={15} />
                        </AppIconButton>
                        <AppIconButton
                          label={translateText("Unduh JSON versi {0}", { 0: version.version })}
                          disabled={busyId !== null}
                          onClick={() => void withVersion(version.id, download)}
                        >
                          <Download size={15} />
                        </AppIconButton>
                        {!version.isActive && (
                          <AppButton
                            type="button"
                            variant="secondary"
                            className="min-h-9 px-3 py-1.5 text-xs"
                            disabled={busyId !== null}
                            onClick={() => void activate(version)}
                          >
                            {translateText("Aktifkan")}{" "}
                          </AppButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog.Root open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        {preview && (
          <TermsDialogContent
            document={preview}
            idPrefix="terms-admin-preview"
            description={translateText("Tampilan dokumen seperti yang dilihat pengguna.")}
            footer={
              <>
                <p className="min-w-0 break-all font-mono text-[11px] leading-5 text-stone-600">
                  {preview.contentHash
                    ? `SHA-256: ${preview.contentHash}`
                    : translateText("Pratinjau (belum disimpan)")}
                </p>
                <Dialog.Close asChild>
                  <AppButton type="button" variant="secondary">
                    {translateText("Tutup")}{" "}
                  </AppButton>
                </Dialog.Close>
              </>
            }
          />
        )}
      </Dialog.Root>
    </div>
  );
}

function TermsVersionForm({
  onCancel,
  onCreated,
  onPreview,
}: {
  onCancel: () => void;
  onCreated: (created: TermsDocument) => void;
  onPreview: (document: PreviewDocument) => void;
}) {
  const { translateText } = useTranslation();
  const [termsType, setTermsType] = useState<TermsType>("CUSTOMER");
  const [title, setTitle] = useState(DEFAULT_TITLES.CUSTOMER);
  const [version, setVersion] = useState("");
  const [effectiveAt, setEffectiveAt] = useState("");
  const [content, setContent] = useState<TermsBlock[] | null>(null);
  const [fileError, setFileError] = useState("");
  const [activate, setActivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function changeType(next: TermsType) {
    // Judul default ikut berganti selama admin belum menulis judul sendiri.
    if (Object.values(DEFAULT_TITLES).includes(title)) setTitle(DEFAULT_TITLES[next]);
    setTermsType(next);
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setContent(null);
    setFileError("");
    if (!file) return;
    try {
      setContent(parseTermsBlocks(JSON.parse(await file.text())));
    } catch (parseError) {
      setFileError(
        parseError instanceof SyntaxError
          ? "File bukan JSON yang valid."
          : parseError instanceof Error
            ? parseError.message
            : "File tidak dapat dibaca.",
      );
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!content) return setFileError("Unggah file JSON isi syarat dan ketentuan.");
    setSaving(true);
    setError("");
    try {
      onCreated(
        await createTermsVersion({
          termsType,
          version: version.trim(),
          title: title.trim(),
          content,
          ...(effectiveAt
            ? { effectiveAt: new Date(`${effectiveAt}T00:00:00`).toISOString() }
            : {}),
          activate,
        }),
      );
    } catch (createError) {
      setError(getErrorMessage(createError, "Versi gagal dibuat."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-4 rounded-xl border bg-white p-5 shadow-sm" onSubmit={submit}>
      <h2 className="font-semibold">{translateText("Versi baru")}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <AppSelect
          label={translateText("Jenis")}
          required
          value={termsType}
          onChange={(event) => changeType(event.target.value as TermsType)}
        >
          {(Object.keys(TERMS_TYPE_LABELS) as TermsType[]).map((type) => (
            <option key={type} value={type}>
              {TERMS_TYPE_LABELS[type]}
            </option>
          ))}
        </AppSelect>
        <AppInput
          label={translateText("Nomor versi")}
          required
          maxLength={20}
          placeholder={translateText("Contoh: 1.1")}
          value={version}
          onChange={(event) => setVersion(event.target.value)}
        />
        <AppInput
          label={translateText("Judul")}
          required
          maxLength={255}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <AppDatePicker
          label={translateText("Berlaku sejak")}
          helper={translateText("Kosongkan untuk memakai tanggal hari ini.")}
          value={effectiveAt}
          onChange={(event) => setEffectiveAt(event.target.value)}
        />
      </div>
      <AppInput
        label={translateText("Isi (file JSON)")}
        type="file"
        accept=".json,application/json"
        required
        error={fileError}
        helper={translateText(
          'Array blok: { "kind": "paragraph", "text": "..." } atau { "kind": "table", "rows": [["..."]] }.',
        )}
        onChange={(event) => void readFile(event)}
      />
      {content && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
          <span>
            {content.length} {translateText("blok dimuat.")}
          </span>
          <AppButton
            type="button"
            variant="outline"
            className="min-h-9 px-3 py-1.5 text-xs"
            onClick={() => onPreview({ title, version: version || "-", content })}
          >
            <Eye size={14} /> {translateText("Pratinjau")}{" "}
          </AppButton>
        </div>
      )}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={activate}
          onChange={(event) => setActivate(event.target.checked)}
          className="mt-1 size-4 shrink-0 accent-blush"
        />
        <span>
          {translateText(
            "Langsung aktifkan. Pengguna yang sudah terdaftar akan diminta menyetujui versi ini.",
          )}{" "}
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {translateText(error)}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <AppButton type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          {translateText("Batal")}{" "}
        </AppButton>
        <AppButton type="submit" loading={saving}>
          {translateText("Simpan versi")}{" "}
        </AppButton>
      </div>
    </form>
  );
}

function TableMessage({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={7} className="p-8 text-center text-sm text-stone-600">
        {message}
      </td>
    </tr>
  );
}
