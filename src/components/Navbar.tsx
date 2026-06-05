import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  ChevronDown,
  Printer,
  Settings,
  Ticket,
  User,
  Bell,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface NavbarProps {
  onMenuToggle: () => void;
  onResultsToggle: () => void;
  resultsOpen: boolean;
  onSettings?: () => void;
  onTicketMonitor?: () => void;
}

export default function Navbar({ onMenuToggle, onResultsToggle, resultsOpen, onSettings, onTicketMonitor }: NavbarProps) {
  const navigate = useNavigate();
  const [clock, setClock] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* Global keyboard shortcut: Ctrl+V navigates to VENTAS */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        navigate('/#/betting-pool/ticket/create');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotificationsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleVentasClick = () => {
    navigate('/#/betting-pool/ticket/create');
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3"
      style={{ height: '50px', backgroundColor: '#333333' }}
    >
      {/* Left section */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded transition-opacity opacity-80 hover:opacity-100"
          aria-label="Menu"
        >
          <Menu size={20} color="#ffffff" />
        </button>
        <button
          onClick={onResultsToggle}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-white transition-opacity opacity-90 hover:opacity-100"
          style={{ fontSize: '13px' }}
        >
          RESULTADOS
          <motion.span
            animate={{ rotate: resultsOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} />
          </motion.span>
        </button>
        <button
          className="p-2 rounded transition-opacity opacity-80 hover:opacity-100"
          aria-label="Print"
        >
          <Printer size={20} color="#ffffff" />
        </button>
      </div>

      {/* Center section */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 text-white font-semibold hidden sm:block"
        style={{ fontSize: '16px' }}
      >
        MATADOR-SPORT
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* VENTAS button - prominent, always visible */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleVentasClick}
          className="flex items-center gap-1 rounded font-bold text-white transition-all mr-2"
          style={{
            backgroundColor: '#5cb85c',
            padding: '8px 16px',
            fontSize: '13px',
            letterSpacing: '0.5px',
          }}
          title="Ctrl+V - Ir a Ventas"
        >
          <Ticket size={16} />
          <span>VENTAS</span>
        </motion.button>

        <button
          onClick={onSettings}
          className="p-2 rounded transition-opacity opacity-80 hover:opacity-100"
          aria-label="Settings"
        >
          <Settings size={20} color="#ffffff" />
        </button>
        <button
          onClick={onTicketMonitor}
          className="p-2 rounded transition-opacity opacity-80 hover:opacity-100"
          aria-label="Tickets"
        >
          <Ticket size={20} color="#ffffff" />
        </button>
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="p-2 rounded transition-opacity opacity-80 hover:opacity-100"
            aria-label="User"
          >
            <User size={20} color="#ffffff" />
          </button>
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 bg-white rounded shadow-lg py-1 min-w-[160px]"
                style={{ zIndex: 60 }}
              >
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Perfil
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  onClick={() => {
                    localStorage.removeItem('matador_auth_pin');
                    localStorage.removeItem('matador_auth_timestamp');
                    navigate('/sessions/new');
                  }}
                >
                  Cerrar sesion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded transition-opacity opacity-80 hover:opacity-100 relative"
            aria-label="Notifications"
          >
            <Bell size={20} color="#ffffff" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 bg-white rounded shadow-lg p-6"
                style={{ width: '320px', zIndex: 60 }}
              >
                <p className="text-center text-gray-500" style={{ fontSize: '13px' }}>
                  No notificaciones nuevas...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div
          className="ml-2 text-white hidden md:block"
          style={{ fontSize: '12px', color: '#cccccc' }}
        >
          {formatDateTime(clock)}
        </div>
      </div>
    </nav>
  );
}
