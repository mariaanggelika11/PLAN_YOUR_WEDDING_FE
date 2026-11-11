import React from "react";
import { useAuth } from "../auth/Provider";
import { useI18n } from "../i18n";
import type { TermsDocument, TermsStatus } from "../domain/contracts";
import { ApiError, jsonBody } from "../api/client";
import { Screen, Button, Loading, Feedback } from "./ui";
import { TermsCheckbox, TermsDialog } from "./Terms";
import { useAction, useResource } from "./hooks";

export function ConsentGate({ children }: { children: React.ReactNode }) {
  const { api, session } = useAuth();
  const resource = useResource(
    async () =>
      session!.user.role === "ADMIN"
        ? { requiresAcceptance: false, pending: [] }
        : api<TermsStatus>("/terms/me/status"),
    [api, session!.user.role],
  );
  if (resource.loading)
    return (
      <Screen top>
        <Loading />
      </Screen>
    );
  if (
    resource.error ||
    !resource.data ||
    (resource.data.requiresAcceptance && !resource.data.pending.length)
  )
    return (
      <Screen top>
        <Feedback
          error={resource.error || new Error("INVALID_RESPONSE")}
          retry={() => void resource.reload()}
        />
      </Screen>
    );
  if (!resource.data.requiresAcceptance) return children;
  const document = resource.data.pending[0];
  return (
    <UpdatedTerms
      key={`${document.id}-${document.version}-${document.contentHash}`}
      document={document}
      reload={resource.reload}
    />
  );
}

function UpdatedTerms({
  document,
  reload,
}: {
  document: TermsDocument;
  reload: () => Promise<void>;
}) {
  const { api, logout } = useAuth();
  const { t } = useI18n();
  const action = useAction();
  const [checked, setChecked] = React.useState(false);
  return (
    <TermsDialog
      document={document}
      visible
      description={t(
        "We have updated our terms and conditions. Read and agree to the latest version to continue using Plan Your Wedding.",
      )}
      footer={
        <>
          <TermsCheckbox
            label={t("I have read and agree to the latest terms and conditions.")}
            checked={checked}
            onChange={setChecked}
            disabled={action.busy}
          />
          <Feedback error={action.error} />
          <Button
            title={t("Accept and continue")}
            disabled={!checked}
            busy={action.busy}
            onPress={() =>
              void action.run(async () => {
                try {
                  await api("/terms/accept", jsonBody({ termsVersionId: document.id }));
                } catch (error) {
                  if (error instanceof ApiError && error.code === "TERMS_OUTDATED") {
                    setChecked(false);
                    await reload();
                  }
                  throw error;
                }
                setChecked(false);
                await reload();
              })
            }
          />
          <Button
            title={t("Sign out")}
            variant="text"
            disabled={action.busy}
            onPress={() => void action.run(logout)}
          />
        </>
      }
    />
  );
}
