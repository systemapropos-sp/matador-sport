import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  DollarSign,
  Receipt,
  Home,
  TrendingDown,
  CreditCard,
  BarChart3,
  Check,
  Calendar,
  X,
  ChevronDown,
  ShieldCheck,
  User,
} from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { useAccounting } from '@/hooks/useAccounting';
import type { FilterPeriod } from '@/hooks/useAccounting';

// ── Simple ledger entry stored in localStorage ───────────────────────────────
interface LedgerEntry {
  id: string;
  date: string;
  tipo: string;       // 'gasto' | 'abono' | 'ingreso' | 'pago'
  monto: number;
  descripcion: string;
}

function loadLedger(key: string): LedgerEntry[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveLedger(key: string, data: LedgerEntry[]) {
  localStorage.setItem(key, JSON.stringify(data));
}
const ADMIN_LEDGER_KEY   = 'nmv_admin_ledger';
const VENDOR_LEDGER_KEY  = 'nmv_vendor_ledger';

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  generado: { label: 'Generado', color: '#2E7D32', bg: '#E8F5E9' },
  premio: { label: 'Premio', color: '#C62828', bg: '#FFEBEE' },
  renta: { label: 'Renta', color: '#6A1B9A', bg: '#F3E5F5' },
  gasto: { label: 'Gasto', color: '#EF6C00', bg: '#FFF3E0' },
  abono: { label: 'Abono', color: '#1565C0', bg: '#E3F2FD' },
};

