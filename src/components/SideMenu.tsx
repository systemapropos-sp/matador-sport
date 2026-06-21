import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  Clock,
  Receipt,
  Printer,
  Copy,
  Layers,
  Gamepad2,
  Banknote,
  Eye,
  CalendarDays,
  HelpCircle,
  Settings,
  ShieldCheck,
  Shuffle,
  LogOut,
  X,
  Users,
  UserPlus,
  ChevronDown,
  Scale,
  Calculator,
  BarChart3,
  Archive,
} from 'lucide-react';
import { useModalContext } from './modals';
import type { ModalType } from './modals/ModalContext';
import { clearVendorSession } from '@/lib/vendorAuth';
import { usePermisos } from '@/hooks/usePermisos';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (message: string) => void;
}

interface MenuItemConfig {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  action: 'modal' | 'navigate' | 'action' | 'toast';
  modalType?: ModalType;
  route?: string;
  toastMessage?: string;
  isLogout?: boolean;
  /** Permission key — if undefined, item is always visible */
  permKey?: string;
}

// Items BEFORE Clientes section
const menuItemsBefore: MenuItemConfig[] = [
  { label: 'Monitoreo',          icon: Monitor,    action: 'modal', modalType: 'ticketMonitor',   permKey: 'monitoreo'      },
  { label: 'Pendientes de pago', icon: Clock,      action: 'modal', modalType: 'pendingPayments', permKey: 'pendiente_pago' },
  { label: 'Balances',           icon: Scale,      action: 'modal', modalType: 'balance',         permKey: 'balances'       },
  { label: 'Contabilidad',       icon: Calculator, action: 'modal', modalType: 'accounting',      permKey: 'contabilidad'   },
];

// Items AFTER Clientes section
const menuItemsAfter: MenuItemConfig[] = [
  { label: 'Ventas historicas',                icon: Receipt,    action: 'navigate', route: '/betting-pool/historical-sale', permKey: 'ventas_historicas'  },
  { label: 'Imprimir reporte',                 icon: Printer,    action: 'action',                                          permKey: 'imprimir_reporte'   },
  { label: 'Duplicar',                         icon: Copy,       action: 'modal', modalType: 'duplicateTicket',             permKey: 'duplicar_jugadas'   },
  { label: 'Duplicar jugadas',                 icon: Layers,     action: 'modal', modalType: 'duplicatePlays',              permKey: 'duplicar_jugadas'   },
  { label: 'Jugadas',                          icon: Gamepad2,   action: 'navigate', route: '/betting-pool/play-monitor',   permKey: 'jugadas'            },
  { label: 'Pagar',                            icon: Banknote,   action: 'modal', modalType: 'pagar',                      permKey: 'pagar'              },
  { label: 'Ver ventas',                       icon: Eye,        action: 'modal', modalType: 'ventasReport',               permKey: 'ver_ventas'         },
  { label: 'Horarios',                         icon: CalendarDays,action: 'modal', modalType: 'schedule',                  permKey: 'horarios'           },
  { label: 'Ayuda',                            icon: HelpCircle, action: 'modal', modalType: 'help',                       permKey: 'ayuda'              },
  { label: 'Configuracion',                    icon: Settings,   action: 'modal', modalType: 'config',                     permKey: 'configuracion'      },
  { label: 'Ponchar',                          icon: ShieldCheck,action: 'modal', modalType: 'authorize',                  permKey: 'autorizar_ponchado' },
  { label: 'Reportes',                         icon: BarChart3,  action: 'modal', modalType: 'reportes',                   permKey: 'reportes'           },
  { label: 'Generador de jugadas aleatorias',  icon: Shuffle,    action: 'modal', modalType: 'randomGenerator',            permKey: 'generador_jugadas'  },
  // These two are always visible — no permission restriction
  { label: 'Cerrar Caja',   icon: Archive, action: 'modal',  modalType: 'cerrarCaja' },
  { label: 'Cerrar sesion', icon: LogOut,  action: 'action', isLogout: true          },
];


const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const menuVariants = {
  hidden: { x: -280 },
  visible: { x: 0 },
  exit: { x: -280 },
};

