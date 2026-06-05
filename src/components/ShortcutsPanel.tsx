import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Wallet,
  BarChart3,
  Clock,
  Settings,
  Copy,
  Shuffle,
  HelpCircle,
  Zap,
  X,
} from 'lucide-react';
import { useModalContext } from './modals';
import type { ModalType } from './modals/ModalContext';

interface ShortcutItem {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  modalType?: ModalType;
  action?: 'navigate' | 'print' | 'toast';
  route?: string;
  toastMessage?: string;
}

const shortcuts: ShortcutItem[] = [
  { label: 'Monitor de tickets', icon: FileText, modalType: 'ticketMonitor' },
  { label: 'Pendientes de pago', icon: Wallet, modalType: 'pendingPayments' },
  { label: 'Ventas historicas', icon: BarChart3, action: 'navigate', route: '/betting-pool/historical-sale' },
  { label: 'Horarios', icon: Clock, modalType: 'schedule' },
  { label: 'Configuracion', icon: Settings, modalType: 'config' },
  { label: 'Duplicar', icon: Copy, modalType: 'duplicateTicket' },
  { label: 'Generador', icon: Shuffle, modalType: 'randomGenerator' },
  { label: 'Ayuda', icon: HelpCircle, action: 'toast', toastMessage: 'Ayuda' },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { y: '100%' },
  visible: { y: 0 },
  exit: { y: '100%' },
};

export default function ShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { openModal } = useModalContext();

  const handleShortcut = (item: ShortcutItem) => {
    setIsOpen(false);
    // Small delay to let panel close
    setTimeout(() => {
      if (item.modalType) {
        openModal(item.modalType);
      } else if (item.action === 'navigate' && item.route) {
        window.location.href = item.route;
      } else if (item.action === 'print') {
        window.print();
      } else if (item.action === 'toast' && item.toastMessage) {
        // Toast will be handled by parent
      }
    }, 200);
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed flex items-center justify-center shadow-lg"
        style={{
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#3C3F54',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          zIndex: 90,
        }}
        whileHover={{ scale: 1.1, boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}
        whileTap={{ scale: 0.95 }}
        title="Accesos Rapidos"
      >
        <Zap size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark backdrop */}
            <motion.div
              className="fixed inset-0"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 95 }}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Slide-up panel */}
            <motion.div
              className="fixed left-0 right-0"
              style={{
                bottom: 0,
                zIndex: 100,
                background: 'rgba(255,255,255,0.98)',
                borderRadius: '16px 16px 0 0',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
                padding: '24px',
                maxHeight: '50vh',
              }}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Accesos Rapidos
                </h3>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-full transition-colors"
                  style={{ width: '36px', height: '36px', backgroundColor: '#f0f0f0' }}
                  whileHover={{ scale: 1.1, backgroundColor: '#e0e0e0' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={18} color="#555" />
                </motion.button>
              </div>

              {/* Grid of shortcuts */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                }}
              >
                {shortcuts.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                      onClick={() => handleShortcut(item)}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl transition-all"
                      style={{
                        padding: '20px 12px',
                        backgroundColor: '#ffffff',
                        border: '2px solid #e0e0e0',
                      }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        borderColor: '#9CCC65',
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div
                        className="flex items-center justify-center rounded-lg"
                        style={{
                          width: '44px',
                          height: '44px',
                          backgroundColor: '#E8F5E9',
                        }}
                      >
                        <Icon size={22} color="#689F38" />
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#444',
                          textAlign: 'center',
                        }}
                      >
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
