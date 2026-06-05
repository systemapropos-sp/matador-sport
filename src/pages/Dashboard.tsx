import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Printer,
  DollarSign,
  HelpCircle,
  FileText,
  X,
  Keyboard,
} from 'lucide-react';
import Layout from '@/components/Layout';
import LotterySelector from '@/components/LotterySelector';
import PlayInput from '@/components/PlayInput';
import GameTable from '@/components/GameTable';
import { usePlays, CAPACITY_LIMITS } from '@/hooks/usePlays';
import { useTicket } from '@/hooks/useTicket';
import { detectPlayType } from '@/lib/utils';
import { regularLotteries } from '@/data/lotteries';
import { useModalContext } from '@/components/modals';

// ---- Reusable Icon Button ----
function IconButton({
  icon: Icon,
  onClick,
  title,
  active = false,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onClick?: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center justify-center rounded transition-colors"
      style={{
        width: '36px',
        height: '36px',
        border: active ? '1px solid #5cb85c' : '1px solid #cccccc',
        borderRadius: '4px',
        backgroundColor: active ? '#e8f5e9' : '#ffffff',
        color: active ? '#5cb85c' : '#555555',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = active ? '#d4edda' : '#f5f5f5';
        e.currentTarget.style.borderColor = '#aaaaaa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = active ? '#e8f5e9' : '#ffffff';
        e.currentTarget.style.borderColor = active ? '#5cb85c' : '#cccccc';
      }}
      title={title}
    >
      <Icon size={16} />
    </motion.button>
  );
}

// ---- PLAYS Button ----
function PlaysButton({ onClick }: { onClick?: () => void }) {
  const { openModal } = useModalContext();
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        openModal('duplicatePlays');
        onClick?.();
      }}
      className="flex items-center gap-2 rounded transition-colors"
      style={{
        padding: '8px 16px',
        border: '1px solid #cccccc',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
        fontSize: '13px',
        color: '#555555',
      }}
    >
      <FileText size={16} />
      <span>PLAYS</span>
    </motion.button>
  );
}

