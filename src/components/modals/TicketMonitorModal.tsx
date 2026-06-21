import { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, XCircle, MessageCircle, Printer } from 'lucide-react';
import TicketPrintModal from '@/components/TicketPrintModal';
import { printTicketWindow } from '@/components/TicketPrintModal';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrencyLong } from '@/lib/utils';
import type { Ticket, TicketStatus } from '@/types';
import { supabase } from '@/lib/supabase';

type ExtendedTicket = Ticket & {
  prize?: number;
  cancelledAt?: string;
  clientName?: string;
  clientPhone?: string;
  clientType?: string;
};

interface TicketMonitorModalProps {
  open: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'winner' | 'pending' | 'loser' | 'cancelled' | 'partial_payment';

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all',             label: 'Todos' },
  { key: 'winner',          label: 'Ganadores' },
  { key: 'pending',         label: 'Pendientes' },
  { key: 'loser',           label: 'Perdedores' },
  { key: 'partial_payment', label: 'Pago Parcial' },
  { key: 'cancelled',       label: 'Cancelado' },
];

// Item 8: Colores por estado
// Gris=pendiente | Azul=ganador | Rojo=perdedor | Verde=pago parcial
const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  winner:          { bg: '#1565C0', color: '#ffffff', label: 'Ganador 🏆' },
  pending:         { bg: '#e0e0e0', color: '#616161', label: 'Pendiente' },
  loser:           { bg: '#c62828', color: '#ffffff', label: 'Perdedor' },
  cancelled:       { bg: '#757575', color: '#ffffff', label: 'Cancelado' },
  paid:            { bg: '#0277BD', color: '#ffffff', label: 'Pagado ✓' },
  partial_payment: { bg: '#2e7d32', color: '#ffffff', label: 'Pago Parcial' },
};

function getVendorPin() {
  return localStorage.getItem('nmv_vendor_pin') || '1234';
}

/** Build minimal thermal HTML for reprinting from the monitor.
 *  Item 16: NO barcode, NO verification code on reprints. */
function buildReprintHTML(t: ExtendedTicket): string {
  const plays = (t.plays || []).map(p =>
    `<tr><td>${p.lotteryName||p.lotteryId||'SORTEO'}</td><td>${p.numbers}</td><td style="text-align:right">${p.amount.toFixed(2)}</td></tr>`
  ).join('');
  return `<div class="ticket-receipt">
    <div class="tkt-header">NMV LOTTERY</div>
    ${t.vendorName ? `<div class="tkt-center">${t.vendorName}</div>` : ''}
    <div class="tkt-type">** COPIA **</div>
    <hr class="tkt-sep">
    <div class="tkt-info">Ticket: <b>${t.ticketNumber}</b></div>
    <div class="tkt-info">[CÓDIGO NO DISPONIBLE EN COPIA]</div>
    <hr class="tkt-sep">
    <table style="width:100%;font-size:13px;font-weight:bold;border-collapse:collapse;margin:4px 0">
      <thead><tr><th style="text-align:left">Lotería</th><th style="text-align:left">Núm</th><th style="text-align:right">$</th></tr></thead>
      <tbody>${plays}</tbody>
    </table>
    <hr class="tkt-sep">
    <div class="tkt-total">TOTAL: ${t.totalAmount.toFixed(2)}</div>
    <hr class="tkt-sep">
    <div class="tkt-footer">NMV Lottery · Reimpresión</div>
  </div>`;
}

