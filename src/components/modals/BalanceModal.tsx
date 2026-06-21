import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Trash2,
  Lock,
  Check,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Calendar,
  X,
} from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { useBalance } from '@/hooks/useBalance';
import type { BalanceSummary } from '@/hooks/useBalance';

const cardColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  green: { bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9', icon: '#4CAF50' },
  red:   { bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2', icon: '#EF5350' },
  blue:  { bg: '#E3F2FD', text: '#1565C0', border: '#BBDEFB', icon: '#42A5F5' },
  gold:  { bg: '#FFF8E1', text: '#F57F17', border: '#FFECB3', icon: '#FFB300' },
};

function SummaryCard({ label, value, colorKey, icon }: {
  label: string; value: string; colorKey: string; icon: React.ReactNode;
}) {
  const c = cardColors[colorKey] || cardColors.blue;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 rounded-lg"
      style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, padding: '12px 14px', minWidth: 0 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: c.icon }}>{icon}</span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: c.text, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </motion.div>
  );
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function BalanceModal() {
  const { closeModal }  = useModalContext();
  const { transactions, summary, registerAbono, registerRetiro, clearTransactions } = useBalance();

  // ── Per-vendor breakdown from localStorage ─────────────────────────
  const byVendorStats = useMemo(() => {
    try {
      const raw = localStorage.getItem('matador_tickets');
      if (!raw) return {};
      const tickets: Array<{ totalAmount?: number; vendorName?: string; createdAt?: string }> = JSON.parse(raw);
      const _d = new Date(); const today = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;
      const result: Record<string, { tickets: number; total: number; today: number }> = {};
      for (const t of tickets) {
        const vname = t.vendorName || 'Sin vendedor';
        if (!result[vname]) result[vname] = { tickets: 0, total: 0, today: 0 };
        result[vname].tickets += 1;
        result[vname].total += Number(t.totalAmount || 0);
        if (t.createdAt && t.createdAt.slice(0, 10) === today) result[vname].today += Number(t.totalAmount || 0);
      }
      return result;
    } catch { return {}; }
  }, []);

  // ── Item 11: Date range filter state ────────────────────────────────
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) return transactions;
    return transactions.filter(tx => {
      const d = tx.date.slice(0, 10);
      if (startDate && d < startDate) return false;
      if (endDate   && d > endDate)   return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  // ── Item 13: Summary recomputed from filtered transactions ──────────
  const filteredSummary = useMemo<BalanceSummary>(() => {
    const totalSales   = filteredTransactions.filter(t => t.type === 'venta').reduce((s,t) => s+t.amount, 0);
    const totalPrizes  = filteredTransactions.filter(t => t.type === 'premio').reduce((s,t) => s+t.amount, 0);
    const totalAbonos  = filteredTransactions.filter(t => t.type === 'abono').reduce((s,t) => s+t.amount, 0);
    const totalRetiros = filteredTransactions.filter(t => t.type === 'retiro').reduce((s,t) => s+t.amount, 0);
    const netBalance   = totalSales - totalPrizes;
    const adminShare   = netBalance * 0.8;
    const vendorShare  = netBalance * 0.2;
    return {
      totalSales, totalPrizes, netBalance, adminShare, vendorShare,
      pendingAdmin:  Math.max(0, adminShare  - totalAbonos),
      pendingVendor: Math.max(0, vendorShare - totalRetiros),
    };
  }, [filteredTransactions]);

  const isFiltered      = !!(startDate || endDate);
  // display = filtered when date range active, otherwise all-time
  const displaySummary  = isFiltered ? filteredSummary : summary;
  // actions always use all-time summary limits
  const actionSummary   = summary;

  // ── UI state ─────────────────────────────────────────────────────────
  const [showAbonoInput,  setShowAbonoInput]  = useState(false);
  const [abonoAmount,     setAbonoAmount]     = useState('');
  const [showRetiroInput, setShowRetiroInput] = useState(false);
  const [retiroAmount,    setRetiroAmount]    = useState('');
  const [showPinInput,    setShowPinInput]    = useState(false);
  const [pin,             setPin]             = useState('');
  const [pinError,        setPinError]        = useState('');
  const [toast,           setToast]           = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleAbono = async () => {
    const amount = parseFloat(abonoAmount);
    if (!amount || amount <= 0) { showToast('Ingrese un monto valido'); return; }
    if (amount > actionSummary.pendingAdmin) { showToast('El monto excede el pendiente'); return; }
    const ok = await registerAbono(amount);
    if (ok) { setAbonoAmount(''); setShowAbonoInput(false); showToast('Abono registrado!'); }
    else showToast('Error al registrar abono');
  };

  const handleRetiro = async () => {
    const amount = parseFloat(retiroAmount);
    if (!amount || amount <= 0) { showToast('Ingrese un monto valido'); return; }
    if (amount > actionSummary.pendingVendor) { showToast('El monto excede el disponible'); return; }
    const ok = await registerRetiro(amount);
    if (ok) { setRetiroAmount(''); setShowRetiroInput(false); showToast('Retiro registrado!'); }
    else showToast('Error al registrar retiro');
  };

  const handlePinVerify = () => {
    const ok = clearTransactions(pin);
    if (ok) { setPin(''); setShowPinInput(false); setPinError(''); showToast('Historial limpiado!'); }
    else { setPinError('PIN incorrecto'); setTimeout(() => setPinError(''), 2000); }
  };

  const txTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
    venta:  { label: 'Venta',  color: '#2E7D32', bg: '#E8F5E9' },
    premio: { label: 'Premio', color: '#C62828', bg: '#FFEBEE' },
    abono:  { label: 'Abono',  color: '#1565C0', bg: '#E3F2FD' },
    retiro: { label: 'Retiro', color: '#F57F17', bg: '#FFF8E1' },
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Balance 80/20" maxWidth="900px">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            className="mb-3 px-3 py-2 rounded-lg text-sm font-medium text-center"
            style={{ backgroundColor:'#E8F5E9', color:'#2E7D32', border:'1px solid #C8E6C9' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Item 11: Date Range Filter ────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: '#f8f9fa', border: '1px solid #e0e0e0' }}>
        <Calendar size={14} color="#888" />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Filtrar por fecha:</span>
        <input
          type="date" value={startDate}
          onChange={e => setStartDate(e.target.value)}
          style={{ height: 32, padding: '0 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, outline: 'none' }}
        />
        <span style={{ fontSize: 12, color: '#888' }}>—</span>
        <input
          type="date" value={endDate}
          onChange={e => setEndDate(e.target.value)}
          style={{ height: 32, padding: '0 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, outline: 'none' }}
        />
        {/* HOY button */}
        <button
          onClick={() => {
            const d = new Date().toISOString().split('T')[0];
            setStartDate(d);
            setEndDate(d);
          }}
          style={{
            height: 32, padding: '0 12px',
            background: '#16a34a', color: '#fff',
            border: 'none', borderRadius: 6,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          HOY
        </button>
        {isFiltered && (
          <button onClick={() => { setStartDate(''); setEndDate(''); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold"
            style={{ background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2' }}>
            <X size={12} /> Limpiar
          </button>
        )}
        {isFiltered && (
          <span style={{ fontSize: 11, color: '#1565C0', fontWeight: 600, background: '#E3F2FD', padding: '3px 8px', borderRadius: 12, border: '1px solid #BBDEFB' }}>
            {filteredTransactions.length} transacciones en rango
          </span>
        )}
      </div>

      {/* ── Summary Cards (Items 11+13: use displaySummary) ────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SummaryCard label="Ventas Totales"  value={formatCurrency(displaySummary.totalSales)}  colorKey="green" icon={<TrendingUp size={16} />} />
        <SummaryCard label="Premios"          value={formatCurrency(displaySummary.totalPrizes)} colorKey="red"   icon={<TrendingDown size={16} />} />
        <SummaryCard label="Balance Neto"     value={formatCurrency(displaySummary.netBalance)}  colorKey="blue"  icon={<Wallet size={16} />} />
        <SummaryCard label="Tu 20%"           value={formatCurrency(displaySummary.vendorShare)} colorKey="gold"  icon={<DollarSign size={16} />} />
      </div>

      {/* ── Per Vendor Breakdown ─────────────────────────────────────── */}
      {Object.keys(byVendorStats).length > 0 && (
        <div className="rounded-lg mb-4" style={{ border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          <div style={{ background: '#0D9488', color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>
            👤 VENTAS POR VENDEDOR
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Object.keys(byVendorStats).length, 2)}, 1fr)`, gap: 1 }}>
            {Object.entries(byVendorStats).map(([vname, vdata]) => (
              <div key={vname} style={{ padding: '10px 14px', background: '#fafafa', borderTop: '1px solid #eee' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#333', marginBottom: 4 }}>{vname}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  <div style={{ textAlign: 'center', background: '#E8F8F5', borderRadius: 6, padding: '4px 6px' }}>
                    <div style={{ fontSize: 9, color: '#666' }}>TICKETS</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0D9488' }}>{vdata.tickets}</div>
                  </div>
                  <div style={{ textAlign: 'center', background: '#E8F8F5', borderRadius: 6, padding: '4px 6px' }}>
                    <div style={{ fontSize: 9, color: '#666' }}>TOTAL</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0D9488' }}>{formatCurrency(vdata.total)}</div>
                  </div>
                  <div style={{ textAlign: 'center', background: '#FFF8E1', borderRadius: 6, padding: '4px 6px' }}>
                    <div style={{ fontSize: 9, color: '#666' }}>HOY</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#F57F17' }}>{formatCurrency(vdata.today)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Distribution 80/20 (uses displaySummary) ─────────────────── */}
      <div className="rounded-lg mb-5" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', padding: '14px 16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#555', marginBottom: '10px', textTransform: 'uppercase' }}>
          Distribucion {isFiltered ? `(${startDate || '…'} → ${endDate || '…'})` : '(Todo el tiempo)'}
        </h4>
        <div className="flex justify-between items-center mb-2">
          <span style={{ fontSize: '13px', color: '#555' }}>Administrador (80%)</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1565C0' }}>{formatCurrency(displaySummary.adminShare)}</span>
        </div>
        <div className="w-full rounded-full mb-2" style={{ height: '8px', backgroundColor: '#e9ecef', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', backgroundColor: '#42A5F5', borderRadius: '9999px' }} />
        </div>
        <div className="flex justify-between items-center">
          <span style={{ fontSize: '13px', color: '#555' }}>Vendedor (20%)</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F57F17' }}>{formatCurrency(displaySummary.vendorShare)}</span>
        </div>
        <div className="w-full rounded-full" style={{ height: '8px', backgroundColor: '#e9ecef', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: '20%' }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            style={{ height: '100%', backgroundColor: '#FFB300', borderRadius: '9999px' }} />
        </div>
      </div>

      {/* ── Pending Balances (all-time for action purposes) ───────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg" style={{ backgroundColor: '#E3F2FD', border: '1px solid #BBDEFB', padding: '12px 14px' }}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle size={14} color="#1565C0" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#1565C0', textTransform: 'uppercase' }}>Pendiente Admin</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1565C0' }}>{formatCurrency(displaySummary.pendingAdmin)}</div>
          <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>Por abonar</div>
        </div>
        <div className="rounded-lg" style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFECB3', padding: '12px 14px' }}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle size={14} color="#F57F17" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#F57F17', textTransform: 'uppercase' }}>Pendiente Vendedor</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#F57F17' }}>{formatCurrency(displaySummary.pendingVendor)}</div>
          <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>Disponible para retiro</div>
        </div>
      </div>

      {/* ── Actions: Abonar / Retirar / Limpiar ─────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Abonar */}
        <div className="flex-1 min-w-[160px]">
          <AnimatePresence mode="wait">
            {!showAbonoInput ? (
              <motion.button key="abono-btn" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={() => { setShowAbonoInput(true); setShowRetiroInput(false); setShowPinInput(false); }}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-white font-bold"
                style={{ backgroundColor: '#42A5F5', fontSize: '13px' }}>
                <CreditCard size={15} /> Entregar al Admin
              </motion.button>
            ) : (
              <motion.div key="abono-input" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                className="rounded-lg" style={{ backgroundColor:'#E3F2FD', border:'1px solid #BBDEFB', padding:10 }}>
                <label style={{ fontSize:'11px', fontWeight:600, color:'#1565C0', display:'block', marginBottom:4 }}>
                  Monto a abonar (max: {formatCurrency(actionSummary.pendingAdmin)})
                </label>
                <div className="flex gap-2">
                  <input type="number" value={abonoAmount} onChange={e => setAbonoAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAbono()} placeholder="0.00"
                    className="flex-1 rounded px-3 py-2 text-sm" style={{ border:'1px solid #90CAF9', outline:'none' }} autoFocus />
                  <motion.button whileTap={{ scale:0.95 }} onClick={handleAbono}
                    className="flex items-center justify-center rounded px-3 py-2 text-white" style={{ backgroundColor:'#1565C0' }}>
                    <Check size={16} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Retirar */}
        <div className="flex-1 min-w-[160px]">
          <AnimatePresence mode="wait">
            {!showRetiroInput ? (
              <motion.button key="retiro-btn" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={() => { setShowRetiroInput(true); setShowAbonoInput(false); setShowPinInput(false); }}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-white font-bold"
                style={{ backgroundColor:'#FFB300', fontSize:'13px' }}>
                <DollarSign size={15} /> Retirar Ganancias
              </motion.button>
            ) : (
              <motion.div key="retiro-input" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                className="rounded-lg" style={{ backgroundColor:'#FFF8E1', border:'1px solid #FFECB3', padding:10 }}>
                <label style={{ fontSize:'11px', fontWeight:600, color:'#F57F17', display:'block', marginBottom:4 }}>
                  Monto a retirar (max: {formatCurrency(actionSummary.pendingVendor)})
                </label>
                <div className="flex gap-2">
                  <input type="number" value={retiroAmount} onChange={e => setRetiroAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRetiro()} placeholder="0.00"
                    className="flex-1 rounded px-3 py-2 text-sm" style={{ border:'1px solid #FFD54F', outline:'none' }} autoFocus />
                  <motion.button whileTap={{ scale:0.95 }} onClick={handleRetiro}
                    className="flex items-center justify-center rounded px-3 py-2 text-white" style={{ backgroundColor:'#F57F17' }}>
                    <Check size={16} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Limpiar */}
        <div className="flex-1 min-w-[160px]">
          <AnimatePresence mode="wait">
            {!showPinInput ? (
              <motion.button key="clear-btn" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={() => { setShowPinInput(true); setShowAbonoInput(false); setShowRetiroInput(false); }}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-white font-bold"
                style={{ backgroundColor:'#EF5350', fontSize:'13px' }}>
                <Trash2 size={15} /> Limpiar Todo
              </motion.button>
            ) : (
              <motion.div key="pin-input" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                className="rounded-lg" style={{ backgroundColor:'#FFEBEE', border:'1px solid #FFCDD2', padding:10 }}>
                <label style={{ fontSize:'11px', fontWeight:600, color:'#C62828', display:'block', marginBottom:4 }}>
                  <Lock size={11} style={{ display:'inline', marginRight:4 }} /> PIN de 4 dígitos
                </label>
                {pinError && <div style={{ fontSize:'11px', color:'#C62828', marginBottom:4 }}>{pinError}</div>}
                <div className="flex gap-2">
                  <input type="password" value={pin} onChange={e => { setPin(e.target.value.slice(0,4)); setPinError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handlePinVerify()} placeholder="****" maxLength={4}
                    className="flex-1 rounded px-3 py-2 text-sm text-center"
                    style={{ border:'1px solid #EF9A9A', outline:'none', letterSpacing:'0.3em' }} autoFocus />
                  <motion.button whileTap={{ scale:0.95 }} onClick={handlePinVerify}
                    className="flex items-center justify-center rounded px-3 py-2 text-white" style={{ backgroundColor:'#C62828' }}>
                    <Check size={16} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Transaction History (filtered by date if active) ─────────── */}
      <div>
        <h4 className="flex items-center gap-2 mb-3"
          style={{ fontSize:'13px', fontWeight:700, color:'#555', textTransform:'uppercase' }}>
          <Clock size={14} />
          Historial de Transacciones
          <span style={{ fontSize:'11px', color:'#999', fontWeight:400, textTransform:'none' }}>
            ({filteredTransactions.length}{isFiltered ? ` de ${transactions.length}` : ''} registros)
          </span>
        </h4>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-6 rounded-lg"
            style={{ backgroundColor:'#f8f9fa', border:'1px dashed #ddd', color:'#888', fontSize:'13px' }}>
            {isFiltered ? 'No hay transacciones en el rango seleccionado' : 'No hay transacciones registradas'}
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight:'280px', border:'1px solid #e9ecef', borderRadius:'8px' }}>
            <table className="w-full" style={{ borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ backgroundColor:'#f8f9fa', borderBottom:'2px solid #e9ecef' }}>
                  {['Fecha','Tipo','Monto','Descripcion'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', fontSize:'11px', fontWeight:700, color:'#666',
                      textAlign: h === 'Monto' ? 'right' : 'left', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredTransactions.map((tx, i) => {
                    const cfg = txTypeConfig[tx.type] || txTypeConfig.venta;
                    const isDebit = tx.type === 'premio' || tx.type === 'abono';
                    return (
                      <motion.tr key={tx.id}
                        initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.03 }}
                        style={{ borderBottom:'1px solid #f0f0f0', backgroundColor: i%2===0?'#fff':'#fafbfc' }}>
                        <td style={{ padding:'8px 10px', fontSize:'12px', color:'#666', whiteSpace:'nowrap' }}>{formatDate(tx.date)}</td>
                        <td style={{ padding:'8px 10px' }}>
                          <span className="inline-block rounded px-2 py-0.5 text-xs font-bold"
                            style={{ backgroundColor:cfg.bg, color:cfg.color }}>{cfg.label}</span>
                        </td>
                        <td style={{ padding:'8px 10px', fontSize:'13px', fontWeight:700, textAlign:'right', whiteSpace:'nowrap',
                          color: isDebit ? '#C62828' : '#2E7D32' }}>
                          {isDebit ? '−' : '+'}{formatCurrency(tx.amount)}
                        </td>
                        <td style={{ padding:'8px 10px', fontSize:'12px', color:'#555' }}>{tx.description}</td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}
