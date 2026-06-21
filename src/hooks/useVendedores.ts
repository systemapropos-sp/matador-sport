/**
 * useVendedores — Provides the active vendor from the NMV auth session.
 *
 * CRITICAL: reads from nmv_vendor_id / nmv_vendor_name (set by saveVendorSession)
 * so each vendor sees THEIR OWN name regardless of which device they use.
 * No hardcoded defaults. No "María" fallback.
 */
import { useState, useCallback, useEffect } from 'react';

export interface Vendedor {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

// Keys used by vendorAuth.ts
const NMV_VENDOR_ID   = 'nmv_vendor_id';
const NMV_VENDOR_NAME = 'nmv_vendor_name';

/** Load the active vendor from the real NMV auth session */
function loadFromAuthSession(): Vendedor | null {
  const id   = localStorage.getItem(NMV_VENDOR_ID);
  const name = localStorage.getItem(NMV_VENDOR_NAME);
  if (id && name) {
    return { id, name, active: true, createdAt: new Date().toISOString() };
  }
  return null;
}

export function useVendedores() {
  const [authVendor, setAuthVendor] = useState<Vendedor | null>(() => loadFromAuthSession());

  // Re-read when localStorage changes (e.g. after login/logout)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === NMV_VENDOR_ID || e.key === NMV_VENDOR_NAME) {
        setAuthVendor(loadFromAuthSession());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Build a single-element list from the auth session
  const vendedores: Vendedor[] = authVendor ? [authVendor] : [];

  // activeVendedor is always the logged-in vendor from the auth session
  const activeVendedor: Vendedor | null = authVendor;
  const activeVendedorId: string | null = authVendor?.id ?? null;

  // These mutators are kept for API compatibility but update localStorage directly
  const setActive = useCallback((_id: string) => {
    // In NMV, the active vendor is set by the auth session — not manually
    setAuthVendor(loadFromAuthSession());
  }, []);

  const addVendedor = useCallback((name: string) => {
    const v: Vendedor = {
      id: `v-${Date.now()}`,
      name,
      active: true,
      createdAt: new Date().toISOString(),
    };
    return v.id;
  }, []);

  const removeVendedor = useCallback((_id: string) => {
    // No-op in Supabase-auth mode
  }, []);

  const renameVendedor = useCallback((_id: string, _name: string) => {
    // No-op in Supabase-auth mode
  }, []);

  return {
    vendedores,
    activeVendedor,
    activeVendedorId,
    setActive,
    addVendedor,
    removeVendedor,
    renameVendedor,
  };
}

export default useVendedores;