export default function TicketMonitorModal({ open, onClose }: TicketMonitorModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [search, setSearch]             = useState('');
  const [tickets, setTickets]           = useState<ExtendedTicket[]>([]);
  const [currentPage, setCurrentPage]   = useState(1);
  const [selectedDate, setSelectedDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; });
  const [loadingTickets, setLoadingTickets] = useState(false);
  const itemsPerPage = 20;

  const loadFromSupabase = useCallback(async (date?: string) => {
    const businessId = localStorage.getItem('nmv_business_id') || '';
    if (!businessId) return;
    const queryDate = date || selectedDate;
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', `${queryDate}T00:00:00`)
        .lte('created_at', `${queryDate}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(500);
      if (!error && data) {
        setTickets(data.map(row => {
          const meta = (row.metadata as Record<string, unknown>) || {};
          return {
            id: row.id,
            ticketNumber: String(row.ticket_number || ''),
            plays: (meta.plays as ExtendedTicket['plays']) || [],
            totalAmount: Number(meta.total_amount ?? row.amount ?? 0),
            status: row.status || 'pending',
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            vendorId: row.vendor_id || '',
            vendorName: String(meta.vendor_name || ''),
            verificationCode: row.verification_code || '',
            prize: Number(row.prize_amount ?? 0),
            clientName:  meta.client_name  as string | undefined,
            clientPhone: meta.client_phone as string | undefined,
            clientType:  meta.client_type  as string | undefined,
          } as ExtendedTicket;
        }));
      }
    } catch (err) {
      console.warn('TicketMonitor load error:', err);
    } finally {
      setLoadingTickets(false);
    }
  }, [selectedDate]);

  useEffect(() => { if (open) loadFromSupabase(); }, [open, selectedDate, loadFromSupabase]);

  // ── Sub-overlay state ──────────────────────────────────────────────────────
  const [previewTicket,  setPreviewTicket]  = useState<ExtendedTicket | null>(null);
  const [cancelTicket,   setCancelTicket]   = useState<ExtendedTicket | null>(null);
  const [cancelPin,      setCancelPin]      = useState('');
  const [cancelPinError, setCancelPinError] = useState(false);
  const [deleteTicket,   setDeleteTicket]   = useState<ExtendedTicket | null>(null);
  const [waTicket,       setWaTicket]       = useState<ExtendedTicket | null>(null);
  const [waPhone,        setWaPhone]        = useState('');
  // Printer: opens TicketPrintModal with full ticket (identical to original)
  const [printPreview,   setPrintPreview]   = useState<ExtendedTicket | null>(null);

  // Confirm cancel — validates PIN then marks as cancelled in Supabase
  const handleConfirmCancel = useCallback(() => {
    if (!cancelTicket) return;
    if (cancelPin !== getVendorPin()) { setCancelPinError(true); return; }
    const id = cancelTicket.id;
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' as TicketStatus } : t));
    supabase.from('tickets').update({ status: 'cancelled' }).eq('id', id).then(() => {});
    setCancelTicket(null);
    setCancelPin('');
    setCancelPinError(false);
  }, [cancelTicket, cancelPin]);

  // Confirm delete — permanently removes ticket from Supabase
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTicket) return;
    const id = deleteTicket.id;
    setTickets(prev => prev.filter(t => t.id !== id));
    await supabase.from('tickets').delete().eq('id', id);
    setDeleteTicket(null);
  }, [deleteTicket]);

  // ESC key
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (previewTicket) { setPreviewTicket(null); return; }
      if (cancelTicket)  { setCancelTicket(null); return; }
      if (waTicket)      { setWaTicket(null); return; }
      onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [previewTicket, cancelTicket, waTicket, onClose]);

  const filteredTickets = useMemo(() => {
    let r = tickets;
    if (activeFilter !== 'all') r = r.filter(t => t.status === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(t => t.ticketNumber.toLowerCase().includes(q) || t.vendorName?.toLowerCase().includes(q));
    }
    return r;
  }, [tickets, activeFilter, search]);

  const paginatedTickets = useMemo(() => {
    const s = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(s, s + itemsPerPage);
  }, [filteredTickets, currentPage]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tickets.length };
    for (const t of tickets) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tickets]);

  const stats = useMemo(() => ({
    // #7: total excluye cancelados
    total:   tickets.filter(t => t.status !== 'cancelled').reduce((s, t) => s + t.totalAmount, 0),
    prizes:  tickets.reduce((s, t) => s + (t.prize || 0), 0),
    // #8: pendiente = $0 si no hay ganadores en el día
    pending: tickets.some(t => t.status === 'winner')
      ? tickets.filter(t => t.status === 'pending').reduce((s, t) => s + t.totalAmount, 0)
      : 0,
  }), [tickets]);

  const badge = (status: TicketStatus) => {
    const s = statusStyles[status] || statusStyles.pending;
    return <span style={{ backgroundColor:s.bg, color:s.color, padding:'4px 10px', borderRadius:12, fontSize:12, fontWeight:500 }}>{s.label}</span>;
  };

  const fmtDate = (d: Date | string) => {
    try { return format(typeof d === 'string' ? new Date(d) : d, 'dd/MM/yyyy hh:mm a', { locale: es }); }
    catch { return '-'; }
  };

  if (!open) return null;

  // ── Render: direct createPortal to body (NO Radix, NO motion transforms on wrapper) ──
  return createPortal(
    <>
      {/* ═══ MAIN MODAL ═══════════════════════════════════════════════════════ */}
      <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {/* Backdrop */}
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} onClick={onClose} />

        {/* Content box — NO transforms so fixed children work correctly */}
        <div style={{ position:'relative', zIndex:1, background:'#fff', borderRadius:8, boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxWidth:900, width:'calc(100% - 2rem)', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
          {/* Header */}
          <div style={{ padding:'12px 20px', borderBottom:'1px solid #e0e0e0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:12, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18, fontWeight:600, color:'#333' }}>Monitor de tickets</span>
              {loadingTickets && <span style={{ fontSize:11, color:'#9ca3af' }}>Cargando...</span>}
            </div>
            {/* Date picker */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => { const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; setSelectedDate(today); }}
                style={{ padding:'5px 12px', fontSize:12, borderRadius:6, border:'1px solid #d1d5db',
                  background: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() === selectedDate ? '#0D9488' : '#f5f5f5',
                  color: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() === selectedDate ? '#fff' : '#374151',
                  cursor:'pointer', fontWeight:600 }}>
                Hoy
              </button>
              <input type="date" value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                style={{ height:32, border:'1px solid #d1d5db', borderRadius:6, padding:'0 8px', fontSize:13, color:'#374151', cursor:'pointer' }}
              />
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#777', lineHeight:1, padding:'4px 8px' }}>×</button>
          </div>

          {/* Body */}
          <div style={{ overflowY:'auto', padding:20, flex:1 }}>

            {/* Filter tabs */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
              {filterTabs.map(tab => (
                <button key={tab.key} onClick={() => { setActiveFilter(tab.key); setCurrentPage(1); }}
                  style={{ padding:'6px 14px', fontSize:13, borderRadius:20, cursor:'pointer',
                    backgroundColor: activeFilter === tab.key ? '#337ab7' : '#f5f5f5',
                    color: activeFilter === tab.key ? '#fff' : '#555',
                    border: `1px solid ${activeFilter === tab.key ? '#337ab7' : '#e0e0e0'}` }}>
                  {tab.label} ({counts[tab.key] || 0})
                </button>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
              {[
                { label:'Monto total:',           value: stats.total },
                { label:'Total de premios:',       value: stats.prizes },
                { label:'Total pendiente de pago:', value: stats.pending },
              ].map((c, i) => (
                <div key={i} style={{ background:'#f9f9f9', border:'1px solid #e0e0e0', borderRadius:6, padding:14 }}>
                  <div style={{ fontSize:11, color:'#777', marginBottom:4 }}>{c.label}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:'#333' }}>{formatCurrencyLong(c.value)}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <input type="text" placeholder="Buscar..." value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ height:36, width:240, border:'1px solid #ccc', borderRadius:4, padding:'0 12px', marginBottom:12, fontSize:14 }}
            />

            {/* Table */}
            <div style={{ border:'1px solid #e0e0e0', borderRadius:6, overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f5f5f5', borderBottom:'1px solid #e0e0e0' }}>
                      {['Número','Fecha','Vendedor','Cliente','Monto','Premio','Estado','Acciones'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', fontWeight:600, color:'#555', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTickets.map((t, idx) => (
                      <tr key={t.id} style={{ background: idx%2===0?'#fff':'#f9f9f9', borderBottom:'1px solid #f0f0f0' }}>
                        <td style={{ padding:'10px 12px', whiteSpace:'nowrap' }}>{t.ticketNumber}</td>
                        <td style={{ padding:'10px 12px', whiteSpace:'nowrap' }}>{fmtDate(t.createdAt)}</td>
                        <td style={{ padding:'10px 12px', fontSize:12 }}>{t.vendorName || '-'}</td>
                        <td style={{ padding:'8px 12px', whiteSpace:'nowrap' }}>
                          {t.clientName ? <span style={{ fontWeight:600, fontSize:12 }}>{t.clientName}</span>
                            : <span style={{ color:'#bbb', fontSize:11 }}>—</span>}
                        </td>
                        <td style={{ padding:'10px 12px', textAlign:'right', whiteSpace:'nowrap' }}>{formatCurrencyLong(t.totalAmount)}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', whiteSpace:'nowrap' }}>{formatCurrencyLong(t.prize || 0)}</td>
                        <td style={{ padding:'10px 12px', textAlign:'center' }}>{badge(t.status)}</td>
                        <td style={{ padding:'10px 12px', textAlign:'center' }}>
                          <div style={{ display:'flex', gap:4, justifyContent:'center', alignItems:'center' }}>
                            <button onClick={() => setPreviewTicket(t)} title="Ver ticket"
                              style={{ padding:4, background:'none', border:'none', cursor:'pointer', borderRadius:4 }}>
                              <Eye size={16} color="#337ab7" />
                            </button>
                            <button onClick={() => setPrintPreview(t)} title="Reimprimir (vista idéntica)"
                              style={{ padding:4, background:'none', border:'none', cursor:'pointer', borderRadius:4 }}>
                              <Printer size={16} color="#0D9488" />
                            </button>
                            <button onClick={() => { setWaTicket(t); setWaPhone(t.clientPhone || ''); }} title="WhatsApp"
                              style={{ padding:4, background:'none', border:'none', cursor:'pointer', borderRadius:4 }}>
                              <MessageCircle size={16} color="#25D366" />
                            </button>
                            {t.status !== 'cancelled' && (
                              <button onClick={() => setCancelTicket(t)} title="Cancelar"
                                style={{ padding:4, background:'none', border:'none', cursor:'pointer', borderRadius:4 }}>
                                <XCircle size={16} color="#d9534f" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedTickets.length === 0 && (
                      <tr><td colSpan={8} style={{ padding:24, textAlign:'center', color:'#aaa', fontSize:13 }}>Sin tickets para mostrar</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0' }}>
              <span style={{ fontSize:12, color:'#777' }}>Mostrando {filteredTickets.length} entradas</span>
              {totalPages > 1 && (
                <div style={{ display:'flex', gap:4 }}>
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i+1).map(p => (
                    <button key={p} onClick={() => setCurrentPage(p)}
                      style={{ width:32, height:32, fontSize:13, cursor:'pointer', borderRadius:4,
                        backgroundColor: currentPage===p ? '#337ab7' : '#f5f5f5',
                        color: currentPage===p ? '#fff' : '#555',
                        border: `1px solid ${currentPage===p ? '#337ab7' : '#e0e0e0'}` }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
              <button onClick={onClose} style={{ padding:'8px 20px', fontSize:14, background:'#f5f5f5', border:'1px solid #ccc', borderRadius:4, cursor:'pointer' }}>
                Cerrar
              </button>
            </div>

          </div>{/* /Body */}
        </div>{/* /Content box */}
      </div>

      {/* ═══ PREVIEW OVERLAY ══════════════════════════════════════════════════ */}
      {previewTicket && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setPreviewTicket(null)}>
          <motion.div initial={{opacity:0,scale:0.93}} animate={{opacity:1,scale:1}} transition={{duration:0.15}}
            style={{ background:'#fff', borderRadius:12, width:'min(480px,92vw)', maxHeight:'80vh', overflowY:'auto', padding:20, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, borderBottom:'2px solid #0D9488', paddingBottom:10 }}>
              <div>
                <div style={{ fontSize:9, color:'#888', letterSpacing:2, textTransform:'uppercase' }}>NMV Lottery</div>
                <div style={{ fontSize:16, fontWeight:800, color:'#333' }}>#{previewTicket.ticketNumber}</div>
              </div>
              <button onClick={() => setPreviewTicket(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#999' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px', marginBottom:14, fontSize:12 }}>
              <div><span style={{color:'#888'}}>Fecha: </span><b>{fmtDate(previewTicket.createdAt)}</b></div>
              <div><span style={{color:'#888'}}>Vendedor: </span><b>{previewTicket.vendorName || '-'}</b></div>
              <div><span style={{color:'#888'}}>Estado: </span>{badge(previewTicket.status)}</div>
              <div><span style={{color:'#888'}}>Total: </span><b style={{color:'#0D9488',fontSize:14}}>${previewTicket.totalAmount.toFixed(2)}</b></div>
              {(previewTicket.prize ?? 0) > 0 && (
                <div><span style={{color:'#888'}}>Premio: </span><b style={{color:'#e6b800',fontSize:14}}>${previewTicket.prize?.toFixed(2)}</b></div>
              )}
            </div>
            {previewTicket.plays && previewTicket.plays.length > 0 ? (
              <div style={{ border:'1px solid #e0e0e0', borderRadius:6, overflow:'hidden', marginBottom:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 80px', background:'#f5f5f5', padding:'6px 10px', fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase' }}>
                  <span>Lotería</span><span>Número</span><span>Tipo</span><span style={{textAlign:'right'}}>$</span>
                </div>
                {previewTicket.plays.map((p, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 80px', padding:'7px 10px', borderTop:'1px solid #f0f0f0', fontSize:12, background:i%2===0?'#fff':'#fafafa' }}>
                    <span style={{fontSize:11,color:'#555'}}>{p.lotteryName || p.lotteryId}</span>
                    <b style={{color:'#222'}}>{p.numbers}</b>
                    <span style={{textTransform:'uppercase',fontSize:11}}>{p.type}</span>
                    <span style={{textAlign:'right',fontWeight:700,color:'#0D9488'}}>${p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : <p style={{textAlign:'center',color:'#bbb',fontSize:12}}>Sin jugadas detalladas</p>}
            <button onClick={() => { setPreviewTicket(null); setWaTicket(previewTicket); setWaPhone(''); }}
              style={{ width:'100%', padding:10, borderRadius:8, background:'#25D366', color:'#fff', fontWeight:700, fontSize:13, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <MessageCircle size={16}/> Enviar por WhatsApp
            </button>
          </motion.div>
        </div>
      )}

      {/* ═══ CANCEL WARNING OVERLAY (con PIN) #9 ═════════════════════════════ */}
      {cancelTicket && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => { setCancelTicket(null); setCancelPin(''); setCancelPinError(false); }}>
          <motion.div initial={{opacity:0,scale:0.93}} animate={{opacity:1,scale:1}} transition={{duration:0.15}}
            style={{ background:'#fff', borderRadius:14, width:'min(340px,90vw)', padding:28, boxShadow:'0 20px 60px rgba(0,0,0,0.35)', textAlign:'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔐</div>
            <h3 style={{ margin:'0 0 8px', color:'#d9534f', fontSize:19, fontWeight:800 }}>Cancelar Ticket</h3>
            <p style={{ margin:'0 0 4px', fontSize:14, color:'#555' }}>Ticket: <b style={{color:'#222'}}>{cancelTicket.ticketNumber}</b></p>
            <p style={{ margin:'0 0 16px', fontSize:14, color:'#555' }}>Monto: <b style={{color:'#0D9488'}}>${cancelTicket.totalAmount.toFixed(2)}</b></p>
            {/* PIN input */}
            <div style={{ marginBottom:16, textAlign:'left' }}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:6 }}>
                🔑 Ingrese su PIN para confirmar
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={cancelPin}
                autoFocus
                onChange={e => { setCancelPin(e.target.value.replace(/\D/g,'')); setCancelPinError(false); }}
                onKeyDown={e => { if (e.key === 'Enter') handleConfirmCancel(); }}
                placeholder="••••"
                style={{
                  width:'100%', padding:'10px 14px', borderRadius:8, boxSizing:'border-box',
                  border: `2px solid ${cancelPinError ? '#d9534f' : '#e0e0e0'}`,
                  fontSize:20, letterSpacing:8, textAlign:'center',
                  outline:'none', color:'#222', fontWeight:700,
                  background: cancelPinError ? '#fff5f5' : '#fafafa',
                }}
              />
              {cancelPinError && (
                <p style={{ margin:'6px 0 0', fontSize:13, color:'#d9534f', fontWeight:700 }}>❌ PIN incorrecto. Intente de nuevo.</p>
              )}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setCancelTicket(null); setCancelPin(''); setCancelPinError(false); }}
                style={{ flex:1, padding:'11px 0', borderRadius:10, background:'#f5f5f5', border:'1px solid #ddd', cursor:'pointer', fontSize:14, fontWeight:600, color:'#666' }}>
                Cancelar
              </button>
              <button onClick={handleConfirmCancel} disabled={cancelPin.length < 4}
                style={{ flex:1, padding:'11px 0', borderRadius:10, background: cancelPin.length >= 4 ? '#d9534f' : '#ccc', border:'none', cursor: cancelPin.length >= 4 ? 'pointer' : 'not-allowed', fontSize:14, fontWeight:800, color:'#fff' }}>
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ═══ WHATSAPP OVERLAY ════════════════════════════════════════════════ */}
      {waTicket && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setWaTicket(null)}>
          <motion.div initial={{opacity:0,scale:0.93}} animate={{opacity:1,scale:1}} transition={{duration:0.15}}
            style={{ background:'#fff', borderRadius:14, width:'min(360px,90vw)', padding:24, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:36, marginBottom:6 }}>💬</div>
              <h3 style={{ margin:0, color:'#25D366', fontSize:17, fontWeight:800 }}>Enviar por WhatsApp</h3>
              <p style={{ margin:'6px 0 0', fontSize:13, color:'#666' }}>Ticket: <b>{waTicket.ticketNumber}</b></p>
            </div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:6 }}>
              Número (con código de país)
            </label>
            <input type="tel" value={waPhone}
              onChange={e => setWaPhone(e.target.value.replace(/\D/g,''))}
              placeholder="18095551234"
              autoFocus
              style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e0e0e0', fontSize:14, boxSizing:'border-box', marginBottom:14, outline:'none' }}
            />
            <button disabled={waPhone.length < 7}
              onClick={() => {
                const plays = waTicket.plays?.map(p => `${p.numbers}(${p.type}) $${p.amount.toFixed(2)}`).join(', ') || 'Sin jugadas';
                const msg   = `🎰 *NMV Lottery*\n*Ticket:* ${waTicket.ticketNumber}\n*Jugadas:* ${plays}\n*Total:* $${waTicket.totalAmount.toFixed(2)}\n\n_NMV Lottery_`;
                window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                setWaTicket(null);
              }}
              style={{ width:'100%', padding:12, borderRadius:10, fontWeight:800, fontSize:14, border:'none', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                background: waPhone.length >= 7 ? '#25D366' : '#ccc',
                color: '#fff',
                cursor: waPhone.length >= 7 ? 'pointer' : 'not-allowed' }}>
              <MessageCircle size={18}/> Enviar ahora
            </button>
            <button onClick={() => setWaTicket(null)}
              style={{ width:'100%', padding:8, borderRadius:8, background:'#f5f5f5', border:'1px solid #ddd', cursor:'pointer', fontSize:13, color:'#666' }}>
              Cancelar
            </button>
          </motion.div>
        </div>
      )}
      {/* ═══ TICKET PRINT MODAL — siempre COPIA al reimprimir desde monitor ══ */}
      <TicketPrintModal
        ticket={printPreview as any}
        onClose={() => setPrintPreview(null)}
        clientPhone={(printPreview as any)?.clientPhone}
        forceReprint={true}
      />
    </>,
    document.body
  );
}
