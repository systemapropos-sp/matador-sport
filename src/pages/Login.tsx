import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Delete, Eye, EyeOff, Loader2, ShieldCheck, LayoutDashboard, Shield } from "lucide-react";
import { verifyVendorPin, saveVendorSession, loadVendorSession } from "@/lib/vendorAuth";
import {
  biometricAvailable,
  registerBiometric,
  authenticateWithBiometric,
  hasBiometric,
  removeBiometric,
} from "@/lib/biometric";

// ─── Admin Credentials ────────────────────────────────────────────────────────
const ADMIN_CREDENTIALS = [
  { email: 'duepostllc@gmail.com', username: 'alex', password: 'Producers0587@', role: 'superadmin' },
];
function verifyAdmin(email: string, pass: string) {
  const q = email.trim().toLowerCase();
  return ADMIN_CREDENTIALS.find(c => (c.email === q || c.username === q) && c.password === pass) ?? null;
}
// PIN shortcut removed — use Admin tab (email/password) to access admin panel
function verifyAdminPin(_pin: string) {
  return null; // no PIN → admin redirect anymore; 0587 = Angela vendor
}
function doAdminRedirect() {
  localStorage.setItem('nmv_admin_auto_role', 'admin');
  localStorage.setItem('nmv_admin_auto_ts', Date.now().toString());
  window.location.replace(window.location.origin + '/admin/');
}

