/**
 * Dashboard.tsx — NMV Vendor (slim orchestrator)
 *
 * This file only contains state, callbacks and layout.
 * UI sub-components live in src/components/:
 *   <QuickAccessBar>    — barra de acceso rápido
 *   <PlayInputSection>  — jugada / monto / lotería / recientes
 *   <IconButton>        — botón icono de la barra de acción
 *   <ClientSelector>    — selector de cliente (portal)
 *   <DisponibleField>   — campo disponible
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Printer,
  DollarSign,
  HelpCircle,
  Shuffle,
  Trash2,
} from 'lucide-react';
import Layout from '@/components/Layout';
import LotterySelector from '@/components/LotterySelector';
import GameTable from '@/components/GameTable';
import ShortcutsPanel from '@/components/ShortcutsPanel';
import TicketPrintModal from '@/components/TicketPrintModal';
import MobileKeypad from '@/components/MobileKeypad';
import IconButton from '@/components/ui/IconButton';
import QuickAccessBar from '@/components/QuickAccessBar';
import PlayInputSection from '@/components/PlayInputSection';
import { usePlays } from '@/hooks/usePlays';
import { useTicket } from '@/hooks/useTicket';
import { detectPlayType, formatCurrency } from '@/lib/utils';
import { regularLotteries } from '@/data/lotteries';
import { useSorteosVendor } from '@/hooks/useSorteosVendor';
import { useVendedores } from '@/hooks/useVendedores';
import { useModalContext } from '@/components/modals';
import { schedules } from '@/data/schedules';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Ticket as TicketData, Play } from '@/types';
import { supabase } from '@/lib/supabase';

// ── parseTimeToMinutes helper ──────────────────────────────────────────
function parseTimeToMinutes(t: string): number {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1]); const min = parseInt(m[2]); const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

// ══════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const isMobile = useIsMobile();
  const { openModal } = useModalContext();
  const [keypadTarget, setKeypadTarget] = useState<'jugada' | 'monto'>('jugada');

  // ── Plays ────────────────────────────────────────────────────────────
  const { plays, addPlay, removePlay, clearPlays, totalPlays, totalAmount, playsByType, isAtCapacity } = usePlays();
  const { createTicket, recentTickets } = useTicket();

  // ── Lotteries ────────────────────────────────────────────────────────
  const { lotteries: sorteosLotteries, closingTimes: sorteosClosingTimes } = useSorteosVendor();
  const lotteries = sorteosLotteries.length > 0 ? sorteosLotteries : regularLotteries;

  const [selectedLotteries, setSelectedLotteries] = useState<string[]>(['florida-pm']);
  useEffect(() => {
    if (lotteries.length === 0) return;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const open = lotteries
      .map(l => {
        const closingStr = sorteosClosingTimes[l.id] || schedules.find(sc => sc.lotteryId === l.id)?.closingTime;
        return { id: l.id, closingMins: closingStr ? parseTimeToMinutes(closingStr) : 1439 };
      })
      .filter(x => x.closingMins > currentMins)
      .sort((a, b) => a.closingMins - b.closingMins);
    if (open.length > 0) setSelectedLotteries([open[0].id]);
  }, [lotteries.length]);

  const { activeVendedor } = useVendedores();

  const primaryColor = useMemo(() => {
    if (selectedLotteries.length === 1) {
      const lottery = lotteries.find((l) => l.id === selectedLotteries[0]);
      if (lottery?.color) return lottery.color;
    }
    return '#5cb85c';
  }, [selectedLotteries, lotteries]);

  const [multiSelect, setMultiSelect] = useState(false);

  // ── Input state ──────────────────────────────────────────────────────
  const [jugada, setJugada] = useState('');
  const [monto, setMonto] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [typeOverride, setTypeOverride] = useState('');
  const lastAmountRef = useRef<string>('');
  const amountOverwriteRef = useRef<boolean>(false);
  const submittingRef = useRef<boolean>(false);

  // ── Lottery locks (Cash3 / Play4) ────────────────────────────────────
  const [cash3Lock, setCash3Lock] = useState<{ locked: boolean; lotteryId: string; lotteryName: string }>({ locked: false, lotteryId: '', lotteryName: '' });
  const [play4Lock, setPlay4Lock] = useState<{ locked: boolean; lotteryId: string; lotteryName: string }>({ locked: false, lotteryId: '', lotteryName: '' });

  const toggleCash3Lock = useCallback(() => {
    if (cash3Lock.locked) {
      setCash3Lock({ locked: false, lotteryId: '', lotteryName: '' });
      setTypeOverride('');
    } else {
      const lotId = selectedLotteries[0] || '';
      const lotName = lotteries.find((l) => l.id === lotId)?.name || lotId;
      setCash3Lock({ locked: true, lotteryId: lotId, lotteryName: lotName });
      setTypeOverride('cash3');
      setJugada('');
    }
  }, [cash3Lock.locked, selectedLotteries, lotteries]);

  const togglePlay4Lock = useCallback(() => {
    if (play4Lock.locked) {
      setPlay4Lock({ locked: false, lotteryId: '', lotteryName: '' });
      setTypeOverride('');
    } else {
      const lotId = selectedLotteries[0] || '';
      const lotName = lotteries.find((l) => l.id === lotId)?.name || lotId;
      setPlay4Lock({ locked: true, lotteryId: lotId, lotteryName: lotName });
      setTypeOverride('play4');
      setJugada('');
    }
  }, [play4Lock.locked, selectedLotteries, lotteries]);

  const maxJugadaDigits = typeOverride === 'cash3' ? 3 : typeOverride === 'play4' ? 4 : typeOverride === 'pick5' ? 5 : 6;

  // ── UI state ─────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null);
  const [printTicket, setPrintTicket] = useState<TicketData | null>(null);
  const [reprintMode, setReprintMode] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const detectedType = jugada ? detectPlayType(jugada) : '';
  const selectedLotteryName =
    selectedLotteries.length === 1
      ? lotteries.find((l) => l.id === selectedLotteries[0])?.name || ''
      : selectedLotteries.length > 1 ? `${selectedLotteries.length} loterias` : '';

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleToggleLottery = useCallback((id: string) => {
    if (multiSelect) {
      setSelectedLotteries((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);
    } else {
      setSelectedLotteries([id]);
    }
  }, [multiSelect]);

  // Ctrl+/ — cicla loterías en orden del selector
  const handleNextLottery = useCallback(() => {
    if (lotteries.length === 0) return;
    const curIdx = lotteries.findIndex(l => l.id === selectedLotteries[0]);
    const nextIdx = (curIdx + 1) % lotteries.length;
    setSelectedLotteries([lotteries[nextIdx].id]);
  }, [selectedLotteries, lotteries]);

  const handleAddPlay = useCallback((): boolean => {
    if (submittingRef.current) return false;
    if (!jugada || !monto) return false;
    submittingRef.current = true;
    const amount = parseFloat(monto);
    if (isNaN(amount) || amount <= 0) { submittingRef.current = false; return false; }
    if (selectedLotteries.length === 0) { submittingRef.current = false; return false; }
    const type = typeOverride || detectPlayType(jugada);
    if (isAtCapacity(type)) {
      showToast(`Capacidad completa para ${type}`);
      submittingRef.current = false;
      return false;
    }
    let lotteriesForPlay: string[];
    if (['cash3', 'pick3'].includes(type) && cash3Lock.locked && cash3Lock.lotteryId) {
      lotteriesForPlay = [cash3Lock.lotteryId];
    } else if (['play4', 'pick4', 'pick5'].includes(type) && play4Lock.locked && play4Lock.lotteryId) {
      lotteriesForPlay = [play4Lock.lotteryId];
    } else {
      lotteriesForPlay = selectedLotteries;
    }
    let added = false;
    lotteriesForPlay.forEach((lotId) => {
      const lottery = lotteries.find((l) => l.id === lotId);
      if (lottery) {
        const ok = addPlay(jugada, amount, lottery.id, lottery.name, typeOverride || undefined);
        if (ok) added = true;
      }
    });
    if (added) {
      lastAmountRef.current = monto;
      setJugada('');
      setTypeOverride('');
    }
    submittingRef.current = false;
    return added;
  }, [jugada, monto, typeOverride, selectedLotteries, cash3Lock, play4Lock, addPlay, isAtCapacity, showToast]);

  // Listen for generator plays
  useEffect(() => {
    type GenPlay = { id: string; numbers: string; amount: number; type: string; lotteryId: string; lotteryName: string };
    const handler = (e: Event) => {
      const p = (e as CustomEvent<GenPlay[]>).detail;
      if (!Array.isArray(p)) return;
      let count = 0;
      p.forEach(x => { if (addPlay(x.numbers, x.amount, x.lotteryId, x.lotteryName, x.type)) count++; });
      if (count > 0) showToast(`✅ ${count} jugadas del generador agregadas`);
    };
    window.addEventListener('nmv:add-generated-plays', handler);
    return () => window.removeEventListener('nmv:add-generated-plays', handler);
  }, [addPlay, showToast]);

  const handleCreateTicket = useCallback(async () => {
    if (plays.length === 0) { showToast('Agregue al menos una jugada'); return; }
    const ticket = await createTicket(plays, activeVendedor?.name || 'Vendedor');
    if (ticket) {
      const clientRecord = selectedClient ? (() => {
        try { const all = JSON.parse(localStorage.getItem('matador_clients') || '[]'); return all.find((c: any) => c.id === selectedClient) || null; } catch { return null; }
      })() : null;
      const enriched = { ...ticket, clientId: clientRecord?.id, clientName: clientRecord?.name, clientPhone: clientRecord?.phone, clientType: clientRecord?.type, vendorName: activeVendedor?.name || 'Vendedor' };
      try {
        const existing = JSON.parse(localStorage.getItem('matador_tickets') || '[]');
        existing.unshift(enriched);
        localStorage.setItem('matador_tickets', JSON.stringify(existing.slice(0, 500)));
      } catch { /* ignore */ }
      setPrintTicket(enriched as TicketData);
      clearPlays();
      setJugada('');
      setMonto('');
      setCash3Lock({ locked: false, lotteryId: '', lotteryName: '' });
      setPlay4Lock({ locked: false, lotteryId: '', lotteryName: '' });
    }
  }, [plays, createTicket, clearPlays, showToast, selectedClient, activeVendedor]);

  const handlePrint = useCallback(() => window.print(), []);

  // Listen for barcode scan duplicate
  useEffect(() => {
    const handler = (e: Event) => {
      const scannedPlays = (e as CustomEvent<Play[]>).detail;
      if (!scannedPlays || scannedPlays.length === 0) return;
      clearPlays();
      scannedPlays.forEach(p => addPlay(p.numbers, p.amount, p.lotteryId, p.lotteryName));
      showToast(`✓ ${scannedPlays.length} jugada${scannedPlays.length !== 1 ? 's' : ''} cargadas desde scan`);
    };
    window.addEventListener('nmv:scan-duplicate', handler);
    return () => window.removeEventListener('nmv:scan-duplicate', handler);
  }, [clearPlays, addPlay, showToast]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setJugada(''); setMonto(''); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Table categories ─────────────────────────────────────────────────
  const directoPlays = playsByType['directo'] || [];
  const paleTripletaPlays = [...(playsByType['pale'] || []), ...(playsByType['tripleta'] || [])];
  const cash3Plays = playsByType['cash3'] || [];
  const play4Pick5Plays = [...(playsByType['play4'] || []), ...(playsByType['pick5'] || [])];

  // ════════════════════════════════════════════════════════════════════
  return (
    <Layout onMenuToast={showToast}>
      <div className="flex flex-col" style={{ backgroundColor: '#e8e8e8', minHeight: 'calc(100dvh - 50px)' }}>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-[80] px-6 py-3 rounded-md shadow-lg text-white font-bold"
              style={{ backgroundColor: toast.includes('creado') || toast.includes('copiad') || toast.includes('pago') ? '#5cb85c' : '#d9534f', fontSize: '14px' }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Access Bar */}
        <QuickAccessBar />

        {/* Lottery Selector */}
        <LotterySelector
          selectedLotteries={selectedLotteries}
          onToggleLottery={handleToggleLottery}
          multiSelect={multiSelect}
          onToggleMultiSelect={() => setMultiSelect((v) => !v)}
        />

        {/* Action Button Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}
          className="flex items-center gap-2 relative"
          style={{ backgroundColor: primaryColor, borderBottom: '2px solid rgba(0,0,0,0.1)', padding: '12px 16px' }}
        >
          {/* CREAR TICKET */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} whileTap={{ scale: 0.98 }}
            onClick={handleCreateTicket}
            disabled={totalPlays === 0}
            className="font-bold uppercase transition-all"
            style={{
              backgroundColor: '#ffffff', color: primaryColor, padding: '12px 32px',
              borderRadius: '6px', fontSize: '15px', letterSpacing: '0.5px',
              opacity: totalPlays === 0 ? 0.6 : 1, cursor: totalPlays === 0 ? 'not-allowed' : 'pointer',
              border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            CREAR TICKET
          </motion.button>

          <IconButton icon={ClipboardList} onClick={() => openModal('duplicateTicket')} title="Duplicar ticket (QR o código)" />

          {/* Múltiple toggle */}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setMultiSelect(v => !v)}
            title={multiSelect ? `Múltiple ACTIVO (${selectedLotteries.length} loterias) — click para desactivar` : 'Activar modo Múltiple'}
            className="flex items-center gap-1.5 font-bold uppercase rounded"
            style={{
              padding: '8px 14px', border: multiSelect ? '2px solid #fff' : '2px solid rgba(255,255,255,0.35)',
              borderRadius: '6px', backgroundColor: multiSelect ? '#f59e0b' : 'rgba(245,158,11,0.18)',
              color: '#fff', fontSize: '12px', letterSpacing: '0.4px', cursor: 'pointer',
            }}
          >
            <Shuffle size={14} />
            <span>Múltiple</span>
            {multiSelect && selectedLotteries.length > 0 && (
              <span style={{ background: '#fff', color: '#f59e0b', borderRadius: '999px', fontSize: '10px', fontWeight: 900, padding: '1px 6px', marginLeft: 2 }}>
                {selectedLotteries.length}
              </span>
            )}
          </motion.button>

          <IconButton icon={Printer} onClick={handlePrint} title="Reporte diario Epson thermal" />
          <IconButton icon={DollarSign} onClick={() => openModal('pagar')} title="Pagar ticket" />
          <IconButton icon={HelpCircle} onClick={() => openModal('help')} title="Ayuda" />
        </motion.div>

        {/* Play Input + Counters */}
        <PlayInputSection
          jugada={jugada}
          onJugadaChange={(v) => setJugada(v.slice(0, maxJugadaDigits))}
          monto={monto}
          onMontoChange={setMonto}
          selectedLotteryName={selectedLotteryName}
          selectedLotteryId={selectedLotteries[0] || ''}
          detectedType={detectedType}
          onAddPlay={handleAddPlay}
          onCreateTicket={handleCreateTicket}
          recentTickets={recentTickets}
          totalPlays={totalPlays}
          totalAmount={totalAmount}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          typeOverride={typeOverride}
          onTypeOverride={setTypeOverride}
          onNextLottery={handleNextLottery}
          onReprintTicket={(t) => { setReprintMode(true); setPrintTicket(t as TicketData); }}
          onCancelTicket={(ticketId) => {
            if (!confirm('¿Cancelar este ticket? Esta acción no se puede deshacer.')) return;
            try {
              const existing = JSON.parse(localStorage.getItem('matador_tickets') || '[]');
              const updated = existing.map((x: any) => x.id === ticketId ? { ...x, status: 'cancelled' } : x);
              localStorage.setItem('matador_tickets', JSON.stringify(updated));
            } catch { /* ignore */ }
            supabase.from('tickets').update({ status: 'cancelled' }).eq('id', ticketId).then(() => {});
            window.dispatchEvent(new CustomEvent('nmv:tickets-updated'));
            showToast('Ticket cancelado');
          }}
        />

        {/* Watermark strip (desktop) */}
        {!isMobile && selectedLotteryName && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedLotteryName}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              style={{ height: 52, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8e8e8', borderBottom: '1px solid #d8d8d8', position: 'relative' }}
            >
              <span style={{ fontFamily: "'Bebas Neue', 'Black Ops One', 'Arial Black', Impact, sans-serif", fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 900, color: 'rgba(0,0,0,0.12)', textTransform: 'uppercase', letterSpacing: '0.12em', userSelect: 'none', whiteSpace: 'nowrap', lineHeight: 1 }}>
                {selectedLotteryName}
              </span>
              {typeOverride && (
                <span style={{ position: 'absolute', right: 16, fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: 1.5, color: '#fff', backgroundColor: '#2E7D32', padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase' }}>
                  {typeOverride} ✓
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Game Tables: Mobile combined OR Desktop 4-column */}
        {isMobile ? (
          <div style={{ padding: '12px', paddingBottom: '290px' }}>
            <div style={{ border: '2px solid #bbb', borderRadius: '8px', backgroundColor: '#E0E0E0', overflow: 'hidden' }}>
              <div className="flex items-center justify-between text-white font-bold uppercase"
                style={{ background: `linear-gradient(to bottom, ${primaryColor}dd, ${primaryColor})`, padding: '10px 12px', fontSize: '14px', letterSpacing: '1px' }}>
                <span>JUGADAS ACTIVAS</span>
                {plays.length > 0 && (
                  <button onClick={() => plays.forEach((p) => removePlay(p.id))} className="text-white/80 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,0,0,0.3)', fontSize: '10px' }}>🗑 Borrar todo</button>
                )}
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr 0.7fr 30px', padding: '6px 8px', backgroundColor: `${primaryColor}33` }}>
                {['LOT', 'NUM', '$', ''].map((h) => <span key={h} className="uppercase font-bold" style={{ fontSize: '10px', color: '#444' }}>{h}</span>)}
              </div>
              {plays.length === 0 ? (
                <div className="text-center py-8" style={{ color: '#999', fontSize: '13px' }}>Sin jugadas</div>
              ) : plays.map((play, i) => {
                const n = play.numbers;
                const num = (play.type === 'pale' && n.length === 4) ? `${n.slice(0,2)}-${n.slice(2)}` : (play.type === 'tripleta' && n.length === 6) ? `${n.slice(0,2)}-${n.slice(2,4)}-${n.slice(4)}` : n;
                return (
                  <div key={play.id} className="grid items-center" style={{ gridTemplateColumns: '1.2fr 1fr 0.7fr 30px', height: '38px', padding: '0 8px', borderBottom: '1px solid #d0d0d0', backgroundColor: i % 2 === 1 ? '#D0D0D0' : '#E0E0E0' }}>
                    <span className="truncate" style={{ fontSize: '11px', color: '#333' }}>{play.lotteryName}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{num}</span>
                    <span style={{ fontSize: '12px', color: '#333' }}>{formatCurrency(play.amount)}</span>
                    <button onClick={() => removePlay(play.id)} style={{ color: '#d9534f', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                );
              })}
              <div className="flex items-center justify-between" style={{ backgroundColor: '#3C3F54', padding: '10px 12px' }}>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{plays.length} jugadas</span>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', flex: '1 1 0', minHeight: 200, overflow: 'hidden' }}>
            {/* Background watermark */}
            <AnimatePresence mode="wait">
              {selectedLotteryName && (
                <motion.div key={selectedLotteryName} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
                  style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                  <span style={{ fontFamily: "'Bebas Neue', 'Black Ops One', 'Arial Black', Impact, sans-serif", fontSize: 'clamp(42px, 8vw, 110px)', fontWeight: 900, color: 'rgba(0,0,0,0.13)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', userSelect: 'none', lineHeight: 1 }}>
                    {selectedLotteryName}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {/* 4-column grid */}
            <div className="grid gap-3 responsive-tables" style={{ position: 'relative', zIndex: 1, gridTemplateColumns: 'repeat(4, 1fr)', padding: '12px', flex: 1, minHeight: 0 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0 }} className="h-full">
                <GameTable title="DIRECTO" plays={directoPlays} onDeletePlay={removePlay} onClearTable={() => directoPlays.forEach((p) => removePlay(p.id))} emptyRows={6} themeColor={primaryColor} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="h-full">
                <GameTable title="PALE & TRIPLETA" plays={paleTripletaPlays} onDeletePlay={removePlay} onClearTable={() => paleTripletaPlays.forEach((p) => removePlay(p.id))} emptyRows={6} themeColor={primaryColor} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="h-full">
                <GameTable title="CASH 3" plays={cash3Plays} onDeletePlay={removePlay} onClearTable={() => cash3Plays.forEach((p) => removePlay(p.id))} emptyRows={6} themeColor={primaryColor} showLockToggle locked={cash3Lock.locked} lockedLotteryName={cash3Lock.lotteryName} onToggleLock={toggleCash3Lock} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="h-full">
                <GameTable title="PLAY 4 & PICK 5" plays={play4Pick5Plays} onDeletePlay={removePlay} onClearTable={() => play4Pick5Plays.forEach((p) => removePlay(p.id))} emptyRows={6} themeColor={primaryColor} showLockToggle locked={play4Lock.locked} lockedLotteryName={play4Lock.lotteryName} onToggleLock={togglePlay4Lock} />
              </motion.div>
            </div>
          </div>
        )}

        {!isMobile && <ShortcutsPanel />}
      </div>

      {/* Mobile Keypad */}
      {isMobile && (
        <MobileKeypad
          themeColor={primaryColor}
          target={keypadTarget}
          onTargetChange={setKeypadTarget}
          jugadaValue={jugada}
          montoValue={monto}
          onKey={(k) => {
            if (keypadTarget === 'jugada') {
              setJugada((prev) => (prev + k).replace(/\D/g, '').slice(0, maxJugadaDigits));
            } else {
              if (amountOverwriteRef.current) {
                amountOverwriteRef.current = false;
                if (k === '.') { setMonto('0.'); return; }
                setMonto(k); return;
              }
              setMonto((prev) => {
                if (k === '.' && prev.includes('.')) return prev;
                const next = prev + k;
                return isNaN(parseFloat(next)) ? prev : next;
              });
            }
          }}
          onBackspace={() => {
            if (keypadTarget === 'jugada') setJugada((p) => p.slice(0, -1));
            else { amountOverwriteRef.current = false; setMonto((p) => p.slice(0, -1)); }
          }}
          onEnter={() => {
            if (keypadTarget === 'jugada') {
              setKeypadTarget('monto');
              if (!monto && lastAmountRef.current) setMonto(lastAmountRef.current);
              amountOverwriteRef.current = true;
            } else {
              if (!submittingRef.current) {
                const ok = handleAddPlay();
                if (ok) { setKeypadTarget('jugada'); amountOverwriteRef.current = false; }
              }
            }
          }}
          onCreateTicket={handleCreateTicket}
          onPrint={handlePrint}
        />
      )}

      {/* Ticket Print Modal */}
      <TicketPrintModal
        ticket={printTicket}
        onClose={() => { setPrintTicket(null); setReprintMode(false); }}
        clientPhone={(printTicket as any)?.clientPhone}
        forceReprint={reprintMode}
      />
    </Layout>
  );
}
