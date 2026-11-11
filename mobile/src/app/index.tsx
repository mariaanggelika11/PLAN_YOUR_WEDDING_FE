import { Redirect } from "expo-router";
import { useAuth } from "../auth/Provider";
import { LandingScreen } from "../screens/LandingScreen";
export default function Index() {
  const { session } = useAuth();
  return session ? <Redirect href="/dashboard" /> : <LandingScreen />;
}
