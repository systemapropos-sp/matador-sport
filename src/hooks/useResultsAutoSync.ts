/**
 * useResultsAutoSync — NMV Lottery
 * Fuente ÚNICA: Supabase (tabla lottery_results publicada por el admin)
 * - Admin publica resultados → aparecen aquí automáticamente en tiempo real
 * - Realtime subscription para actualizaciones instantáneas
 * - Polling cada 60s como respaldo
 * - Muestra mocks SOLO si Supabase confirma vacío (admin no publicó aún)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export interface LiveResult {
  id: string;
  lottery_name: string;
  draw_date: string;       // normalized from result_date
  result_date?: string;    // real Supabase column name
  draw_time?: string;
  primera?: string;
  segunda?: string;
  tercera?: string;
  pick3?: string;
  pick4?: string;
  pick5?: string;
  company?: string;
  source?: 'supabase' | 'mock';
}

// ── Mock results — sólo cuando admin aún no publicó hoy ────────────────────────
const today = new Date().toISOString().slice(0, 10);
export const MOCK_RESULTS: LiveResult[] = [
  { id: 'm1',  lottery_name: 'Florida AM',      draw_date: today, draw_time: '11:00 AM', primera: '14', segunda: '73', tercera: '92', pick3: '147',  pick4: '3057', pick5: '14739', source: 'mock' },
  { id: 'm2',  lottery_name: 'Florida PM',       draw_date: today, draw_time: '1:30 PM',  primera: '07', segunda: '45', tercera: '62', pick3: '708',  pick4: '4521', pick5: '07456', source: 'mock' },
  { id: 'm3',  lottery_name: 'New York AM',      draw_date: today, draw_time: '12:20 PM', primera: '33', segunda: '81', tercera: '56', pick3: '334',  pick4: '8124', pick5: '33817', source: 'mock' },
  { id: 'm4',  lottery_name: 'New York PM',      draw_date: today, draw_time: '2:30 PM',  primera: '22', segunda: '67', tercera: '11', pick3: '221',  pick4: '6711', pick5: '22671', source: 'mock' },
  { id: 'm5',  lottery_name: 'Nacional 12M',     draw_date: today, draw_time: '12:00 PM', primera: '05', segunda: '38', source: 'mock' },
  { id: 'm6',  lottery_name: 'Nacional 3PM',     draw_date: today, draw_time: '3:00 PM',  primera: '49', segunda: '12', source: 'mock' },
  { id: 'm7',  lottery_name: 'Leidsa 12M',       draw_date: today, draw_time: '12:00 PM', primera: '76', segunda: '03', source: 'mock' },
  { id: 'm8',  lottery_name: 'Leidsa 3PM',       draw_date: today, draw_time: '3:00 PM',  primera: '84', segunda: '20', source: 'mock' },
  { id: 'm9',  lottery_name: 'Real 12M',         draw_date: today, draw_time: '11:55 AM', primera: '91', segunda: '58', source: 'mock' },
  { id: 'm10', lottery_name: 'Loteka 12M',       draw_date: today, draw_time: '12:00 PM', primera: '17', segunda: '64', source: 'mock' },
  { id: 'm11', lottery_name: 'Anguila 10AM',     draw_date: today, draw_time: '10:00 AM', primera: '29', segunda: '73', source: 'mock' },
  { id: 'm12', lottery_name: 'Anguila 12M',      draw_date: today, draw_time: '12:00 PM', primera: '55', segunda: '48', source: 'mock' },
  { id: 'm13', lottery_name: 'Anguila 3PM',      draw_date: today, draw_time: '3:00 PM',  primera: '06', segunda: '81', source: 'mock' },
  { id: 'm14', lottery_name: 'Anguila 6PM',      draw_date: today, draw_time: '6:00 PM',  primera: '37', segunda: '92', source: 'mock' },
  { id: 'm15', lottery_name: 'La Primera 12M',   draw_date: today, draw_time: '12:00 PM', primera: '43', segunda: '86', source: 'mock' },
  { id: 'm16', lottery_name: 'King 12M',         draw_date: today, draw_time: '12:00 PM', primera: '60', segunda: '15', source: 'mock' },
  { id: 'm17', lottery_name: 'La Suerte 12M',    draw_date: today, draw_time: '12:00 PM', primera: '88', segunda: '31', source: 'mock' },
  { id: 'm18', lottery_name: 'Lotedom 12M',      draw_date: today, draw_time: '12:00 PM', primera: '72', segunda: '50', source: 'mock' },
];

// ── Company detection ────────────────────────────────────────────────────────────
export function detectCompany(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('nacional') || n.includes('gana mas') || n.includes('ganamas') || n.includes('loto') || n.includes('quiniela nacional')) return 'Nacional';
  if (n.includes('leidsa') || n.includes('pega 3') || n.includes('pega3') || n.includes('super pale') || n.includes('quiniela pale') || n.includes('quiniela leidsa')) return 'Leidsa';
  if (n.includes('real') && !n.includes('super')) return 'Real';
  if (n.includes('loteka') || n.includes('mega')) return 'Loteka';
  if (n.includes('new york') || n.includes('ny ') || n.includes('midday') || n.includes('win4') || n.includes('numbers')) return 'New York';
  if (n.includes('florida') || n.includes('cash3') || n.includes('cash 3') || n.includes('play4') || n.includes('play 4') || n.includes('pick5') || n.includes('pick 5')) return 'Florida';
  if (n.includes('anguila') || n.includes('anguilla')) return 'Anguila';
  if (n.includes('primera') || n.includes('la primera')) return 'La Primera';
  if (n.includes('loteca') || n.includes('la suerte') || n.includes('king')) return 'Otros (RD)';
  if (n.includes('lotedom')) return 'Lotedom';
  return 'Otros';
}

// ── Main hook ────────────────────────────────────────────────────────────────────
// targetDate: 'yyyy-MM-dd' — defaults to today
export function useResultsAutoSync(targetDate?: string) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dateToUse = targetDate || todayStr;
  const isToday = dateToUse === todayStr;

  const [results, setResults]     = useState<LiveResult[]>([]);
  const [loading, setLoading]     = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load from Supabase ────────────────────────────────────────────────────────
  const loadFromSupabase = useCallback(async (): Promise<LiveResult[]> => {
    try {
      const { data, error: dbErr } = await supabase
        .from('lottery_results')
        .select('*')
        .eq('result_date', dateToUse)
        .order('draw_time', { ascending: true, nullsFirst: false });
      if (dbErr) throw dbErr;
      // Normalize result_date → draw_date so the rest of the UI is consistent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data as any[]) || []).map((r) => ({
        ...r,
        draw_date: r.result_date || r.draw_date || dateToUse,
        source: 'supabase' as const,
      }));
    } catch {
      return [];
    }
  }, [dateToUse]);

  // ── Main sync ─────────────────────────────────────────────────────────────────
  const sync = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const fromDB = await loadFromSupabase();
      setHasLoaded(true);
      if (fromDB.length > 0) {
        setResults(fromDB);
        setLastUpdated(new Date());
      } else if (!isToday) {
        setError('No hay resultados para esta fecha');
      }
    } catch {
      setError('Error al obtener resultados');
    } finally {
      setLoading(false);
    }
  }, [loadFromSupabase, isToday]);

  // ── Supabase Realtime — actualización instantánea cuando admin publica ────────
  useEffect(() => {
    const channel = supabase
      .channel(`lottery-results-${dateToUse}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lottery_results',
        filter: `result_date=eq.${dateToUse}`,
      }, () => {
        loadFromSupabase().then((data) => {
          if (data.length > 0) {
            setResults(data);
            setLastUpdated(new Date());
          }
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dateToUse, loadFromSupabase]);

  // ── Carga inicial + polling cada 60s ─────────────────────────────────────────
  useEffect(() => {
    setResults([]);
    setHasLoaded(false);
    setLastUpdated(null);
    sync(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => sync(false), 60_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sync]);

  // ── Refresh al volver a la pestaña ────────────────────────────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync(false);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [sync]);

  // Mocks SOLO cuando: Supabase confirmó vacío + carga terminó + es hoy
  const isMockData    = hasLoaded && results.length === 0 && !loading && isToday;
  const displayResults = results.length > 0 ? results : (isMockData ? MOCK_RESULTS : []);

  return { results: displayResults, loading, lastUpdated, error, isMockData, refresh: () => sync(true) };
}
