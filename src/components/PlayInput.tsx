import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, ChevronDown, Clock, Trash2 } from 'lucide-react';
import type { Ticket } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { printTicketWindow } from '@/components/TicketPrintModal';
import { usePlayLimit } from '@/hooks/usePlayLimit';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlayInputProps {
  jugada: string;
  onJugadaChange: (v: string) => void;
  monto: string;
  onMontoChange: (v: string) => void;
  selectedLotteryName: string;
  selectedLotteryId?: string | null;
  businessId?: string | null;
  detectedType: string;
  onAddPlay: () => boolean;
  onCreateTicket: () => void;
  recentTickets: Ticket[];
  totalPlays: number;
  totalAmount: number;
  isAtCapacity?: (type: string) => boolean;
}

// Default limits per play type — shown while loading or when admin has not configured one
const DEFAULT_LIMITS: Record<string, number> = {
  suelto: 200,
  pale: 50,
  tripleta: 10,
};

export default function PlayInput({
  jugada,
  onJugadaChange,
  monto,
  onMontoChange,
  selectedLotteryName,
  selectedLotteryId = null,
  businessId = null,
  detectedType,
  onAddPlay,
  onCreateTicket,
  recentTickets,
  totalPlays,
  totalAmount,
  isAtCapacity,
}: PlayInputProps) {
  const jugadaRef = useRef<HTMLInputElement>(null);
  const montoRef = useRef<HTMLInputElement>(null);
  const [jugadaFlash, setJugadaFlash] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Real-time availability from Supabase
  const { disponible } = usePlayLimit(
    jugada,
    selectedLotteryId,
    businessId
  );

  // Fallback limit based on play type
  const defaultLimit = DEFAULT_LIMITS[detectedType] ?? 200;

  // Show default immediately while loading, then use DB value if found
  // Never show a loading spinner — always show a number
  const efectivoDisponible: number | null = jugada.length >= 2
    ? (disponible !== null ? disponible : defaultLimit)
    : null;

  // Is this showing the default (not from DB)?
  const isDefault = disponible === null && jugada.length >= 2;

  // Auto-focus JUGADA on mount
  useEffect(() => { jugadaRef.current?.focus(); }, []);

  // Keyboard handlers
  const handleJugadaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onJugadaChange(''); return; }
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); montoRef.current?.focus(); }
    if (e.key === 'Enter') { e.preventDefault(); montoRef.current?.focus(); }
  };

  const handleMontoKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onJugadaChange(''); onMontoChange(''); jugadaRef.current?.focus(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isAtCapacity && detectedType && isAtCapacity(detectedType)) return;
      const added = onAddPlay();
      if (added) {
        setJugadaFlash(true);
        setTimeout(() => setJugadaFlash(false), 300);
        setTimeout(() => jugadaRef.current?.focus(), 50);
      }
    }
    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); jugadaRef.current?.focus(); }
  };

  // Ctrl+Enter → create ticket
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); onCreateTicket(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCreateTicket]);

  // Color for disponible number
  const disponibleColor = (): string => {
    if (efectivoDisponible === null) return '#888';
    if (efectivoDisponible <= 0) return '#d9534f';
    if (efectivoDisponible <= 10) return '#f0ad4e';
    if (isDefault) return '#999'; // grey for default
    return '#0D9488';
  };

  // ────────────────────────────────────────────────────────────────────────────
  // MOBILE layout: 2 clean rows — no overflow, no scroll
  // ────────────────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ backgroundColor: '#fff', borderBottom: '2px solid #e0e0e0' }}>

        {/* ROW 1: Jugada + Monto + Disponible badge */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, padding: '8px 10px 4px' }}>

          {/* JUGADA */}
          <input
            ref={jugadaRef}
            type="text"
            inputMode="numeric"
            value={jugada}
            onChange={(e) => onJugadaChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={handleJugadaKeyDown}
            placeholder="#"
            style={{
              flex: 2,
              height: 48,
              fontSize: 22,
              fontWeight: 700,
              textAlign: 'center',
              border: jugadaFlash ? '2px solid #5cb85c' : '2px solid #d1d5db',
              borderRadius: 8,
              backgroundColor: jugadaFlash ? '#e8f5e9' : '#fafafa',
              outline: 'none',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          />

          {/* MONTO */}
          <div style={{ flex: 2, position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              fontSize: 18, fontWeight: 700, color: '#555', userSelect: 'none',
            }}>$</span>
            <input
              ref={montoRef}
              type="number"
              inputMode="decimal"
              value={monto}
              onChange={(e) => onMontoChange(e.target.value)}
              onKeyDown={handleMontoKeyDown}
              placeholder="0"
              min="0"
              style={{
                width: '100%',
                height: 48,
                fontSize: 20,
                fontWeight: 700,
                paddingLeft: 26,
                paddingRight: 4,
                border: '2px solid #d1d5db',
                borderRadius: 8,
                backgroundColor: '#fafafa',
                outline: 'none',
              }}
            />
          </div>

          {/* DISPONIBLE — always shows a number, no loading icon */}
          <div style={{
            flex: 1.2,
            height: 48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${isDefault ? '#ddd' : '#c8f0ec'}`,
            borderRadius: 8,
            backgroundColor: isDefault ? '#f8f8f8' : efectivoDisponible === 0 ? '#fff5f5' : '#f0faf9',
          }}>
            {efectivoDisponible !== null ? (
              <>
                <span style={{ fontSize: 19, fontWeight: 800, color: disponibleColor(), lineHeight: 1 }}>
                  {efectivoDisponible}
                </span>
                <span style={{ fontSize: 8, color: '#bbb', marginTop: 1 }}>
                  {isDefault ? 'máx' : 'disp'}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 14, color: '#ccc' }}>—</span>
            )}
          </div>
        </div>

        {/* ROW 2: Lottery name + Tickets dropdown + Crear + Counters */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px 8px',
        }}>

          {/* Lottery name — flex fill */}
          <div style={{
            flex: 1,
            fontSize: 11, fontWeight: 600, color: '#555',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {selectedLotteryName ? `🎰 ${selectedLotteryName}` : '—'}
          </div>

          {/* TICKETS dropdown — compact button */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setTicketsOpen(v => !v)}
              style={{
                height: 34, display: 'flex', alignItems: 'center', gap: 3,
                border: '1px solid #d1d5db', borderRadius: 7,
                padding: '0 10px', background: '#fff',
                fontSize: 11, fontWeight: 600, color: '#444', cursor: 'pointer',
              }}
            >
              <Clock size={12} style={{ opacity: 0.6 }} />
              Recientes
              <ChevronDown size={11} />
            </button>
            <AnimatePresence>
              {ticketsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'absolute', bottom: '100%', right: 0, marginBottom: 4,
                    width: 210, maxHeight: 220, overflowY: 'auto', zIndex: 60,
                    background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tickets recientes
                  </div>
                  {recentTickets.length === 0 ? (
                    <div style={{ padding: '12px', color: '#bbb', fontSize: 12, textAlign: 'center' }}>
                      Sin tickets aún
                    </div>
                  ) : recentTickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTicketsOpen(false)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '8px 12px', border: 'none',
                        background: 'none', cursor: 'pointer',
                        borderBottom: '1px solid #f8f8f8',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{t.ticketNumber}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {formatCurrency(t.totalAmount)} · {t.plays.length} jugadas
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CREAR button */}
          <button
            onClick={onCreateTicket}
            style={{
              height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
              border: '1px solid #0D9488', borderRadius: 7,
              padding: '0 12px', background: '#0D9488',
              fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}
          >
            <Printer size={13} /> Crear
          </button>

          {/* COUNTERS */}
          <div style={{ flexShrink: 0, textAlign: 'right', lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#333' }}>
              {totalPlays}<span style={{ fontSize: 9, fontWeight: 500, color: '#888', marginLeft: 2 }}>JUG</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0D9488' }}>
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // DESKTOP layout: one compact bar
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#fff', borderBottom: '2px solid #e0e0e0', padding: '8px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* JUGADA */}
        <motion.input
          ref={jugadaRef}
          type="text"
          inputMode="numeric"
          value={jugada}
          onChange={(e) => onJugadaChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={handleJugadaKeyDown}
          placeholder="#"
          style={{
            height: 46, width: 100, fontSize: 22, fontWeight: 700, textAlign: 'center',
            border: jugadaFlash ? '2px solid #5cb85c' : '2px solid #d1d5db',
            borderRadius: 8, backgroundColor: jugadaFlash ? '#e8f5e9' : '#fafafa',
            outline: 'none', flexShrink: 0,
            transition: 'border-color 0.2s, background 0.2s',
          }}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* MONTO */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <span style={{
            position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)',
            fontSize: 18, fontWeight: 700, color: '#555', userSelect: 'none',
          }}>$</span>
          <input
            ref={montoRef}
            type="number"
            inputMode="decimal"
            value={monto}
            onChange={(e) => onMontoChange(e.target.value)}
            onKeyDown={handleMontoKeyDown}
            placeholder="0"
            min="0"
            style={{
              height: 46, width: 90, fontSize: 20, fontWeight: 700,
              paddingLeft: 24, paddingRight: 4,
              border: '2px solid #d1d5db', borderRadius: 8,
              backgroundColor: '#fafafa', outline: 'none',
            }}
          />
        </div>

        {/* DISPONIBLE — number only, no spinner */}
        <div style={{
          height: 46, minWidth: 62, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          border: `1px solid ${isDefault ? '#ddd' : '#c8f0ec'}`,
          borderRadius: 8,
          backgroundColor: isDefault ? '#f8f8f8' : efectivoDisponible === 0 ? '#fff5f5' : '#f0faf9',
          padding: '0 6px',
        }}>
          {efectivoDisponible !== null ? (
            <>
              <span style={{ fontSize: 20, fontWeight: 800, color: disponibleColor(), lineHeight: 1 }}>
                {efectivoDisponible}
              </span>
              <span style={{ fontSize: 8, color: '#bbb', marginTop: 1 }}>
                {isDefault ? 'máx' : 'disp'}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 13, color: '#ccc' }}>—</span>
          )}
        </div>

        {/* LOTTERY NAME */}
        <div style={{
          flex: 1, height: 46, display: 'flex', alignItems: 'center',
          border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#f9fafb',
          fontSize: 12, fontWeight: 600, color: '#374151', padding: '0 10px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {selectedLotteryName ? `🎰 ${selectedLotteryName}` : '—'}
        </div>

        {/* TICKETS DROPDOWN */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setTicketsOpen(v => !v)}
            style={{
              height: 40, display: 'flex', alignItems: 'center', gap: 5,
              border: '1px solid #d1d5db', borderRadius: 7,
              padding: '0 12px', background: '#fff',
              fontSize: 12, fontWeight: 600, color: '#444', cursor: 'pointer',
            }}
          >
            <Clock size={13} style={{ opacity: 0.6 }} />
            Recientes
            <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {ticketsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  width: 320, maxHeight: 280, overflowY: 'auto', zIndex: 9000,
                  background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Tickets recientes</span>
                  <span style={{ fontWeight: 400, textTransform: 'none' }}>{recentTickets.length} tickets</span>
                </div>
                {recentTickets.length === 0 ? (
                  <div style={{ padding: '16px', color: '#bbb', fontSize: 12, textAlign: 'center' }}>
                    Sin tickets aún
                  </div>
                ) : recentTickets.map(t => (
                  <div
                    key={t.id}
                    title="Clic para cargar jugadas"
                    style={{
                      padding: '8px 12px', borderBottom: '1px solid #f3f4f6',
                      display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    onClick={() => {
                      // Load this ticket's plays into the board
                      if (!t.plays || t.plays.length === 0) return;
                      window.dispatchEvent(new CustomEvent('nmv:scan-duplicate', { detail: t.plays }));
                      setTicketsOpen(false);
                    }}
                  >
                    {/* Ticket info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#333', fontFamily: 'monospace' }}>{t.ticketNumber}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {formatCurrency(t.totalAmount)} · {t.plays.length} jugada{t.plays.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {/* Reimprimir */}
                    <button
                      onClick={(e) => { e.stopPropagation(); printTicketWindow(t as any); }}
                      title="Reimprimir ticket"
                      style={{ padding: '4px 8px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#1D4ED8', fontWeight: 600, flexShrink: 0 }}>
                      <Printer size={12}/> Reimp.
                    </button>
                    {/* Cancelar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!window.confirm(`¿Cancelar ticket ${t.ticketNumber}?`)) return;
                        // Mark cancelled in localStorage
                        const key = 'matador_tickets';
                        const stored = JSON.parse(localStorage.getItem(key) || '[]');
                        const updated = stored.map((x: any) => x.id === t.id ? { ...x, status: 'cancelled' } : x);
                        localStorage.setItem(key, JSON.stringify(updated));
                        setTicketsOpen(false);
                      }}
                      title="Cancelar ticket"
                      style={{ padding: '4px 8px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#DC2626', fontWeight: 600, flexShrink: 0 }}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CREAR */}
        <button
          onClick={onCreateTicket}
          style={{
            height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
            border: '1px solid #0D9488', borderRadius: 7,
            padding: '0 14px', background: '#0D9488',
            fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
          }}
          title="Crear ticket (Ctrl+Enter)"
        >
          <Printer size={14} /> Crear
        </button>

        {/* COUNTERS inline */}
        <div style={{ flexShrink: 0, lineHeight: 1.3, textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#333' }}>
            {totalPlays}<span style={{ fontSize: 9, fontWeight: 500, color: '#888', marginLeft: 2 }}>JUG</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0D9488' }}>
            {formatCurrency(totalAmount)}
          </div>
        </div>

      </div>
    </div>
  );
}
