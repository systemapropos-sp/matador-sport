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
} from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { useAccounting } from '@/hooks/useAccounting';
import type { FilterPeriod } from '@/hooks/useAccounting';

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
          value={formatCurrency(totals.neto)}
          bg="#ECEFF1"
          textColor="#37474F"
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
    </ModalWrapper>
  );
}
