/**
 * useSorteosVendor — Fetches sorteos (lotteries) from Supabase
 * with Realtime subscription. When admin edits a sorteo (name,
 * color, schedule, active), the change propagates here instantly.
 *
 * FALLBACK: if Supabase is unavailable or table doesn't exist,
 * uses the hardcoded regularLotteries array as default.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { regularLotteries } from '@/data/lotteries';
import type { Lottery } from '@/types';

const BIZ_ID = localStorage.getItem('nmv_business_id') || 'bb000001-0000-0000-0000-000000000001';

export interface SorteoRow {
  id: string;
  nombre: string;
  abreviacion: string;
  horario: string;
  horario_cierre?: string;
  color: string;
  activo: boolean;
  orden: number;
  icon?: string;
}

/** Map a Supabase sorteo row → Lottery interface */
function toSorteoLottery(s: SorteoRow): Lottery {
  // Map icon by name pattern — supports existing logo files
  const n = s.nombre.toLowerCase();
  let icon = s.icon ?? '';
  if (!icon) {
    if (n.includes('florida'))        icon = '/florida-icon.png';
    else if (n.includes('new york') || n.includes('ny')) icon = '/newyork-icon.png';
    else if (n.includes('anguila'))   icon = '/logo-anguila.png';
    else if (n.includes('king'))      icon = '/logo-king.png';
    else if (n.includes('loteka') || n.includes('loteca'))   icon = '/logo-loteka.png';
    else if (n.includes('leidsa'))    icon = '/logo-leidsa.png';
    else if (n.includes('primera'))   icon = '/logo-la-primera.png';
    else if (n.includes('suerte'))    icon = '/logo-la-suerte.png';
    else if (n.includes('nacional') || n.includes('gana mas')) icon = '/logo-nacional.png';
    else if (n.includes('lotedom'))   icon = '/logo-lotedom.png';
    else if (n.includes('real'))      icon = '/logo-real.png';
    else if (n.includes('ganamas') || n.includes('gana mas')) icon = '/logo-ganamas.png';
  }
  return {
    id:       s.id,
    name:     s.nombre,
    schedule: s.horario,    // apertura
    type:     'regular',
    icon,
    color:    s.color,
  };
}

/** closingTimes map: lotteryId → closing time string */
export type ClosingTimesMap = Record<string, string>;

interface UseSorteosVendorReturn {
  lotteries: Lottery[];
  closingTimes: ClosingTimesMap;
  loading: boolean;
}

export function useSorteosVendor(): UseSorteosVendorReturn {
  const [lotteries, setLotteries]     = useState<Lottery[]>(regularLotteries);
  const [closingTimes, setClosingTimes] = useState<ClosingTimesMap>({});
  const [loading, setLoading]         = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchSorteos = useCallback(async () => {
    try {
      const bizId = localStorage.getItem('nmv_business_id') || BIZ_ID;
      const { data, error } = await supabase
        .from('sorteos')
        .select('*')
        .eq('business_id', bizId)
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (!error && data && data.length > 0) {
        const rows = data as SorteoRow[];
        setLotteries(rows.map(toSorteoLottery));
        // Build closingTimes map: id → horario_cierre
        const ct: ClosingTimesMap = {};
        rows.forEach(r => {
          if (r.horario_cierre) ct[r.id] = r.horario_cierre;
        });
        setClosingTimes(ct);
      } else {
        // Fallback to hardcoded — no data in Supabase yet
        setLotteries(regularLotteries);
        setClosingTimes({});
      }
    } catch (err) {
      console.warn('[useSorteosVendor] fetch error (non-fatal):', err);
      setLotteries(regularLotteries);
      setClosingTimes({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSorteos();

    // Realtime — unique channel name to avoid React StrictMode conflicts
    const channelName = `sorteos-vendor-${Date.now()}`;
    let destroyed = false;

    try {
      const bizId = localStorage.getItem('nmv_business_id') || BIZ_ID;
      const channel = supabase
        .channel(channelName)
        .on(
          // @ts-ignore
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sorteos', filter: `business_id=eq.${bizId}` },
          () => { if (!destroyed) fetchSorteos(); }
        )
        .subscribe((status, err) => {
          if (err) console.warn('[useSorteosVendor] realtime warning:', err);
        });
      channelRef.current = channel;
    } catch (err) {
      console.warn('[useSorteosVendor] channel setup (non-fatal):', err);
    }

    return () => {
      destroyed = true;
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch { /* ignore */ }
        channelRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { lotteries, closingTimes, loading };
}

export default useSorteosVendor;
