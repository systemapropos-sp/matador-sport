/**
 * ResultsPanel — NMV Lottery
 * Formato idéntico a loteriasdominicanas.com:
 *  • Grid principal agrupado por empresa (cards con header de color)
 *  • Auto-sync cada 60s + Supabase Realtime
 *  • Navegación por fechas ← →
 *  • SIN links externos
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, Calendar, Wifi, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subDays, addDays, isToday as checkIsToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useResultsAutoSync, detectCompany } from '@/hooks/useResultsAutoSync';
import type { LiveResult } from '@/hooks/useResultsAutoSync';

interface ResultsPanelProps {
  isOpen: boolean;
}

// Company header colors
const COMPANY_COLORS: Record<string, { bg: string; text: string }> = {
  Nacional:     { bg: '#2E7D32', text: '#fff' },
  Leidsa:       { bg: '#F59E0B', text: '#fff' },
  Real:         { bg: '#1565C0', text: '#fff' },
  Loteka:       { bg: '#7B1FA2', text: '#fff' },
  'New York':   { bg: '#B71C1C', text: '#fff' },
  Florida:      { bg: '#0097A7', text: '#fff' },
  Anguila:      { bg: '#E65100', text: '#fff' },
  'La Primera': { bg: '#558B2F', text: '#fff' },
  'Otros (RD)': { bg: '#455A64', text: '#fff' },
  Lotedom:      { bg: '#37474F', text: '#fff' },
  Otros:        { bg: '#546E7A', text: '#fff' },
};

// ── Bolita individual (green ball) ────────────────────────────────────────────
function Bolita({ number, large = false, grey = false }: { number: string; large?: boolean; grey?: boolean }) {
  const size = large ? 67 : 50;   // +20 % para mejor visibilidad móvil
  const fs   = large ? 20 : 17;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: grey
        ? 'radial-gradient(circle at 35% 30%, #e0e0e0, #bdbdbd)'
        : 'radial-gradient(circle at 35% 30%, #66BB6A, #2E7D32)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: grey
        ? '0 2px 6px rgba(0,0,0,0.15)'
        : '0 3px 8px rgba(46,125,50,0.45), inset 0 1px 3px rgba(255,255,255,0.35)',
    }}>
      <span style={{
        fontWeight: 800, fontSize: fs, color: grey ? '#555' : '#fff',
        lineHeight: 1, letterSpacing: 0,
      }}>
        {number.slice(0, 2).padStart(2, '0')}
      </span>
    </div>
  );
}

// ── Date badge (the dark blue date chip like "13-06") ─────────────────────────
function DateBadge({ date }: { date: string }) {
  const d = new Date(date + 'T12:00:00');
  const label = !isNaN(d.getTime())
    ? `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`
    : '—';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#3E4158', color: '#fff', borderRadius: 4,
      fontSize: 10, fontWeight: 700, padding: '2px 6px', letterSpacing: 0.5,
      minWidth: 36,
    }}>
      {label}
    </span>
  );
}

// ── Single result card (main grid) ────────────────────────────────────────────
function ResultCard({ result }: { result: LiveResult }) {
  const nums3 = [result.primera, result.segunda, result.tercera].filter(Boolean) as string[];
  const pick3 = result.pick3;
  const pick4 = result.pick4;
  const pick5 = result.pick5;

  const hasNumbers = nums3.length > 0 || pick3 || pick4 || pick5;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e9ef',
      borderRadius: 8,
      padding: '12px 14px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <DateBadge date={result.draw_date} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: '#1a1a1a',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            textTransform: 'uppercase', letterSpacing: 0.3,
          }}>
            {result.lottery_name}
          </div>
          {result.draw_time && (
            <div style={{ fontSize: 10, color: '#888', display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>
              <Clock size={9} /> {result.draw_time}
            </div>
          )}
        </div>
      </div>

      {/* Numbers */}
      {hasNumbers ? (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          {nums3.map((n, i) => (
            <Bolita key={i} number={n} grey={!hasNumbers} />
          ))}
          {pick3 && <span style={{ fontSize: 11, color: '#555', fontWeight: 700, paddingLeft: 4 }}>P3: {pick3}</span>}
          {pick4 && <span style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>P4: {pick4}</span>}
          {pick5 && <span style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>P5: {pick5}</span>}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 42, height: 42, borderRadius: '50%',
              background: '#f0f0f0', border: '1px dashed #ccc',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Company group section ─────────────────────────────────────────────────────
function CompanySection({ company, results }: { company: string; results: LiveResult[] }) {
  const colors = COMPANY_COLORS[company] || COMPANY_COLORS.Otros;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Company header bar */}
      <div style={{
        backgroundColor: colors.bg,
        color: colors.text,
        padding: '5px 14px',
        borderRadius: '6px 6px 0 0',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {company}
        <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 400 }}>
          ({results.length} sorteo{results.length !== 1 ? 's' : ''})
        </span>
      </div>
      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: 8,
        padding: 10,
        backgroundColor: `${colors.bg}11`,
        border: `1px solid ${colors.bg}33`,
        borderTop: 'none',
        borderRadius: '0 0 6px 6px',
      }}>
        {results.map((r) => <ResultCard key={r.id || r.lottery_name} result={r} />)}
      </div>
    </div>
  );
}

