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

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: 'Monitoreo', icon: Monitor },
  { label: 'Pendientes de pago', icon: Clock },
  { label: 'Ventas historicas', icon: Receipt },
  { label: 'Imprimir reporte', icon: Printer },
  { label: 'Duplicar', icon: Copy },
  { label: 'Duplicar jugadas', icon: Layers },
  { label: 'Jugadas', icon: Gamepad2 },
  { label: 'Pagar', icon: Banknote },
  { label: 'Ver ventas', icon: Eye },
  { label: 'Horarios', icon: CalendarDays },
  { label: 'Ayuda', icon: HelpCircle },
  { label: 'Configuracion', icon: Settings },
  { label: 'Autorizar ponchado', icon: ShieldCheck },
  { label: 'Generador de jugadas aleatorias', icon: Shuffle },
  { label: 'Cerrar sesion', icon: LogOut },
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

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
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
                const isLogout = item.label === 'Cerrar sesion';
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
