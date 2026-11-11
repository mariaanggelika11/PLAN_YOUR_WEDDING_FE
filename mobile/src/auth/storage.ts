import * as SecureStore from "expo-secure-store";
import type { Session } from "../domain/contracts";
import { validSession } from "../domain/rules";
const key = "pyw.native.session.v1";
export async function readSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (validSession(value)) return value;
  } catch {
    /* Invalid sessions are discarded. */
  }
  await SecureStore.deleteItemAsync(key);
  return null;
}
export async function storeSession(value: Session | null) {
  if (value)
    await SecureStore.setItemAsync(key, JSON.stringify(value), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  else await SecureStore.deleteItemAsync(key);
}
