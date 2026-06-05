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
} from 'lucide-react';
import { useModalContext } from './modals';
import type { ModalType } from './modals/ModalContext';

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
}

const menuItems: MenuItemConfig[] = [
  { label: 'Monitoreo', icon: Monitor, action: 'modal', modalType: 'ticketMonitor' },
  { label: 'Pendientes de pago', icon: Clock, action: 'modal', modalType: 'pendingPayments' },
  { label: 'Ventas historicas', icon: Receipt, action: 'navigate', route: '/betting-pool/historical-sale' },
  { label: 'Imprimir reporte', icon: Printer, action: 'action' },
  { label: 'Duplicar', icon: Copy, action: 'modal', modalType: 'duplicateTicket' },
  { label: 'Duplicar jugadas', icon: Layers, action: 'modal', modalType: 'duplicatePlays' },
  { label: 'Jugadas', icon: Gamepad2, action: 'navigate', route: '/betting-pool/play-monitor' },
  { label: 'Pagar', icon: Banknote, action: 'modal', modalType: 'pagar' },
  { label: 'Ver ventas', icon: Eye, action: 'toast', toastMessage: 'Ver ventas' },
  { label: 'Horarios', icon: CalendarDays, action: 'modal', modalType: 'schedule' },
  { label: 'Ayuda', icon: HelpCircle, action: 'toast', toastMessage: 'Ayuda' },
  { label: 'Configuracion', icon: Settings, action: 'modal', modalType: 'config' },
  { label: 'Autorizar ponchado', icon: ShieldCheck, action: 'modal', modalType: 'authorize' },
  { label: 'Generador de jugadas aleatorias', icon: Shuffle, action: 'modal', modalType: 'randomGenerator' },
  { label: 'Cerrar sesion', icon: LogOut, action: 'action', isLogout: true },
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
        if (item.label === 'Cerrar sesion') {
          // Clear auth and go to login
          localStorage.removeItem('matador_auth');
          navigate('/sessions/new');
        } else if (item.label === 'Imprimir reporte') {
          window.print();
        }
      }
    }, 100);
  };

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
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isLogout = item.isLogout;
                return (
                  <div key={item.label}>
                    {index > 0 && (
                      <div
                        style={{
                          height: '1px',
                          backgroundColor: '#444444',
                          margin: '0 16px',
                        }}
                      />
                    )}
                    <button
                      className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors text-left"
                      style={{
                        fontSize: '14px',
                        color: isLogout ? '#d9534f' : '#cccccc',
                      }}
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={(e) => {
                        if (!isLogout) {
                          e.currentTarget.style.backgroundColor = '#3a3a3a';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLogout) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#cccccc';
                        }
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
