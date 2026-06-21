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

interface MenuSection {
  label: string;
  items: MenuItemConfig[];
}

// ─── Secciones del menú ───────────────────────────────────────────────────────
const menuSections: MenuSection[] = [
  {
    label: 'MONITOREO',
    items: [
      { label: 'Monitoreo',          icon: Monitor,    action: 'modal', modalType: 'ticketMonitor',   permKey: 'monitoreo'      },
      { label: 'Pendientes de pago', icon: Clock,      action: 'modal', modalType: 'pendingPayments', permKey: 'pendiente_pago' },
      { label: 'Balances',           icon: Scale,      action: 'modal', modalType: 'balance',         permKey: 'balances'       },
      { label: 'Contabilidad',       icon: Calculator, action: 'modal', modalType: 'accounting',      permKey: 'contabilidad'   },
    ],
  },
  // Clientes se renderiza por separado (tiene acordeón especial)
  {
    label: 'VENTAS',
    items: [
      { label: 'Ventas historicas', icon: Receipt,  action: 'navigate', route: '/betting-pool/historical-sale', permKey: 'ventas_historicas' },
      { label: 'Ver ventas',        icon: Eye,      action: 'modal',    modalType: 'ventasReport',               permKey: 'ver_ventas'        },
      { label: 'Reportes',          icon: BarChart3,action: 'modal',    modalType: 'reportes',                   permKey: 'reportes'          },
      { label: 'Imprimir reporte',  icon: Printer,  action: 'action',                                           permKey: 'imprimir_reporte'  },
    ],
  },
  {
    label: 'JUGADAS',
    items: [
      { label: 'Jugadas',                         icon: Gamepad2, action: 'navigate', route: '/betting-pool/play-monitor', permKey: 'jugadas'            },
      { label: 'Pagar',                           icon: Banknote, action: 'modal',    modalType: 'pagar',                  permKey: 'pagar'              },
      { label: 'Duplicar',                        icon: Copy,     action: 'modal',    modalType: 'duplicateTicket',        permKey: 'duplicar_jugadas'   },
      { label: 'Duplicar jugadas',                icon: Layers,   action: 'modal',    modalType: 'duplicatePlays',         permKey: 'duplicar_jugadas'   },
      { label: 'Generador de jugadas aleatorias', icon: Shuffle,  action: 'modal',    modalType: 'randomGenerator',        permKey: 'generador_jugadas'  },
    ],
  },
  {
    label: 'CONFIGURACIÓN',
    items: [
      { label: 'Horarios',      icon: CalendarDays, action: 'modal', modalType: 'schedule',   permKey: 'horarios'           },
      { label: 'Ponchar',       icon: ShieldCheck,  action: 'modal', modalType: 'authorize',  permKey: 'autorizar_ponchado' },
      { label: 'Ayuda',         icon: HelpCircle,   action: 'modal', modalType: 'help',       permKey: 'ayuda'              },
      { label: 'Configuracion', icon: Settings,     action: 'modal', modalType: 'config',     permKey: 'configuracion'      },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { label: 'Cerrar Caja',   icon: Archive, action: 'modal',  modalType: 'cerrarCaja' },
      { label: 'Cerrar sesion', icon: LogOut,  action: 'action', isLogout: true          },
    ],
  },
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

// ── Section label separator ───────────────────────────────────────────────────
function SectionLabel({ label, first = false }: { label: string; first?: boolean }) {
  return (
    <div style={{ paddingTop: first ? 4 : 12, paddingBottom: 2 }}>
      {!first && (
        <div style={{ height: '1px', backgroundColor: '#3a3a3a', margin: '0 16px 6px' }} />
      )}
      <span style={{
        display: 'block',
        paddingLeft: 20,
        fontSize: '9px',
        fontWeight: 700,
        color: '#666666',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

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
            style={{ width: '280px', backgroundColor: '#2c2c2c' }}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
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

            {/* Menu items por sección */}
            <nav className="pb-6">

              {menuSections.map((section, sectionIdx) => {
                // Filtrar items por permisos
                const visibleItems = section.items.filter(
                  item => !item.permKey || hasPerm(item.permKey)
                );

                // Insertar "Clientes" entre sección MONITOREO y VENTAS
                const afterMonitoreo = sectionIdx === 1; // VENTAS es el índice 1

                return (
                  <div key={section.label}>
                    {/* Clientes accordion — va entre MONITOREO y VENTAS */}
                    {afterMonitoreo && showClientes && (
                      <>
                        <SectionLabel label="CLIENTES" />
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

                    {/* Section header + items — solo si hay items visibles */}
                    {visibleItems.length > 0 && (
                      <>
                        <SectionLabel label={section.label} first={sectionIdx === 0} />
                        {visibleItems.map((item) => {
                          const Icon = item.icon;
                          const isLogout = item.isLogout;
                          return (
                            <button
                              key={item.label}
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
                          );
                        })}
                      </>
                    )}
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