function SummaryCard({
  label,
  value,
  bg,
  textColor,
  icon,
}: {
  label: string;
  value: string;
  bg: string;
  textColor: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg"
      style={{
        backgroundColor: bg,
        border: `1px solid ${textColor}20`,
        padding: '12px 14px',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: textColor }}>{icon}</span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: textColor, textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '17px', fontWeight: 700, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </motion.div>
  );
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AccountingModal() {
  const { closeModal } = useModalContext();
  const { records, addRentaPayment, getTotals, filterRecords } = useAccounting();

  const [filter, setFilter] = useState<FilterPeriod>('mensual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRenta, setShowAddRenta] = useState(false);
  const [rentaAmount, setRentaAmount] = useState('');
  const [rentaDesc, setRentaDesc] = useState('');
  const [toast, setToast] = useState('');

  // ── Admin $ ledger ────────────────────────────────────────────────────────
  const [adminEntries, setAdminEntries] = useState<LedgerEntry[]>(() => loadLedger(ADMIN_LEDGER_KEY));
  const [adminOpen, setAdminOpen] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminTipo, setAdminTipo] = useState('abono');
  const [adminMonto, setAdminMonto] = useState('');
  const [adminDesc, setAdminDesc] = useState('');

  // ── Vendedor $ ledger ─────────────────────────────────────────────────────
  const [vendorEntries, setVendorEntries] = useState<LedgerEntry[]>(() => loadLedger(VENDOR_LEDGER_KEY));
  const [vendorOpen, setVendorOpen] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [vendorTipo, setVendorTipo] = useState('gasto');
  const [vendorMonto, setVendorMonto] = useState('');
  const [vendorDesc, setVendorDesc] = useState('');

  const addAdminEntry = () => {
    const monto = parseFloat(adminMonto);
    if (!monto || monto <= 0) { setToast('Monto inválido'); setTimeout(() => setToast(''), 2000); return; }
    const entry: LedgerEntry = { id: Date.now().toString(), date: new Date().toISOString(), tipo: adminTipo, monto, descripcion: adminDesc || adminTipo };
    const updated = [entry, ...adminEntries];
    setAdminEntries(updated); saveLedger(ADMIN_LEDGER_KEY, updated);
    setAdminMonto(''); setAdminDesc(''); setShowAddAdmin(false);
    setToast('Entrada Admin registrada!'); setTimeout(() => setToast(''), 2000);
  };

  const addVendorEntry = () => {
    const monto = parseFloat(vendorMonto);
    if (!monto || monto <= 0) { setToast('Monto inválido'); setTimeout(() => setToast(''), 2000); return; }
    const entry: LedgerEntry = { id: Date.now().toString(), date: new Date().toISOString(), tipo: vendorTipo, monto, descripcion: vendorDesc || vendorTipo };
    const updated = [entry, ...vendorEntries];
    setVendorEntries(updated); saveLedger(VENDOR_LEDGER_KEY, updated);
    setVendorMonto(''); setVendorDesc(''); setShowAddVendor(false);
    setToast('Entrada Vendedor registrada!'); setTimeout(() => setToast(''), 2000);
  };

  const adminTotal = adminEntries.reduce((s, e) => s + (e.tipo === 'gasto' || e.tipo === 'pago' ? -e.monto : e.monto), 0);
  const vendorTotal = vendorEntries.reduce((s, e) => s + (e.tipo === 'gasto' || e.tipo === 'pago' ? -e.monto : e.monto), 0);

  const totals = useMemo(
    () => getTotals(filter, startDate || undefined, endDate || undefined),
    [getTotals, filter, startDate, endDate, records]
  );

  const filteredRecords = useMemo(
    () => filterRecords(filter, startDate || undefined, endDate || undefined, searchTerm),
    [filterRecords, filter, startDate, endDate, searchTerm, records]
  );

  const handleAddRenta = () => {
    const amount = parseFloat(rentaAmount);
    if (!amount || amount <= 0) {
      setToast('Ingrese un monto valido');
      setTimeout(() => setToast(''), 2000);
      return;
    }
    addRentaPayment(amount, rentaDesc || 'Pago de renta');
    setRentaAmount('');
    setRentaDesc('');
    setShowAddRenta(false);
    setToast('Renta registrada!');
    setTimeout(() => setToast(''), 2000);
  };

  const filterTabs: { key: FilterPeriod; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'semanal', label: 'Semanal' },
    { key: 'mensual', label: 'Mensual' },
  ];

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Contabilidad" maxWidth="900px">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 px-3 py-2 rounded-lg text-sm font-medium text-center"
            style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e0e0e0' }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="px-4 py-2 text-sm font-bold transition-colors"
              style={{
                backgroundColor: filter === tab.key ? '#333' : '#fff',
                color: filter === tab.key ? '#fff' : '#555',
                borderRight: '1px solid #e0e0e0',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Calendar size={14} color="#888" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 rounded px-2 py-1.5 text-xs"
            style={{ border: '1px solid #ddd', outline: 'none' }}
          />
          <span style={{ fontSize: '12px', color: '#888' }}>-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 rounded px-2 py-1.5 text-xs"
            style={{ border: '1px solid #ddd', outline: 'none' }}
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="flex items-center justify-center rounded"
              style={{ padding: '4px', color: '#888' }}
              title="Limpiar fechas"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <SummaryCard
          label="Total Generado"
          value={formatCurrency(totals.totalGenerado)}
          bg="#E8F5E9"
          textColor="#2E7D32"
          icon={<DollarSign size={16} />}
        />
        <SummaryCard
          label="Premios"
          value={formatCurrency(totals.totalPremios)}
          bg="#FFEBEE"
          textColor="#C62828"
          icon={<Receipt size={16} />}
        />
        <SummaryCard
          label="Renta"
          value={formatCurrency(totals.totalRenta)}
          bg="#F3E5F5"
          textColor="#6A1B9A"
          icon={<Home size={16} />}
        />
        <SummaryCard
          label="Gastos"
          value={formatCurrency(totals.totalGastos)}
          bg="#FFF3E0"
          textColor="#EF6C00"
          icon={<TrendingDown size={16} />}
        />
        <SummaryCard
          label="Abonos"
          value={formatCurrency(totals.totalAbonos)}
          bg="#E3F2FD"
          textColor="#1565C0"
          icon={<CreditCard size={16} />}
        />
        <SummaryCard
          label="Neto"
          value={`${totals.neto >= 0 ? '+' : '−'}${formatCurrency(Math.abs(totals.neto))}`}
          bg={totals.neto >= 0 ? '#E8F5E9' : '#FFEBEE'}
          textColor={totals.neto >= 0 ? '#2E7D32' : '#C62828'}
          icon={<BarChart3 size={16} />}
        />
      </div>

      {/* Search + Add Renta */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-lg px-3 py-2" style={{ border: '1px solid #ddd', backgroundColor: '#fafbfc' }}>
          <Search size={14} color="#888" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripcion..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#333' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ color: '#888' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddRenta((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-white font-bold"
          style={{ backgroundColor: '#6A1B9A', fontSize: '13px' }}
        >
          <Plus size={15} />
          Agregar Renta
        </motion.button>
      </div>

      {/* Add Renta Form */}
      <AnimatePresence>
        {showAddRenta && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg mb-4 overflow-hidden"
            style={{ backgroundColor: '#F3E5F5', border: '1px solid #CE93D8', padding: '14px' }}
          >
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[140px]">
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6A1B9A', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Monto
                </label>
                <input
                  type="number"
                  value={rentaAmount}
                  onChange={(e) => setRentaAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRenta()}
                  placeholder="0.00"
                  className="w-full rounded px-3 py-2 text-sm"
                  style={{ border: '1px solid #CE93D8', outline: 'none' }}
                  autoFocus
                />
              </div>
              <div className="flex-[2] min-w-[200px]">
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6A1B9A', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Descripcion
                </label>
                <input
                  type="text"
                  value={rentaDesc}
                  onChange={(e) => setRentaDesc(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRenta()}
                  placeholder="Ej: Pago de renta local"
                  className="w-full rounded px-3 py-2 text-sm"
                  style={{ border: '1px solid #CE93D8', outline: 'none' }}
                />
              </div>
              <div className="flex items-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddRenta}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-white font-bold"
                  style={{ backgroundColor: '#6A1B9A', fontSize: '13px' }}
                >
                  <Check size={15} />
                  Agregar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records Table */}
      <div>
        <h4
          className="flex items-center gap-2 mb-3"
          style={{ fontSize: '13px', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}
        >
          <Receipt size={14} />
          Registros
          <span style={{ fontSize: '11px', color: '#999', fontWeight: 400, textTransform: 'none' }}>
            ({filteredRecords.length} encontrados)
          </span>
        </h4>

        {filteredRecords.length === 0 ? (
          <div
            className="text-center py-6 rounded-lg"
            style={{ backgroundColor: '#f8f9fa', border: '1px dashed #ddd', color: '#888', fontSize: '13px' }}
          >
            No hay registros para el filtro seleccionado
          </div>
        ) : (
          <div
            className="overflow-y-auto"
            style={{ maxHeight: '320px', border: '1px solid #e9ecef', borderRadius: '8px' }}
          >
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#666', textAlign: 'left', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#666', textAlign: 'left', textTransform: 'uppercase' }}>Tipo</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#666', textAlign: 'right', textTransform: 'uppercase' }}>Monto</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#666', textAlign: 'left', textTransform: 'uppercase' }}>Descripcion</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#666', textAlign: 'left', textTransform: 'uppercase' }}>Periodo</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredRecords.map((record, i) => {
                    const cfg = typeConfig[record.type] || typeConfig.generado;
                    return (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                      >
                        <td style={{ padding: '8px 10px', fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
                          {formatDate(record.date)}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span
                            className="inline-block rounded px-2 py-0.5 text-xs font-bold"
                            style={{ backgroundColor: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 700, color: cfg.color, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {formatCurrency(record.amount)}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: '12px', color: '#555', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {record.description}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: '11px', color: '#888', textTransform: 'capitalize' }}>
                          {record.period}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* ═══ ADMIN $ LEDGER ═══════════════════════════════════════════════ */}
      <div className="mt-5 rounded-xl overflow-hidden" style={{ border: '1px solid #BBDEFB' }}>
        <button
          className="w-full flex items-center justify-between px-4 py-3 font-bold text-sm"
          style={{ background: 'linear-gradient(135deg,#1565C0,#1976D2)', color:'#fff' }}
          onClick={() => setAdminOpen(v => !v)}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            ADMIN $ — Gastos / Abonos del Admin
            <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:10, padding:'1px 8px', fontSize:11, fontWeight:400 }}>
              {adminEntries.length} entradas · Balance: {adminTotal >= 0 ? '+' : ''}{formatCurrency(adminTotal)}
            </span>
          </div>
          <motion.div animate={{ rotate: adminOpen ? 180 : 0 }} transition={{ duration:0.2 }}>
            <ChevronDown size={16} />
          </motion.div>
        </button>
        <AnimatePresence>
          {adminOpen && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} style={{ overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', background:'#EBF3FF' }}>
                {/* Add entry form */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <select value={adminTipo} onChange={e => setAdminTipo(e.target.value)}
                    style={{ height:34, padding:'0 10px', borderRadius:6, border:'1px solid #90CAF9', fontSize:13, outline:'none', background:'#fff' }}>
                    <option value="abono">Abono</option>
                    <option value="ingreso">Ingreso</option>
                    <option value="gasto">Gasto</option>
                    <option value="pago">Pago</option>
                  </select>
                  <input type="number" value={adminMonto} onChange={e => setAdminMonto(e.target.value)} placeholder="Monto"
                    style={{ height:34, padding:'0 10px', borderRadius:6, border:'1px solid #90CAF9', fontSize:13, outline:'none', width:110 }} />
                  <input type="text" value={adminDesc} onChange={e => setAdminDesc(e.target.value)} placeholder="Descripción"
                    style={{ height:34, padding:'0 10px', borderRadius:6, border:'1px solid #90CAF9', fontSize:13, outline:'none', flex:1, minWidth:140 }} />
                  <button onClick={addAdminEntry}
                    className="flex items-center gap-1 px-3 rounded-lg text-white font-bold text-sm"
                    style={{ background:'#1565C0', height:34, cursor:'pointer', border:'none' }}>
                    <Plus size={14}/> Agregar
                  </button>
                </div>
                {adminEntries.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'16px 0', color:'#90CAF9', fontSize:13 }}>Sin entradas aún</div>
                ) : (
                  <div style={{ maxHeight:200, overflowY:'auto', borderRadius:6, border:'1px solid #BBDEFB' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead><tr style={{ background:'#BBDEFB' }}>
                        {['Fecha','Tipo','Monto','Descripción'].map(h=>(
                          <th key={h} style={{ padding:'6px 10px', textAlign:'left', color:'#1565C0', fontWeight:700, fontSize:11, textTransform:'uppercase' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {adminEntries.map((e,i)=>(
                          <tr key={e.id} style={{ borderBottom:'1px solid #E3F2FD', background: i%2===0?'#fff':'#f8fbff' }}>
                            <td style={{ padding:'6px 10px', whiteSpace:'nowrap', color:'#666' }}>{formatDate(e.date)}</td>
                            <td style={{ padding:'6px 10px' }}>
                              <span style={{ background: e.tipo==='gasto'||e.tipo==='pago' ? '#FFEBEE' : '#E3F2FD', color: e.tipo==='gasto'||e.tipo==='pago' ? '#C62828' : '#1565C0', padding:'1px 7px', borderRadius:8, fontSize:11, fontWeight:700 }}>{e.tipo}</span>
                            </td>
                            <td style={{ padding:'6px 10px', fontWeight:700, color: e.tipo==='gasto'||e.tipo==='pago' ? '#C62828' : '#1565C0', textAlign:'right', whiteSpace:'nowrap' }}>
                              {e.tipo==='gasto'||e.tipo==='pago' ? '−' : '+'}{formatCurrency(e.monto)}
                            </td>
                            <td style={{ padding:'6px 10px', color:'#555' }}>{e.descripcion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ VENDEDOR $ LEDGER ════════════════════════════════════════════ */}
      <div className="mt-3 mb-2 rounded-xl overflow-hidden" style={{ border: '1px solid #FFE0B2' }}>
        <button
          className="w-full flex items-center justify-between px-4 py-3 font-bold text-sm"
          style={{ background: 'linear-gradient(135deg,#E65100,#F57C00)', color:'#fff' }}
          onClick={() => setVendorOpen(v => !v)}
        >
          <div className="flex items-center gap-2">
            <User size={16} />
            VENDEDOR $ — Gastos / Abonos del Vendedor
            <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:10, padding:'1px 8px', fontSize:11, fontWeight:400 }}>
              {vendorEntries.length} entradas · Balance: {vendorTotal >= 0 ? '+' : ''}{formatCurrency(vendorTotal)}
            </span>
          </div>
          <motion.div animate={{ rotate: vendorOpen ? 180 : 0 }} transition={{ duration:0.2 }}>
            <ChevronDown size={16} />
          </motion.div>
        </button>
        <AnimatePresence>
          {vendorOpen && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} style={{ overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', background:'#FFF3E0' }}>
                {/* Add entry form */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <select value={vendorTipo} onChange={e => setVendorTipo(e.target.value)}
                    style={{ height:34, padding:'0 10px', borderRadius:6, border:'1px solid #FFCC80', fontSize:13, outline:'none', background:'#fff' }}>
                    <option value="gasto">Gasto</option>
                    <option value="pago">Pago</option>
                    <option value="abono">Abono</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                  <input type="number" value={vendorMonto} onChange={e => setVendorMonto(e.target.value)} placeholder="Monto"
                    style={{ height:34, padding:'0 10px', borderRadius:6, border:'1px solid #FFCC80', fontSize:13, outline:'none', width:110 }} />
                  <input type="text" value={vendorDesc} onChange={e => setVendorDesc(e.target.value)} placeholder="Descripción"
                    style={{ height:34, padding:'0 10px', borderRadius:6, border:'1px solid #FFCC80', fontSize:13, outline:'none', flex:1, minWidth:140 }} />
                  <button onClick={addVendorEntry}
                    className="flex items-center gap-1 px-3 rounded-lg text-white font-bold text-sm"
                    style={{ background:'#E65100', height:34, cursor:'pointer', border:'none' }}>
                    <Plus size={14}/> Agregar
                  </button>
                </div>
                {vendorEntries.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'16px 0', color:'#FFCC80', fontSize:13 }}>Sin entradas aún</div>
                ) : (
                  <div style={{ maxHeight:200, overflowY:'auto', borderRadius:6, border:'1px solid #FFE0B2' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead><tr style={{ background:'#FFE0B2' }}>
                        {['Fecha','Tipo','Monto','Descripción'].map(h=>(
                          <th key={h} style={{ padding:'6px 10px', textAlign:'left', color:'#E65100', fontWeight:700, fontSize:11, textTransform:'uppercase' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {vendorEntries.map((e,i)=>(
                          <tr key={e.id} style={{ borderBottom:'1px solid #FFF3E0', background: i%2===0?'#fff':'#fffaf5' }}>
                            <td style={{ padding:'6px 10px', whiteSpace:'nowrap', color:'#666' }}>{formatDate(e.date)}</td>
                            <td style={{ padding:'6px 10px' }}>
                              <span style={{ background: e.tipo==='gasto'||e.tipo==='pago' ? '#FFEBEE' : '#FFF3E0', color: e.tipo==='gasto'||e.tipo==='pago' ? '#C62828' : '#E65100', padding:'1px 7px', borderRadius:8, fontSize:11, fontWeight:700 }}>{e.tipo}</span>
                            </td>
                            <td style={{ padding:'6px 10px', fontWeight:700, color: e.tipo==='gasto'||e.tipo==='pago' ? '#C62828' : '#2E7D32', textAlign:'right', whiteSpace:'nowrap' }}>
                              {e.tipo==='gasto'||e.tipo==='pago' ? '−' : '+'}{formatCurrency(e.monto)}
                            </td>
                            <td style={{ padding:'6px 10px', color:'#555' }}>{e.descripcion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalWrapper>
  );
}
