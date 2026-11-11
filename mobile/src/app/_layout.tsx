import { Stack } from "expo-router";
import { AppProviders } from "../providers";
import { useAuth } from "../auth/Provider";
import { Screen, Loading, Feedback, colors } from "../components/ui";
import { NavigationShell, WorkspaceHeader } from "../components/NavigationChrome";

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
function RootNavigator() {
  const { session, ready, storageError, retryStorage } = useAuth();
  if (!ready)
    return (
      <Screen top>
        <Loading />
      </Screen>
    );
  if (!session && storageError)
    return (
      <Screen top>
        <Feedback error={new Error("STORAGE_ERROR")} retry={retryStorage} />
      </Screen>
    );
  return (
    <NavigationShell>
      <Stack
        screenOptions={{
          header: ({ options }) => <WorkspaceHeader back title={options.title} />,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Protected guard={!session}>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="page" />
        </Stack.Protected>
      </Stack>
    </NavigationShell>
  );
}