// ---- Quick Amount Presets Dropdown ----
function QuickAmountDropdown({
  onSelectAmount,
}: {
  onSelectAmount: (amount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const presets = [5, 10, 20, 50, 100];

  return (
    <div className="relative">
      <IconButton
        icon={DollarSign}
        onClick={() => setOpen(!open)}
        title="Montos rapidos"
        active={open}
      />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg overflow-hidden"
            style={{ zIndex: 50, border: '1px solid #e0e0e0', minWidth: '80px' }}
          >
            {presets.map((amount) => (
              <button
                key={amount}
                className="w-full text-left px-4 py-2 transition-colors hover:bg-gray-100"
                style={{ fontSize: '13px', color: '#333333' }}
                onClick={() => {
                  onSelectAmount(amount);
                  setOpen(false);
                }}
              >
                ${amount}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Keyboard Shortcuts Help ----
function KeyboardHelp({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: 'Tab', desc: 'Ciclar entre JUGADA y MONTO' },
    { key: 'Enter (JUGADA)', desc: 'Mover foco a MONTO' },
    { key: 'Enter (MONTO)', desc: 'Agregar jugada' },
    { key: 'Ctrl + Enter', desc: 'Crear ticket' },
    { key: 'Escape', desc: 'Limpiar campos' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg overflow-hidden"
      style={{ zIndex: 50, border: '1px solid #e0e0e0', width: '300px' }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Keyboard size={14} />
          <span className="font-semibold" style={{ fontSize: '13px' }}>
            Atajos de teclado
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
          <X size={14} />
        </button>
      </div>
      <div className="p-2">
        {shortcuts.map((s) => (
          <div
            key={s.key}
            className="flex items-center justify-between px-2 py-1.5"
            style={{ fontSize: '12px' }}
          >
            <kbd
              className="px-2 py-0.5 rounded font-mono font-bold"
              style={{
                backgroundColor: '#f0f0f0',
                border: '1px solid #cccccc',
                fontSize: '11px',
                color: '#333333',
              }}
            >
              {s.key}
            </kbd>
            <span style={{ color: '#555555' }}>{s.desc}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---- Capacity Panel ----
function CapacityPanel({
  capacityUsed,
  capacityRemaining,
}: {
  capacityUsed: Record<string, number>;
  capacityRemaining: Record<string, number>;
}) {
  const items = [
    { label: 'Directo', type: 'directo' },
    { label: 'Pale', type: 'pale' },
    { label: 'Tripleta', type: 'tripleta' },
  ];

  return (
    <div
      className="flex flex-col rounded overflow-hidden"
      style={{ border: '1px solid #cccccc', backgroundColor: '#ffffff' }}
    >
      {/* Header */}
      <div
        className="text-center text-white font-bold uppercase"
        style={{
          background: 'linear-gradient(to bottom, #66BB6A, #43A047)',
          padding: '8px',
          fontSize: '12px',
        }}
      >
        CAPACIDAD
      </div>

      {/* Capacity items */}
      <div className="flex flex-col p-3 gap-3" style={{ flex: 1, justifyContent: 'center' }}>
        {items.map(({ label, type }) => {
          const used = capacityUsed[type] || 0;
          const total = CAPACITY_LIMITS[type] || 0;
          const remaining = capacityRemaining[type] || 0;
          const pct = total > 0 ? (used / total) * 100 : 0;
          const isFull = remaining <= 0;
          const isLow = remaining > 0 && remaining <= 5;

          return (
            <div key={type}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#444444' }}>
                  {label}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isFull ? '#d9534f' : isLow ? '#f0ad4e' : '#43A047',
                  }}
                >
                  {used} / {total}
                </span>
              </div>
              {/* Progress bar */}
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: '8px', backgroundColor: '#e0e0e0' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: isFull ? '#d9534f' : isLow ? '#f0ad4e' : '#43A047',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              {remaining <= 0 && (
                <div style={{ fontSize: '10px', color: '#d9534f', marginTop: '2px' }}>
                  COMPLETO
                </div>
              )}
              {remaining > 0 && remaining <= 5 && (
                <div style={{ fontSize: '10px', color: '#f0ad4e', marginTop: '2px' }}>
                  Quedan {remaining}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="text-center font-semibold"
        style={{
          backgroundColor: '#3C3F54',
          padding: '8px',
          fontSize: '11px',
          color: '#ffffff',
        }}
      >
        LIMITES DE VENTA
      </div>
    </div>
  );
}

// ---- Main Dashboard ----
export default function Dashboard() {
  // Plays state with capacity tracking
  const {
    plays,
    addPlay,
    removePlay,
    clearPlays,
    totalPlays,
    totalAmount,
    playsByType,
    capacityUsed,
    capacityRemaining,
    isAtCapacity,
  } = usePlays();

  // Ticket state
  const { createTicket, recentTickets } = useTicket();

  // Lottery selection
  const [selectedLotteries, setSelectedLotteries] = useState<string[]>(['florida-pm']);
  const [multiSelect, setMultiSelect] = useState(false);

  // Input state
  const [jugada, setJugada] = useState('');
  const [monto, setMonto] = useState('');

  // UI state
  const [toast, setToast] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // Detect play type from current jugada input
  const detectedType = jugada ? detectPlayType(jugada) : '';
  const selectedLotteryName =
    selectedLotteries.length === 1
      ? regularLotteries.find((l) => l.id === selectedLotteries[0])?.name || ''
      : selectedLotteries.length > 1
        ? `${selectedLotteries.length} loterias`
        : '';

  // Toggle lottery selection
  const handleToggleLottery = useCallback(
    (id: string) => {
      if (multiSelect) {
        setSelectedLotteries((prev) =>
          prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
        );
      } else {
        setSelectedLotteries([id]);
      }
    },
    [multiSelect]
  );

  // Add play callback with capacity check
  const handleAddPlay = useCallback((): boolean => {
    if (!jugada || !monto) return false;

    const amount = parseFloat(monto);
    if (isNaN(amount) || amount <= 0) return false;
    if (selectedLotteries.length === 0) return false;

    // Check capacity for this play type
    const type = detectPlayType(jugada);
    if (isAtCapacity(type)) {
      showToast(`Capacidad completa para ${type}`);
      return false;
    }

    // Add play for each selected lottery
    let added = false;
    selectedLotteries.forEach((lotId) => {
      const lottery = regularLotteries.find((l) => l.id === lotId);
      if (lottery) {
        const ok = addPlay(jugada, amount, lottery.id, lottery.name);
        if (ok) added = true;
      }
    });

    if (added) {
      setJugada('');
      setMonto('');
    }

    return added;
  }, [jugada, monto, selectedLotteries, addPlay, isAtCapacity, showToast]);

  // Create ticket callback
  const handleCreateTicket = useCallback(() => {
    if (plays.length === 0) {
      showToast('Agregue al menos una jugada');
      return;
    }

    const ticket = createTicket(plays);
    if (ticket) {
      showToast(`Ticket creado: ${ticket.ticketNumber}`);
      clearPlays();
      setJugada('');
      setMonto('');
    }
  }, [plays, createTicket, clearPlays, showToast]);

  // Copy plays to clipboard
  const handleCopyPlays = useCallback(() => {
    if (plays.length === 0) {
      showToast('No hay jugadas para copiar');
      return;
    }
    const text = plays
      .map(
        (p) =>
          `${p.lotteryName} | ${p.numbers} | ${p.type.toUpperCase()} | $${p.amount.toFixed(2)}`
      )
      .join('\n');
    navigator.clipboard.writeText(text).then(
      () => showToast('Jugadas copiadas al portapapeles'),
      () => showToast('Error al copiar')
    );
  }, [plays, showToast]);

  // Trigger print dialog
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Set quick amount
  const handleQuickAmount = useCallback((amount: number) => {
    setMonto(amount.toString());
    // Focus monto input after setting
    setTimeout(() => {
      const montoInput = document.querySelector('input[type="number"]') as HTMLInputElement;
      montoInput?.focus();
    }, 50);
  }, []);

  // Keyboard shortcuts: Esc clears input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setJugada('');
        setMonto('');
        setHelpOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close help on outside click
  useEffect(() => {
    if (!helpOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-help-panel]')) {
        setHelpOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [helpOpen]);

  // Table categories
  const directoPlays = playsByType['directo'] || [];
  const paleTripletaPlays = [
    ...(playsByType['pale'] || []),
    ...(playsByType['tripleta'] || []),
  ];
  const cash3Plays = playsByType['cash3'] || [];
  const play4Pick5Plays = [
    ...(playsByType['play4'] || []),
    ...(playsByType['pick5'] || []),
  ];

  return (
    <Layout>
      <div
        className="flex flex-col"
        style={{ backgroundColor: '#e8e8e8', minHeight: 'calc(100dvh - 50px)' }}
      >
        {/* Toast notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-[80] px-6 py-3 rounded-md shadow-lg text-white font-medium"
              style={{
                backgroundColor: toast.includes('creado') ? '#5cb85c' : '#d9534f',
                fontSize: '14px',
              }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 2: Lottery Selector Bar */}
        <LotterySelector
          selectedLotteries={selectedLotteries}
          onToggleLottery={handleToggleLottery}
          multiSelect={multiSelect}
          onToggleMultiSelect={() => setMultiSelect((v) => !v)}
        />

        {/* Section 3: Action Button Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="flex items-center gap-2 relative"
          style={{
            backgroundColor: '#f9f9f9',
            borderBottom: '1px solid #e0e0e0',
            padding: '10px 16px',
          }}
        >
          {/* CREAR TICKET */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(92, 184, 92, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateTicket}
            disabled={totalPlays === 0}
            className="font-semibold uppercase transition-all"
            style={{
              backgroundColor: '#5cb85c',
              color: '#ffffff',
              padding: '10px 28px',
              borderRadius: '6px',
              fontSize: '14px',
              letterSpacing: '0.5px',
              opacity: totalPlays === 0 ? 0.5 : 1,
              cursor: totalPlays === 0 ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            CREAR TICKET
          </motion.button>

          {/* Icon buttons */}
          <IconButton
            icon={ClipboardList}
            onClick={handleCopyPlays}
            title="Copiar jugadas al portapapeles"
          />
          <IconButton icon={Printer} onClick={handlePrint} title="Imprimir" />
          <QuickAmountDropdown onSelectAmount={handleQuickAmount} />
          <div data-help-panel className="relative">
            <IconButton
              icon={HelpCircle}
              onClick={() => setHelpOpen(!helpOpen)}
              title="Atajos de teclado"
              active={helpOpen}
            />
            <AnimatePresence>
              {helpOpen && <KeyboardHelp onClose={() => setHelpOpen(false)} />}
            </AnimatePresence>
          </div>

          {/* PLAYS button */}
          <PlaysButton />
        </motion.div>

        {/* Section 4 & 5: Play Input + Counters */}
        <PlayInput
          jugada={jugada}
          onJugadaChange={setJugada}
          monto={monto}
          onMontoChange={setMonto}
          selectedLotteryName={selectedLotteryName}
          detectedType={detectedType}
          onAddPlay={handleAddPlay}
          onCreateTicket={handleCreateTicket}
          recentTickets={recentTickets}
          totalPlays={totalPlays}
          totalAmount={totalAmount}
          capacityRemaining={capacityRemaining}
          isAtCapacity={isAtCapacity}
        />

        {/* Section 6: 4-Column Game Tables Grid + Capacity Panel */}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: '1fr 1fr 1fr 1fr 180px',
            padding: '12px',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Table 1: DIRECTO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0 }}
            className="h-full"
          >
            <GameTable
              title="DIRECTO"
              plays={directoPlays}
              onDeletePlay={removePlay}
              emptyRows={4}
              compact
            />
          </motion.div>

          {/* Table 2: PALE & TRIPLETA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="h-full"
          >
            <GameTable
              title="PALE & TRIPLETA"
              plays={paleTripletaPlays}
              onDeletePlay={removePlay}
              emptyRows={4}
              compact
            />
          </motion.div>

          {/* Table 3: CASH 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="h-full"
          >
            <GameTable
              title="CASH 3"
              plays={cash3Plays}
              onDeletePlay={removePlay}
              emptyRows={4}
              compact
            />
          </motion.div>

          {/* Table 4: PLAY 4 & PICK 5 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="h-full"
          >
            <GameTable
              title="PLAY 4 & PICK 5"
              plays={play4Pick5Plays}
              onDeletePlay={removePlay}
              emptyRows={4}
              compact
            />
          </motion.div>

          {/* Capacity Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="h-full"
          >
            <CapacityPanel
              capacityUsed={capacityUsed}
              capacityRemaining={capacityRemaining}
            />
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
