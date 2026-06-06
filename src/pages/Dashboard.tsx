import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Printer,
  DollarSign,
  HelpCircle,
  X,
  Keyboard,
  Ticket,
  ChevronDown,
  Monitor,
  Wallet,
  BarChart3,
  Scale,
  Calculator,
  Shuffle,
  Copy,
  Users,
} from 'lucide-react';
import Layout from '@/components/Layout';
import LotterySelector from '@/components/LotterySelector';
import GameTable from '@/components/GameTable';
import ShortcutsPanel from '@/components/ShortcutsPanel';
import { usePlays } from '@/hooks/usePlays';
import { useTicket } from '@/hooks/useTicket';
import { detectPlayType, formatCurrency } from '@/lib/utils';
import { regularLotteries } from '@/data/lotteries';
import { useVendedores } from '@/hooks/useVendedores';
import { useModalContext } from '@/components/modals';
import { schedules } from '@/data/schedules';

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
        width: '38px',
        height: '38px',
        border: active ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(0,0,0,0.15)',
        borderRadius: '6px',
        backgroundColor: active ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
        color: '#ffffff',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = active ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)';
      }}
      title={title}
    >
      <Icon size={17} />
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

// ---- Duplicar Dropdown ----
function DuplicarDropdown() {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const openLotteries = regularLotteries.filter((l) => {
    const schedule = schedules.find((s) => s.lotteryId === l.id);
    if (!schedule) return true;
    const match = schedule.closingTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return true;
    let h = parseInt(match[1], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    return currentMinutes < h * 60 + parseInt(match[2], 10);
  });

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded transition-colors font-semibold"
        style={{
          padding: '9px 18px',
          border: '1px solid #cccccc',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          fontSize: '13px',
          color: '#555555',
        }}
      >
        <Copy size={16} />
        <span>Duplicar</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1 bg-white rounded shadow-lg overflow-hidden"
            style={{ zIndex: 50, border: '1px solid #e0e0e0', width: '240px', maxHeight: '300px', overflowY: 'auto' }}
          >
            <div className="px-3 py-2 border-b border-gray-200 font-semibold" style={{ fontSize: '12px', color: '#555' }}>
              Loterias disponibles ({openLotteries.length})
            </div>
            {openLotteries.map((lottery) => (
              <button
                key={lottery.id}
                className="w-full flex items-center gap-2 px-3 py-2 transition-colors hover:bg-gray-50 text-left"
                style={{ fontSize: '12px', color: '#333' }}
                onClick={() => setOpen(false)}
              >
                <span
                  className="rounded-full flex-shrink-0"
                  style={{ width: '14px', height: '14px', backgroundColor: lottery.color || '#ccc' }}
                />
                {lottery.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Client Selector ----
function ClientSelector({ onSelect, selectedClient }: { onSelect: (clientId: string) => void; selectedClient: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Array<{ id: string; name: string; phone?: string }>>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('matador_clients');
      if (stored) setClients(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [open]);

  const filtered = search.trim()
    ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search)))
    : clients;

  const selectedName = clients.find((c) => c.id === selectedClient)?.name;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => { setOpen(!open); setSearch(''); }}
        className="flex items-center gap-1 rounded border transition-colors"
        style={{
          padding: '14px 16px',
          fontSize: '13px',
          color: selectedName ? '#333' : '#999',
          borderColor: '#cccccc',
          backgroundColor: '#ffffff',
          minHeight: '55px',
          fontWeight: selectedName ? 600 : 400,
        }}
      >
        <Users size={16} />
        <span>{selectedName || 'Cliente'}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg overflow-hidden"
            style={{ zIndex: 50, border: '1px solid #e0e0e0', width: '260px' }}
          >
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ borderColor: '#e0e0e0', outline: 'none' }}
                autoFocus
              />
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <button
                className="w-full text-left px-4 py-2 transition-colors hover:bg-gray-50"
                style={{ fontSize: '12px', color: '#999' }}
                onClick={() => { onSelect(''); setOpen(false); }}
              >
                Ninguno
              </button>
              {filtered.map((c) => (
                <button
                  key={c.id}
                  className="w-full text-left px-4 py-2 transition-colors hover:bg-gray-50 flex items-center gap-2"
                  style={{ fontSize: '12px', color: '#333' }}
                  onClick={() => { onSelect(c.id); setOpen(false); }}
                >
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{c.name}</span>
                    {c.phone && <span style={{ fontSize: '10px', color: '#888' }}>{c.phone}</span>}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-3 text-center" style={{ fontSize: '12px', color: '#999' }}>
                  No encontrado
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Quick Access Bar ----
function QuickAccessBar({ openModal }: { openModal: (type: any) => void }) {
  const items = [
    { icon: Monitor, label: 'Monitor', modal: 'ticketMonitor' },
    { icon: Wallet, label: 'Pendientes', modal: 'pendingPayments' },
    { icon: Scale, label: 'Balances', modal: 'balance' },
    { icon: Calculator, label: 'Contab.', modal: 'accounting' },
    { icon: BarChart3, label: 'Historial', route: '/betting-pool/historical-sale' },
    { icon: Copy, label: 'Duplicar', modal: 'duplicateTicket' },
    { icon: Shuffle, label: 'Generador', modal: 'randomGenerator' },
  ];

  const navigate = useNavigate();

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '6px 12px',
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if ((item as any).route) {
                navigate((item as any).route);
              } else if ((item as any).modal) {
                openModal((item as any).modal);
              }
            }}
            className="flex items-center gap-1.5 rounded transition-colors flex-shrink-0"
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#555555',
              backgroundColor: '#f5f5f5',
              border: '1px solid #e0e0e0',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8e8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
          >
            <Icon size={14} />
            <span className="hidden md:inline">{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ---- Play Input Section ----
function PlayInputSection({
  jugada,
  onJugadaChange,
  monto,
  onMontoChange,
  selectedLotteryName,
  detectedType,
  onAddPlay,
  onCreateTicket,
  totalPlays,
  totalAmount,
  recentTickets,
  selectedClient,
  onSelectClient,
}: {
  jugada: string;
  onJugadaChange: (v: string) => void;
  monto: string;
  onMontoChange: (v: string) => void;
  selectedLotteryName: string;
  detectedType: string;
  onAddPlay: () => boolean;
  onCreateTicket: () => void;
  totalPlays: number;
  totalAmount: number;
  recentTickets: Array<{ ticketNumber: string; totalAmount: number; createdAt: Date }>;
  selectedClient?: string;
  onSelectClient?: (clientId: string) => void;
}) {
  const jugadaRef = useRef<HTMLInputElement>(null);
  const montoRef = useRef<HTMLInputElement>(null);
  const [showRecent, setShowRecent] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.currentTarget === jugadaRef.current) {
        montoRef.current?.focus();
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
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      onCreateTicket();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'directo': return '#689F38';
      case 'pale': return '#558B2F';
      case 'tripleta': return '#33691E';
      case 'cash3': return '#43A047';
      case 'play4': return '#2E7D32';
      case 'pick5': return '#1B5E20';
      default: return '#888888';
    }
  };

  return (
    <div
      className="flex flex-col gap-3"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #e0e0e0',
        padding: '16px 20px',
      }}
    >
      {/* Input row */}
      <div className="flex items-end gap-3 flex-wrap">
        {/* JUGADA */}
        <div className="flex flex-col gap-1" style={{ flex: '0 0 35%', minWidth: '130px' }}>
          <label
            className="uppercase font-bold"
            style={{ fontSize: '11px', color: '#555', letterSpacing: '0.5px' }}
          >
            JUGADA
          </label>
          <div className="relative">
            <input
              ref={jugadaRef}
              type="text"
              value={jugada}
              onChange={(e) => onJugadaChange(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              placeholder="--"
              className="w-full text-center font-bold rounded border-2 transition-colors"
              style={{
                padding: '12px 16px',
                fontSize: '24px',
                color: '#333',
                borderColor: detectedType ? getTypeColor(detectedType) : '#cccccc',
                backgroundColor: '#fafafa',
                letterSpacing: '2px',
              }}
              autoFocus
            />
            {detectedType && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 uppercase font-bold"
                style={{
                  fontSize: '11px',
                  color: getTypeColor(detectedType),
                  backgroundColor: '#E8F5E9',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {detectedType}
              </span>
            )}
          </div>
        </div>

        {/* N/A - Selected Lottery */}
        <div className="flex flex-col gap-1" style={{ minWidth: '140px' }}>
          <label
            className="uppercase font-bold"
            style={{ fontSize: '11px', color: '#555', letterSpacing: '0.5px' }}
          >
            N/A
          </label>
          <div
            className="flex items-center justify-center rounded border font-semibold"
            style={{
              padding: '14px 16px',
              fontSize: '13px',
              color: selectedLotteryName ? '#333' : '#999',
              borderColor: '#cccccc',
              backgroundColor: '#f5f5f5',
              minHeight: '55px',
            }}
          >
            {selectedLotteryName || 'Seleccione'}
          </div>
        </div>

        {/* MONTO */}
        <div className="flex flex-col gap-1" style={{ flex: '0 0 15%', minWidth: '85px' }}>
          <label
            className="uppercase font-bold"
            style={{ fontSize: '11px', color: '#555', letterSpacing: '0.5px' }}
          >
            MONTO
          </label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 font-bold"
              style={{ fontSize: '18px', color: '#999' }}
            >
              $
            </span>
            <input
              ref={montoRef}
              type="number"
              value={monto}
              onChange={(e) => onMontoChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              className="w-full text-right font-bold rounded border-2 transition-colors"
              style={{
                padding: '12px 12px 12px 28px',
                fontSize: '20px',
                color: '#333',
                borderColor: monto ? '#5cb85c' : '#cccccc',
                backgroundColor: '#fafafa',
              }}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Client Selector */}
        {onSelectClient && <ClientSelector onSelect={onSelectClient} selectedClient={selectedClient || ''} />}

        {/* Recent tickets dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowRecent(!showRecent)}
            className="flex items-center gap-1 rounded border transition-colors"
            style={{
              padding: '14px 16px',
              fontSize: '13px',
              color: '#555',
              borderColor: '#cccccc',
              backgroundColor: '#ffffff',
              minHeight: '55px',
            }}
          >
            <Ticket size={16} />
            <span>Recientes</span>
            <motion.span
              animate={{ rotate: showRecent ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={14} />
            </motion.span>
          </motion.button>
          <AnimatePresence>
            {showRecent && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg overflow-hidden"
                style={{ zIndex: 50, border: '1px solid #e0e0e0', minWidth: '480px' }}
              >
                {recentTickets.length === 0 ? (
                  <div className="px-4 py-3 text-center" style={{ fontSize: '13px', color: '#999' }}>
                    No hay tickets recientes
                  </div>
                ) : (
                  recentTickets.slice(0, 5).map((t) => (
                    <div
                      key={t.ticketNumber}
                      className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-gray-50"
                      style={{ borderBottom: '1px solid #f0f0f0' }}
                    >
                      <div className="flex flex-col">
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>
                          {t.ticketNumber}
                        </span>
                        <span style={{ fontSize: '11px', color: '#888' }}>
                          {t.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#689F38' }}>
                        {formatCurrency(t.totalAmount)}
                      </span>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Counters row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div
          className="flex items-center gap-2 rounded px-4 py-2"
          style={{ backgroundColor: '#E8F5E9', border: '1px solid #C5E1A5' }}
        >
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
        <div
          className="flex items-center gap-2 rounded px-4 py-2"
          style={{ backgroundColor: '#E3F2FD', border: '1px solid #90CAF9' }}
        >
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
    isAtCapacity,
  } = usePlays();

  // Ticket state
  const { createTicket, recentTickets } = useTicket();

  // Lottery selection
  const [selectedLotteries, setSelectedLotteries] = useState<string[]>(['florida-pm']);

  // Vendedor
  const { activeVendedor } = useVendedores();

  // Modal context
  const { openModal } = useModalContext();

  // Calculate theme color directly from selected lottery
  const primaryColor = useMemo(() => {
    if (selectedLotteries.length === 1) {
      const lottery = regularLotteries.find((l) => l.id === selectedLotteries[0]);
      if (lottery?.color) return lottery.color;
    }
    return '#5cb85c';
  }, [selectedLotteries]);

  const [multiSelect, setMultiSelect] = useState(false);

  // Input state
  const [jugada, setJugada] = useState('');
  const [monto, setMonto] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

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

    const type = detectPlayType(jugada);
    if (isAtCapacity(type)) {
      showToast(`Capacidad completa para ${type}`);
      return false;
    }

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
      // monto stays for next play
    }

    return added;
  }, [jugada, monto, selectedLotteries, addPlay, isAtCapacity, showToast]);

  // Create ticket callback
  const handleCreateTicket = useCallback(() => {
    if (plays.length === 0) {
      showToast('Agregue al menos una jugada');
      return;
    }

    const ticket = createTicket(plays, activeVendedor?.name || 'Vendedor');
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
    setTimeout(() => {
      const montoInput = document.querySelector('input[type="number"]') as HTMLInputElement;
      montoInput?.focus();
    }, 50);
  }, []);

  // Handle toast from side menu
  const handleMenuToast = useCallback((message: string) => {
    showToast(message);
  }, [showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setJugada('');
        setMonto('');
        setHelpOpen(false);
      }
      if (e.key === '-' || e.key === 'Minus') {
        e.preventDefault();
        handleCreateTicket();
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
    <Layout onMenuToast={handleMenuToast}>
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
              className="fixed top-16 left-1/2 -translate-x-1/2 z-[80] px-6 py-3 rounded-md shadow-lg text-white font-bold"
              style={{
                backgroundColor: toast.includes('creado') || toast.includes('copiad') || toast.includes('pago') ? '#5cb85c' : '#d9534f',
                fontSize: '14px',
              }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Access Bar */}
        <QuickAccessBar openModal={openModal} />

        {/* Section 1: Lottery Selector Bar */}
        <LotterySelector
          selectedLotteries={selectedLotteries}
          onToggleLottery={handleToggleLottery}
          multiSelect={multiSelect}
          onToggleMultiSelect={() => setMultiSelect((v) => !v)}
        />

        {/* Section 2: Action Button Bar - FULL color theme */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="flex items-center gap-2 relative"
          style={{
            backgroundColor: primaryColor,
            borderBottom: '2px solid rgba(0,0,0,0.1)',
            padding: '12px 16px',
          }}
        >
          {/* CREAR TICKET */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateTicket}
            disabled={totalPlays === 0}
            className="font-bold uppercase transition-all"
            style={{
              backgroundColor: '#ffffff',
              color: primaryColor,
              padding: '12px 32px',
              borderRadius: '6px',
              fontSize: '15px',
              letterSpacing: '0.5px',
              opacity: totalPlays === 0 ? 0.6 : 1,
              cursor: totalPlays === 0 ? 'not-allowed' : 'pointer',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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

          {/* Duplicar dropdown */}
          <DuplicarDropdown />
        </motion.div>

        {/* Section 3: Play Input + Counters */}
        <PlayInputSection
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
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
        />

        {/* Section 4: 4-Column Game Tables Grid */}
        <div
          className="grid gap-3 responsive-tables"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
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
              emptyRows={6}
              themeColor={primaryColor}
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
              emptyRows={6}
              themeColor={primaryColor}
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
              emptyRows={6}
              themeColor={primaryColor}
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
              emptyRows={6}
              themeColor={primaryColor}
            />
          </motion.div>
        </div>

        {/* Shortcuts Panel */}
        <ShortcutsPanel />
      </div>
    </Layout>
  );
}
