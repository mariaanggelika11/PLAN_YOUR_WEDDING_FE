import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./auth/Provider";
import { restoreLanguage, useI18n } from "./i18n";
import { Button, Feedback, Loading, Screen } from "./components/ui";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void restoreLanguage().finally(() => setReady(true));
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <ErrorBoundary>
          {ready ? (
            children
          ) : (
            <Screen>
              <Loading />
            </Screen>
          )}
        </ErrorBoundary>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <ErrorFallback retry={() => this.setState({ failed: false })} />
    ) : (
      this.props.children
    );
  }
}
function ErrorFallback({ retry }: { retry: () => void }) {
  const { t } = useI18n();
  return (
    <Screen>
      <Feedback error={new Error("REQUEST_FAILED")} />
      <Button title={t("Try again")} onPress={retry} />
    </Screen>
  );
}
