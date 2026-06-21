import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────
interface ClientSession { id: string; full_name: string; code: string; balance: number; banca_code: string; }

// ── PIN Keypad ───────────────────────────────────────────────────────────────
function PinKeypad({ pin, onChange }: { pin: string; onChange: (p: string) => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:16 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:52, height:60, borderRadius:12,
            border: `2.5px solid ${pin.length > i ? '#0D9488' : '#d1d5db'}`,
            background: pin.length > i ? '#f0fdfa' : '#f9fafb',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:28, fontWeight:900, color:'#0D9488', transition:'all 0.15s',
          }}>
            {pin.length > i ? '●' : ''}
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:240, margin:'0 auto' }}>
        {keys.map((k, idx) => (
          k === '' ? <div key={idx} /> :
          <button key={k} type="button"
            onClick={() => { if (k === '⌫') { onChange(pin.slice(0,-1)); } else if (pin.length < 4) { onChange(pin + k); }}}
            style={{
              height:52, borderRadius:12, border: `1.5px solid ${k === '⌫' ? '#fecaca' : '#e5e7eb'}`,
              background: k === '⌫' ? '#fff5f5' : '#fff',
              fontSize: k === '⌫' ? 18 : 22, fontWeight:700, color:'#374151',
              cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
            }}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Portal ───────────────────────────────────────────────────────────────
export default function ClientPortal() {
  const [view, setView]             = useState<'login' | 'dashboard'>('login');
  const [username, setUsername]     = useState('');
  const [pin, setPin]               = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [client, setClient]         = useState<ClientSession | null>(null);
  const [tickets, setTickets]       = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tab, setTab]               = useState<'tickets' | 'movimientos'>('tickets');

  // Auto-login attempt from saved session
  useEffect(() => {
    const saved = localStorage.getItem('nmv_movil_client');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id) { setClient(parsed); setView('dashboard'); loadClientData(parsed.id); }
      } catch { /* ignore */ }
    }
  }, []);

  // Auto-submit when PIN is 4 digits
  useEffect(() => {
    if (pin.length === 4 && username.trim()) handleLogin();
  }, [pin]);

  const handleLogin = async () => {
    if (!username.trim() || pin.length < 4) return;
    setLoading(true); setError('');
    try {
      const { data, error: err } = await supabase
        .from('nmv_clients')
        .select('id, full_name, code, balance, banca_code, pin, is_active')
        .or(`username.eq.${username.trim().toLowerCase()},code.eq.${username.trim().toUpperCase()}`)
        .eq('is_active', true)
        .single();

      if (err || !data) { setError('Usuario no encontrado. Verifica tu número de código o usuario.'); setPin(''); setLoading(false); return; }
      if (data.pin !== pin) { setError('PIN incorrecto. Intenta de nuevo.'); setPin(''); setLoading(false); return; }

      const session: ClientSession = { id: data.id, full_name: data.full_name, code: data.code, balance: Number(data.balance ?? 0), banca_code: data.banca_code };
      setClient(session);
      localStorage.setItem('nmv_movil_client', JSON.stringify(session));
      await loadClientData(data.id);
      setView('dashboard');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setPin('');
    } finally { setLoading(false); }
  };

  const loadClientData = async (clientId: string) => {
    const [ticketsRes, transRes] = await Promise.all([
      supabase.from('movil_tickets').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
      supabase.from('movil_transactions').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
    ]);
    if (ticketsRes.data) setTickets(ticketsRes.data);
    if (transRes.data) setTransactions(transRes.data);
  };

  const handleLogout = () => {
    localStorage.removeItem('nmv_movil_client');
    setClient(null); setView('login'); setUsername(''); setPin(''); setTickets([]); setTransactions([]);
  };

  // ── LOGIN VIEW ───────────────────────────────────────────────────────────────
  if (view === 'login') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0D9488 0%,#134e4a 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:380, padding:'36px 28px', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#0D9488,#134e4a)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:32 }}>🎰</div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#0D9488' }}>NMV Lottery</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#6b7280' }}>Portal del Cliente</p>
        </div>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626', fontWeight:600, textAlign:'center' }}>
            {error}
          </div>
        )}

        {/* Username */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
            Código o Usuario
          </label>
          <input type="text" value={username} onChange={e => { setUsername(e.target.value); setError(''); }}
            placeholder="NMV-00123 o miusuario"
            style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`2px solid ${username ? '#0D9488' : '#e5e7eb'}`, fontSize:15, fontWeight:600, outline:'none', boxSizing:'border-box', background:'#f9fafb', transition:'border 0.2s' }} />
        </div>

        {/* PIN */}
        <div style={{ marginBottom:24 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'center' }}>
            PIN de 4 dígitos
          </label>
          <PinKeypad pin={pin} onChange={p => { setPin(p); setError(''); }} />
        </div>

        {loading && (
          <div style={{ textAlign:'center', color:'#0D9488', fontWeight:700, fontSize:14, padding:'10px 0' }}>
            Verificando…
          </div>
        )}
      </div>
    </div>
  );

  // ── DASHBOARD VIEW ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0D9488,#134e4a)', padding:'20px 20px 60px', color:'#fff' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', maxWidth:480, margin:'0 auto' }}>
          <div>
            <p style={{ margin:'0 0 2px', fontSize:12, opacity:0.8 }}>Bienvenido(a)</p>
            <h2 style={{ margin:0, fontSize:20, fontWeight:900 }}>{client?.full_name}</h2>
            <p style={{ margin:'2px 0 0', fontSize:12, opacity:0.7, fontFamily:'monospace' }}>{client?.code} · {client?.banca_code}</p>
          </div>
          <button onClick={handleLogout} style={{ background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            Salir
          </button>
        </div>
        {/* Balance card */}
        <div style={{ maxWidth:480, margin:'20px auto 0', background:'rgba(255,255,255,0.12)', borderRadius:16, padding:'20px 24px', backdropFilter:'blur(8px)', textAlign:'center' }}>
          <p style={{ margin:'0 0 4px', fontSize:13, opacity:0.8 }}>Balance disponible</p>
          <p style={{ margin:0, fontSize:38, fontWeight:900, letterSpacing:'-0.02em' }}>
            ${(client?.balance ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth:480, margin:'-28px auto 0', padding:'0 16px' }}>
        <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,0.08)', overflow:'hidden' }}>
          <div style={{ display:'flex', borderBottom:'1px solid #f3f4f6' }}>
            {(['tickets','movimientos'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex:1, padding:'14px', fontSize:13, fontWeight:700, background:'none', border:'none', cursor:'pointer',
                  color: tab === t ? '#0D9488' : '#9ca3af',
                  borderBottom: tab === t ? '2px solid #0D9488' : '2px solid transparent' }}>
                {t === 'tickets' ? `🎫 Tickets (${tickets.length})` : `💳 Movimientos (${transactions.length})`}
              </button>
            ))}
          </div>

          <div style={{ padding:'12px', maxHeight:'60vh', overflowY:'auto' }}>
            {tab === 'tickets' && (
              tickets.length === 0
                ? <p style={{ textAlign:'center', color:'#9ca3af', padding:'32px 0', fontSize:14 }}>Sin tickets registrados</p>
                : tickets.map(t => (
                  <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', marginBottom:8, background:'#f9fafb', borderRadius:12, border:'1px solid #e5e7eb' }}>
                    <div>
                      <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:800, color:'#0D9488', fontFamily:'monospace' }}>{t.ticket_number || t.id?.slice(0,8)}</p>
                      <p style={{ margin:0, fontSize:11, color:'#9ca3af' }}>{t.created_at ? new Date(t.created_at).toLocaleDateString('es-DO') : '-'}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                        background: t.status === 'winner' ? '#d1fae5' : t.status === 'cancelled' ? '#f3f4f6' : '#fef3c7',
                        color: t.status === 'winner' ? '#065f46' : t.status === 'cancelled' ? '#6b7280' : '#92400e' }}>
                        {t.status || 'pendiente'}
                      </span>
                      <p style={{ margin:'4px 0 0', fontSize:14, fontWeight:800, color:'#0D9488' }}>${Number(t.amount ?? 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))
            )}
            {tab === 'movimientos' && (
              transactions.length === 0
                ? <p style={{ textAlign:'center', color:'#9ca3af', padding:'32px 0', fontSize:14 }}>Sin movimientos registrados</p>
                : transactions.map(t => (
                  <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', marginBottom:8, background:'#f9fafb', borderRadius:12, border:'1px solid #e5e7eb' }}>
                    <div>
                      <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:'#374151' }}>{t.type === 'recarga' ? '⬆️ Recarga' : t.type === 'retiro' ? '⬇️ Retiro' : '💰 Movimiento'}</p>
                      <p style={{ margin:0, fontSize:11, color:'#9ca3af' }}>{t.created_at ? new Date(t.created_at).toLocaleDateString('es-DO') : '-'}</p>
                    </div>
                    <p style={{ margin:0, fontSize:16, fontWeight:800, color: t.type === 'recarga' ? '#059669' : '#dc2626' }}>
                      {t.type === 'recarga' ? '+' : '-'}${Number(t.amount ?? 0).toFixed(2)}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
