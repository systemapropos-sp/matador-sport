import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Banknote,
  Gamepad2,
  Trash2,
} from 'lucide-react';
import Layout from '@/components/Layout';
import BarcodeScanner from '@/components/BarcodeScanner';
import LotterySelector from '@/components/LotterySelector';
import GameTable from '@/components/GameTable';
import ShortcutsPanel from '@/components/ShortcutsPanel';
import TicketPrintModal from '@/components/TicketPrintModal';
import MobileKeypad from '@/components/MobileKeypad';
import { usePlays } from '@/hooks/usePlays';
import { useTicket } from '@/hooks/useTicket';
import { usePlayLimit } from '@/hooks/usePlayLimit';
import { detectPlayType, formatCurrency } from '@/lib/utils';
import { regularLotteries } from '@/data/lotteries';
import { useVendedores } from '@/hooks/useVendedores';
import { useModalContext } from '@/components/modals';
import { schedules } from '@/data/schedules';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Ticket as TicketData, Play } from '@/types';
import { supabase } from '@/lib/supabase';
import { usePermisos } from '@/hooks/usePermisos';

// ── parseTimeToMinutes helper (shared with LotterySelector) ──
function parseTimeToMinutes(t: string): number {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1]); const min = parseInt(m[2]); const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

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

// ---- Client Selector — usa createPortal para escapar overflow-x:auto ----
function ClientSelector({ onSelect, selectedClient }: { onSelect: (clientId: string) => void; selectedClient: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Array<{ id: string; name: string; phone?: string }>>([]);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('matador_clients');
      if (stored) setClients(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [open]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest('[data-cs-drop]') && !t.closest('[data-cs-btn]')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(v => !v);
    setSearch('');
  };

  const filtered = search.trim()
    ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search)))
    : clients;

  const selectedName = clients.find((c) => c.id === selectedClient)?.name;

  return (
    <>
      <motion.button
        ref={btnRef}
        data-cs-btn
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleToggle}
        className="flex items-center gap-1 rounded border transition-colors flex-shrink-0"
        style={{
          padding: '14px 16px',
          fontSize: '13px',
          color: selectedName ? '#333' : '#999',
          borderColor: open ? '#0D9488' : '#cccccc',
          backgroundColor: open ? '#f0fffe' : '#ffffff',
          minHeight: '55px',
          fontWeight: selectedName ? 600 : 400,
          whiteSpace: 'nowrap',
        }}
      >
        <Users size={16} />
        <span>{selectedName || 'Cliente'}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} />
        </motion.span>
      </motion.button>
      {open && createPortal(
        <motion.div
          data-cs-drop
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.14 }}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            width: '265px',
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '10px',
            boxShadow: '0 10px 32px rgba(0,0,0,0.18)',
            overflow: 'hidden',
          }}
        >
          {/* Search */}
          <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              autoFocus
              style={{
                width: '100%', padding: '7px 10px', borderRadius: '6px',
                border: '1px solid #e0e0e0', fontSize: '12px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {/* List */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            <button
              style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '12px', color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
              onClick={() => { onSelect(''); setOpen(false); }}
            >
              Ninguno
            </button>
            {filtered.length === 0 ? (
              <div style={{ padding: '14px', textAlign: 'center', fontSize: '12px', color: '#bbb' }}>No encontrado</div>
            ) : filtered.map((c) => (
              <button
                key={c.id}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '12px',
                  color: '#333', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  borderTop: '1px solid #f8f8f8',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                onClick={() => { onSelect(c.id); setOpen(false); }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#0D9488',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  {c.phone && <span style={{ fontSize: '10px', color: '#888' }}>{c.phone}</span>}
                </div>
              </button>
            ))}
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
}

// ---- Quick Access Bar — uses useModalContext() directly (same as SideMenu) ----
function QuickAccessBar() {
  const { openModal } = useModalContext();
  const navigate = useNavigate();
  const { hasPerm } = usePermisos();
  const [clientsOpen, setClientsOpen] = useState(false);
  const [clientsPos, setClientsPos] = useState({ top: 0, left: 0 });
  const clientsBtnRef = useRef<HTMLButtonElement>(null);
  const [qbClients, setQbClients] = useState<Array<{ id: string; name: string; phone?: string; type?: string; balance?: number }>>([]);

  const toggleClients = () => {
    if (!clientsOpen) {
      try { setQbClients(JSON.parse(localStorage.getItem('matador_clients') || '[]')); } catch { setQbClients([]); }
      if (clientsBtnRef.current) {
        const r = clientsBtnRef.current.getBoundingClientRect();
        setClientsPos({ top: r.bottom + 4, left: r.left });
      }
    }
    setClientsOpen(p => !p);
  };

  const allItems = [
    { icon: Monitor,   label: 'Monitor',   modal: 'ticketMonitor' as const,        permKey: 'monitoreo'         },
    { icon: Wallet,    label: 'Pendientes',modal: 'pendingPayments' as const,       permKey: 'pendiente_pago'    },
    { icon: Scale,     label: 'Balances',  modal: 'balance' as const,               permKey: 'balances'          },
    { icon: Calculator,label: 'Contab.',   modal: 'accounting' as const,            permKey: 'contabilidad'      },
    { icon: BarChart3, label: 'Historial', route: '/betting-pool/historical-sale',  permKey: 'ventas_historicas' },
    { icon: Copy,      label: 'Duplicar',  modal: 'duplicateTicket' as const,       permKey: 'duplicar_jugadas'  },
    { icon: Shuffle,   label: 'Generador', modal: 'randomGenerator' as const,       permKey: 'generador_jugadas' },
    { icon: Banknote,  label: 'Pagar',     modal: 'pagar' as const,                 permKey: 'pagar'             },
    { icon: Users,     label: 'Clientes',  custom: 'clients' as const,              permKey: 'clientes'          },
    { icon: Gamepad2,  label: 'Jugadas',   route: '/betting-pool/play-monitor',     permKey: 'jugadas'           },
  ];
  // Filter items based on permissions (default true if no record for this banca)
  const items = allItems.filter(item => hasPerm(item.permKey));

  const btnBase: React.CSSProperties = {
    padding: '6px 12px', fontSize: '11px', fontWeight: 600,
    color: '#555555', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0',
  };

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto"
      style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0', padding: '6px 12px' }}
    >
      {items.map((item) => {
        const Icon = item.icon;

        // ── Clientes: inline dropdown (no modal overlay) ──
        if ('custom' in item && item.custom === 'clients') {
          return (
            <div key="Clientes" style={{ flexShrink: 0 }}>
              <motion.button
                ref={clientsBtnRef}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={toggleClients}
                className="flex items-center gap-1.5 rounded transition-colors"
                style={{ ...btnBase, backgroundColor: clientsOpen ? '#e0e0e0' : '#f5f5f5' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8e8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = clientsOpen ? '#e0e0e0' : '#f5f5f5'; }}
              >
                <Users size={14} />
                <span className="hidden md:inline">Clientes</span>
                <ChevronDown size={10} style={{ transform: clientsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </motion.button>
              {clientsOpen && createPortal(
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  style={{
                    position: 'fixed',
                    top: clientsPos.top,
                    left: clientsPos.left,
                    zIndex: 9999,
                    width: 280, maxHeight: 340, overflowY: 'auto',
                    background: '#fff', border: '1px solid #e0e0e0',
                    borderRadius: 10, boxShadow: '0 10px 32px rgba(0,0,0,0.18)',
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', fontSize: 12, fontWeight: 700, color: '#555', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff' }}>
                    <span>Clientes ({qbClients.length})</span>
                    <button onClick={() => setClientsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>
                  {/* List */}
                  {qbClients.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>No hay clientes registrados</div>
                  ) : qbClients.map((c) => (
                    <div key={c.id} style={{ padding: '8px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{c.name}</div>
                        {c.phone && <div style={{ fontSize: 11, color: '#888' }}>{c.phone}</div>}
                        {c.type === 'credito' && c.balance !== undefined && (
                          <div style={{ fontSize: 10, color: c.balance > 0 ? '#d9534f' : '#5cb85c', fontWeight: 700 }}>Balance: ${c.balance?.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>,
                document.body
              )}
            </div>
          );
        }

        // ── Normal button ──
        return (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if ('route' in item && item.route) {
                navigate(item.route);
              } else if ('modal' in item && item.modal) {
                openModal(item.modal);
              }
            }}
            className="flex items-center gap-1.5 rounded transition-colors flex-shrink-0"
            style={btnBase}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8e8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
          >
            <Icon size={14} />
            <span className="hidden md:inline">{item.label}</span>
          </motion.button>
        );
      })}

      {/* ── Barcode Scanner button — gated by 'escanear' permission ── */}
      {hasPerm('escanear') && (
        <div style={{ flexShrink: 0 }}>
          <BarcodeScanner
            onDuplicate={(plays) => {
              window.dispatchEvent(new CustomEvent('nmv:scan-duplicate', { detail: plays }));
            }}
            onPay={(_ticket) => {
              openModal('pagar');
            }}
          />
        </div>
      )}
    </div>
  );
}

// ---- Disponible Field — standalone column between JUGADA and LOTERÍA ----
function DisponibleField({ jugada, lotteryId }: { jugada: string; lotteryId: string }) {
  const businessId = localStorage.getItem('nmv_business_id') || null;
  const active = jugada.length >= 2 && !!lotteryId;
  const { disponible, limite, loading } = usePlayLimit(
    active ? jugada : '',
    active ? lotteryId : '',
    active ? businessId : null
  );

  const hasLimit = active && !loading && limite !== null;
  const color = !hasLimit ? '#aaaaaa'
    : disponible === 0 ? '#d32f2f'
    : disponible !== null && disponible <= 5 ? '#f57c00'
    : '#388e3c';

  return (
    <div className="flex flex-col gap-1 flex-shrink-0" style={{ minWidth: '90px' }}>
      <label className="uppercase font-bold" style={{ fontSize: '11px', color: '#555', letterSpacing: '0.5px' }}>
        DISPONIBLE
      </label>
      <div
        className="flex items-center justify-center rounded border font-bold"
        style={{
          padding: '14px 10px',
          fontSize: '18px',
          color: hasLimit ? color : '#aaaaaa',
          borderColor: hasLimit ? color : '#cccccc',
          backgroundColor: hasLimit ? `${color}11` : '#f9f9f9',
          minHeight: '55px',
          minWidth: '90px',
        }}
      >
        {!active ? '—' : loading ? '…' : limite === null ? '∞' : (
          <>
            {disponible ?? 0}
            <span style={{ fontSize: '10px', color: '#888', marginLeft: 3 }}>/{limite}</span>
          </>
        )}
      </div>
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
  selectedLotteryId,
  detectedType,
  onAddPlay,
  onCreateTicket,
  totalPlays,
  totalAmount,
  recentTickets,
  selectedClient,
  onSelectClient,
  typeOverride,
  onTypeOverride,
  onNextLottery,
  onReprintTicket,
  onCancelTicket,
}: {
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
}) {
  const isMobile = useIsMobile();
  const { openModal } = useModalContext();
  const jugadaRef = useRef<HTMLInputElement>(null);
  const montoRef = useRef<HTMLInputElement>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [recentPos, setRecentPos] = useState({ top: 0, left: 0 });
  const recentBtnRef = useRef<HTMLButtonElement>(null);

  // Cerrar Recientes al click fuera
  useEffect(() => {
    if (!showRecent) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest('[data-rec-drop]') && !t.closest('[data-rec-btn]')) setShowRecent(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRecent]);

  // ── Mantener posición del dropdown sincronizada con el botón ──
  useEffect(() => {
    if (!showRecent || !recentBtnRef.current) return;
    const update = () => {
      if (!recentBtnRef.current) return;
      const r = recentBtnRef.current.getBoundingClientRect();
      if (r.width === 0) return; // botón fuera de vista
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
    // ── Ctrl shortcuts (any field) ──
    if (e.ctrlKey) {
      if (e.key === 'Enter' || e.key === '*') { e.preventDefault(); onCreateTicket(); return; }
      if (e.key === '/') { e.preventDefault(); onNextLottery?.(); return; }
      if (e.key === 'd' || e.key === 'D') { e.preventDefault(); openModal('duplicateTicket'); return; }
    }
    // ── Type shortcuts (only on JUGADA field) — TOGGLE ──
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
      {/* Input row — overflow-x:auto + nowrap so items never jump to 2nd line */}
      <div className="flex items-end gap-3 hide-scrollbar" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
        {/* JUGADA */}
        <div className="flex flex-col gap-1 flex-shrink-0" style={{ flex: '0 0 35%', minWidth: '130px' }}>
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
              inputMode={isMobile ? 'none' : 'numeric'}
              readOnly={isMobile}
              value={jugada}
              onChange={(e) => !isMobile && onJugadaChange(e.target.value.replace(/\D/g, ''))}
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
                cursor: isMobile ? 'default' : 'text',
              }}
              autoFocus={!isMobile}
            />
            {detectedType && (
              <span
                className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 uppercase font-bold"
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

        {/* DISPONIBLE — campo separado entre JUGADA y LOTERÍA */}
        <DisponibleField jugada={jugada} lotteryId={selectedLotteryId} />

        {/* LOTERÍA - Selected Lottery */}
        <div className="flex flex-col gap-1" style={{ minWidth: '140px' }}>
          <label
            className="uppercase font-bold"
            style={{ fontSize: '11px', color: '#555', letterSpacing: '0.5px' }}
          >
            LOTERÍA
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
              type={isMobile ? 'text' : 'number'}
              inputMode={isMobile ? 'none' : 'decimal'}
              readOnly={isMobile}
              value={monto}
              onChange={(e) => !isMobile && onMontoChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              className="w-full text-right font-bold rounded border-2 transition-colors"
              style={{
                padding: '12px 12px 12px 28px',
                fontSize: '20px',
                color: '#333',
                borderColor: monto ? '#5cb85c' : '#cccccc',
                backgroundColor: '#fafafa',
                cursor: isMobile ? 'default' : 'text',
              }}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Client Selector — dropdown flotante */}
        {onSelectClient && <ClientSelector onSelect={onSelectClient} selectedClient={selectedClient || ''} />}

        {/* Recent tickets — portal dropdown (escapa overflow-x:auto) */}
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
              padding: '14px 16px',
              fontSize: '13px',
              color: '#555',
              borderColor: showRecent ? '#0D9488' : '#cccccc',
              backgroundColor: showRecent ? '#f0fffe' : '#ffffff',
              minHeight: '55px',
              whiteSpace: 'nowrap',
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
                position: 'fixed',
                top: recentPos.top,
                left: recentPos.left,
                zIndex: 9999,
                width: '390px',
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                boxShadow: '0 10px 32px rgba(0,0,0,0.18)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '10px 14px', borderBottom: '1px solid #f0f0f0',
                fontSize: 12, fontWeight: 700, color: '#555',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>Tickets recientes</span>
                <button
                  onClick={() => setShowRecent(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 20, lineHeight: 1 }}
                >×</button>
              </div>
              {/* Rows */}
              {recentTickets.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
                  No hay tickets recientes
                </div>
              ) : recentTickets.slice(0, 8).map((t) => (
                <div
                  key={t.ticketNumber}
                  title="Clic para cargar jugadas en pantalla"
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
                  {/* Reprint button */}
                  <button
                    title="Reimprimir"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReprintTicket?.(t);
                      setShowRecent(false);
                    }}
                    style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#1D4ED8', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    <Printer size={15} />
                  </button>
                  {/* Trash button */}
                  {t.id && (
                    <button
                      title="Cancelar ticket"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelTicket?.(t.id!);
                        setShowRecent(false);
                      }}
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
  const isMobile = useIsMobile();
  const { openModal } = useModalContext();
  // En móvil el teclado siempre está visible — no hay FAB
  const [keypadTarget, setKeypadTarget] = useState<'jugada' | 'monto'>('jugada');

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

  // Lottery selection — #1: auto-select first open lottery on mount (sorted by closing time)
  const [selectedLotteries, setSelectedLotteries] = useState<string[]>(['florida-pm']);
  useEffect(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const open = regularLotteries
      .map(l => { const s = schedules.find(sc => sc.lotteryId === l.id); return { id: l.id, closingMins: s ? parseTimeToMinutes(s.closingTime) : 1439 }; })
      .filter(x => x.closingMins > currentMins)
      .sort((a, b) => a.closingMins - b.closingMins);
    if (open.length > 0) setSelectedLotteries([open[0].id]);
  }, []); // once on mount

  // Vendedor
  const { activeVendedor } = useVendedores();

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
  // Type override — set by shortcuts . (cash3) - (play4) + (pick5)
  const [typeOverride, setTypeOverride] = useState('');

  // ── Last-amount memory + overwrite mode (fixes "$5 bug") ──────────
  const lastAmountRef     = useRef<string>('');
  const amountOverwriteRef = useRef<boolean>(false);
  const submittingRef     = useRef<boolean>(false);

  // Lottery lock — CASH 3 / PLAY 4 & PICK 5
  // When locked, all plays of that type go to the locked lottery (not selectedLotteries)
  const [cash3Lock, setCash3Lock] = useState<{ locked: boolean; lotteryId: string; lotteryName: string }>({ locked: false, lotteryId: '', lotteryName: '' });
  const [play4Lock, setPlay4Lock] = useState<{ locked: boolean; lotteryId: string; lotteryName: string }>({ locked: false, lotteryId: '', lotteryName: '' });

  const toggleCash3Lock = useCallback(() => {
    if (cash3Lock.locked) {
      setCash3Lock({ locked: false, lotteryId: '', lotteryName: '' });
      setTypeOverride(''); // libera el forzado de tipo
    } else {
      const lotId = selectedLotteries[0] || '';
      const lotName = regularLotteries.find((l) => l.id === lotId)?.name || lotId;
      setCash3Lock({ locked: true, lotteryId: lotId, lotteryName: lotName });
      setTypeOverride('cash3'); // fuerza tipo cash3 (3 dígitos)
      setJugada(''); // limpia jugada al activar
    }
  }, [cash3Lock.locked, selectedLotteries]);

  const togglePlay4Lock = useCallback(() => {
    if (play4Lock.locked) {
      setPlay4Lock({ locked: false, lotteryId: '', lotteryName: '' });
      setTypeOverride(''); // libera el forzado de tipo
    } else {
      const lotId = selectedLotteries[0] || '';
      const lotName = regularLotteries.find((l) => l.id === lotId)?.name || lotId;
      setPlay4Lock({ locked: true, lotteryId: lotId, lotteryName: lotName });
      setTypeOverride('play4'); // fuerza tipo play4 (4 dígitos)
      setJugada(''); // limpia jugada al activar
    }
  }, [play4Lock.locked, selectedLotteries]);

  // Límite de dígitos según el tipo activo (typeOverride o lock)
  const maxJugadaDigits = typeOverride === 'cash3' ? 3
    : typeOverride === 'play4' ? 4
    : typeOverride === 'pick5' ? 5
    : 6;

  // UI state
  const [toast, setToast] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [printTicket, setPrintTicket] = useState<TicketData | null>(null);
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

  // #2: Cycle to next open lottery (Ctrl+/)
  const handleNextLottery = useCallback(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const open = regularLotteries
      .map(l => { const s = schedules.find(sc => sc.lotteryId === l.id); return { id: l.id, closingMins: s ? parseTimeToMinutes(s.closingTime) : 1439 }; })
      .filter(x => x.closingMins > currentMins)
      .sort((a, b) => a.closingMins - b.closingMins);
    if (open.length === 0) return;
    const curIdx = open.findIndex(x => x.id === selectedLotteries[0]);
    setSelectedLotteries([open[(curIdx + 1) % open.length].id]);
  }, [selectedLotteries]);

  // Add play callback with capacity check
  const handleAddPlay = useCallback((): boolean => {
    // ── Prevenir doble envío (fix "5 jugadas" bug) ───────────────
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

  // Determine which lotteries to use — respect lock state for cash3 / play4 / pick5
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
    const lottery = regularLotteries.find((l) => l.id === lotId);
    if (lottery) {
      const ok = addPlay(jugada, amount, lottery.id, lottery.name, typeOverride || undefined);
      if (ok) added = true;
    }
  });

  if (added) {
    lastAmountRef.current = monto;   // ← guarda último monto usado
    setJugada('');
    setTypeOverride('');
    // monto stays for next play (sobreescritura activada al presionar OK en jugada)
  }

  submittingRef.current = false;     // ← libera el lock anti-doble-submit
  return added;
}, [jugada, monto, typeOverride, selectedLotteries, cash3Lock, play4Lock, addPlay, isAtCapacity, showToast]);

  // ── Listen for generator plays → add them directly to DIRECTO/PALE/etc tables ──
  useEffect(() => {
    type GenPlay = { id: string; numbers: string; amount: number; type: string; lotteryId: string; lotteryName: string };
    const handler = (e: Event) => {
      const plays = (e as CustomEvent<GenPlay[]>).detail;
      if (!Array.isArray(plays)) return;
      let count = 0;
      plays.forEach(p => {
        const ok = addPlay(p.numbers, p.amount, p.lotteryId, p.lotteryName, p.type);
        if (ok) count++;
      });
      if (count > 0) showToast(`✅ ${count} jugadas del generador agregadas`);
    };
    window.addEventListener('nmv:add-generated-plays', handler);
    return () => window.removeEventListener('nmv:add-generated-plays', handler);
  }, [addPlay, showToast]);

  // Create ticket callback (async — waits for sequential NMV number from Supabase)
  const handleCreateTicket = useCallback(async () => {
    if (plays.length === 0) {
      showToast('Agregue al menos una jugada');
      return;
    }

    const ticket = await createTicket(plays, activeVendedor?.name || 'Vendedor');
    if (ticket) {
      // Enrich with client info if selected
      const clientRecord = selectedClient ? (() => {
        try {
          const all = JSON.parse(localStorage.getItem('matador_clients') || '[]');
          return all.find((c: any) => c.id === selectedClient) || null;
        } catch { return null; }
      })() : null;
      const enriched = {
        ...ticket,
        clientId: clientRecord?.id,
        clientName: clientRecord?.name,
        clientPhone: clientRecord?.phone,
        clientType: clientRecord?.type,
        vendorName: activeVendedor?.name || 'Vendedor',
      };
      // Save to localStorage so Monitor sees it immediately
      try {
        const existing = JSON.parse(localStorage.getItem('matador_tickets') || '[]');
        existing.unshift(enriched);
        localStorage.setItem('matador_tickets', JSON.stringify(existing.slice(0, 500)));
      } catch { /* ignore */ }
      setPrintTicket(enriched as TicketData);
      clearPlays();
      setJugada('');
      setMonto('');
      // Clear lottery locks — se liberan al imprimir el ticket
      setCash3Lock({ locked: false, lotteryId: '', lotteryName: '' });
      setPlay4Lock({ locked: false, lotteryId: '', lotteryName: '' });
    }
  }, [plays, createTicket, clearPlays, showToast, selectedClient, activeVendedor]);

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

  // Listen for BarcodeScanner duplicate events
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setJugada('');
        setMonto('');
        setHelpOpen(false);
      }
      if (e.key === '-' || e.key === 'Minus') {
        // Skip if user is typing in an input (prevents conflict with play4 override key)
        if (document.activeElement?.tagName === 'INPUT') return;
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
        <QuickAccessBar />

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

          {/* Duplicar ticket — abre modal de duplicar con QR/código */}
          <IconButton
            icon={ClipboardList}
            onClick={() => openModal('duplicateTicket')}
            title="Duplicar ticket (QR o código)"
          />

          {/* ── Múltiple: toggle modo multi-lotería ── */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMultiSelect(v => !v)}
            title={multiSelect ? `Múltiple ACTIVO (${selectedLotteries.length} loterias) — click para desactivar` : 'Activar modo Múltiple (selecciona varias loterias)'}
            className="flex items-center gap-1.5 font-bold uppercase rounded"
            style={{
              padding: '8px 14px',
              border: multiSelect ? '2px solid #fff' : '2px solid rgba(255,255,255,0.35)',
              borderRadius: '6px',
              backgroundColor: multiSelect ? '#f59e0b' : 'rgba(245,158,11,0.18)',
              color: '#fff',
              fontSize: '12px',
              letterSpacing: '0.4px',
              cursor: 'pointer',
            }}
          >
            <Shuffle size={14} />
            <span>Múltiple</span>
            {multiSelect && selectedLotteries.length > 0 && (
              <span style={{
                background: '#fff', color: '#f59e0b', borderRadius: '999px',
                fontSize: '10px', fontWeight: 900, padding: '1px 6px', marginLeft: 2,
              }}>
                {selectedLotteries.length}
              </span>
            )}
          </motion.button>

          {/* Imprimir reporte diario thermal Epson */}
          <IconButton icon={Printer} onClick={handlePrint} title="Reporte diario Epson thermal" />

          {/* Pagar ticket — abre modal de pago con QR/código */}
          <IconButton
            icon={DollarSign}
            onClick={() => openModal('pagar')}
            title="Pagar ticket"
          />

          {/* Ayuda — mismo modal del sidemenu */}
          <IconButton
            icon={HelpCircle}
            onClick={() => openModal('help')}
            title="Ayuda"
          />
        </motion.div>

        {/* Section 3: Play Input + Counters */}
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
          onReprintTicket={(t) => setPrintTicket(t as TicketData)}
          onCancelTicket={(ticketId) => {
            if (!confirm('¿Cancelar este ticket? Esta acción no se puede deshacer.')) return;
            // ── Marcar como cancelado (no borrar) para que el Monitor lo vea ──
            try {
              const existing = JSON.parse(localStorage.getItem('matador_tickets') || '[]');
              const updated = existing.map((x: any) =>
                x.id === ticketId ? { ...x, status: 'cancelled' } : x
              );
              localStorage.setItem('matador_tickets', JSON.stringify(updated));
            } catch { /* ignore */ }
            // Actualizar en Supabase (fire and forget)
            supabase.from('tickets').update({ status: 'cancelled' }).eq('id', ticketId).then(() => {});
            // Notificar al Monitor para que refresque
            window.dispatchEvent(new CustomEvent('nmv:tickets-updated'));
            showToast('Ticket cancelado');
          }}
        />

        {/* ── Watermark strip — entre counters y tablas ── */}
        {!isMobile && selectedLotteryName && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedLotteryName}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                height: 52, overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#e8e8e8', borderBottom: '1px solid #d8d8d8',
                position: 'relative',
              }}
            >
              <span style={{
                fontFamily: "'Bebas Neue', 'Black Ops One', 'Arial Black', Impact, sans-serif",
                fontSize: 'clamp(28px, 4.5vw, 52px)',
                fontWeight: 900, color: 'rgba(0,0,0,0.12)',
                textTransform: 'uppercase', letterSpacing: '0.12em',
                userSelect: 'none', whiteSpace: 'nowrap', lineHeight: 1,
              }}>
                {selectedLotteryName}
              </span>
              {typeOverride && (
                <span style={{
                  position: 'absolute', right: 16,
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 13, fontWeight: 800, letterSpacing: 1.5,
                  color: '#fff', backgroundColor: '#2E7D32',
                  padding: '3px 10px', borderRadius: 4,
                  textTransform: 'uppercase',
                }}>
                  {typeOverride} ✓
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Section 4: Mobile Combined Table OR Desktop 4-Column Grid */}
        {isMobile ? (
          /* ── MOBILE: Single combined table ── */
          <div style={{ padding: '12px', paddingBottom: '290px' }}>
            <div
              style={{
                border: '2px solid #bbb',
                borderRadius: '8px',
                backgroundColor: '#E0E0E0',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between text-white font-bold uppercase"
                style={{ background: `linear-gradient(to bottom, ${primaryColor}dd, ${primaryColor})`, padding: '10px 12px', fontSize: '14px', letterSpacing: '1px' }}
              >
                <span>JUGADAS ACTIVAS</span>
                {plays.length > 0 && (
                  <button
                    onClick={() => plays.forEach((p) => removePlay(p.id))}
                    className="text-white/80 text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(255,0,0,0.3)', fontSize: '10px' }}
                  >
                    🗑 Borrar todo
                  </button>
                )}
              </div>
              {/* Column headers */}
              <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr 0.7fr 30px', padding: '6px 8px', backgroundColor: `${primaryColor}33` }}>
                {['LOT', 'NUM', '$', ''].map((h) => (
                  <span key={h} className="uppercase font-bold" style={{ fontSize: '10px', color: '#444' }}>{h}</span>
                ))}
              </div>
              {/* Rows */}
              {plays.length === 0 ? (
                <div className="text-center py-8" style={{ color: '#999', fontSize: '13px' }}>Sin jugadas</div>
              ) : plays.map((play, i) => {
                const n = play.numbers;
                const num = (play.type === 'pale' && n.length === 4) ? `${n.slice(0,2)}-${n.slice(2)}` : (play.type === 'tripleta' && n.length === 6) ? `${n.slice(0,2)}-${n.slice(2,4)}-${n.slice(4)}` : n;
                return (
                  <div
                    key={play.id}
                    className="grid items-center"
                    style={{ gridTemplateColumns: '1.2fr 1fr 0.7fr 30px', height: '38px', padding: '0 8px', borderBottom: '1px solid #d0d0d0', backgroundColor: i % 2 === 1 ? '#D0D0D0' : '#E0E0E0' }}
                  >
                    <span className="truncate" style={{ fontSize: '11px', color: '#333' }}>{play.lotteryName}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{num}</span>
                    <span style={{ fontSize: '12px', color: '#333' }}>{formatCurrency(play.amount)}</span>
                    <button onClick={() => removePlay(play.id)} style={{ color: '#d9534f', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {/* Footer */}
              <div className="flex items-center justify-between" style={{ backgroundColor: '#3C3F54', padding: '10px 12px' }}>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{plays.length} jugadas</span>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        ) : (
        <div style={{ position: 'relative', flex: '1 1 0', minHeight: 200, overflow: 'hidden' }}>
          {/* ── Watermark: cambia con la lotería seleccionada — font BEBAS NEUE ── */}
          <AnimatePresence mode="wait">
            {selectedLotteryName && (
              <motion.div
                key={selectedLotteryName}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
                }}
              >
                <span style={{
                  fontFamily: "'Bebas Neue', 'Black Ops One', 'Arial Black', Impact, sans-serif",
                  fontSize: 'clamp(42px, 8vw, 110px)',
                  fontWeight: 900,
                  color: 'rgba(0,0,0,0.13)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  lineHeight: 1,
                }}>
                  {selectedLotteryName}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        <div
          className="grid gap-3 responsive-tables"
          style={{
            position: 'relative', zIndex: 1,
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
              onClearTable={() => directoPlays.forEach((p) => removePlay(p.id))}
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
              onClearTable={() => paleTripletaPlays.forEach((p) => removePlay(p.id))}
              emptyRows={6}
              themeColor={primaryColor}
            />
          </motion.div>

          {/* Table 3: CASH 3 — con lock toggle */}
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
              onClearTable={() => cash3Plays.forEach((p) => removePlay(p.id))}
              emptyRows={6}
              themeColor={primaryColor}
              showLockToggle
              locked={cash3Lock.locked}
              lockedLotteryName={cash3Lock.lotteryName}
              onToggleLock={toggleCash3Lock}
            />
          </motion.div>

          {/* Table 4: PLAY 4 & PICK 5 — con lock toggle */}
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
              onClearTable={() => play4Pick5Plays.forEach((p) => removePlay(p.id))}
              emptyRows={6}
              themeColor={primaryColor}
              showLockToggle
              locked={play4Lock.locked}
              lockedLotteryName={play4Lock.lotteryName}
              onToggleLock={togglePlay4Lock}
            />
          </motion.div>
        </div>
        </div>
        )} 

        {/* Shortcuts Panel */}
        {!isMobile && <ShortcutsPanel />}
      </div>

      {/* ── Mobile Keypad — siempre visible en móvil ── */}
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
              // ── Overwrite mode: primer dígito reemplaza el valor actual ──
              if (amountOverwriteRef.current) {
                amountOverwriteRef.current = false;
                if (k === '.') { setMonto('0.'); return; }
                setMonto(k);
                return;
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
              // Pre-llenar con último monto si el campo está vacío
              if (!monto && lastAmountRef.current) {
                setMonto(lastAmountRef.current);
              }
              // Activar modo sobreescribir para el primer dígito
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

      {/* ── Ticket Print Modal (opens after CREAR TICKET) ── */}
      <TicketPrintModal
        ticket={printTicket}
        onClose={() => setPrintTicket(null)}
        clientPhone={(printTicket as any)?.clientPhone}
      />
    </Layout>
  );
}
