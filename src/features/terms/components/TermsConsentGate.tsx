"use client";

import { useAuth } from "@/features/auth/useAuth";
import { acceptTerms, getMyTermsStatus } from "@/features/terms/api";
import { TermsDialogContent } from "@/features/terms/components/TermsDialogContent";
import type { TermsStatus } from "@/features/terms/types";
import { getErrorMessage } from "@/shared/api/apiClient";
import { isTermsOutdated } from "@/shared/api/errorCodes";
import { AppButton } from "@/shared/components/ui/AppButton";
import { ROUTES } from "@/shared/config/routes";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useState } from "react";

/**
 * Asks a logged-in customer/vendor to accept terms that were updated after they registered.
 * The backend decides what is pending (GET /terms/me/status); if that request fails the app
 * stays usable and the check simply runs again on the next visit.
 */
export function TermsConsentGate() {
  const { logout } = useAuth();
  const loadStatus = useCallback(() => getMyTermsStatus(), []);
  const status = useAsyncResource<TermsStatus | null>(loadStatus, { initialData: null });
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const current = status.data?.pending[0];
  if (!current) return null;

  async function accept() {
    if (!current || saving) return;
    setSaving(true);
    setError("");
    try {
      await acceptTerms(current.id);
      setChecked(false);
      await status.reload({ background: true });
    } catch (acceptError) {
      if (isTermsOutdated(acceptError)) {
        setChecked(false);
        await status.reload({ background: true });
      }
      setError(getErrorMessage(acceptError, "Persetujuan gagal disimpan. Silakan coba lagi."));
    } finally {
      setSaving(false);
    }
  }

  function leave() {
    void logout();
    window.location.replace(ROUTES.login);
  }

  return (
    <Dialog.Root open>
      <TermsDialogContent
        key={current.id}
        dismissible={false}
        document={current}
        idPrefix={`terms-consent-${current.id}`}
        description="Kami telah memperbarui syarat dan ketentuan. Baca dan setujui versi terbaru untuk melanjutkan menggunakan Plan Your Wedding."
        footer={
          <div className="grid w-full gap-3">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={checked}
                disabled={saving}
                onChange={(event) => setChecked(event.target.checked)}
                className="mt-1 size-4 shrink-0 accent-blush"
              />
              <span>Saya telah membaca dan menyetujui {current.title.toLowerCase()} terbaru.</span>
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AppButton type="button" variant="ghost" disabled={saving} onClick={leave}>
                Keluar
              </AppButton>
              <AppButton
                type="button"
                loading={saving}
                disabled={!checked}
                onClick={() => void accept()}
              >
                Setujui dan lanjutkan
              </AppButton>
            </div>
          </div>
        }
      />
    </Dialog.Root>
  );
}
