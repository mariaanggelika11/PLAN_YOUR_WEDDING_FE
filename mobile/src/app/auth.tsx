import { useLocalSearchParams } from "expo-router";
import { AuthScreen } from "../screens/AuthScreen";

export default function AuthRoute() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const initialFlow = mode === "customer" || mode === "vendor" ? mode : "login";
  return <AuthScreen key={initialFlow} initialFlow={initialFlow} />;
}
