import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Ticket, ChevronDown, Printer, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useModalContext } from '@/components/modals';
import { formatCurrency } from '@/lib/utils';
import ClientSelector from '@/components/ClientSelector';
import DisponibleField from '@/components/DisponibleField';

export interface PlayInputSectionProps {
  jugada: string;
  onJugadaChange: (v: string) => void;
  monto: string;
  onMontoChange: (v: string) => void;
  selectedLotteryName: string;
  selectedLotteryId: string;
  detectedType: string;
  onAddPlay: () => boolean;
  onCreateTicket: () => void;
  totalPlays: number;
  totalAmount: number;
  recentTickets: Array<{ id?: string; ticketNumber: string; totalAmount: number; createdAt: Date; plays?: any[] }>;
  selectedClient?: string;
  onSelectClient?: (clientId: string) => void;
  typeOverride?: string;
  onTypeOverride?: (type: string) => void;
  onNextLottery?: () => void;
  onReprintTicket?: (t: any) => void;
  onCancelTicket?: (ticketId: string) => void;
}

function getTypeColor(type: string) {
  switch (type) {
    case 'directo': return '#689F38';
    case 'pale': return '#558B2F';
    case 'tripleta': return '#33691E';
    case 'cash3': return '#43A047';
    case 'play4': return '#2E7D32';
    case 'pick5': return '#1B5E20';
    default: return '#888888';
  }
}