export default function SideMenu({ isOpen, onClose, onToast }: SideMenuProps) {
  const navigate = useNavigate();
  const { openModal } = useModalContext();
  const [clientesOpen, setClientesOpen] = useState(false);

  // ── Permisos en tiempo real ──────────────────────────────────────────────
  const { hasPerm } = usePermisos();

  const handleItemClick = (item: MenuItemConfig) => {
    onClose();

    setTimeout(() => {
      if (item.action === 'modal' && item.modalType) {
        openModal(item.modalType);
      } else if (item.action === 'navigate' && item.route) {
        navigate(item.route);
      } else if (item.action === 'toast' && item.toastMessage && onToast) {
        onToast(item.toastMessage);
      } else if (item.action === 'action') {
        if (item.isLogout) {
          clearVendorSession();
          navigate('/sessions/new');
        } else if (item.label === 'Imprimir reporte') {
          window.print();
        }
      }
    }, 100);
  };

  // ── Filter items by permissions ──────────────────────────────────────────
  const visibleBefore = menuItemsBefore.filter(
    item => !item.permKey || hasPerm(item.permKey)
  );
  const visibleAfter = menuItemsAfter.filter(
    item => !item.permKey || hasPerm(item.permKey)
  );
  const showClientes = hasPerm('clientes');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            className="fixed top-0 left-0 bottom-0 z-[70] overflow-y-auto"
            style={{
              width: '280px',
              backgroundColor: '#2c2c2c',
            }}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            }}
          >
            {/* Close button */}
            <div className="flex justify-end p-3">
              <button
                onClick={onClose}
                className="p-1 rounded transition-colors hover:bg-white/10"
                aria-label="Close menu"
              >
                <X size={20} color="#cccccc" />
              </button>
            </div>

            {/* Menu items */}
            <nav className="pb-6">
              {/* --- Before Clientes (filtered by permissions) --- */}
              {visibleBefore.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    {index > 0 && (
                      <div style={{ height: '1px', backgroundColor: '#444444', margin: '0 16px' }} />
                    )}
                    <button
                      className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors text-left"
                      style={{ fontSize: '14px', color: '#cccccc' }}
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3a3a'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cccccc'; }}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  </div>
                );
              })}

              {/* Clientes submenu — gated by 'clientes' permission */}
              {showClientes && (
                <>
                  <div style={{ height: '1px', backgroundColor: '#444444', margin: '0 16px' }} />
                  <button
                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 transition-colors text-left"
                    style={{ fontSize: '14px', color: '#cccccc' }}
                    onClick={() => setClientesOpen(!clientesOpen)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3a3a'; e.currentTarget.style.color = '#ffffff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cccccc'; }}
                  >
                    <div className="flex items-center gap-3">
                      <Users size={18} />
                      <span className="font-bold">Clientes</span>
                    </div>
                    <motion.div animate={{ rotate: clientesOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {clientesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', backgroundColor: '#252525' }}
                      >
                        <button
                          className="w-full flex items-center gap-3 py-2.5 transition-colors text-left"
                          style={{ fontSize: '13px', color: '#aaaaaa', paddingLeft: '56px' }}
                          onClick={() => { onClose(); setTimeout(() => openModal('clientCreate'), 100); }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333333'; e.currentTarget.style.color = '#ffffff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#aaaaaa'; }}
                        >
                          <UserPlus size={15} />
                          <span>Crear cliente</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-3 py-2.5 transition-colors text-left"
                          style={{ fontSize: '13px', color: '#aaaaaa', paddingLeft: '56px' }}
                          onClick={() => { onClose(); setTimeout(() => openModal('clientList'), 100); }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333333'; e.currentTarget.style.color = '#ffffff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#aaaaaa'; }}
                        >
                          <Users size={15} />
                          <span>Editar clientes</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* --- After Clientes (filtered by permissions) --- */}
              {visibleAfter.map((item) => {
                const Icon = item.icon;
                const isLogout = item.isLogout;
                return (
                  <div key={item.label}>
                    <div style={{ height: '1px', backgroundColor: '#444444', margin: '0 16px' }} />
                    <button
                      className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors text-left"
                      style={{ fontSize: '14px', color: isLogout ? '#d9534f' : '#cccccc' }}
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={(e) => {
                        if (!isLogout) { e.currentTarget.style.backgroundColor = '#3a3a3a'; e.currentTarget.style.color = '#ffffff'; }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLogout) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cccccc'; }
                      }}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  </div>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
