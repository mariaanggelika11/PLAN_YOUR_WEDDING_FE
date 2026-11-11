import { Stack, useLocalSearchParams } from "expo-router";
import { PageContent } from "../screens/PageContent";
import { titles, type Kind } from "../navigation";
import { useI18n } from "../i18n";
import { Screen, Feedback } from "../components/ui";
export default function PageRoute() {
  const params = useLocalSearchParams<{ kind?: string | string[]; id?: string | string[] }>();
  const { t } = useI18n();
  if (typeof params.kind !== "string" || !Object.hasOwn(titles, params.kind))
    return (
      <Screen>
        <Feedback error={new Error("FORBIDDEN")} />
      </Screen>
    );
  const kind = params.kind as Kind;
  return (
    <>
      <Stack.Screen options={{ title: t(titles[kind]) }} />
      <PageContent
        key={`${kind}-${params.id ?? ""}`}
        kind={kind}
        id={typeof params.id === "string" ? params.id : undefined}
      />
    </>
  );
}