export default function PlayInputSection({
  jugada, onJugadaChange,
  monto, onMontoChange,
  selectedLotteryName, selectedLotteryId,
  detectedType,
  onAddPlay, onCreateTicket,
  totalPlays, totalAmount,
  recentTickets,
  selectedClient, onSelectClient,
  typeOverride, onTypeOverride,
  onNextLottery,
  onReprintTicket, onCancelTicket,
}: PlayInputSectionProps) {
  const isMobile = useIsMobile();
  const { openModal } = useModalContext();
  const jugadaRef = useRef<HTMLInputElement>(null);
  const montoRef = useRef<HTMLInputElement>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [recentPos, setRecentPos] = useState({ top: 0, left: 0 });
  const recentBtnRef = useRef<HTMLButtonElement>(null);

  // Close Recientes on outside click
  useEffect(() => {
    if (!showRecent) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest('[data-rec-drop]') && !t.closest('[data-rec-btn]')) setShowRecent(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRecent]);

  // Keep dropdown position in sync with button
  useEffect(() => {
    if (!showRecent || !recentBtnRef.current) return;
    const update = () => {
      if (!recentBtnRef.current) return;
      const r = recentBtnRef.current.getBoundingClientRect();
      if (r.width === 0) return;
      const dropW = 390;
      const cL = Math.max(8, Math.min(r.left, window.innerWidth - dropW - 8));
      const top = Math.min(r.bottom + 4, window.innerHeight - 420);
      setRecentPos({ top, left: cL });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [showRecent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey) {
      if (e.key === 'Enter' || e.key === '*') { e.preventDefault(); onCreateTicket(); return; }
      if (e.key === '/') { e.preventDefault(); onNextLottery?.(); return; }
      if (e.key === 'd' || e.key === 'D') { e.preventDefault(); openModal('duplicateTicket'); return; }
    }
    if (e.currentTarget === jugadaRef.current) {
      if (e.key === '.') { e.preventDefault(); onTypeOverride?.(typeOverride === 'cash3' ? '' : 'cash3'); return; }
      if (e.key === '-' && !e.ctrlKey) { e.preventDefault(); onTypeOverride?.(typeOverride === 'play4' ? '' : 'play4'); return; }
      if (e.key === '+') { e.preventDefault(); onTypeOverride?.(typeOverride === 'pick5' ? '' : 'pick5'); return; }
    }
    if (e.key === 'Enter') {
      if (e.currentTarget === jugadaRef.current) {
        montoRef.current?.focus();
        setTimeout(() => montoRef.current?.select(), 0);
      } else if (e.currentTarget === montoRef.current) {
        onAddPlay();
        jugadaRef.current?.focus();
      }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.currentTarget === jugadaRef.current) {
        montoRef.current?.focus();
      } else {
        jugadaRef.current?.focus();
      }
    }
  };

  return (
    <div
      className="flex flex-col gap-3"
      style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #e0e0e0', padding: '16px 20px' }}
    >
      {/* Input row */}
      <div className="flex items-end gap-3 hide-scrollbar" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>

        {/* JUGADA */}
        <div className="flex flex-col gap-1 flex-shrink-0" style={{ flex: '0 0 35%', minWidth: '130px' }}>
          <label className="uppercase font-bold" style={{ fontSize: '11px', color: '#555', letterSpacing: '0.5px' }}>JUGADA</label>
          <div className="relative">
            <input
              ref={jugadaRef}
              type="text"
              inputMode={isMobile ? 'none' : 'numeric'}
              readOnly={isMobile}
              value={jugada}
              onChange={(e) => !isMobile && onJugadaChange(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              placeholder="--"
              className="w-full text-center font-bold rounded border-2 transition-colors"
              style={{
                padding: '12px 16px', fontSize: '24px', color: '#333',
                borderColor: detectedType ? getTypeColor(detectedType) : '#cccccc',
                backgroundColor: '#fafafa', letterSpacing: '2px',
                cursor: isMobile ? 'default' : 'text',
              }}
              autoFocus={!isMobile}
            />
            {detectedType && (
              <span
                className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 uppercase font-bold"
                style={{
                  fontSize: '11px', color: getTypeColor(detectedType),
                  backgroundColor: '#E8F5E9', padding: '2px 8px', borderRadius: '4px',
                }}
              >
                {detectedType}
              </span>
            )}
          </div>
        </div>

        {/* DISPONIBLE */}
        <DisponibleField jugada={jugada} lotteryId={selectedLotteryId} />

        {/* LOTERÍA */}
        <div className="flex flex-col gap-1" style={{ minWidth: '140px' }}>
          <label className="uppercase font-bold" style={{ fontSize: '11px', color: '#555', letterSpacing: '0.5px' }}>LOTERÍA</label>
          <div
            className="flex items-center justify-center rounded border font-semibold"
            style={{
              padding: '14px 16px', fontSize: '13px',
              color: selectedLotteryName ? '#333' : '#999',
              borderColor: '#cccccc', backgroundColor: '#f5f5f5', minHeight: '55px',
            }}
          >
            {selectedLotteryName || 'Seleccione'}
          </div>
        </div>

        {/* MONTO */}
        <div className="flex flex-col gap-1" style={{ flex: '0 0 15%', minWidth: '85px' }}>
          <label className="uppercase font-bold" style={{ fontSize: '11px', color: '#555', letterSpacing: '0.5px' }}>MONTO</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold" style={{ fontSize: '18px', color: '#999' }}>$</span>
            <input
              ref={montoRef}
              type={isMobile ? 'text' : 'number'}
              inputMode={isMobile ? 'none' : 'decimal'}
              readOnly={isMobile}
              value={monto}
              onChange={(e) => !isMobile && onMontoChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              className="w-full text-right font-bold rounded border-2 transition-colors"
              style={{
                padding: '12px 12px 12px 28px', fontSize: '20px', color: '#333',
                borderColor: monto ? '#5cb85c' : '#cccccc',
                backgroundColor: '#fafafa',
                cursor: isMobile ? 'default' : 'text',
              }}
              min="0" step="0.01"
            />
          </div>
        </div>

        {/* Client Selector */}
        {onSelectClient && <ClientSelector onSelect={onSelectClient} selectedClient={selectedClient || ''} />}

        {/* Recientes dropdown — portal */}
        <>
          <motion.button
            ref={recentBtnRef}
            data-rec-btn
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (!showRecent && recentBtnRef.current) {
                const r = recentBtnRef.current.getBoundingClientRect();
                const dropW = 390;
                const clampedLeft = Math.min(r.left, window.innerWidth - dropW - 8);
                setRecentPos({ top: r.bottom + 4, left: Math.max(8, clampedLeft) });
              }
              setShowRecent(v => !v);
            }}
            className="flex items-center gap-1 rounded border transition-colors flex-shrink-0"
            style={{
              padding: '14px 16px', fontSize: '13px', color: '#555',
              borderColor: showRecent ? '#0D9488' : '#cccccc',
              backgroundColor: showRecent ? '#f0fffe' : '#ffffff',
              minHeight: '55px', whiteSpace: 'nowrap',
            }}
          >
            <Ticket size={16} />
            <span>Recientes</span>
            <motion.span animate={{ rotate: showRecent ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} />
            </motion.span>
          </motion.button>

          {showRecent && createPortal(
            <motion.div
              data-rec-drop
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.14 }}
              style={{
                position: 'fixed', top: recentPos.top, left: recentPos.left,
                zIndex: 9999, width: '390px', background: '#fff',
                border: '1px solid #e0e0e0', borderRadius: '10px',
                boxShadow: '0 10px 32px rgba(0,0,0,0.18)', overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '10px 14px', borderBottom: '1px solid #f0f0f0',
                fontSize: 12, fontWeight: 700, color: '#555',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>Tickets recientes</span>
                <button onClick={() => setShowRecent(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 20, lineHeight: 1 }}>×</button>
              </div>
              {/* Rows */}
              {recentTickets.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#999' }}>No hay tickets recientes</div>
              ) : recentTickets.slice(0, 8).map((t) => (
                <div
                  key={t.ticketNumber}
                  title="Clic para cargar jugadas"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px', borderBottom: '1px solid #f5f5f5',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f0fdf4'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  onClick={() => {
                    if (!t.plays || t.plays.length === 0) return;
                    window.dispatchEvent(new CustomEvent('nmv:scan-duplicate', { detail: t.plays }));
                    setShowRecent(false);
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.ticketNumber}
                    </div>
                    <div style={{ fontSize: '10px', color: '#aaa' }}>
                      {t.createdAt.toLocaleDateString()} · {t.plays?.length ?? 0} jug.
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#689F38', flexShrink: 0 }}>
                    {formatCurrency(t.totalAmount)}
                  </span>
                  {/* Reprint */}
                  <button
                    title="Reimprimir"
                    onClick={(e) => { e.stopPropagation(); onReprintTicket?.(t); setShowRecent(false); }}
                    style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#1D4ED8', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    <Printer size={15} />
                  </button>
                  {/* Cancel */}
                  {t.id && (
                    <button
                      title="Cancelar ticket"
                      onClick={(e) => { e.stopPropagation(); onCancelTicket?.(t.id!); setShowRecent(false); }}
                      style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </motion.div>,
            document.body
          )}
        </>
      </div>

      {/* Counters row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 rounded px-4 py-2" style={{ backgroundColor: '#E8F5E9', border: '1px solid #C5E1A5' }}>
          <span style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>Jugadas:</span>
          <motion.span
            key={totalPlays}
            initial={{ scale: 1.3, color: '#689F38' }}
            animate={{ scale: 1, color: '#333' }}
            style={{ fontSize: '18px', fontWeight: 700 }}
          >
            {totalPlays}
          </motion.span>
        </div>
        <div className="flex items-center gap-2 rounded px-4 py-2" style={{ backgroundColor: '#E3F2FD', border: '1px solid #90CAF9' }}>
          <span style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>Total:</span>
          <motion.span
            key={totalAmount}
            initial={{ scale: 1.3, color: '#1976D2' }}
            animate={{ scale: 1, color: '#333' }}
            style={{ fontSize: '18px', fontWeight: 700 }}
          >
            {formatCurrency(totalAmount)}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
