import { useState, useCallback } from 'react';
import { UserPlus, Loader2, Shuffle } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { createMovilClient } from '@/lib/movilService';
import { useVendedores } from '@/hooks/useVendedores';
import { supabase } from '@/lib/supabase';

// ── Mini PIN keypad component ──────────────────────────────────────────────
function PinKeypad({ pin, onChange }: { pin: string; onChange: (p: string) => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div>
      {/* Dots display */}
      <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:12, marginTop:6 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:44, height:52, borderRadius:10,
            border:`2px solid ${pin.length > i ? '#337AB7' : '#ddd'}`,
            background: pin.length > i ? '#EBF5FB' : '#fafafa',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:26, fontWeight:900, color:'#337AB7',
          }}>
            {pin.length > i ? '●' : ''}
          </div>
        ))}
      </div>
      {/* Numpad */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, maxWidth:220, margin:'0 auto' }}>
        {keys.map((k, idx) => (
          k === '' ? <div key={idx} /> :
          <button key={k} type="button"
            onClick={() => {
              if (k === '⌫') { onChange(pin.slice(0,-1)); }
              else if (pin.length < 4) { onChange(pin + k); }
            }}
            style={{
              height:44, borderRadius:10,
              border:`1.5px solid ${k === '⌫' ? '#f0d0d0' : '#e0e8f5'}`,
              background: k === '⌫' ? '#fff5f5' : '#EBF5FB',
              fontSize: k === '⌫' ? 16 : 18, fontWeight:700, color:'#2C3E50',
              cursor:'pointer',
            }}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MovilCrearClienteModal() {
  const { closeModal } = useModalContext();
  const { activeVendedor } = useVendedores();

  const [step, setStep]             = useState<'form' | 'pin'>('form');
  const [fullName, setFullName]     = useState('');
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [balance, setBalance]       = useState('');
  const [language, setLanguage]     = useState('es');
  const [pin, setPin]               = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinStep, setPinStep]       = useState<'set' | 'confirm'>('set');
  const [loading, setLoading]           = useState(false);
  const [genLoading, setGenLoading]     = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  // ── Auto-generate a unique 4-digit PIN ─────────────────────────────────────
  const generateUniquePin = useCallback(async () => {
    setGenLoading(true);
    setError('');
    try {
      // Get all existing active PINs for this business
      const bizId = localStorage.getItem('nmv_business_id');
      let query = supabase.from('nmv_clients').select('pin').eq('is_active', true);
      if (bizId) query = query.eq('business_id', bizId);
      const { data: existing } = await query;
      const usedPins = new Set((existing || []).map((r: any) => r.pin).filter(Boolean));

      // Generate random PIN not in use
      let attempts = 0;
      let candidate = '';
      do {
        // Random 4-digit: 1000-9999 to avoid leading zero
        candidate = String(Math.floor(1000 + Math.random() * 9000));
        attempts++;
      } while (usedPins.has(candidate) && attempts < 200);

      if (attempts >= 200) { setError('No se pudo generar un PIN único. Intenta manualmente.'); return; }

      setPin(candidate);
      setGeneratedPin(candidate);
      setError('');
    } catch (e: any) {
      setError('Error al generar PIN: ' + e.message);
    } finally {
      setGenLoading(false);
    }
  }, []);

  const handleNextToPin = () => {
    setError('');
    if (!fullName.trim() || !username.trim()) {
      setError('Nombre completo y nombre de usuario son requeridos.');
      return;
    }
    if (password && password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setStep('pin');
    setPin('');
    setPinConfirm('');
    setPinStep('set');
  };

  const handlePinStep = () => {
    if (pinStep === 'set') {
      if (pin.length !== 4) { setError('El PIN debe ser de 4 dígitos.'); return; }
      setError('');
      setPinStep('confirm');
      setPinConfirm('');
    }
  };

  // Auto-advance when confirm pin reaches 4 digits
  const handlePinConfirmChange = (p: string) => {
    setPinConfirm(p);
    if (p.length === 4) {
      if (p !== pin) {
        setError('Los PINs no coinciden. Intente de nuevo.');
        setPin('');
        setPinConfirm('');
        setPinStep('set');
      } else {
        setError('');
        // Auto-save
        handleSave(pin);
      }
    }
  };

  const handleSave = async (confirmedPin: string) => {
    setError('');
    setLoading(true);
    try {
      // banca_code MUST be the vendor_code (RDV-R01, RDV-R02, etc.) — NOT the vendor's name
      const vendorCode = localStorage.getItem('nmv_vendor_code') || activeVendedor?.id || 'NMV-001';
      const vendorId   = localStorage.getItem('nmv_vendor_id')   || activeVendedor?.id || 'vendor';
      const client = await createMovilClient({
        full_name:    fullName.trim(),
        username:     username.trim().toLowerCase(),
        password:     password || undefined,
        pin:          confirmedPin,
        email:        email.trim() || undefined,
        phone:        phone.trim() || undefined,
        balance:      balance ? Number(balance) : 0,
        language,
        banca_code:   vendorCode,
        created_by:   vendorId,
        is_active:    true,
      });
      setSuccess(
        `🎉 ¡${fullName.trim()} creado exitosamente!\n` +
        `📋 Código: ${client.code}\n` +
        `🔐 PIN: ${confirmedPin}\n` +
        `🌐 Acceso: numeros.nmvapp.com`
      );
      setTimeout(() => { setSuccess(''); closeModal(); }, 5000);
    } catch (e: any) {
      setError(e.message ?? 'Error al crear cliente.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Crear cliente MOVIL" maxWidth="540px">
      {success && (
        <div style={{ background:'linear-gradient(135deg,#d1fae5,#a7f3d0)', border:'2px solid #6ee7b7',
          borderRadius:14, padding:'16px 18px', marginBottom:12, textAlign:'center' }}>
          {success.split('\n').map((line, i) => (
            <div key={i} style={{
              fontSize: i===0 ? 16 : i<=2 ? 15 : 12,
              fontWeight: i<=2 ? 700 : 500,
              color: '#065f46',
              letterSpacing: i===1||i===2 ? 2 : 0,
              fontFamily: i===1||i===2 ? 'monospace' : 'inherit',
              marginTop: i===0 ? 0 : 4,
              padding: i===1||i===2 ? '4px 12px' : 0,
              background: i===1||i===2 ? 'rgba(255,255,255,0.5)' : 'transparent',
              borderRadius: i===1||i===2 ? 8 : 0,
              display: 'inline-block',
            }}>
              {line}
            </div>
          ))}
        </div>
      )}
      {error && (
        <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:13, color:'#991b1b' }}>
          {error}
        </div>
      )}

      {/* ── STEP 1: Data form ── */}
      {step === 'form' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre completo *</label>
              <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre de usuario *</label>
              <input type="text" value={username} onChange={e=>setUsername(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                placeholder="juan01" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña (opc.)</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                placeholder="••••••" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar contraseña</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                placeholder="••••••" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo electrónico</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número telefónico</label>
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                placeholder="809-000-0000" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Balance inicial ($)</label>
              <input type="number" value={balance} onChange={e=>setBalance(e.target.value)} min="0" step="0.01"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-400"
                placeholder="0.00" style={{ borderColor: balance && Number(balance) > 0 ? '#22c55e' : undefined }} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Idioma</label>
              <select value={language} onChange={e=>setLanguage(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400">
                <option value="es">Español</option>
                <option value="en">Inglés</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={closeModal}
              className="flex-1 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleNextToPin}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: '#337AB7' }}>
              Siguiente → Crear PIN
            </button>
          </div>
        </>
      )}

      {/* ── STEP 2: PIN setup ── */}
      {step === 'pin' && !loading && !success && (
        <div>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:32, marginBottom:6 }}>🔐</div>
            <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:'#2C3E50' }}>
              {pinStep === 'set' ? 'Crea el PIN de acceso' : 'Confirma el PIN'}
            </h3>
            <p style={{ margin:'6px 0 0', fontSize:13, color:'#666' }}>
              {pinStep === 'set'
                ? 'Este PIN de 4 dígitos le permitirá al cliente acceder a numeros.nmvapp.com'
                : 'Ingresa el PIN nuevamente para confirmar'}
            </p>
          </div>

          {pinStep === 'set' ? (
            <>
              {/* Auto-generate button */}
              <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                <button type="button" onClick={generateUniquePin} disabled={genLoading}
                  style={{
                    display:'flex', alignItems:'center', gap:8, padding:'10px 20px',
                    borderRadius:12, border:'2px solid #0D9488',
                    background: genLoading ? '#f0fdfa' : 'linear-gradient(135deg,#0D9488,#0891B2)',
                    color: genLoading ? '#0D9488' : '#fff',
                    fontWeight:700, fontSize:13, cursor: genLoading ? 'not-allowed' : 'pointer',
                    boxShadow: genLoading ? 'none' : '0 3px 10px rgba(13,148,136,0.35)',
                  }}>
                  {genLoading
                    ? <><Loader2 size={14} className="animate-spin" /> Generando…</>
                    : <><Shuffle size={14} /> 🎲 Generar PIN Único Automático</>
                  }
                </button>
              </div>

              {/* Show generated PIN prominently */}
              {generatedPin && pin === generatedPin && (
                <div style={{ background:'linear-gradient(135deg,#F0FDF4,#ECFDF5)', border:'2px solid #4ADE80',
                  borderRadius:12, padding:'12px 16px', marginBottom:12, textAlign:'center' }}>
                  <p style={{ margin:0, fontSize:12, color:'#166534', fontWeight:600, marginBottom:4 }}>
                    ✅ PIN generado automáticamente — sin repetir
                  </p>
                  <p style={{ margin:0, fontSize:28, fontWeight:900, color:'#15803D', letterSpacing:8, fontFamily:'monospace' }}>
                    {generatedPin}
                  </p>
                  <p style={{ margin:'6px 0 0', fontSize:11, color:'#166534' }}>
                    📱 Comparte este PIN con el cliente para que acceda a numeros.nmvapp.com
                  </p>
                </div>
              )}

              <div style={{ marginBottom:8, textAlign:'center', fontSize:12, color:'#9CA3AF' }}>— o crea el PIN manualmente —</div>
              <PinKeypad pin={pin} onChange={p => { setPin(p); if (p !== generatedPin) setGeneratedPin(''); }} />
              <div className="flex gap-2 mt-5">
                <button onClick={() => setStep('form')}
                  className="flex-1 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-600">
                  ← Atrás
                </button>
                <button onClick={handlePinStep} disabled={pin.length < 4}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: pin.length === 4 ? '#337AB7' : '#aaa', cursor: pin.length < 4 ? 'not-allowed' : 'pointer' }}>
                  Confirmar PIN →
                </button>
              </div>
            </>
          ) : (
            <>
              <PinKeypad pin={pinConfirm} onChange={handlePinConfirmChange} />
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setPinStep('set'); setPin(''); setPinConfirm(''); setError(''); }}
                  className="flex-1 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-600">
                  ← Cambiar PIN
                </button>
                <div className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center"
                  style={{ backgroundColor: '#888', textAlign:'center' }}>
                  Ingresa 4 dígitos…
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <Loader2 size={36} className="animate-spin mx-auto mb-3" color="#337AB7" />
          <p style={{ color:'#666', fontSize:14 }}>Guardando cliente en Supabase…</p>
        </div>
      )}
    </ModalWrapper>
  );
}
