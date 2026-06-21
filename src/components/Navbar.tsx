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
  Store,
  Download,
  Smartphone,
  UserPlus,
  ArrowDownCircle,
  CreditCard,
  XCircle,
  FileText,
  Power,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { useVendedores } from '@/hooks/useVendedores';
import { clearVendorSession } from '@/lib/vendorAuth';
import type { ModalType } from '@/components/modals/ModalContext';
import { useWinnerNotifications } from '@/hooks/useWinnerNotifications';
import { usePermisos } from '@/hooks/usePermisos';

interface NavbarProps {
  onMenuToggle: () => void;
  onResultsToggle: () => void;
  resultsOpen: boolean;
  onSettings?: () => void;
  onTicketMonitor?: () => void;
  onOpenModal?: (type: ModalType) => void;
}

export default function Navbar({ onMenuToggle, onResultsToggle, resultsOpen, onSettings, onTicketMonitor, onOpenModal }: NavbarProps) {
  const navigate = useNavigate();
  const [clock, setClock] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [movilOpen, setMovilOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [cpCurrentPin, setCpCurrentPin] = useState('');
  const [cpNewPass, setCpNewPass] = useState('');
  const [cpConfirmPass, setCpConfirmPass] = useState('');
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpShowConfirm, setCpShowConfirm] = useState(false);
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);
  const movilRef = useRef<HTMLDivElement>(null);
  const { activeVendedor } = useVendedores();
  const { hasPerm } = usePermisos();

  // Winner notifications — Realtime from Supabase
  const businessId = localStorage.getItem('nmv_business_id');
  const { notifications, unreadCount, markAllRead, markOneRead, refresh: refreshNotifs } = useWinnerNotifications(businessId);

  // PWA install prompt — Android/Chrome + iOS detection
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detect iOS (iPhone / iPad)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = (window.navigator as any).standalone === true;
    setIsIOS(ios);
    // Show install on iOS if NOT already installed as standalone
    if (ios && !standalone) setShowInstall(true);
  }, []);

  useEffect(() => {
    // ── Read prompt captured BEFORE React mounted (main.tsx stores it globally) ──
    const existing = (window as any).__installPrompt;
    if (existing) {
      setInstallPrompt(existing);
      setShowInstall(true);
    }

    // Listen for late-firing event (in case component mounted before the event)
    const onReady = () => {
      const p = (window as any).__installPrompt;
      if (p) { setInstallPrompt(p); setShowInstall(true); }
    };
    const onInstalled = () => { setShowInstall(false); setInstallPrompt(null); };

    window.addEventListener('nmv-install-ready', onReady);
    window.addEventListener('nmv-app-installed', onInstalled);
    // Legacy fallback (in case main.tsx didn't load yet)
    const legacyHandler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', legacyHandler as EventListener);

    return () => {
      window.removeEventListener('nmv-install-ready', onReady);
      window.removeEventListener('nmv-app-installed', onInstalled);
      window.removeEventListener('beforeinstallprompt', legacyHandler as EventListener);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(v => !v);
      return;
    }
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowInstall(false);
      setInstallPrompt(null);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotificationsOpen(false);
      if (userRef.current   && !userRef.current.contains(e.target as Node))   setUserMenuOpen(false);
      if (movilRef.current  && !movilRef.current.contains(e.target as Node))  setMovilOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChangePassword = () => {
    const storedPin = localStorage.getItem('nmv_vendor_pin') || '';
    if (!cpCurrentPin.trim()) { setCpError('Ingrese su PIN actual'); return; }
    if (storedPin && cpCurrentPin !== storedPin) { setCpError('PIN actual incorrecto'); return; }
    if (cpNewPass.length < 4) { setCpError('La nueva contraseña debe tener al menos 4 caracteres'); return; }
    if (cpNewPass !== cpConfirmPass) { setCpError('Las contraseñas no coinciden'); return; }
    localStorage.setItem('nmv_vendor_pin', cpNewPass);
    setCpSuccess(true);
    setTimeout(() => { setChangePassOpen(false); setCpSuccess(false); }, 2000);
  };

  return (
    <>
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
        {hasPerm('resultados') && (
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
        )}
        <button
          className="p-2 rounded transition-opacity opacity-80 hover:opacity-100"
          aria-label="Print"
        >
          <Printer size={20} color="#ffffff" />
        </button>
        {/* NMV LOTTERY — junto al printer, visible en sm+ */}
        <span
          className="hidden sm:inline"
          style={{
            fontFamily: "'Bebas Neue', 'Black Ops One', 'Arial Black', sans-serif",
            fontSize: '16px',
            color: '#0D9488',
            letterSpacing: '3px',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            fontWeight: 400,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          NMV LOTTERY
        </span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
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
        {/* Change Password button — to the left of notifications */}
        <button
          onClick={() => { setChangePassOpen(true); setCpCurrentPin(''); setCpNewPass(''); setCpConfirmPass(''); setCpError(''); setCpSuccess(false); }}
          className="p-2 rounded transition-opacity opacity-80 hover:opacity-100"
          aria-label="Cambiar contraseña"
          title="Cambiar contraseña"
        >
          <KeyRound size={18} color="#a5b4fc" />
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotificationsOpen(v => !v); if (!notificationsOpen) refreshNotifs(); }}
            className="p-2 rounded transition-opacity opacity-80 hover:opacity-100 relative"
            aria-label="Notifications"
          >
            <Bell size={20} color="#ffffff" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                minWidth: 16, height: 16, borderRadius: 8,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {unreadCount === 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-gray-500 rounded-full opacity-40" />}
          </button>
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 340, zIndex: 9999,
                  background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  border: '1px solid #e5e7eb', overflow: 'hidden' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderBottom: '1px solid #f3f4f6',
                  background: 'linear-gradient(135deg,#1565C0,#1976D2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={15} color="#fff" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      Tickets Ganadores Hoy
                    </span>
                    {unreadCount > 0 && (
                      <span style={{ background: '#ef4444', color: '#fff', borderRadius: 8,
                        fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>
                        {unreadCount} nuevo{unreadCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)',
                      background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      Marcar todos leídos
                    </button>
                  )}
                </div>
                {/* List */}
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '28px 20px', textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>Sin ganadores hoy</p>
                      <p style={{ fontSize: 11, marginTop: 4 }}>Los tickets ganadores aparecerán aquí en tiempo real</p>
                    </div>
                  ) : notifications.map(n => (
                    <div key={n.id}
                      onClick={() => markOneRead(n.id)}
                      style={{
                        padding: '10px 16px', borderBottom: '1px solid #f9fafb',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                        background: n.read ? '#fff' : '#eff6ff',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f0f9ff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n.read ? '#fff' : '#eff6ff'; }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#1565C0,#1976D2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        🏆
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f' }}>
                            #{n.ticketNumber}
                          </span>
                          {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                          {n.vendorName && <span>{n.vendorName} · </span>}
                          {new Date(n.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1565C0' }}>
                          ${n.prizeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>PREMIO</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Footer totals */}
                {notifications.length > 0 && (
                  <div style={{ padding: '8px 16px', background: '#f9fafb', borderTop: '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                      {notifications.length} ganador{notifications.length !== 1 ? 'es' : ''} hoy
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#1565C0' }}>
                      Total: ${notifications.reduce((s, n) => s + n.prizeAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Logout / Power button — next to notifications */}
        <button
          onClick={() => {
            if (window.confirm('¿Cerrar sesión?')) {
              clearVendorSession();
              navigate('/sessions/new');
            }
          }}
          className="p-2 rounded transition-opacity opacity-80 hover:opacity-100"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <Power size={20} color="#ff6b6b" />
        </button>

        {/* PWA Install button */}
        {showInstall && (
          <div style={{ position: 'relative' }}>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleInstall}
              className="flex items-center gap-1 px-2 py-1 rounded font-bold transition-opacity"
              style={{
                fontSize: '11px',
                backgroundColor: '#4CAF50',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
              title={isIOS ? 'Cómo instalar en iPhone/iPad' : 'Instalar aplicación'}
            >
              <Download size={14} />
              <span>Instalar</span>
            </motion.button>
            {/* iOS install guide tooltip */}
            {isIOS && showIOSGuide && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  width: 220, backgroundColor: '#fff', borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 100,
                  padding: '12px 14px', border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>
                  📱 Instalar en iPhone/iPad
                </div>
                <ol style={{ fontSize: 12, color: '#444', paddingLeft: 16, margin: 0, lineHeight: 1.7 }}>
                  <li>Abre en <strong>Safari</strong></li>
                  <li>Toca el botón <strong>Compartir</strong> (□↑)</li>
                  <li>Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                  <li>Confirma con <strong>Agregar</strong></li>
                </ol>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  style={{ marginTop: 8, fontSize: 11, color: '#888', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Cerrar
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* MOVIL dropdown — visible only when permission is ON */}
        {hasPerm('movil') && (
          <div className="relative" ref={movilRef}>
            <button
              onClick={() => setMovilOpen(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded font-bold transition-opacity ml-1"
              style={{ fontSize:'13px', backgroundColor:'#5B8DD9', color:'#fff', border:'none', cursor:'pointer', opacity:0.95 }}
              onMouseEnter={e=>{e.currentTarget.style.opacity='1';}}
              onMouseLeave={e=>{e.currentTarget.style.opacity='0.95';}}
            >
              <Smartphone size={16}/>
              <span className="hidden sm:inline">MOVIL</span>
              <motion.span animate={{ rotate: movilOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12}/>
              </motion.span>
            </button>
            <AnimatePresence>
              {movilOpen && (
                <motion.div
                  initial={{ opacity:0, y:-5, scale:0.97 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  exit={{ opacity:0, y:-5, scale:0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl py-1 z-[60]"
                  style={{ minWidth:180, border:'1px solid #e5e7eb' }}
                >
                  {[
                    { icon:<UserPlus size={15}/>,      label:'Crear cliente',     type:'movilCrearCliente' as const },
                    { icon:<Store size={15}/>,         label:'Lista de clientes', type:'movilListaClientes' as const },
                    { icon:<ArrowDownCircle size={15}/>,label:'Retiro',           type:'movilRetiro' as const },
                    { icon:<CreditCard size={15}/>,     label:'Recargas',         type:'movilRecargas' as const },
                    { icon:<XCircle size={15}/>,        label:'Cancelar recarga', type:'movilCancelarRecarga' as const },
                    { icon:<Ticket size={15}/>,         label:'Tickets',          type:'movilTickets' as const },
                    { icon:<FileText size={15}/>,       label:'Ver reporte',      type:'movilReporte' as const },
                  ].map(item => (
                    <button key={item.type}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors"
                      onClick={() => { setMovilOpen(false); onOpenModal?.(item.type); }}
                    >
                      <span className="text-blue-500">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* VENTAS button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 px-3 py-1.5 rounded font-bold transition-opacity ml-2"
          style={{
            fontSize: '13px',
            backgroundColor: '#FF9800',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            opacity: 0.95,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.95'; }}
        >
          <Store size={16} />
          <span className="hidden sm:inline">VENTAS</span>
        </button>

        <div className="flex items-center gap-2 ml-2">
          <span
            className="hidden md:inline font-bold px-2 py-0.5 rounded"
            style={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
          >
            {activeVendedor?.name || 'Vendedor'}
          </span>
          <span style={{ fontSize: '12px', color: '#cccccc' }}>
            {formatDateTime(clock)}
          </span>
        </div>
      </div>
    </nav>

    {/* ── Change Password Modal ─────────────────────────────────────── */}
    <AnimatePresence>
      {changePassOpen && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.55)' }}
          onClick={() => setChangePassOpen(false)}>
          <motion.div initial={{ opacity:0, scale:0.93, y:10 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
            transition={{ duration:0.2 }}
            style={{ background:'#fff', borderRadius:16, width:'min(380px,90vw)', padding:28, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, borderBottom:'2px solid #6366f1', paddingBottom:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <KeyRound size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#1f2937' }}>Cambiar Contraseña</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>Actualiza tu PIN de acceso</div>
              </div>
              <button onClick={() => setChangePassOpen(false)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#9ca3af', lineHeight:1 }}>×</button>
            </div>
            {cpSuccess ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                <div style={{ fontSize:16, fontWeight:800, color:'#16a34a' }}>¡Contraseña actualizada!</div>
                <div style={{ fontSize:13, color:'#6b7280', marginTop:6 }}>Tu PIN ha sido cambiado exitosamente</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {/* Current PIN */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>PIN Actual</label>
                  <input type="password" value={cpCurrentPin} maxLength={8}
                    onChange={e => { setCpCurrentPin(e.target.value); setCpError(''); }}
                    placeholder="PIN de 4 dígitos"
                    style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, outline:'none', boxSizing:'border-box', letterSpacing:'0.2em' }} />
                </div>
                {/* New PIN */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Nueva Contraseña / PIN</label>
                  <div style={{ position:'relative' }}>
                    <input type={cpShowNew ? 'text' : 'password'} value={cpNewPass} maxLength={20}
                      onChange={e => { setCpNewPass(e.target.value); setCpError(''); }}
                      placeholder="Mínimo 4 caracteres"
                      style={{ width:'100%', padding:'10px 40px 10px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, outline:'none', boxSizing:'border-box' }} />
                    <button type="button" onClick={() => setCpShowNew(v => !v)}
                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex' }}>
                      {cpShowNew ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                {/* Confirm PIN */}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Confirmar Contraseña</label>
                  <div style={{ position:'relative' }}>
                    <input type={cpShowConfirm ? 'text' : 'password'} value={cpConfirmPass} maxLength={20}
                      onChange={e => { setCpConfirmPass(e.target.value); setCpError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                      placeholder="Repite la contraseña"
                      style={{ width:'100%', padding:'10px 40px 10px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, outline:'none', boxSizing:'border-box' }} />
                    <button type="button" onClick={() => setCpShowConfirm(v => !v)}
                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex' }}>
                      {cpShowConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                {cpError && (
                  <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'8px 12px', fontSize:12, textAlign:'center' }}>
                    {cpError}
                  </div>
                )}
                <button onClick={handleChangePassword}
                  style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:14,
                    background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
                    boxShadow:'0 4px 14px rgba(99,102,241,0.35)', marginTop:4 }}>
                  🔑 Actualizar Contraseña
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
