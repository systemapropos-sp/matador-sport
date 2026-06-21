/**
 * usePermisos — Real-time banca permissions from Supabase.
 *
 * Loads permissions for the vendor's banca_code from the
 * `banca_permisos` table and subscribes to real-time changes.
 *
 * CRASH-SAFE: if Supabase realtime fails (table doesn't exist, network error,
 * React StrictMode double-invoke), the hook silently falls back to
 * "all permissions = true" and never breaks the app.
 *
 * Default: all permissions are TRUE (unrestricted) if no record exists.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type PermisoRecord = Record<string, boolean>;

interface UsePermisosReturn {
  permisos: PermisoRecord;
  /** Returns true if permiso is enabled (default: true if not set) */
  hasPerm: (key: string) => boolean;
  loading: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const BIZ_ID = 'bb000001-0000-0000-0000-000000000001';

// ──────────────────────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────────────────────

export function usePermisos(): UsePermisosReturn {
  const [permisos, setPermisos] = useState<PermisoRecord>({});
  const [loading, setLoading]   = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Read vendorCode once — it won't change during a session
  const vendorCode = localStorage.getItem('nmv_vendor_code') ?? '';

  // ── Fetch initial permissions (simple HTTP, no realtime) ──────────────────
  const fetchPermisos = useCallback(async () => {
    if (!vendorCode) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('banca_permisos')
        .select('permisos')
        .eq('banca_id', vendorCode)
        .eq('business_id', BIZ_ID)
        .maybeSingle();

      if (error) {
        // Table may not exist yet — not a fatal error
        console.warn('[usePermisos] fetch warning (non-fatal):', error.message);
      } else if (data?.permisos) {
        setPermisos(data.permisos as PermisoRecord);
      }
    } catch (err) {
      console.warn('[usePermisos] fetch error (non-fatal):', err);
    } finally {
      setLoading(false);
    }
  }, [vendorCode]);

  // ── Supabase Realtime subscription ───────────────────────────────────────
  // Uses a unique channel name (Date.now()) to avoid React StrictMode
  // double-invoke "already subscribed" crash.
  useEffect(() => {
    if (!vendorCode) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    fetchPermisos();

    // Create a UNIQUE channel name each time to avoid conflicts
    const channelName = `banca-permisos-${vendorCode}-${Date.now()}`;

    let destroyed = false;

    try {
      const channel = supabase
        .channel(channelName)
        .on(
          // @ts-ignore — some Supabase versions type this differently
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'banca_permisos',
            filter: `banca_id=eq.${vendorCode}`,
          },
          (payload: { new?: { permisos?: PermisoRecord } }) => {
            if (destroyed) return;
            console.log('[usePermisos] realtime update received');
            const newPermisos = payload?.new?.permisos;
            if (newPermisos && typeof newPermisos === 'object') {
              setPermisos(newPermisos);
            }
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.warn('[usePermisos] subscription warning (non-fatal):', err);
          } else {
            console.log(`[usePermisos] realtime status: ${status} banca: ${vendorCode}`);
          }
        });

      channelRef.current = channel;
    } catch (err) {
      // Catch any sync errors during channel setup (e.g. duplicate subscribe)
      console.warn('[usePermisos] channel setup warning (non-fatal):', err);
    }

    return () => {
      destroyed = true;
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (e) {
          // Ignore cleanup errors
        }
        channelRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorCode]); // Only re-subscribe if vendorCode changes (i.e., different login)

  // hasPerm: defaults to TRUE (open) if key not set — never blocks by default
  const hasPerm = useCallback(
    (key: string): boolean => {
      if (!vendorCode) return true; // not logged in = no restriction
      const val = permisos[key];
      return val === undefined ? true : val; // missing key → default ON
    },
    [permisos, vendorCode]
  );

  return { permisos, hasPerm, loading };
}

export default usePermisos;