// ─── Fingerprint SVG ──────────────────────────────────────────────────────────
function FingerprintIcon({ size = 72, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <path d="M36 12C22.7 12 12 22.7 12 36" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M60 36C60 22.7 49.3 12 36 12" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M36 20C27.2 20 20 27.2 20 36c0 5.5 1.5 10.7 4 15" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M52 36c0-8.8-7.2-16-16-16" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M36 28c-4.4 0-8 3.6-8 8 0 6.6 1.4 12.9 3.9 18.5" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M44 36c0-4.4-3.6-8-8-8" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M36 36v15" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M42 39c0 7.2-1.3 14-3.5 20" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─── PIN Dots ─────────────────────────────────────────────────────────────────
function PinDots({ count, shake, error }: { count: number; shake: boolean; error: boolean }) {
  return (
    <motion.div animate={shake ? { x:[0,-8,8,-8,8,0] } : {x:0}} transition={{duration:0.4}}
      style={{ display:'flex', gap:14, justifyContent:'center', margin:'14px 0 10px' }}>
      {[0,1,2,3].map(i => (
        <motion.div key={i}
          animate={i < count ? {scale:[0.8,1.15,1]} : {scale:1}}
          transition={{ type:'spring', stiffness:400, damping:15 }}
          style={{
            width:46, height:46, borderRadius:'50%',
            border:`2px solid ${error && i < count ? '#ef4444' : i < count ? '#4ECDC4' : '#D1D5DB'}`,
            background: error && i < count ? '#FEE2E2' : i < count ? '#ECFDF5' : '#F9FAFB',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow: i < count ? `0 2px 12px ${error ? '#ef444440' : '#4ECDC440'}` : 'none',
          }}>
          {i < count && <div style={{ width:14, height:14, borderRadius:'50%', background: error ? '#ef4444' : '#0D9488' }}/>}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Keypad Key ───────────────────────────────────────────────────────────────
function Key({ label, onClick, color }: { label: React.ReactNode; onClick:()=>void; color?:string }) {
  return (
    <motion.button type="button" whileTap={{scale:0.9}} onClick={onClick}
      style={{ height:54, borderRadius:12, fontSize:22, fontWeight:600,
        background: color||'#FFFFFF', border:`1.5px solid ${color?'transparent':'#E5E7EB'}`,
        color: color?'#fff':'#1F2937', cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 1px 4px rgba(0,0,0,0.06)', WebkitTapHighlightColor:'transparent',
      }}>
      {label}
    </motion.button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();

  // ── Tab state: 'vendor' | 'huella' | 'admin' ───────────────────────────────
  const [tab, setTab]   = useState<'vendor'|'huella'|'admin'>('vendor');
  const [adminMode, setAdminMode] = useState<'password'|'pin'>('password');

  // ── Vendor PIN ─────────────────────────────────────────────────────────────
  const [pin, setPin]           = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinShake, setPinShake] = useState(false);

  // ── Admin PIN ──────────────────────────────────────────────────────────────
  const [aPin, setAPin]       = useState('');
  const [aPinError, setAPinError] = useState('');
  const [aPinShake, setAPinShake] = useState(false);
  const aPinRef = useRef(false);

  // ── Admin password ─────────────────────────────────────────────────────────
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // ── Biometric ──────────────────────────────────────────────────────────────
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioLoading, setBioLoading]     = useState(false);
  const [bioSetupShow, setBioSetupShow] = useState(false);
  const [bioRegistering, setBioRegistering] = useState(false);
  const [bioRegistered, setBioRegistered]   = useState(false);
  const [bioTrigger, setBioTrigger]         = useState(0);
  const pendingPinRef = useRef('');

  // ── Clock ──────────────────────────────────────────────────────────────────
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t); },[]);

  // ── Init biometric state ───────────────────────────────────────────────────
  useEffect(() => {
    biometricAvailable().then(avail => {
      setBioAvailable(avail);
      const reg = hasBiometric('vendor');
      setBioRegistered(reg);
      // Default to huella tab ONLY on actual mobile devices — never on desktop/web
      const isMobDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (avail && reg && isMobDevice) setTab('huella');
    });
  }, []);

  // ── Auto-redirect if session exists ───────────────────────────────────────
  useEffect(() => { if (loadVendorSession()) navigate('/betting-pool/ticket/create'); }, [navigate]);

  // ── Trigger biometric auth when huella tab is active ──────────────────────
  useEffect(() => {
    if (tab !== 'huella') return;
    if (!bioRegistered || !bioAvailable) return;
    const tryBio = async () => {
      setBioLoading(true);
      try {
        const cred = await authenticateWithBiometric('vendor');
        if (cred?.pin) {
          const session = await verifyVendorPin(cred.pin);
          if (session) {
            saveVendorSession(session);
            localStorage.setItem('nmv_vendor_pin', cred.pin);
            if (session.businessId) localStorage.setItem('nmv_business_id', session.businessId);
            navigate('/betting-pool/ticket/create');
            return;
          }
        }
      } catch { /* silent */ } finally { setBioLoading(false); }
    };
    const t = setTimeout(tryBio, 400);
    return () => clearTimeout(t);
  }, [tab, bioTrigger, bioRegistered, bioAvailable, navigate]);

  // ── Vendor PIN submit ──────────────────────────────────────────────────────
  const submitVendorPin = useCallback(async (p: string) => {
    setPinLoading(true);
    try {
      const session = await verifyVendorPin(p);
      if (session) {
        saveVendorSession(session);
        localStorage.setItem('nmv_vendor_pin', p);
        if (session.businessId) localStorage.setItem('nmv_business_id', session.businessId);
        // Only offer biometric enrollment on actual mobile devices — never on desktop/web
        const isMobDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (bioAvailable && !hasBiometric('vendor') && isMobDevice) {
          pendingPinRef.current = p;
          setBioSetupShow(true);
        } else {
          navigate('/betting-pool/ticket/create');
        }
      } else {
        setPinError('PIN incorrecto');
        setPinShake(true);
        setTimeout(() => { setPinShake(false); setPin(''); setPinError(''); }, 900);
      }
    } catch {
      setPinError('Error de conexión');
      setPinShake(true);
      setTimeout(() => { setPinShake(false); setPin(''); setPinError(''); }, 900);
    } finally { setPinLoading(false); }
  }, [navigate, bioAvailable]);

  useEffect(() => {
    if (pin.length === 4) {
      const t = setTimeout(() => submitVendorPin(pin), 350);
      return () => clearTimeout(t);
    }
  }, [pin, submitVendorPin]);

  // ── Admin PIN submit ───────────────────────────────────────────────────────
  useEffect(() => {
    if (aPin.length === 4 && !aPinRef.current) {
      aPinRef.current = true;
      setTimeout(() => {
        const found = verifyAdminPin(aPin);
        if (found) { doAdminRedirect(); }
        else {
          setAPinError('PIN incorrecto');
          setAPinShake(true);
          setTimeout(() => { setAPinShake(false); setAPin(''); aPinRef.current = false; setAPinError(''); }, 900);
        }
      }, 250);
    }
  }, [aPin]);

  // ── Admin password submit ──────────────────────────────────────────────────
  const handleAdminLogin = () => {
    setPwdLoading(true); setPwdError('');
    const found = verifyAdmin(email, password);
    if (found) { doAdminRedirect(); }
    else { setPwdError('Credenciales incorrectas'); setPwdLoading(false); }
  };

  // ── Keyboard for vendor PIN ────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'vendor') return;
    const k = (e: KeyboardEvent) => {
      if (['INPUT','TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key >= '0' && e.key <= '9') { setPinError(''); setPin(p => p.length < 4 ? p + e.key : p); }
      else if (e.key === 'Backspace') { setPinError(''); setPin(p => p.slice(0,-1)); }
      else if (e.key === 'Escape')    { setPinError(''); setPin(''); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [tab]);

  // ── Keyboard for admin PIN ─────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'admin' || adminMode !== 'pin') return;
    const k = (e: KeyboardEvent) => {
      if (['INPUT','TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (aPinRef.current) return;
      if (e.key >= '0' && e.key <= '9') { setAPinError(''); setAPin(p => p.length < 4 ? p + e.key : p); }
      else if (e.key === 'Backspace') { setAPinError(''); setAPin(p => p.slice(0,-1)); }
      else if (e.key === 'Escape')    { setAPinError(''); setAPin(''); aPinRef.current = false; }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [tab, adminMode]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const vDigit = (d:string) => { setPinError(''); setPin(p => p.length < 4 ? p + d : p); };
  const vBack  = () => { setPinError(''); setPin(p => p.slice(0,-1)); };
  const vClear = () => { setPinError(''); setPin(''); };
  const aDigit = (d:string) => { setAPinError(''); if (!aPinRef.current) setAPin(p => p.length < 4 ? p + d : p); };
  const aBack  = () => { setAPinError(''); setAPin(p => p.slice(0,-1)); };
  const aClear = () => { setAPinError(''); setAPin(''); aPinRef.current = false; };

  const nums = [['1','2','3'],['4','5','6'],['7','8','9']];
  const dateStr = time.toLocaleDateString('es-ES', {weekday:'long', day:'numeric', month:'long'});
  const timeStr = time.toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit', hour12:true});

  // Stored vendor name from last session
  const vendorName = localStorage.getItem('nmv_vendor_name') || localStorage.getItem('nmv_vendor_username') || 'Vendedor';

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg, #F0FDFA 0%, #ECFDF5 40%, #F0F9FF 100%)',
      fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      padding:20,
    }}>
      {/* Background blobs */}
      <div style={{ position:'fixed', top:-60, right:-60, width:300, height:300, borderRadius:'50%', background:'rgba(20,184,166,0.07)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:-80, left:-80, width:350, height:350, borderRadius:'50%', background:'rgba(59,130,246,0.05)', pointerEvents:'none' }}/>

      <motion.div initial={{opacity:0,y:20,scale:0.97}} animate={{opacity:1,y:0,scale:1}} transition={{duration:0.4}}
        style={{ width:'100%', maxWidth:400, background:'#FFFFFF', borderRadius:24,
          boxShadow:'0 8px 40px rgba(0,0,0,0.10), 0 1px 0 rgba(0,0,0,0.04)',
          border:'1px solid rgba(20,184,166,0.15)', overflow:'hidden' }}>

        {/* ── Header ───────────────────────────────────────── */}
        <div style={{ background:'linear-gradient(135deg,#0D9488,#0891B2)', padding:'28px 32px 22px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }}/>
          <div style={{ position:'absolute', bottom:-20, left:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
          <div style={{ textAlign:'center', position:'relative', zIndex:1 }}>
            <div style={{ width:52, height:52, background:'rgba(255,255,255,0.18)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', fontSize:26 }}>🎰</div>
            <h1 style={{ margin:0, color:'#fff', fontSize:22, fontWeight:800, letterSpacing:2 }}>NMV LOTTERY</h1>
            <p style={{ margin:'3px 0 0', color:'rgba(255,255,255,0.75)', fontSize:12, letterSpacing:1 }}>Sistema de Banca de Lotería</p>
          </div>
          <div style={{ textAlign:'center', marginTop:12, position:'relative', zIndex:1 }}>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, textTransform:'capitalize' }}>{dateStr}</div>
            <div style={{ color:'#fff', fontSize:20, fontWeight:300, letterSpacing:1 }}>{timeStr}</div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div style={{ display:'flex', padding:'14px 20px 0', gap:6 }}>
          <button type="button" onClick={() => setTab('vendor')}
            style={{ flex:1, padding:'9px 0', borderRadius:10, border:'none', cursor:'pointer', transition:'all 0.2s',
              background: tab==='vendor' ? '#0D9488' : '#F3F4F6',
              color: tab==='vendor' ? '#fff' : '#6B7280',
              fontWeight: tab==='vendor' ? 700 : 500, fontSize:13,
              display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <LayoutDashboard size={13}/> PIN
          </button>
        {/* Biometrics ONLY on actual mobile devices — hide on web/desktop */}
        {bioAvailable && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && (
            <button type="button" onClick={() => setTab('huella')}
              style={{ flex:1, padding:'9px 0', borderRadius:10, border:'none', cursor:'pointer', transition:'all 0.2s',
                background: tab==='huella' ? '#7C3AED' : '#F3F4F6',
                color: tab==='huella' ? '#fff' : '#6B7280',
                fontWeight: tab==='huella' ? 700 : 500, fontSize:13,
                display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
              <span style={{fontSize:14}}>🔏</span> Huella
            </button>
          )}
          <button type="button" onClick={() => setTab('admin')}
            style={{ flex:1, padding:'9px 0', borderRadius:10, border:'none', cursor:'pointer', transition:'all 0.2s',
              background: tab==='admin' ? '#1a237e' : '#F3F4F6',
              color: tab==='admin' ? '#fff' : '#6B7280',
              fontWeight: tab==='admin' ? 700 : 500, fontSize:13,
              display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <ShieldCheck size={13}/> Admin
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────── */}
        <div style={{ padding:'16px 22px 24px' }}>
          <AnimatePresence mode="wait">

            {/* ═══════ VENDOR PIN TAB ═══════ */}
            {tab === 'vendor' && (
              <motion.div key="vendor" initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}} transition={{duration:0.2}}>
                {pinError && (
                  <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
                    style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', borderRadius:8, padding:'8px 12px', fontSize:13, textAlign:'center', marginBottom:8 }}>
                    {pinError}
                  </motion.div>
                )}
                <p style={{ textAlign:'center', color:'#6B7280', fontSize:13, margin:'0 0 2px' }}>Ingrese su PIN de 4 dígitos</p>
                <PinDots count={pin.length} shake={pinShake} error={!!pinError}/>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {nums.map(row => row.map(n => <Key key={n} label={n} onClick={() => vDigit(n)}/>))}
                  <Key label="ESC" onClick={vClear} color="#EF4444"/>
                  <Key label="0" onClick={() => vDigit('0')}/>
                  <Key label={<Delete size={20}/>} onClick={vBack}/>
                  <motion.button type="button" whileTap={pin.length===4 ? {scale:0.97} : {}}
                    onClick={() => pin.length===4 && !pinLoading && submitVendorPin(pin)}
                    disabled={pin.length < 4 || pinLoading}
                    style={{ gridColumn:'1/-1', height:50, borderRadius:14, border:'none',
                      background: pin.length===4 ? 'linear-gradient(135deg,#0D9488,#0891B2)' : '#E5E7EB',
                      color: pin.length===4 ? '#fff' : '#9CA3AF',
                      fontWeight:700, fontSize:15, cursor: pin.length===4 ? 'pointer' : 'default',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      letterSpacing:1, textTransform:'uppercase' }}>
                    {pinLoading ? <Loader2 size={18} className="animate-spin"/> : 'Entrar'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ═══════ HUELLA TAB ═══════ */}
            {tab === 'huella' && (
              <motion.div key="huella" initial={{opacity:0,x:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} transition={{duration:0.25}}>
                {bioRegistered ? (
                  /* Biometric registered — show fingerprint button */
                  <div style={{ textAlign:'center', padding:'8px 0' }}>
                    <p style={{ margin:'0 0 4px', color:'#6B7280', fontSize:14 }}>Bienvenido de nuevo,</p>
                    <p style={{ margin:'0 0 24px', color:'#111827', fontSize:20, fontWeight:800 }}>{vendorName}</p>

                    {/* Fingerprint circle */}
                    <motion.div
                      whileTap={{ scale:0.94 }}
                      onClick={() => { if (!bioLoading) setBioTrigger(t => t+1); }}
                      style={{ cursor: bioLoading ? 'default' : 'pointer', width:148, height:148, margin:'0 auto 20px',
                        borderRadius:'50%', position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
                        background:'linear-gradient(135deg, #7C3AED, #4F46E5)',
                        boxShadow:'0 8px 32px rgba(124,58,237,0.45)', }}
                      animate={bioLoading ? {} : { boxShadow:['0 8px 32px rgba(124,58,237,0.45)','0 12px 48px rgba(124,58,237,0.65)','0 8px 32px rgba(124,58,237,0.45)'] }}
                      transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
                    >
                      {/* Outer pulse ring */}
                      <motion.div
                        animate={{ scale:[1, 1.25, 1], opacity:[0.4, 0, 0.4] }}
                        transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
                        style={{ position:'absolute', inset:-8, borderRadius:'50%', border:'3px solid rgba(124,58,237,0.5)' }}
                      />
                      {bioLoading ? (
                        <Loader2 size={52} color="rgba(255,255,255,0.9)" className="animate-spin"/>
                      ) : (
                        <FingerprintIcon size={76} color="rgba(255,255,255,0.95)"/>
                      )}
                    </motion.div>

                    <p style={{ color: bioLoading ? '#7C3AED' : '#374151', fontSize:15, fontWeight:600, margin:'0 0 16px', transition:'color 0.2s' }}>
                      {bioLoading ? 'Verificando huella...' : 'Toca para entrar'}
                    </p>

                    {/* Status */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:12 }}>
                      <Shield size={15} color="#10B981"/>
                      <span style={{ color:'#10B981', fontSize:14, fontWeight:600 }}>Huella / Face ID activo</span>
                    </div>

                    {/* Remove biometric */}
                    <button type="button"
                      onClick={() => { removeBiometric('vendor'); setBioRegistered(false); setTab('vendor'); }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:13,
                        display:'flex', alignItems:'center', justifyContent:'center', gap:5, margin:'0 auto' }}>
                      <span style={{ fontSize:13 }}>&#215;</span> Quitar huella de este dispositivo
                    </button>
                  </div>
                ) : (
                  /* Biometric not registered — instructions */
                  <div style={{ textAlign:'center', padding:'20px 0' }}>
                    <div style={{ width:80, height:80, margin:'0 auto 16px', borderRadius:'50%',
                      background:'linear-gradient(135deg,#E0E7FF,#F3E8FF)',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <FingerprintIcon size={52} color="#7C3AED"/>
                    </div>
                    <h3 style={{ margin:'0 0 8px', color:'#1F2937', fontSize:17, fontWeight:700 }}>Huella / Face ID</h3>
                    <p style={{ color:'#6B7280', fontSize:13, lineHeight:1.5, margin:'0 0 20px' }}>
                      Para activar la huella, primero entra con tu <strong>PIN</strong>. Al ingresar, se te ofrecerá activarla automáticamente.
                    </p>
                    <button type="button" onClick={() => setTab('vendor')}
                      style={{ padding:'11px 28px', borderRadius:12, border:'none', cursor:'pointer',
                        background:'linear-gradient(135deg,#7C3AED,#4F46E5)', color:'#fff',
                        fontWeight:700, fontSize:14, boxShadow:'0 4px 16px rgba(124,58,237,0.35)' }}>
                      Entrar con PIN
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══════ ADMIN TAB ═══════ */}
            {tab === 'admin' && (
              <motion.div key="admin" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>
                <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                  {[{id:'password',label:'🔑 Contraseña'},{id:'pin',label:'🔢 PIN Admin'}].map(m => (
                    <button key={m.id} type="button"
                      onClick={() => { setAdminMode(m.id as 'password'|'pin'); setAPinError(''); setPwdError(''); setAPin(''); aPinRef.current=false; }}
                      style={{ flex:1, padding:'7px 0', borderRadius:8, border:'none', cursor:'pointer', transition:'all 0.2s',
                        background: adminMode===m.id ? '#1a237e' : '#F3F4F6',
                        color: adminMode===m.id ? '#fff' : '#6B7280',
                        fontWeight: adminMode===m.id ? 700 : 500, fontSize:12 }}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  {adminMode === 'pin' && (
                    <motion.div key="apin" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.15}}>
                      {aPinError && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', borderRadius:8, padding:'8px 12px', fontSize:13, textAlign:'center', marginBottom:8 }}>{aPinError}</div>}
                      <p style={{ textAlign:'center', color:'#6B7280', fontSize:13, margin:'0 0 2px' }}>PIN de Administrador</p>
                      <PinDots count={aPin.length} shake={aPinShake} error={!!aPinError}/>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                        {nums.map(row => row.map(n => <Key key={'a'+n} label={n} onClick={() => aDigit(n)}/>))}
                        <Key label="ESC" onClick={aClear} color="#EF4444"/>
                        <Key label="0" onClick={() => aDigit('0')}/>
                        <Key label={<Delete size={20}/>} onClick={aBack}/>
                      </div>
                    </motion.div>
                  )}
                  {adminMode === 'password' && (
                    <motion.div key="apwd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.15}}>
                      {pwdError && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', borderRadius:8, padding:'8px 12px', fontSize:13, textAlign:'center', marginBottom:10 }}>{pwdError}</div>}
                      <div style={{ marginBottom:12 }}>
                        <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:4 }}>Correo electrónico</label>
                        <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setPwdError('');}} placeholder="admin@nmvlottery.com"
                          autoComplete="off"
                          style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:14, outline:'none', boxSizing:'border-box' }}/>
                      </div>
                      <div style={{ marginBottom:16 }}>
                        <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:4 }}>Contraseña</label>
                        <div style={{ position:'relative' }}>
                          <input type={showPwd?'text':'password'} value={password} onChange={e=>{setPassword(e.target.value);setPwdError('');}}
                            onKeyDown={e=>e.key==='Enter' && email && password && handleAdminLogin()}
                            placeholder="••••••••••"
                            autoComplete="new-password"
                            style={{ width:'100%', padding:'10px 44px 10px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:14, outline:'none', boxSizing:'border-box' }}/>
                          <button type="button" onClick={()=>setShowPwd(v=>!v)}
                            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6B7280', padding:0, display:'flex' }}>
                            {showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}
                          </button>
                        </div>
                      </div>
                      <motion.button type="button" whileTap={email&&password?{scale:0.97}:{}}
                        onClick={()=>email&&password&&!pwdLoading&&handleAdminLogin()}
                        disabled={!email||!password||pwdLoading}
                        style={{ width:'100%', padding:'12px', borderRadius:12, border:'none',
                          background: email&&password ? 'linear-gradient(135deg,#1a237e,#0d47a1)' : '#E5E7EB',
                          color: email&&password ? '#fff' : '#9CA3AF',
                          fontWeight:700, fontSize:15, cursor: email&&password ? 'pointer' : 'default',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:8, letterSpacing:1 }}>
                        {pwdLoading ? <Loader2 size={18} className="animate-spin"/> : <><ShieldCheck size={16}/> Acceder al Panel</>}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <p style={{ textAlign:'center', marginTop:12, fontSize:11, color:'#9CA3AF' }}>Acceso restringido — Solo personal autorizado</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ borderTop:'1px solid #F3F4F6', padding:'10px 24px', textAlign:'center', background:'#FAFAFA' }}>
          <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>© 2026 NMV Lottery · Sistema seguro · v1.0.1</p>
        </div>
      </motion.div>

      {/* ── Printer Driver Badge ───────────────────────────────────────── */}
      <a href="https://printers.apk.lol/" target="_blank" rel="noreferrer"
        style={{ position:'fixed', bottom:18, right:18,
          background:'linear-gradient(135deg,#0D9488,#0891B2)', color:'#fff', borderRadius:20,
          padding:'8px 14px', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:6,
          boxShadow:'0 4px 16px rgba(13,148,136,0.35)', textDecoration:'none', zIndex:999, letterSpacing:0.3 }}>
        🖨️ Drivers impresora
      </a>

      {/* ── Biometric Setup Modal — Bottom Sheet ──────────────────────── */}
      <AnimatePresence>
        {bioSetupShow && (
          <motion.div key="bio-modal" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            transition={{duration:0.25}}
            style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'flex-end',
              background:'rgba(0,0,0,0.65)', backdropFilter:'blur(12px)' }}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
              transition={{ type:'spring', stiffness:350, damping:30 }}
              style={{ width:'100%', background:'#fff', borderRadius:'28px 28px 0 0', padding:'0 0 36px', maxHeight:'92vh' }}>
              {/* Handle */}
              <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
                <div style={{ width:40, height:4, borderRadius:2, background:'#E5E7EB' }}/>
              </div>
              {/* Gradient header */}
              <div style={{ background:'linear-gradient(135deg,#0D9488 0%,#0891B2 50%,#0369A1 100%)',
                margin:'16px 20px 0', borderRadius:24, padding:'28px 20px 24px',
                textAlign:'center', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }}/>
                <div style={{ position:'absolute', bottom:-30, left:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }}/>
                <motion.div initial={{scale:0,rotate:-180}} animate={{scale:1,rotate:0}}
                  transition={{type:'spring',stiffness:260,damping:20,delay:0.15}}
                  style={{ width:72,height:72,borderRadius:'50%',background:'rgba(255,255,255,0.2)',
                    border:'3px solid rgba(255,255,255,0.4)',display:'flex',alignItems:'center',
                    justifyContent:'center',margin:'0 auto 14px',position:'relative',zIndex:1 }}>
                  <motion.span initial={{opacity:0,scale:0}} animate={{opacity:1,scale:1}}
                    transition={{delay:0.3,duration:0.2}} style={{fontSize:36}}>✅</motion.span>
                </motion.div>
                <h2 style={{ margin:'0 0 6px',fontSize:22,fontWeight:800,color:'#fff',position:'relative',zIndex:1 }}>¡Bienvenido!</h2>
                <p style={{ margin:0,fontSize:13,color:'rgba(255,255,255,0.85)',position:'relative',zIndex:1 }}>Entrada verificada correctamente</p>
              </div>
              {/* Offer */}
              <div style={{ padding:'24px 20px 0' }}>
                <div style={{ display:'flex',alignItems:'center',gap:14,background:'#F0FDFA',borderRadius:16,padding:'16px',marginBottom:16,border:'1px solid #CCFBF1' }}>
                  <div style={{ position:'relative',flexShrink:0 }}>
                    <motion.div animate={{scale:[1,1.15,1]}} transition={{duration:2,repeat:Infinity,ease:'easeInOut'}}
                      style={{ width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,#0D9488,#0891B2)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        boxShadow:'0 4px 16px rgba(13,148,136,0.4)' }}>
                      <FingerprintIcon size={32} color="#fff"/>
                    </motion.div>
                    <motion.div animate={{scale:[1,1.6,1],opacity:[0.5,0,0.5]}} transition={{duration:2,repeat:Infinity,ease:'easeInOut'}}
                      style={{ position:'absolute',inset:0,borderRadius:'50%',border:'2px solid #0D9488' }}/>
                  </div>
                  <div>
                    <p style={{ margin:'0 0 2px',fontWeight:700,color:'#0F766E',fontSize:14 }}>Activa Face ID o Huella dactilar</p>
                    <p style={{ margin:0,color:'#6B7280',fontSize:12,lineHeight:1.4 }}>Entra en 1 segundo sin PIN la próxima vez</p>
                  </div>
                </div>
                <motion.button type="button" whileTap={{scale:0.97}} disabled={bioRegistering}
                  onClick={async () => {
                    setBioRegistering(true);
                    try {
                      const ok = await registerBiometric('vendor','Vendedor NMV','Vendedor NMV Lottery', pendingPinRef.current);
                      if (ok) {
                        setBioRegistered(true);
                        setBioSetupShow(false);
                        navigate('/betting-pool/ticket/create');
                      } else setBioRegistering(false);
                    } catch { setBioRegistering(false); }
                  }}
                  style={{ width:'100%',height:54,borderRadius:16,border:'none',marginBottom:12,
                    background: bioRegistering ? '#E5E7EB' : 'linear-gradient(135deg,#0D9488 0%,#0891B2 100%)',
                    color: bioRegistering ? '#9CA3AF' : '#fff',fontWeight:800,fontSize:16,
                    cursor: bioRegistering ? 'default' : 'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                    boxShadow: bioRegistering ? 'none' : '0 6px 20px rgba(13,148,136,0.4)' }}>
                  {bioRegistering ? <><Loader2 size={18} className="animate-spin"/> Activando...</> : <><FingerprintIcon size={22} color="#fff"/> Activar ahora</>}
                </motion.button>
                <button type="button" onClick={() => { setBioSetupShow(false); navigate('/betting-pool/ticket/create'); }}
                  style={{ width:'100%',height:46,borderRadius:14,border:'1.5px solid #E5E7EB',
                    background:'transparent',color:'#9CA3AF',fontWeight:600,fontSize:14,cursor:'pointer' }}>
                  Continuar sin biometría
                </button>
                <p style={{ textAlign:'center',fontSize:11,color:'#9CA3AF',marginTop:10 }}>🔒 Usa el hardware seguro de tu dispositivo</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
