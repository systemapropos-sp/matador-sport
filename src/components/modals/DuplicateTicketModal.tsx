/**
 * DuplicateTicketModal — Redesigned with multi-lottery selector.
 * Busca por últimos 4 dígitos o QR. Al duplicar, permite elegir en qué
 * loterias se carnan las jugadas (multi-selección con pills).
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, QrCode, Keyboard, Copy, Loader2, CheckCircle, X } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { supabase } from '@/lib/supabase';
import { regularLotteries } from '@/data/lotteries';
import { schedules } from '@/data/schedules';

type PlayItem = {
  id?: string;
  numbers: string;
  amount: number;
  type?: string;
  lotteryId?: string;
  lotteryName?: string;
};

type FoundTicket = {
  id: string;
  ticket_number: string;
  status: string;
  amount: number;
  metadata: {
    plays?: PlayItem[];
    total_amount?: number;
    vendor_name?: string;
  };
};

interface Props { open: boolean; onClose: () => void; }

export default function DuplicateTicketModal({ open, onClose }: Props) {
  const [tab, setTab]       = useState<'code' | 'qr'>('code');
  const [input, setInput]   = useState('');
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [found, setFound]   = useState<FoundTicket | null>(null);
  const [error, setError]   = useState('');
  const [done, setDone]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qrRef    = useRef<HTMLInputElement>(null);

  // ── Selected lotteries for duplicate ──
  const [selectedLots, setSelectedLots] = useState<string[]>([]);

  // Open lotteries (not yet closed by schedule)
  const openLotteries = useMemo(() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    return regularLotteries.filter(l => {
      const sch = schedules.find(s => s.lotteryId === l.id);
      if (!sch) return true;
      const m = sch.closingTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!m) return true;
      let h = parseInt(m[1], 10);
      if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
      return mins < h * 60 + parseInt(m[2], 10);
    });
  }, []);

  // Auto-focus & reset
  useEffect(() => {
    if (!open) { reset(); return; }
    setTimeout(() => (tab === 'code' ? inputRef : qrRef).current?.focus(), 150);
  }, [open, tab]);

  // When ticket found — pre-select its original lottery(ies)
  useEffect(() => {
    if (!found) return;
    const plays = found.metadata?.plays || [];
    const ids = plays
      .map(p => p.lotteryId || regularLotteries.find(l =>
        l.name.toLowerCase() === (p.lotteryName || '').toLowerCase())?.id || '')
      .filter(Boolean);
    const unique = [...new Set(ids)];
    setSelectedLots(unique.length ? unique : [regularLotteries[0]?.id || 'florida-pm']);
  }, [found]);

  const parseTicketCode = (raw: string): string => {
    try {
      const url = new URL(raw);
      const t = url.searchParams.get('t');
      if (t) return t;
    } catch { /* not url */ }
    return raw.trim();
  };

  const reset = () => {
    setInput(''); setQrInput(''); setFound(null);
    setError(''); setDone(false); setLoading(false); setSelectedLots([]);
  };

  const searchTicket = async (rawCode: string) => {
    setLoading(true); setError(''); setFound(null); setDone(false);
    const code = parseTicketCode(rawCode).toUpperCase().replace(/\s/g, '');
    if (!code) { setLoading(false); return; }
    const searchCode = /^\d{1,4}$/.test(code) ? code.padStart(4, '0') : code;
    const { data, error: dbErr } = await supabase
      .from('tickets')
      .select('id, ticket_number, status, amount, metadata')
      .ilike('ticket_number', `%${searchCode}%`)
      .neq('status', 'cancelled')
      .limit(1)
      .maybeSingle();
    setLoading(false);
    if (dbErr || !data) { setError('Ticket no encontrado. Verifica los últimos dígitos.'); return; }
    setFound(data as unknown as FoundTicket);
  };

  const getPlays = (): PlayItem[] => found?.metadata?.plays || [];
  const getTotalAmount = (): number => found?.metadata?.total_amount ?? found?.amount ?? 0;

  const toggleLot = (id: string) =>
    setSelectedLots(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleDuplicate = () => {
    if (!found || selectedLots.length === 0) return;
    const srcPlays = getPlays();
    if (srcPlays.length === 0) { setError('Este ticket no tiene jugadas disponibles'); return; }
    const duplicated: PlayItem[] = [];
    selectedLots.forEach(lotId => {
      const lot = regularLotteries.find(l => l.id === lotId);
      if (!lot) return;
      srcPlays.forEach((p, i) => {
        let resolvedId = lotId;
        let resolvedName = lot.name;
        duplicated.push({
          ...p,
          id: `dup-${Date.now()}-${lotId}-${i}`,
          lotteryId: resolvedId,
          lotteryName: resolvedName,
          type: p.type || 'directo',
        });
      });
    });
    window.dispatchEvent(new CustomEvent('nmv:scan-duplicate', { detail: duplicated }));
    setDone(true);
    setTimeout(() => { reset(); onClose(); }, 1400);
  };

  const plays = getPlays();
  const statusLabel = (s: string) =>
    s === 'winner' ? '🏆 GANADOR' : s === 'loser' ? 'PERDEDOR' : 'PENDIENTE';
  const statusColor = (s: string) =>
    s === 'winner' ? '#16a34a' : s === 'loser' ? '#dc2626' : '#64748b';

  return (
    <ModalWrapper open={open} onClose={onClose} title="Duplicar Ticket">
      <div style={{ minWidth: 340, maxWidth: 520 }}>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', gap: 3, marginBottom: 16,
          background: '#f1f5f9', borderRadius: 10, padding: 4,
        }}>
          {[
            { id: 'code', icon: <Keyboard size={13}/>, label: 'Últimos 4 dígitos' },
            { id: 'qr',   icon: <QrCode size={13}/>,   label: 'Escanear QR'       },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as 'code' | 'qr')} style={{
              flex: 1, height: 36, border: 'none', borderRadius: 7,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? '#0D9488' : '#64748b',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── Search row ── */}
        {tab === 'code' ? (
          <>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, padding: '7px 12px', background: '#f0fffe', borderRadius: 8, borderLeft: '3px solid #0D9488', lineHeight: 1.5 }}>
              💡 Ingresa los <strong>últimos 4 dígitos</strong> del ticket.<br/>
              Ej: ticket <code>NMV-001-000000028</code> → escribe <strong>0028</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value.slice(0, 20).toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && searchTicket(input)}
                placeholder="Ej: 0028"
                maxLength={20}
                style={{
                  flex: 1, height: 50, padding: '0 16px',
                  border: '2px solid #e2e8f0', borderRadius: 10,
                  fontSize: 22, fontWeight: 800, letterSpacing: '0.18em',
                  outline: 'none', textAlign: 'center',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#0D9488'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button onClick={() => searchTicket(input)} disabled={loading || !input.trim()} style={{
                height: 50, padding: '0 20px',
                background: loading || !input.trim() ? '#94a3b8' : 'linear-gradient(135deg,#0D9488,#0891B2)',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'background 0.15s',
              }}>
                {loading ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
                Buscar
              </button>
            </div>
          </>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8, lineHeight: 1.5 }}>
              Escanea el QR del ticket. El código se pegará automáticamente:
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={qrRef}
                type="text"
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && qrInput && searchTicket(qrInput)}
                placeholder="Resultado del scan QR..."
                style={{
                  flex: 1, height: 46, padding: '0 14px',
                  border: '2px solid #0D9488', borderRadius: 10,
                  fontSize: 13, outline: 'none', background: '#f0fffe',
                }}
                autoComplete="off"
              />
              <button onClick={() => qrInput && searchTicket(qrInput)} disabled={loading || !qrInput.trim()} style={{
                height: 46, padding: '0 18px',
                background: !qrInput.trim() ? '#94a3b8' : 'linear-gradient(135deg,#0D9488,#0891B2)',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: loading || !qrInput.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {loading ? <Loader2 size={16} className="animate-spin"/> : <QrCode size={16}/>}
                Buscar
              </button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            color: '#dc2626', fontSize: 13, marginBottom: 12,
            padding: '10px 14px', background: '#fef2f2',
            borderRadius: 8, border: '1px solid #fecaca',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <X size={14} style={{ flexShrink: 0 }}/>
            {error}
          </div>
        )}

        {/* ── Found ticket card ── */}
        {found && !done && (
          <>
            <div style={{
              background: 'linear-gradient(135deg,#f8fafc,#f0fffe)',
              border: '2px solid #0D9488',
              borderRadius: 12, padding: '14px 16px', marginBottom: 14,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: 16 }}>
                  #{found.ticket_number}
                </span>
                <span style={{
                  fontWeight: 700, fontSize: 11, color: statusColor(found.status),
                  background: `${statusColor(found.status)}18`,
                  padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase',
                  border: `1px solid ${statusColor(found.status)}44`,
                }}>
                  {statusLabel(found.status)}
                </span>
              </div>

              {/* Plays list */}
              {plays.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                  Sin jugadas disponibles
                </p>
              ) : (
                <div style={{ maxHeight: 140, overflowY: 'auto' }}>
                  {plays.map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 12, color: '#475569',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: regularLotteries.find(l => l.id === p.lotteryId || l.name === p.lotteryName)?.color || '#0D9488',
                        }}/>
                        {p.lotteryName || '—'} · <strong>{p.numbers}</strong>
                        {p.type && <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}> ({p.type})</span>}
                      </span>
                      <span style={{ fontWeight: 700, color: '#0D9488' }}>${p.amount?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div style={{
                marginTop: 10, paddingTop: 8, borderTop: '2px solid #0D948844',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                  {plays.length} jugada{plays.length !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#0D9488' }}>
                  ${getTotalAmount().toFixed(2)}
                </span>
              </div>
            </div>

            {/* ── Lottery selector ── */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Copy size={13} style={{ color: '#0D9488' }}/>
                Duplicar a estas loterias:
                {selectedLots.length > 0 && (
                  <span style={{ background: '#0D9488', color: '#fff', borderRadius: 12, fontSize: 10, fontWeight: 900, padding: '1px 7px' }}>
                    {selectedLots.length}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {openLotteries.map(lot => {
                  const sel = selectedLots.includes(lot.id);
                  return (
                    <button
                      key={lot.id}
                      onClick={() => toggleLot(lot.id)}
                      style={{
                        padding: '5px 12px',
                        border: sel ? `2px solid ${lot.color || '#0D9488'}` : '2px solid #e2e8f0',
                        borderRadius: 20, fontSize: 11, fontWeight: sel ? 700 : 500,
                        background: sel ? `${lot.color || '#0D9488'}18` : '#f8fafc',
                        color: sel ? (lot.color || '#0D9488') : '#64748b',
                        cursor: 'pointer', transition: 'all 0.12s',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      {sel && <CheckCircle size={11} />}
                      {lot.name}
                    </button>
                  );
                })}
              </div>
              {selectedLots.length === 0 && (
                <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>
                  ⚠ Selecciona al menos una lotería
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Success ── */}
        {done && (
          <div style={{
            padding: '18px', background: '#f0fdf4', border: '2px solid #86efac',
            borderRadius: 12, textAlign: 'center', marginBottom: 14,
          }}>
            <CheckCircle size={32} style={{ color: '#16a34a', margin: '0 auto 8px' }}/>
            <p style={{ color: '#16a34a', fontWeight: 800, fontSize: 16 }}>✓ Jugadas cargadas en pantalla</p>
            <p style={{ color: '#4ade80', fontSize: 12, marginTop: 4 }}>
              {selectedLots.length} loter{selectedLots.length === 1 ? 'ía' : 'ías'} · {plays.length * selectedLots.length} jugadas
            </p>
          </div>
        )}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 8 }}>
          {found && !done && plays.length > 0 && (
            <button
              onClick={handleDuplicate}
              disabled={selectedLots.length === 0}
              style={{
                flex: 2, height: 46,
                background: selectedLots.length === 0
                  ? '#94a3b8'
                  : 'linear-gradient(135deg,#0D9488,#0891B2)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: selectedLots.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'background 0.15s',
              }}
            >
              <Copy size={16}/>
              Duplicar Jugadas
              {selectedLots.length > 1 && (
                <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 12, padding: '1px 8px', fontSize: 11 }}>
                  ×{selectedLots.length}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => { reset(); onClose(); }}
            style={{
              flex: found && !done ? 1 : 2,
              height: 46, background: '#64748b', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#475569')}
            onMouseLeave={e => (e.currentTarget.style.background = '#64748b')}
          >
            Cancelar
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
