import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Monitor, Wallet, BarChart3, Scale, Calculator,
  Shuffle, Copy, Users, Banknote, Gamepad2, ChevronDown,
} from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';
import { useModalContext } from '@/components/modals';
import { usePermisos } from '@/hooks/usePermisos';

export default function QuickAccessBar() {
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
    { icon: Monitor,    label: 'Monitor',    modal: 'ticketMonitor' as const,       permKey: 'monitoreo'         },
    { icon: Wallet,     label: 'Pendientes', modal: 'pendingPayments' as const,      permKey: 'pendiente_pago'    },
    { icon: Scale,      label: 'Balances',   modal: 'balance' as const,              permKey: 'balances'          },
    { icon: Calculator, label: 'Contab.',    modal: 'accounting' as const,           permKey: 'contabilidad'      },
    { icon: BarChart3,  label: 'Historial',  route: '/betting-pool/historical-sale', permKey: 'ventas_historicas' },
    { icon: Copy,       label: 'Duplicar',   modal: 'duplicateTicket' as const,      permKey: 'duplicar_jugadas'  },
    { icon: Shuffle,    label: 'Generador',  modal: 'randomGenerator' as const,      permKey: 'generador_jugadas' },
    { icon: Banknote,   label: 'Pagar',      modal: 'pagar' as const,                permKey: 'pagar'             },
    { icon: Users,      label: 'Clientes',   custom: 'clients' as const,             permKey: 'clientes'          },
    { icon: Gamepad2,   label: 'Jugadas',    route: '/betting-pool/play-monitor',    permKey: 'jugadas'           },
  ];

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

        // ── Clientes: inline dropdown ──
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
                    position: 'fixed', top: clientsPos.top, left: clientsPos.left,
                    zIndex: 9999, width: 280, maxHeight: 340, overflowY: 'auto',
                    background: '#fff', border: '1px solid #e0e0e0',
                    borderRadius: 10, boxShadow: '0 10px 32px rgba(0,0,0,0.18)',
                  }}
                >
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', fontSize: 12, fontWeight: 700, color: '#555', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff' }}>
                    <span>Clientes ({qbClients.length})</span>
                    <button onClick={() => setClientsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>
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
