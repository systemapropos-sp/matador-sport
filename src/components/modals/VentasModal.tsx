import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, RefreshCw, TrendingUp, TrendingDown, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { printTicketWindow } from '@/components/TicketPrintModal';
import { useModalContext } from './ModalContext';
import { useAccounting } from '@/hooks/useAccounting';
import { useVendedores } from '@/hooks/useVendedores';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type TabType = 'ventas' | 'comparaciones';

interface TicketRow {
  id: string;
  ticketNumber: string;
  totalAmount: number;
  prizeAmount: number;
  status: string;
  createdAt: string;
  lotteryName: string;
  plays: any[];
  vendorName: string;
}

interface SorteoTotal {
  name: string;
  venta: number;
  comisiones: number;
  premios: number;
  neto: number;
}

export default function VentasModal() {
  const { closeModal } = useModalContext();
  const { getTotals, refresh } = useAccounting();
  const { activeVendedor } = useVendedores();
  const [tab, setTab] = useState<TabType>('ventas');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const vendorId = localStorage.getItem('nmv_vendor_id');
  const businessId = localStorage.getItem('nmv_business_id');

  // Load tickets for selected date — fallback to businessId if no vendorId
  useEffect(() => {
    const bid = vendorId || businessId;
    if (!bid) return;
    setTicketsLoading(true);
    const start = selectedDate + 'T00:00:00';
    const end = selectedDate + 'T23:59:59';
    const q = supabase
      .from('tickets')
      .select('id, ticket_number, total_amount, status, created_at, lottery_id, metadata')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });
    if (vendorId) q.eq('vendor_id', vendorId);
    else if (businessId) q.eq('business_id', businessId);
    q.then(({ data }) => {
        setTickets(
          (data || []).map((t) => {
            const meta = (t.metadata as Record<string, unknown>) || {};
            return {
              id: t.id,
              ticketNumber: t.ticket_number || t.id.slice(0, 8).toUpperCase(),
              totalAmount: t.total_amount || 0,
              prizeAmount: 0,
              status: t.status || 'active',
              createdAt: t.created_at,
              lotteryName: t.lottery_id || '—',
              plays: (meta.plays as any[]) || [],
              vendorName: (meta.vendor_name as string) || '',
            };
          })
        );
        setTicketsLoading(false);
      });
  }, [vendorId, selectedDate]);

  const totals = getTotals('todos');
  const todayTotals = getTotals('todos', selectedDate, selectedDate);

  // Aggregate by lottery
  const sorteoMap: Record<string, SorteoTotal> = {};
  tickets.forEach((t) => {
    if (!sorteoMap[t.lotteryName]) {
      sorteoMap[t.lotteryName] = { name: t.lotteryName, venta: 0, comisiones: 0, premios: 0, neto: 0 };
    }
    sorteoMap[t.lotteryName].venta += t.totalAmount;
    sorteoMap[t.lotteryName].premios += t.prizeAmount;
    sorteoMap[t.lotteryName].neto = sorteoMap[t.lotteryName].venta - sorteoMap[t.lotteryName].premios;
  });
  const sorteoTotals = Object.values(sorteoMap).sort((a, b) => b.venta - a.venta);

  const ganadores = tickets.filter(
    (t) => t.prizeAmount > 0 || t.status === 'paid'
  );
  const pendientes = tickets.filter((t) => t.status === 'active');
  const ventaTotal = tickets.reduce((s, t) => s + t.totalAmount, 0);
  const premioTotal = tickets.reduce((s, t) => s + t.prizeAmount, 0);
  const neto = ventaTotal - premioTotal;

  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', padding: '2px 0',
  };
  const valueStyle = {
    fontSize: 14, fontWeight: 800, color: '#1a1a1a',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '12px 8px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <motion.div
        initial={{ y: 20, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%', maxWidth: 700,
          backgroundColor: '#fff', borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ backgroundColor: '#1a1a1a', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Reporte de ventas</span>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['ventas', 'comparaciones'] as TabType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: 'none',
                    cursor: 'pointer', textTransform: 'capitalize',
                    backgroundColor: tab === t ? '#0D9488' : 'rgba(255,255,255,0.1)',
                    color: tab === t ? '#fff' : '#ccc',
                  }}
                >
                  {t === 'ventas' ? 'Ventas' : 'Comparaciones'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid #555', background: 'transparent', color: '#ccc', cursor: 'pointer' }}
            >
              <Printer size={13} /> Imprimir
            </button>
            <button
              onClick={() => { refresh(); setSelectedDate(selectedDate); }}
              style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4 }}
            >
              <RefreshCw size={16} />
            </button>
            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Date Picker */}
        <div style={{ padding: '10px 18px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>Fecha:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 8px', fontSize: 13, fontWeight: 600, color: '#333' }}
          />
          <span style={{ fontSize: 12, color: '#888' }}>
            {activeVendedor?.name || 'Vendedor'} · {businessId?.slice(0, 8) || '—'}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'ventas' ? (
            <motion.div key="ventas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '16px 18px' }}>

              {/* RESUMEN DE VENTA */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#333', marginBottom: 8, textAlign: 'center', borderBottom: '2px solid #0D9488', paddingBottom: 4 }}>
                  Resumen de venta
                </div>
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#555' }}>Balance a la fecha: </span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: neto >= 0 ? '#0D9488' : '#d9534f' }}>
                    {formatCurrency(neto)}
                  </span>
                </div>
                {premioTotal > 0 && (
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#888' }}>Monto total de tickets pendientes: </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f0ad4e' }}>
                      {formatCurrency(pendientes.reduce((s, t) => s + t.totalAmount, 0))}
                    </span>
                  </div>
                )}

                {/* Summary grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { label: 'Banco', value: 'NMV LOTTERY' },
                    { label: 'Código', value: businessId?.slice(0, 12) || '—' },
                    { label: 'Pendiente', value: String(pendientes.length) },
                    { label: 'Total tickets', value: String(tickets.length) },
                    { label: 'Ganadores', value: String(ganadores.length) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ backgroundColor: '#f8f9fa', borderRadius: 6, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={labelStyle}>{label}</span>
                      <span style={valueStyle}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOTALES ROW */}
              <div style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Venta total', value: ventaTotal, color: '#0D9488' },
                    { label: 'Premios', value: premioTotal, color: '#d9534f' },
                    { label: 'Neto', value: neto, color: neto >= 0 ? '#5cb85c' : '#d9534f' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color }}>{formatCurrency(value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOTALES POR SORTEO */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#333', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>
                  Totales por sorteo
                </div>
                {ticketsLoading ? (
                  <div style={{ textAlign: 'center', padding: 16, color: '#aaa', fontSize: 13 }}>Cargando...</div>
                ) : sorteoTotals.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 16, color: '#ccc', fontSize: 13 }}>Sin ventas para esta fecha</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                          {['Sorteo', 'Venta total', 'Premios', 'Neto'].map((h) => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#555', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sorteoTotals.map((s, i) => (
                          <tr key={s.name} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '7px 10px', fontWeight: 600, color: '#333' }}>{s.name}</td>
                            <td style={{ padding: '7px 10px', color: '#0D9488', fontWeight: 700 }}>{formatCurrency(s.venta)}</td>
                            <td style={{ padding: '7px 10px', color: '#d9534f', fontWeight: 700 }}>{formatCurrency(s.premios)}</td>
                            <td style={{ padding: '7px 10px', fontWeight: 800, color: s.neto >= 0 ? '#5cb85c' : '#d9534f' }}>
                              {formatCurrency(s.neto)}
                            </td>
                          </tr>
                        ))}
                        {/* Total row */}
                        <tr style={{ backgroundColor: '#1a1a1a', fontWeight: 900 }}>
                          <td style={{ padding: '8px 10px', color: '#fff' }}>TOTAL</td>
                          <td style={{ padding: '8px 10px', color: '#4ade80' }}>{formatCurrency(ventaTotal)}</td>
                          <td style={{ padding: '8px 10px', color: '#f87171' }}>{formatCurrency(premioTotal)}</td>
                          <td style={{ padding: '8px 10px', color: neto >= 0 ? '#4ade80' : '#f87171' }}>{formatCurrency(neto)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ══ TICKETS RECIENTES — con Reimprimir + Cancelar ════════════ */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#333', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 4, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span>Tickets recientes</span>
                  <span style={{ fontSize:11, color:'#888', fontWeight:400 }}>{tickets.length} tickets</span>
                </div>
                {ticketsLoading ? (
                  <div style={{ textAlign:'center', padding:14, color:'#aaa', fontSize:13 }}>Cargando...</div>
                ) : tickets.length === 0 ? (
                  <div style={{ textAlign:'center', padding:14, color:'#ccc', fontSize:13 }}>Sin tickets para esta fecha</div>
                ) : (
                  <div style={{ maxHeight:260, overflowY:'auto', border:'1px solid #e9ecef', borderRadius:8 }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead style={{ position:'sticky', top:0, backgroundColor:'#f3f4f6', zIndex:1 }}>
                        <tr>
                          {['#','Monto','Status','Acciones'].map(h=>(
                            <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontWeight:700, color:'#555', fontSize:11, textTransform:'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((t, i) => (
                          <tr key={t.id} style={{ borderBottom:'1px solid #f0f0f0', backgroundColor: i%2===0?'#fff':'#fafafa' }}>
                            <td style={{ padding:'7px 10px', fontWeight:700, color:'#333', fontFamily:'monospace', fontSize:12 }}>{t.ticketNumber}</td>
                            <td style={{ padding:'7px 10px', fontWeight:700, color:'#0D9488' }}>{formatCurrency(t.totalAmount)}</td>
                            <td style={{ padding:'7px 10px' }}>
                              <span style={{
                                fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:8,
                                background: t.status==='cancelled' ? '#FFEBEE' : t.status==='paid' ? '#E8F5E9' : t.status==='winner' ? '#E3F2FD' : '#F5F5F5',
                                color: t.status==='cancelled' ? '#C62828' : t.status==='paid' ? '#2E7D32' : t.status==='winner' ? '#1565C0' : '#666',
                              }}>
                                {t.status==='cancelled' ? 'Cancelado' : t.status==='paid' ? 'Pagado' : t.status==='winner' ? 'Ganador' : 'Activo'}
                              </span>
                            </td>
                            <td style={{ padding:'6px 10px' }}>
                              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                                {/* Reimprimir */}
                                <button
                                  onClick={() => {
                                    // Build ticket with plays from metadata for reprinting
                                    const minTicket = {
                                      ticketNumber: t.ticketNumber,
                                      totalAmount: t.totalAmount,
                                      plays: t.plays,
                                      verificationCode: '',
                                      createdAt: new Date(t.createdAt),
                                      vendorName: t.vendorName,
                                      status: t.status,
                                    };
                                    printTicketWindow(minTicket as any);
                                  }}
                                  title="Reimprimir"
                                  style={{ padding:'4px 8px', borderRadius:6, background:'#E3F2FD', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#1565C0', fontWeight:700 }}>
                                  <Printer size={12}/> Reimp.
                                </button>
                                {/* Cancelar */}
                                {t.status !== 'cancelled' && (
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm(`¿Cancelar ticket ${t.ticketNumber}?`)) return;
                                      await supabase.from('tickets').update({ status:'cancelled' }).eq('id', t.id);
                                      setTickets(prev => prev.map(x => x.id===t.id ? {...x, status:'cancelled'} : x));
                                    }}
                                    title="Cancelar ticket"
                                    style={{ padding:'4px 8px', borderRadius:6, background:'#FFEBEE', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#C62828', fontWeight:700 }}>
                                    <XCircle size={12}/> Cancel.
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* TICKETS GANADORES */}
              {ganadores.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#333', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>
                    Tickets ganadores
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f3f4f6', zIndex: 1 }}>
                        <tr>
                          {['Fecha', 'Número ticket', 'A pagar', 'Pagado'].map((h) => (
                            <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: '#555', fontSize: 11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ganadores.map((t) => (
                          <tr key={t.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '6px 8px', color: '#888' }}>{t.createdAt.slice(0, 10)}</td>
                            <td style={{ padding: '6px 8px', fontWeight: 700, color: '#333', fontFamily: 'monospace' }}>{t.ticketNumber}</td>
                            <td style={{ padding: '6px 8px', color: '#0D9488', fontWeight: 700 }}>{formatCurrency(t.prizeAmount)}</td>
                            <td style={{ padding: '6px 8px' }}>
                              {t.status === 'paid'
                                ? <CheckCircle2 size={16} color="#5cb85c" />
                                : <Circle size={16} color="#ccc" />
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </motion.div>
          ) : (
            /* COMPARACIONES TAB */
            <motion.div key="comp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '16px 18px' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#333', marginBottom: 12 }}>Comparación de períodos</div>
              </div>
              {[
                { label: 'Hoy', data: todayTotals, color: '#0D9488' },
                { label: 'Total histórico', data: totals, color: '#333' },
              ].map(({ label, data, color }) => (
                <div key={label} style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 8 }}>{label}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    {[
                      { l: 'Generado', v: data.totalGenerado, icon: <TrendingUp size={12} color="#0D9488" /> },
                      { l: 'Premios', v: data.totalPremios, icon: <TrendingDown size={12} color="#d9534f" /> },
                      { l: 'Renta', v: data.totalRenta, icon: null },
                      { l: 'Neto', v: data.neto, icon: null },
                    ].map(({ l, v, icon }) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{l}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: v >= 0 ? '#333' : '#d9534f' }}>{formatCurrency(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
