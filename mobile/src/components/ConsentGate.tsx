import React from "react";
import { useAuth } from "../auth/Provider";
import { useI18n } from "../i18n";
import type { TermsStatus } from "../domain/contracts";
import { jsonBody } from "../api/client";
import { Screen, Button, Loading, Feedback, H1, Toggle, Card } from "./ui";
import { Terms } from "./Terms";
import { useAction, useResource } from "./hooks";

export function ConsentGate({ children }: { children: React.ReactNode }) {
  const { api, session } = useAuth();
  const { t } = useI18n();
  const action = useAction();
  const [checked, setChecked] = React.useState(false);
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
    <Screen top>
      <H1>{t("Terms and conditions")}</H1>
      <Terms document={document} />
      <Card>
        <Toggle
          label={t("I agree to the terms and conditions")}
          value={checked}
          onChange={setChecked}
        />
        <Feedback error={action.error} />
        <Button
          title={t("Accept and continue")}
          disabled={!checked}
          busy={action.busy}
          onPress={() =>
            void action.run(
              () => api("/terms/accept", jsonBody({ termsVersionId: document.id })),
              async () => {
                setChecked(false);
                await resource.reload();
              },
            )
          }
        />
      </Card>
    </Screen>
  );
}
