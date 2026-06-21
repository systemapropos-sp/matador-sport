/**
 * PlayMonitor — NMV Lottery
 * Monitoreo de jugadas por sorteo y fecha.
 * 5 columnas: Directo · Pale · Tripleta · Cash 3 · Play 4/Pick 5
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Printer, ArrowLeft, Loader2, TrendingUp } from 'lucide-react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { localDateStr } from '@/lib/utils';

// ── Known lotteries ──────────────────────────────────────────────
const LOTTERIES = [
  'Florida AM','Florida PM','New York AM','New York PM',
  'Anguila 10AM','Anguila 12M','Anguila 3PM','Anguila 6PM',
  'Nacional 12M','Nacional 3PM','Leidsa 12M','Leidsa 3PM',
  'Real 12M','Real 3PM','Loteka 12M','Loteka 3PM',
  'King 12M','King 3PM','La Primera 12M','La Primera 3PM',
  'La Suerte 12M','La Suerte 3PM','Lotedom 12M','Lotedom 3PM',
];

interface RawPlay {
  numbers: string;
  amount: number;
  lotteryName: string;
  type?: string;
}

interface AggPlay {
  numbers: string;
  total: number;
  count: number;
}

// ── play type detection ──────────────────────────────────────────
function detectType(numbers: string): 'directo' | 'pale' | 'tripleta' | 'cash3' | 'play4' | 'pick5' | 'other' {
  const clean = numbers.replace(/\D/g, '');
  if (clean.length === 2) return 'directo';
  if (clean.length === 3) return 'cash3';
  if (clean.length === 4) return 'pale';
  if (clean.length === 5) return 'pick5';
  if (clean.length === 6) return 'tripleta';
  return 'other';
}

function formatJugada(numbers: string, type: ReturnType<typeof detectType>): string {
  const c = numbers.replace(/\D/g, '');
  if (type === 'pale' && c.length === 4) return `${c.slice(0,2)}-${c.slice(2)}`;
  if (type === 'tripleta' && c.length === 6) return `${c.slice(0,2)}-${c.slice(2,4)}-${c.slice(4)}`;
  return c;
}

export default function PlayMonitor() {
  const navigate = useNavigate();
  const businessId = localStorage.getItem('nmv_business_id');

  // ── State ────────────────────────────────────────────────────
  const today = localDateStr();  // LOCAL date, not UTC
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedLottery, setSelectedLottery] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);  // prevent auto-reset on refresh
  const [allPlays, setAllPlays] = useState<RawPlay[]>([]);
  const [availableLotteries, setAvailableLotteries] = useState<string[]>(LOTTERIES);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState('');
  const [searchDirecto, setSearchDirecto]   = useState('');
  const [searchPale, setSearchPale]         = useState('');
  const [searchTripleta, setSearchTripleta] = useState('');
  const [searchCash3, setSearchCash3]       = useState('');
  const [searchPlay4, setSearchPlay4]       = useState('');

  /** Read plays from localStorage (matador_tickets + nmv_tickets) as fallback */
  const readFromLocalStorage = useCallback((): RawPlay[] => {
    const collected: RawPlay[] = [];
    const sources = ['matador_tickets', 'nmv_tickets'];
    for (const key of sources) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const tickets = JSON.parse(raw);
        if (!Array.isArray(tickets)) continue;
        for (const ticket of tickets) {
          if (ticket.status === 'cancelled') continue;
          const created = ticket.createdAt || ticket.created_at || '';
          const ticketDate = created ? new Date(created).toISOString().slice(0, 10) : '';
          if (ticketDate && ticketDate !== selectedDate) continue;
          for (const play of (ticket.plays || [])) {
            const lotName = play.lotteryName || play.lotteryId || 'Sin sorteo';
            collected.push({
              numbers: play.numbers || '',
              amount: Number(play.amount || play.monto || 0),
              lotteryName: lotName,
              type: play.type,
            });
          }
        }
      } catch { /* ignore */ }
    }
    return collected;
  }, [selectedDate]);

  // ── Query Supabase (with localStorage fallback) ──────────────
  const loadFromSupabase = useCallback(async () => {
    setLoading(true);
    setDbError('');
    try {
      const startUTC = new Date(`${selectedDate}T00:00:00`).toISOString();
      const endUTC   = new Date(`${selectedDate}T23:59:59`).toISOString();

      let collected: RawPlay[] = [];
      let queryOk = false;

      // ── Attempt 1: with business_id filter ──────────────────
      if (businessId) {
        const { data, error } = await supabase
          .from('tickets')
          .select('metadata, status, created_at')
          .eq('business_id', businessId)
          .gte('created_at', startUTC)
          .lte('created_at', endUTC)
          .neq('status', 'cancelled');

        if (!error && data) {
          for (const ticket of data) {
            const plays = (ticket.metadata as any)?.plays;
            if (!Array.isArray(plays)) continue;
            for (const play of plays) {
              collected.push({
                numbers: play.numbers || '',
                amount: Number(play.amount || play.monto || 0),
                lotteryName: play.lotteryName || play.lotteryId || 'Sin sorteo',
                type: play.type,
              });
            }
          }
          queryOk = true;
        } else if (error) {
          setDbError(`DB: ${error.message}`);
        }
      }

      // ── Attempt 2: without business_id (if first was empty) ──
      if (queryOk && collected.length === 0) {
        const { data: data2 } = await supabase
          .from('tickets')
          .select('plays, status, created_at')
          .gte('created_at', startUTC)
          .lte('created_at', endUTC)
          .neq('status', 'cancelled')
          .limit(200);

        if (data2 && data2.length > 0) {
          for (const ticket of data2) {
            if (!Array.isArray(ticket.plays)) continue;
            for (const play of ticket.plays) {
              collected.push({
                numbers: play.numbers || '',
                amount: Number(play.amount || play.monto || 0),
                lotteryName: play.lotteryName || play.lotteryId || 'Sin sorteo',
                type: play.type,
              });
            }
          }
        }
      }

      // ── Attempt 3: Read from localStorage if still empty ─────
      if (collected.length === 0) {
        collected = readFromLocalStorage();
      }

      const lotteriesFound = new Set(collected.map(p => p.lotteryName));
      setAllPlays(collected);
      setAvailableLotteries(Array.from(new Set([...Array.from(lotteriesFound), ...LOTTERIES])));
      // Only auto-select lottery on the VERY FIRST load — never overwrite user's choice
      if (!selectedLottery && !initialLoadDone && lotteriesFound.size > 0) {
        setSelectedLottery(Array.from(lotteriesFound)[0]);
      }
      setInitialLoadDone(true);
    } catch (err: any) {
      setDbError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }, [businessId, selectedDate, selectedLottery, readFromLocalStorage]);

  useEffect(() => {
    loadFromSupabase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, businessId]);

  // ── Filter by lottery ────────────────────────────────────────
  const filteredPlays = useMemo(() => {
    if (!selectedLottery) return allPlays;
    return allPlays.filter(p =>
      p.lotteryName.toLowerCase() === selectedLottery.toLowerCase() ||
      p.lotteryName.toLowerCase().includes(selectedLottery.toLowerCase()) ||
      selectedLottery.toLowerCase().includes(p.lotteryName.toLowerCase())
    );
  }, [allPlays, selectedLottery]);

  // ── Aggregate ────────────────────────────────────────────────
  const aggregated = useMemo(() => {
    const directo:   Record<string, AggPlay> = {};
    const pale:      Record<string, AggPlay> = {};
    const tripleta:  Record<string, AggPlay> = {};
    const cash3:     Record<string, AggPlay> = {};
    const play4pick5: Record<string, AggPlay> = {};

    for (const play of filteredPlays) {
      const rawType = (play.type as string) || detectType(play.numbers);
      const type = detectType(play.numbers); // use actual digit count as ground truth
      const jugada = formatJugada(play.numbers, type);

      let bucket: Record<string, AggPlay>;
      if (rawType === 'directo' || type === 'directo')      bucket = directo;
      else if (rawType === 'pale' || type === 'pale')       bucket = pale;
      else if (rawType === 'tripleta' || type === 'tripleta') bucket = tripleta;
      else if (rawType === 'cash3' || type === 'cash3')     bucket = cash3;
      else if (rawType === 'play4' || rawType === 'pick4' || rawType === 'pick5' ||
               type === 'pick5')                            bucket = play4pick5;
      else continue;

      const key = jugada;
      if (!bucket[key]) bucket[key] = { numbers: key, total: 0, count: 0 };
      bucket[key].total += play.amount;
      bucket[key].count += 1;
    }

    const sortDesc = (obj: Record<string, AggPlay>) =>
      Object.values(obj).sort((a, b) => b.total - a.total);

    return {
      directo:   sortDesc(directo),
      pale:      sortDesc(pale),
      tripleta:  sortDesc(tripleta),
      cash3:     sortDesc(cash3),
      play4pick5: sortDesc(play4pick5),
    };
  }, [filteredPlays]);

  const grandTotal  = filteredPlays.reduce((s, p) => s + p.amount, 0);
  const totDirecto  = aggregated.directo.reduce((s, x)    => s + x.total, 0);
  const totPale     = aggregated.pale.reduce((s, x)       => s + x.total, 0);
  const totTripleta = aggregated.tripleta.reduce((s, x)   => s + x.total, 0);
  const totCash3    = aggregated.cash3.reduce((s, x)      => s + x.total, 0);
  const totPlay4    = aggregated.play4pick5.reduce((s, x) => s + x.total, 0);

  const maxDirecto  = aggregated.directo[0]?.total    || 1;
  const maxPale     = aggregated.pale[0]?.total       || 1;
  const maxTripleta = aggregated.tripleta[0]?.total   || 1;
  const maxCash3    = aggregated.cash3[0]?.total      || 1;
  const maxPlay4    = aggregated.play4pick5[0]?.total || 1;

  const displayDirecto  = aggregated.directo.filter(x =>
    !searchDirecto || x.numbers.includes(searchDirecto));
  const displayPale     = aggregated.pale.filter(x =>
    !searchPale || x.numbers.includes(searchPale.replace(/\D/g, '').replace(/^(\d{2})(\d{2})$/, '$1-$2')));
  const displayTripleta = aggregated.tripleta.filter(x =>
    !searchTripleta || x.numbers.includes(searchTripleta));
  const displayCash3    = aggregated.cash3.filter(x =>
    !searchCash3 || x.numbers.includes(searchCash3));
  const displayPlay4    = aggregated.play4pick5.filter(x =>
    !searchPlay4 || x.numbers.includes(searchPlay4));

  return (
    <Layout>
      <div style={{ background: '#f8fafc', minHeight: 'calc(100dvh - 50px)', fontFamily: 'system-ui,sans-serif' }}>

        {/* ── Header card ── */}
        <div style={{ background: 'linear-gradient(135deg,#0D9488,#0891B2)', padding: '18px 24px 14px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <TrendingUp size={22} />
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Monitoreo de Jugadas</h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>
            Análisis de ventas por tipo de jugada
          </p>
        </div>

        {/* ── Filters ── */}
        <div style={{ padding: '14px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fecha</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              style={{ height: 40, padding: '0 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#f8fafc', color: '#1e293b' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sorteo</label>
            <select value={selectedLottery} onChange={e => setSelectedLottery(e.target.value)}
              style={{ height: 40, padding: '0 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#f8fafc', color: '#1e293b', minWidth: 200 }}>
              <option value="">— Todos los sorteos —</option>
              {availableLotteries.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <button onClick={() => loadFromSupabase()} disabled={loading}
            style={{ height: 40, padding: '0 18px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.75 : 1 }}>
            {loading ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>} Refrescar
          </button>
          <button onClick={() => window.print()}
            style={{ height: 40, padding: '0 18px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={14}/> Print
          </button>
          <button onClick={() => navigate('/betting-pool/ticket/create')}
            style={{ height: 40, padding: '0 18px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14}/> Volver a Ventas
          </button>
        </div>

        {/* ── Grand total pill ── */}
        {grandTotal > 0 && (
          <div style={{ padding: '14px 20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '10px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                {selectedLottery || 'Todos los sorteos'}
              </span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#e11d48' }}>
                ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {filteredPlays.length} jugadas
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Loader2 size={40} color='#0D9488' className="animate-spin mx-auto"/>
            <p style={{ color: '#64748b', marginTop: 12, fontSize: 14 }}>Cargando jugadas...</p>
          </div>
        ) : !businessId ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 15 }}>
            ⚠️ No hay sesión de vendedor activa.<br/>
            <span style={{ fontSize: 12 }}>Inicia sesión como vendedor para ver jugadas.</span>
          </div>
        ) : grandTotal === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 15 }}>
            📋 No hay jugadas para el sorteo y fecha seleccionados.<br/>
            <span style={{ fontSize: 12 }}>Selecciona un sorteo diferente o verifica que se hayan creado tickets hoy.</span>
          </div>
        ) : (
          /* ── 5-column grid ── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, borderTop: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <PlayColumn
              title="Directo" subtitle="2 dígitos"
              accentColor="#0D9488"
              plays={displayDirecto} total={totDirecto} maxTotal={maxDirecto}
              search={searchDirecto} onSearch={setSearchDirecto} searchPlaceholder="Buscar ##"
            />
            <PlayColumn
              title="Pale" subtitle="##-##"
              accentColor="#0891B2"
              plays={displayPale} total={totPale} maxTotal={maxPale}
              search={searchPale} onSearch={setSearchPale} searchPlaceholder="Buscar ##-##"
              borderLeft
            />
            <PlayColumn
              title="Tripleta" subtitle="##-##-##"
              accentColor="#7C3AED"
              plays={displayTripleta} total={totTripleta} maxTotal={maxTripleta}
              search={searchTripleta} onSearch={setSearchTripleta} searchPlaceholder="Buscar ##-##-##"
              borderLeft
            />
            <PlayColumn
              title="Cash 3" subtitle="3 dígitos"
              accentColor="#059669"
              plays={displayCash3} total={totCash3} maxTotal={maxCash3}
              search={searchCash3} onSearch={setSearchCash3} searchPlaceholder="Buscar ###"
              borderLeft
            />
            <PlayColumn
              title="Play 4 / Pick 5" subtitle="4-5 dígitos"
              accentColor="#DC2626"
              plays={displayPlay4} total={totPlay4} maxTotal={maxPlay4}
              search={searchPlay4} onSearch={setSearchPlay4} searchPlaceholder="Buscar ####"
              borderLeft
            />
          </div>
        )}
      </div>
    </Layout>
  );
}

// ─── Play Column Sub-component ────────────────────────────────────────────────
interface PlayColumnProps {
  title: string;
  subtitle: string;
  accentColor: string;
  plays: AggPlay[];
  total: number;
  maxTotal: number;
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  borderLeft?: boolean;
}

function PlayColumn({ title, subtitle, accentColor, plays, total, maxTotal, search, onSearch, searchPlaceholder, borderLeft }: PlayColumnProps) {
  const threshold = maxTotal * 0.55;

  return (
    <div style={{ borderLeft: borderLeft ? '1px solid #e2e8f0' : undefined, background: '#fff', display: 'flex', flexDirection: 'column', minWidth: 140 }}>
      {/* Column header */}
      <div style={{ background: accentColor, padding: '10px 12px', borderBottom: `2px solid ${accentColor}` }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', textAlign: 'center', letterSpacing: 0.5 }}>{title}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 1 }}>{subtitle}</div>
      </div>

      {/* Search box */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          style={{
            width: '100%', padding: '6px 10px', border: '1.5px solid #e2e8f0',
            borderRadius: 6, fontSize: 12, outline: 'none',
            boxSizing: 'border-box', background: '#fff', color: '#334155',
          }}
        />
      </div>

      {/* Sub-header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '5px 10px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>JUGADA</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right', letterSpacing: 0.5 }}>IMPORTE</span>
      </div>

      {/* Scrollable play list */}
      <div style={{ flex: 1, maxHeight: 400, overflowY: 'auto' }}>
        {plays.length === 0 ? (
          <div style={{ padding: '30px 12px', textAlign: 'center', color: '#cbd5e1', fontSize: 12 }}>
            Sin jugadas
          </div>
        ) : (
          plays.map((play, i) => {
            const isHigh = play.total >= threshold;
            const pct = Math.round((play.total / maxTotal) * 100);
            return (
              <div key={play.numbers} style={{
                position: 'relative',
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                padding: '6px 10px',
                background: i % 2 === 0 ? '#fff' : '#f8fafc',
                borderBottom: '1px solid #f1f5f9',
                overflow: 'hidden',
              }}>
                {/* risk bar */}
                {isHigh && (
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${pct}%`, background: `${accentColor}18`,
                    pointerEvents: 'none',
                  }}/>
                )}
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: isHigh ? accentColor : '#334155', position: 'relative' }}>
                  {play.numbers}
                </span>
                <span style={{ textAlign: 'right', fontSize: 13, color: isHigh ? accentColor : '#334155', fontWeight: isHigh ? 800 : 400, position: 'relative' }}>
                  {play.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Column total */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 10px', background: `${accentColor}18`, borderTop: `2px solid ${accentColor}33` }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: accentColor }}>Total</span>
        <span style={{ textAlign: 'right', fontSize: 12, fontWeight: 800, color: accentColor }}>
          ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