// ── Main ResultsPanel ─────────────────────────────────────────────────────────
export default function ResultsPanel({ isOpen }: ResultsPanelProps) {
  // ── Navegación por fechas ──────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isAtToday = selectedDate === todayStr;

  const goBack = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    setSelectedDate(format(subDays(d, 1), 'yyyy-MM-dd'));
  };

  const goForward = () => {
    if (isAtToday) return; // No ir más allá de hoy
    const d = new Date(selectedDate + 'T12:00:00');
    const next = addDays(d, 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  // Pasar la fecha seleccionada al hook
  const { results, loading, lastUpdated, error, isMockData, refresh } = useResultsAutoSync(selectedDate);

  if (!isOpen) return null;

  const dateObj = new Date(selectedDate + 'T12:00:00');
  const dateLabel = format(dateObj, "EEEE d 'de' MMMM yyyy", { locale: es });
  const isDateToday = checkIsToday(dateObj);

  // Group by company (maintain insertion order)
  const grouped: Record<string, LiveResult[]> = {};
  for (const r of results) {
    const c = r.company || detectCompany(r.lottery_name);
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(r);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'fixed',
        left: 0, right: 0, top: 50, zIndex: 40,
        backgroundColor: '#F3F4F6',
        borderBottom: '2px solid #d1d5db',
        boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        maxHeight: '82vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── TOP BAR ── */}
      <div style={{
        background: '#F8F9FA',
        borderBottom: '1px solid #e0e0e0',
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
      }}>
        {/* Left: date navigation + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* ← Día anterior */}
          <button
            onClick={goBack}
            title="Día anterior"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid #d1d5db', background: '#fff',
              cursor: 'pointer', color: '#374151', flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
          >
            <ChevronLeft size={15} />
          </button>

          {/* Fecha actual */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
            <Calendar size={14} />
            <span style={{ fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {isDateToday ? 'Hoy — ' : ''}{dateLabel}
            </span>
          </div>

          {/* → Día siguiente (deshabilitado si es hoy) */}
          <button
            onClick={goForward}
            disabled={isAtToday}
            title={isAtToday ? 'Ya estás en el día de hoy' : 'Día siguiente'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid #d1d5db',
              background: isAtToday ? '#f9fafb' : '#fff',
              cursor: isAtToday ? 'not-allowed' : 'pointer',
              color: isAtToday ? '#d1d5db' : '#374151',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!isAtToday) (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              if (!isAtToday) (e.currentTarget as HTMLButtonElement).style.background = '#fff';
            }}
          >
            <ChevronRight size={15} />
          </button>

          {/* Status indicators */}
          {lastUpdated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#888' }}>
              <Wifi size={11} color={error ? '#ef4444' : '#22c55e'} />
              Actualizado: {format(lastUpdated, 'HH:mm')}
            </div>
          )}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#0D9488' }}>
              <RefreshCw size={11} className="animate-spin" /> Sincronizando…
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Botón "Hoy" — visible solo cuando no estamos en hoy */}
          {!isAtToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              style={{
                padding: '4px 12px', borderRadius: 6,
                border: '1px solid #0D9488',
                background: '#f0fffe', color: '#0D9488', fontSize: 12,
                cursor: 'pointer', fontWeight: 700,
              }}
            >
              Hoy
            </button>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 14px', borderRadius: 6,
              border: '1px solid #d1d5db',
              background: '#fff', color: '#374151', fontSize: 12,
              cursor: loading ? 'wait' : 'pointer', fontWeight: 600,
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── SIDEBAR "En Directo" eliminado — el main grid ocupa todo el ancho ── */}

        {/* ── MAIN GRID ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading && results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block', color: '#4CAF50' }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>Obteniendo resultados…</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                {isDateToday ? 'Conectando con Supabase y loteriasdominicanas.com' : `Buscando resultados del ${dateLabel}`}
              </p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎰</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                {isDateToday ? 'Sin resultados por ahora' : `Sin resultados para el ${dateLabel}`}
              </p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
                {isDateToday
                  ? 'Los resultados se actualizan automáticamente cuando salen los sorteos.'
                  : 'No se encontraron resultados para esta fecha en la base de datos.'}
              </p>
              {isDateToday && (
                <button
                  onClick={refresh}
                  style={{
                    padding: '8px 20px', borderRadius: 6, border: '1px solid #d1d5db',
                    background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto',
                  }}
                >
                  <RefreshCw size={13} /> Intentar de nuevo
                </button>
              )}
              {error && (
                <p style={{ marginTop: 12, fontSize: 11, color: '#ef4444', maxWidth: 400, margin: '12px auto 0' }}>
                  ⚠ {error}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* DEMO banner — only shown when using mock data */}
              {isMockData && (
                <div style={{
                  background: 'linear-gradient(90deg,#FF6B35,#FF8C42)',
                  color: '#fff', borderRadius: 8, padding: '8px 16px',
                  marginBottom: 14, fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 2px 8px rgba(255,107,53,0.35)',
                }}>
                  <span style={{ fontSize: 16 }}>📋</span>
                  <span>VISTA PREVIA — Datos de ejemplo. Los números reales aparecerán automáticamente cuando el admin los publique.</span>
                </div>
              )}
              {error && !isMockData && (
                <div style={{
                  background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 6,
                  padding: '6px 12px', marginBottom: 12, fontSize: 11, color: '#92400e',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  ⚠ {error}
                </div>
              )}
              {Object.entries(grouped).map(([company, list]) => (
                <CompanySection key={company} company={company} results={list} />
              ))}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
