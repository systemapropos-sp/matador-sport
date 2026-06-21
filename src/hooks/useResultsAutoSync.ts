/**
 * useResultsAutoSync — NMV Lottery
 * Auto-fetches lottery results from loteriasdominicanas.com via CORS proxy
 * + Supabase Realtime subscription for instant admin updates
 * Polls every 60s during lottery hours (8AM–11PM)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export interface LiveResult {
  id: string;
  lottery_name: string;
  draw_date: string;
  draw_time?: string;
  primera?: string;
  segunda?: string;
  tercera?: string;
  pick3?: string;
  pick4?: string;
  pick5?: string;
  company?: string;
  source?: 'live' | 'supabase' | 'mock';
}

// ── CORS proxies (tried in order until one succeeds) ────────────────────────────
const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const TARGET_URL = 'https://loteriasdominicanas.com/';

// ── Mock results (shown when no live data is available) ─────────────────────────
const today = new Date().toISOString().slice(0, 10);
export const MOCK_RESULTS: LiveResult[] = [
  { id: 'm1', lottery_name: 'Florida AM',      draw_date: today, draw_time: '11:00 AM', primera: '14', segunda: '73', tercera: '92', pick3: '147', pick4: '3057', pick5: '14739', source: 'mock' },
  { id: 'm2', lottery_name: 'Florida PM',      draw_date: today, draw_time: '1:30 PM',  primera: '07', segunda: '45', tercera: '62', pick3: '708', pick4: '4521', pick5: '07456', source: 'mock' },
  { id: 'm3', lottery_name: 'New York AM',     draw_date: today, draw_time: '12:20 PM', primera: '33', segunda: '81', tercera: '56', pick3: '334', pick4: '8124', pick5: '33817', source: 'mock' },
  { id: 'm4', lottery_name: 'New York PM',     draw_date: today, draw_time: '2:30 PM',  primera: '22', segunda: '67', tercera: '11', pick3: '221', pick4: '6711', pick5: '22671', source: 'mock' },
  { id: 'm5', lottery_name: 'Nacional 12M',    draw_date: today, draw_time: '12:00 PM', primera: '05', segunda: '38', source: 'mock' },
  { id: 'm6', lottery_name: 'Nacional 3PM',    draw_date: today, draw_time: '3:00 PM',  primera: '49', segunda: '12', source: 'mock' },
  { id: 'm7', lottery_name: 'Leidsa 12M',      draw_date: today, draw_time: '12:00 PM', primera: '76', segunda: '03', source: 'mock' },
  { id: 'm8', lottery_name: 'Leidsa 3PM',      draw_date: today, draw_time: '3:00 PM',  primera: '84', segunda: '20', source: 'mock' },
  { id: 'm9', lottery_name: 'Real 12M',        draw_date: today, draw_time: '11:55 AM', primera: '91', segunda: '58', source: 'mock' },
  { id: 'm10', lottery_name: 'Loteka 12M',     draw_date: today, draw_time: '12:00 PM', primera: '17', segunda: '64', source: 'mock' },
  { id: 'm11', lottery_name: 'Anguila 10AM',   draw_date: today, draw_time: '10:00 AM', primera: '29', segunda: '73', source: 'mock' },
  { id: 'm12', lottery_name: 'Anguila 12M',    draw_date: today, draw_time: '12:00 PM', primera: '55', segunda: '48', source: 'mock' },
  { id: 'm13', lottery_name: 'Anguila 3PM',    draw_date: today, draw_time: '3:00 PM',  primera: '06', segunda: '81', source: 'mock' },
  { id: 'm14', lottery_name: 'Anguila 6PM',    draw_date: today, draw_time: '6:00 PM',  primera: '37', segunda: '92', source: 'mock' },
  { id: 'm15', lottery_name: 'La Primera 12M', draw_date: today, draw_time: '12:00 PM', primera: '43', segunda: '86', source: 'mock' },
  { id: 'm16', lottery_name: 'King 12M',       draw_date: today, draw_time: '12:00 PM', primera: '60', segunda: '15', source: 'mock' },
  { id: 'm17', lottery_name: 'La Suerte 12M',  draw_date: today, draw_time: '12:00 PM', primera: '88', segunda: '31', source: 'mock' },
  { id: 'm18', lottery_name: 'Lotedom 12M',    draw_date: today, draw_time: '12:00 PM', primera: '72', segunda: '50', source: 'mock' },
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

// ── HTML parser for loteriasdominicanas.com ──────────────────────────────────────
function parseLoteriasDominicanas(html: string): LiveResult[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const results: LiveResult[] = [];
    const today = format(new Date(), 'yyyy-MM-dd');
    const seen = new Set<string>();

    // Strategy 1: Common card selectors
    const selectors = [
      '.sorteo-resultado', '.resultado-item', '.result-card', '.lottery-result',
      '[data-lottery]', '.card-sorteo', '.game-result', '.resultado',
      'article', '.post-card', '.lottery-card',
    ];

    for (const sel of selectors) {
      const cards = doc.querySelectorAll(sel);
      if (cards.length === 0) continue;

      cards.forEach((card) => {
        // Try to extract lottery name
        const nameEl = card.querySelector('h1,h2,h3,h4,h5,.name,.lottery-name,.sorteo-name,.title,.nombre,.card-title');
        const name = nameEl?.textContent?.trim();
        if (!name || name.length < 3) return;
        if (seen.has(name)) return;

        // Try to extract numbers
        const numberEls = card.querySelectorAll('.numero,.bolita,.ball,.number,.winning-number,.num-ball,.digit,.result-number');
        const numbers = Array.from(numberEls)
          .map((el) => el.textContent?.trim()?.replace(/\D/g, '').padStart(2, '0'))
          .filter((n) => n && n.length >= 2);

        if (numbers.length === 0) return;

        // Try to extract time
        const timeEl = card.querySelector('.time,.hora,.draw-time,.sorteo-time,.schedule-time,.hour');
        const drawTime = timeEl?.textContent?.trim().replace(/[^\d:APMapm\s]/g, '').trim();

        seen.add(name);
        const result: LiveResult = {
          id: `live-${name.toLowerCase().replace(/\s+/g, '-')}`,
          lottery_name: name.toUpperCase(),
          draw_date: today,
          draw_time: drawTime,
          source: 'live',
          company: detectCompany(name),
        };

        // Assign numbers based on count
        if (numbers.length >= 1) result.primera = numbers[0];
        if (numbers.length >= 2) result.segunda = numbers[1];
        if (numbers.length >= 3) result.tercera = numbers[2];
        if (numbers.length >= 4) result.pick3 = numbers.slice(0, 3).join('');
        if (numbers.length >= 5) result.pick4 = numbers.slice(0, 4).join('');
        if (numbers.length >= 6) result.pick5 = numbers.slice(0, 5).join('');

        results.push(result);
      });

      if (results.length > 0) break; // Found results with this selector
    }

    // Strategy 2: Look for table rows with lottery data
    if (results.length === 0) {
      const rows = doc.querySelectorAll('tr');
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length < 2) return;
        const name = cells[0]?.textContent?.trim();
        if (!name || name.length < 3) return;
        const nums = cells.slice(1).map(c => c.textContent?.trim()?.replace(/\D/g, '')).filter(n => n && n.length >= 2);
        if (nums.length === 0 || seen.has(name)) return;
        seen.add(name);
        results.push({
          id: `live-${name.toLowerCase().replace(/\s+/g, '-')}`,
          lottery_name: name.toUpperCase(),
          draw_date: today,
          source: 'live',
          company: detectCompany(name),
          primera: nums[0],
          segunda: nums[1],
          tercera: nums[2],
        });
      });
    }

    return results;
  } catch {
    return [];
  }
}

// ── Check if within lottery hours (8AM – 11PM ET) ───────────────────────────────
function isLotteryHours(): boolean {
  const h = new Date().getHours();
  return h >= 8 && h <= 23;
}

// ── Main hook ────────────────────────────────────────────────────────────────────
export function useResultsAutoSync() {
  const [results, setResults] = useState<LiveResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  // ── Fetch from CORS proxy ──────────────────────────────────────────────────────
  const fetchExternal = useCallback(async (): Promise<LiveResult[]> => {
    for (const makeProxy of PROXIES) {
      try {
        const proxyUrl = makeProxy(TARGET_URL);
        const res = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(12000),
          headers: { 'Accept': 'text/html,application/xhtml+xml' },
        });
        if (!res.ok) continue;
        const html = await res.text();
        if (!html || html.length < 500) continue;
        const parsed = parseLoteriasDominicanas(html);
        if (parsed.length > 0) return parsed;
      } catch {
        // try next proxy
      }
    }
    return [];
  }, []);

  // ── Save external results to Supabase (upsert) ────────────────────────────────
  const saveToSupabase = useCallback(async (liveResults: LiveResult[]) => {
    if (liveResults.length === 0) return;
    try {
      const rows = liveResults.map((r) => ({
        lottery_name: r.lottery_name,
        draw_date: r.draw_date,
        draw_time: r.draw_time || null,
        primera: r.primera || null,
        segunda: r.segunda || null,
        tercera: r.tercera || null,
        pick3: r.pick3 || null,
        pick4: r.pick4 || null,
        pick5: r.pick5 || null,
        company: r.company || null,
      }));
      // Upsert on (lottery_name, draw_date) to avoid duplicates
      await supabase.from('lottery_results').upsert(rows, {
        onConflict: 'lottery_name,draw_date',
        ignoreDuplicates: false,
      });
    } catch { /* silent — don't block UI */ }
  }, []);

  // ── Load from Supabase ─────────────────────────────────────────────────────────
  const loadFromSupabase = useCallback(async (): Promise<LiveResult[]> => {
    try {
      const { data } = await supabase
        .from('lottery_results')
        .select('*')
        .eq('draw_date', today)
        .order('draw_time', { ascending: true, nullsFirst: false });
      return ((data as LiveResult[]) || []).map((r) => ({ ...r, source: 'supabase' as const }));
    } catch {
      return [];
    }
  }, [today]);

  // ── Main sync function ─────────────────────────────────────────────────────────
  const sync = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      // 1. Try external scrape
      const external = await fetchExternal();

      if (external.length > 0) {
        // Save to Supabase in background
        saveToSupabase(external).catch(() => {});
        setResults(external);
        setLastUpdated(new Date());
      } else {
        // 2. Fallback to Supabase
        const fromDB = await loadFromSupabase();
        if (fromDB.length > 0) {
          setResults(fromDB);
          setLastUpdated(new Date());
        }
        // If both are empty, keep existing results (don't flash empty)
        if (external.length === 0 && fromDB.length === 0) {
          setError('Sin datos externos — mostrando últimos disponibles');
        }
      }
    } catch (e) {
      setError('Error al obtener resultados');
    } finally {
      setLoading(false);
    }
  }, [fetchExternal, saveToSupabase, loadFromSupabase]);

  // ── Supabase Realtime subscription ────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('lottery-results-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lottery_results',
        filter: `draw_date=eq.${today}`,
      }, () => {
        // When admin adds a result, reload from DB
        loadFromSupabase().then((data) => {
          if (data.length > 0) {
            setResults(data);
            setLastUpdated(new Date());
          }
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [today, loadFromSupabase]);

  // ── Initial load + periodic polling ───────────────────────────────────────────
  useEffect(() => {
    sync(true);

    // Poll every 60 seconds during lottery hours, every 5 min otherwise
    const interval = isLotteryHours() ? 60_000 : 300_000;
    timerRef.current = setInterval(() => sync(false), interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sync]);

  // ── Refresh from DB when tab becomes visible ───────────────────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync(false);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [sync]);

  // When no real data available, show mock results so the panel looks populated
  const displayResults = results.length > 0 ? results : (!loading ? MOCK_RESULTS : []);
  const isMockData = results.length === 0 && !loading;

  return { results: displayResults, loading, lastUpdated, error, isMockData, refresh: () => sync(true) };
}
