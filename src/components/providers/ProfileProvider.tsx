"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getCustomerProfile, getVendorProfile } from "@/services/profileService";
import type { CustomerApiProfile, VendorApiProfile } from "@/types/profile";

type ProfileRole = "customer" | "vendor";

interface ProfileState<T> {
  data: T | null;
  error: string;
  loaded: boolean;
  loading: boolean;
}

interface ProfileContextValue {
  customer: ProfileState<CustomerApiProfile>;
  vendor: ProfileState<VendorApiProfile>;
  loadCustomer: (force?: boolean) => Promise<CustomerApiProfile | null | undefined>;
  loadVendor: (force?: boolean) => Promise<VendorApiProfile | null | undefined>;
  setCustomer: (profile: CustomerApiProfile | null) => void;
  setVendor: (profile: VendorApiProfile | null) => void;
}

const initialState = { data: null, error: "", loaded: false, loading: false };
const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomerState] = useState<ProfileState<CustomerApiProfile>>(initialState);
  const [vendor, setVendorState] = useState<ProfileState<VendorApiProfile>>(initialState);
  const customerRequest = useRef<Promise<CustomerApiProfile | null> | null>(null);
  const vendorRequest = useRef<Promise<VendorApiProfile | null> | null>(null);

  const loadCustomer = useCallback(
    async (force = false) => {
      if (!force && customer.loaded) return customer.data;
      if (customerRequest.current) return customerRequest.current;
      setCustomerState((state) => ({ ...state, error: "", loading: true }));
      const request = getCustomerProfile();
      customerRequest.current = request;
      try {
        const data = await request;
        setCustomerState({ data, error: "", loaded: true, loading: false });
        return data;
      } catch {
        setCustomerState((state) => ({
          ...state,
          error: "Profile customer gagal dimuat.",
          loaded: true,
          loading: false,
        }));
        return undefined;
      } finally {
        customerRequest.current = null;
      }
    },
    [customer.data, customer.loaded],
  );

  const loadVendor = useCallback(
    async (force = false) => {
      if (!force && vendor.loaded) return vendor.data;
      if (vendorRequest.current) return vendorRequest.current;
      setVendorState((state) => ({ ...state, error: "", loading: true }));
      const request = getVendorProfile();
      vendorRequest.current = request;
      try {
        const data = await request;
        setVendorState({ data, error: "", loaded: true, loading: false });
        return data;
      } catch {
        setVendorState((state) => ({
          ...state,
          error: "Profile vendor gagal dimuat.",
          loaded: true,
          loading: false,
        }));
        return undefined;
      } finally {
        vendorRequest.current = null;
      }
    },
    [vendor.data, vendor.loaded],
  );

  const setCustomer = useCallback((data: CustomerApiProfile | null) => {
    setCustomerState({ data, error: "", loaded: true, loading: false });
  }, []);
  const setVendor = useCallback((data: VendorApiProfile | null) => {
    setVendorState({ data, error: "", loaded: true, loading: false });
  }, []);

  useEffect(() => {
    const clear = () => {
      customerRequest.current = null;
      vendorRequest.current = null;
      setCustomerState(initialState);
      setVendorState(initialState);
    };
    window.addEventListener("pyw-auth-change", clear);
    return () => window.removeEventListener("pyw-auth-change", clear);
  }, []);

  const value = useMemo(
    () => ({ customer, loadCustomer, loadVendor, setCustomer, setVendor, vendor }),
    [customer, loadCustomer, loadVendor, setCustomer, setVendor, vendor],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

type ProfileResource<T> = ProfileState<T> & {
  reload: () => Promise<T | null | undefined>;
  setData: (profile: T | null) => void;
};

export function useProfileData(
  role: "customer",
  enabled?: boolean,
): ProfileResource<CustomerApiProfile>;
export function useProfileData(
  role: "vendor",
  enabled?: boolean,
): ProfileResource<VendorApiProfile>;
export function useProfileData(
  role: ProfileRole,
  enabled?: boolean,
): ProfileResource<CustomerApiProfile> | ProfileResource<VendorApiProfile>;
export function useProfileData(role: ProfileRole, enabled = true) {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfileData harus digunakan di dalam ProfileProvider.");
  const state = context[role];
  const load = role === "customer" ? context.loadCustomer : context.loadVendor;
  useEffect(() => {
    if (enabled && !state.loaded && !state.loading) void load();
  }, [enabled, load, state.loaded, state.loading]);
  const result = {
    ...state,
    loading: enabled && (!state.loaded || state.loading),
    reload: useCallback(() => load(true), [load]),
    setData: role === "customer" ? context.setCustomer : context.setVendor,
  };
  return result as ProfileResource<CustomerApiProfile> | ProfileResource<VendorApiProfile>;
}
