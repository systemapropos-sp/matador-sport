/**
 * PagarModal — Pago de tickets ganadores.
 * Búsqueda por: código escrito | QR escaneado
 * Seguridad: código de verificación de 12 dígitos requerido para pagar tickets ganadores.
 */
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, QrCode, Keyboard, Check, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { supabase } from '@/lib/supabase';

interface PagarModalProps { open: boolean; onClose: () => void; }

type TicketResult = {
  id: string;
  ticket_number: string;
  status: string;
  prize_amount: number | null;
  total_amount: number;
  plays: any[];
  verification_code?: string;
};

export default function PagarModal({ open, onClose }: PagarModalProps) {
  const [tab, setTab] = useState<'code' | 'qr'>('code');
  const [ticketInput, setTicketInput] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [ticket, setTicket] = useState<TicketResult | null>(null);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);

  // Verification code step (winner tickets)
  const [verifCode, setVerifCode] = useState('');
  const [verifError, setVerifError] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifStep, setVerifStep] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);
  const qrRef   = useRef<HTMLInputElement>(null);
  const verifRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { reset(); return; }
    setTimeout(() => (tab === 'code' ? codeRef : qrRef).current?.focus(), 200);
  }, [open, tab]);

  const reset = () => {
    setTicketInput(''); setQrInput(''); setTicket(null); setError('');
    setPaid(false); setVerifCode(''); setVerifError('');
    setCodeVerified(false); setVerifStep(false); setLoading(false); setPaying(false);
  };

  /** Extract ticket number from QR URL or return raw value */
  const parseQR = (raw: string): string => {
    try {
      const url = new URL(raw);
      const t = url.searchParams.get('t');
      if (t) return t;
    } catch { /* not a URL */ }
    return raw.trim();
  };

  const searchTicket = async (raw: string) => {
    const num = parseQR(raw).toUpperCase().trim();
    if (!num) return;
    setLoading(true); setError(''); setTicket(null); setPaid(false);
    setVerifCode(''); setVerifError(''); setCodeVerified(false); setVerifStep(false);

    const { data, error: dbErr } = await supabase
      .from('tickets')
      .select('id, ticket_number, status, prize_amount, total_amount, plays, verification_code')
      .ilike('ticket_number', `%${num}%`)
      .maybeSingle();

    setLoading(false);
    if (dbErr || !data) { setError('Ticket no encontrado en el sistema.'); return; }

    setTicket(data as TicketResult);
    if (data.status === 'winner') {
      setVerifStep(true);
      setTimeout(() => verifRef.current?.focus(), 100);
    }
  };

  const handleVerifyCode = () => {
    if (!ticket || !verifCode.trim()) { setVerifError('Ingrese el código de verificación.'); return; }
    const input  = verifCode.replace(/\D/g, '');
    const stored = (ticket.verification_code || '').replace(/\D/g, '');
    if (!stored) { setCodeVerified(true); setVerifError(''); return; }
    if (input !== stored) { setVerifError('❌ Código incorrecto. No se puede pagar.'); setCodeVerified(false); return; }
    setCodeVerified(true); setVerifError('');
  };

  const handlePay = async () => {
    if (!ticket) return;
    if (ticket.status === 'winner' && !codeVerified) {
      setVerifError('Debe verificar el código primero.'); return;
    }
    setPaying(true);
    const { error: dbErr } = await supabase
      .from('tickets')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', ticket.id);
    setPaying(false);
    if (dbErr) { setError('Error al registrar el pago.'); return; }
    setPaid(true);
  };

  const handleClose = () => { reset(); onClose(); };

  const statusLabel: Record<string, string> = {
    pending: 'Pendiente', winner: '🏆 GANADOR', loser: 'Perdedor', paid: '✅ Pagado', cancelled: 'Cancelado',
  };
  const statusColor: Record<string, string> = {
    pending: '#64748b', winner: '#16a34a', loser: '#dc2626', paid: '#0891b2', cancelled: '#94a3b8',
  };

  return (
    <ModalWrapper open={open} onClose={handleClose} title="💲 Pagar Ticket">
      <div style={{ padding: '0 4px', minWidth: 340, maxWidth: 400 }}>

        {/* ── Tabs ── */}
        {!ticket && !paid && (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
              {[
                { id: 'code', icon: <Keyboard size={14}/>, label: 'Ingresar Código' },
                { id: 'qr',   icon: <QrCode size={14}/>,   label: 'Escanear QR'     },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)} style={{
                  flex: 1, height: 36, border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: tab === t.id ? '#fff' : 'transparent',
                  color: tab === t.id ? '#0D9488' : '#64748b',
                  boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all .15s',
                }}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {tab === 'code' ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  ref={codeRef}
                  type="text"
                  value={ticketInput}
                  onChange={e => setTicketInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && searchTicket(ticketInput)}
                  placeholder="Ej: NMV-001-000016"
                  style={{ flex: 1, height: 44, padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'monospace' }}
                />
                <button onClick={() => searchTicket(ticketInput)} disabled={loading || !ticketInput.trim()}
                  style={{ height: 44, padding: '0 18px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: loading || !ticketInput.trim() ? 0.7 : 1 }}>
                  {loading ? <Loader2 size={15} className="animate-spin"/> : <Search size={15}/>}
                  Buscar
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8, lineHeight: 1.4 }}>
                  Escanea el código QR del ticket con tu cámara. Pega aquí el resultado:
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    ref={qrRef}
                    type="text"
                    value={qrInput}
                    onChange={e => setQrInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && qrInput && searchTicket(qrInput)}
                    placeholder="Pega el contenido del QR..."
                    style={{ flex: 1, height: 44, padding: '0 14px', border: '1.5px solid #0D9488', borderRadius: 8, fontSize: 13, outline: 'none', background: '#f0fffe' }}
                    autoComplete="off"
                  />
                  <button onClick={() => qrInput && searchTicket(qrInput)} disabled={loading || !qrInput.trim()}
                    style={{ height: 44, padding: '0 18px', background: '#0D9488', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: loading || !qrInput.trim() ? 0.7 : 1 }}>
                    {loading ? <Loader2 size={15} className="animate-spin"/> : <QrCode size={15}/>}
                    Buscar
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 12 }}>
            <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }}/>
            <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* ── Ticket found — details ── */}
        {ticket && !paid && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 12 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1e293b', fontSize: 14 }}>
                #{ticket.ticket_number}
              </span>
              <span style={{
                fontWeight: 800, fontSize: 12, padding: '3px 10px', borderRadius: 20,
                background: `${statusColor[ticket.status] || '#64748b'}18`,
                color: statusColor[ticket.status] || '#64748b',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {statusLabel[ticket.status] || ticket.status}
              </span>
            </div>

            {/* Plays */}
            <div style={{ marginBottom: 8 }}>
              {ticket.plays?.slice(0, 5).map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', padding: '2px 0' }}>
                  <span>• {p.lotteryName || '—'} / <b>{p.numbers}</b> ({p.type})</span>
                  <span style={{ fontWeight: 700 }}>${Number(p.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total / Prize */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Jugado:</span>
              <span style={{ fontWeight: 800, color: '#334155' }}>${ticket.total_amount?.toFixed(2)}</span>
            </div>
            {ticket.prize_amount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>Premio:</span>
                <span style={{ fontWeight: 900, color: '#16a34a', fontSize: 16 }}>${ticket.prize_amount.toFixed(2)}</span>
              </div>
            )}

            {/* Already paid / cancelled */}
            {(ticket.status === 'paid' || ticket.status === 'cancelled') && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 13, color: '#0369a1', fontWeight: 700, textAlign: 'center' }}>
                {ticket.status === 'paid' ? '✅ Este ticket ya fue pagado.' : '🚫 Este ticket está cancelado.'}
              </div>
            )}

            {/* Verification step (winner only) */}
            {verifStep && ticket.status === 'winner' && (
              <div style={{ marginTop: 12, padding: '12px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <ShieldCheck size={16} color="#16a34a" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Verificación de seguridad</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                  Ingrese el código de 12 dígitos del <strong>ticket ORIGINAL</strong>:
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    ref={verifRef}
                    type="text"
                    value={verifCode}
                    onChange={e => { setVerifCode(e.target.value.replace(/\D/g, '').slice(0, 12)); setVerifError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                    placeholder="############"
                    maxLength={12}
                    style={{ flex: 1, height: 40, padding: '0 14px', border: `1.5px solid ${verifError ? '#dc2626' : '#bbf7d0'}`, borderRadius: 8, fontSize: 16, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2, outline: 'none', background: '#fff' }}
                  />
                  <button onClick={handleVerifyCode}
                    style={{ height: 40, padding: '0 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Verificar
                  </button>
                </div>
                {verifError && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 6, fontWeight: 600 }}>{verifError}</p>}
                {codeVerified && <p style={{ color: '#16a34a', fontSize: 12, marginTop: 6, fontWeight: 700 }}>✓ Código verificado — ticket listo para pagar</p>}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Paid success ── */}
        {paid && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ padding: 24, background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 12, textAlign: 'center', marginBottom: 12 }}>
            <Check size={40} color="#16a34a" style={{ margin: '0 auto 8px' }}/>
            <p style={{ fontWeight: 800, fontSize: 16, color: '#15803d', margin: 0 }}>¡Pago registrado exitosamente!</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Ticket #{ticket?.ticket_number}</p>
          </motion.div>
        )}

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: 8 }}>
          {ticket && !paid && ticket.status !== 'paid' && ticket.status !== 'cancelled' && (
            <button
              onClick={handlePay}
              disabled={paying || (ticket.status === 'winner' && !codeVerified)}
              style={{
                flex: 2, height: 44,
                background: paying || (ticket.status === 'winner' && !codeVerified)
                  ? '#e2e8f0' : 'linear-gradient(135deg,#0D9488,#0891B2)',
                color: paying || (ticket.status === 'winner' && !codeVerified) ? '#94a3b8' : '#fff',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                cursor: paying || (ticket.status === 'winner' && !codeVerified) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {paying ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>}
              {paying ? 'Procesando...' : 'Registrar Pago'}
            </button>
          )}
          {(paid || ticket) && (
            <button onClick={() => { reset(); }}
              style={{ flex: 1, height: 44, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Nuevo
            </button>
          )}
          <button onClick={handleClose}
            style={{ flex: 1, height: 44, background: '#64748b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cerrar
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
