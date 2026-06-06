import { useState } from 'react';
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
} from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { useBalance } from '@/hooks/useBalance';

const cardColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  green: { bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9', icon: '#4CAF50' },
  red: { bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2', icon: '#EF5350' },
  blue: { bg: '#E3F2FD', text: '#1565C0', border: '#BBDEFB', icon: '#42A5F5' },
  gold: { bg: '#FFF8E1', text: '#F57F17', border: '#FFECB3', icon: '#FFB300' },
};

function SummaryCard({
  label,
  value,
  colorKey,
  icon,
}: {
  label: string;
  value: string;
  colorKey: string;
  icon: React.ReactNode;
}) {
  const c = cardColors[colorKey] || cardColors.blue;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 rounded-lg"
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        padding: '12px 14px',
        minWidth: 0,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: c.icon }}>{icon}</span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: c.text, textTransform: 'uppercase' }}>
          {label}
        </span>
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
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BalanceModal() {
  const { closeModal } = useModalContext();
  const { transactions, summary, registerAbono, registerRetiro, clearTransactions } = useBalance();

  const [showAbonoInput, setShowAbonoInput] = useState(false);
  const [abonoAmount, setAbonoAmount] = useState('');
  const [showRetiroInput, setShowRetiroInput] = useState(false);
  const [retiroAmount, setRetiroAmount] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [toast, setToast] = useState('');

  const handleAbono = () => {
    const amount = parseFloat(abonoAmount);
    if (!amount || amount <= 0) {
      setToast('Ingrese un monto valido');
      setTimeout(() => setToast(''), 2000);
      return;
    }
    if (amount > summary.pendingAdmin) {
      setToast('El monto excede el pendiente');
      setTimeout(() => setToast(''), 2000);
      return;
    }
    registerAbono(amount);
    setAbonoAmount('');
    setShowAbonoInput(false);
    setToast('Abono registrado!');
    setTimeout(() => setToast(''), 2000);
  };

  const handleRetiro = () => {
    const amount = parseFloat(retiroAmount);
    if (!amount || amount <= 0) {
      setToast('Ingrese un monto valido');
      setTimeout(() => setToast(''), 2000);
      return;
    }
    if (amount > summary.pendingVendor) {
      setToast('El monto excede el disponible');
      setTimeout(() => setToast(''), 2000);
      return;
    }
    registerRetiro(amount);
    setRetiroAmount('');
    setShowRetiroInput(false);
    setToast('Retiro registrado!');
    setTimeout(() => setToast(''), 2000);
  };

  const handlePinVerify = () => {
    const ok = clearTransactions(pin);
    if (ok) {
      setPin('');
      setShowPinInput(false);
      setPinError('');
      setToast('Historial limpiado!');
      setTimeout(() => setToast(''), 2000);
    } else {
      setPinError('PIN incorrecto');
      setTimeout(() => setPinError(''), 2000);
    }
  };

  const txTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
    venta: { label: 'Venta', color: '#2E7D32', bg: '#E8F5E9' },
    premio: { label: 'Premio', color: '#C62828', bg: '#FFEBEE' },
    abono: { label: 'Abono', color: '#1565C0', bg: '#E3F2FD' },
    retiro: { label: 'Retiro', color: '#F57F17', bg: '#FFF8E1' },
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Balance 80/20" maxWidth="900px">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SummaryCard
          label="Ventas Totales"
          value={formatCurrency(summary.totalSales)}
          colorKey="green"
          icon={<TrendingUp size={16} />}
        />
        <SummaryCard
          label="Premios"
          value={formatCurrency(summary.totalPrizes)}
          colorKey="red"
          icon={<TrendingDown size={16} />}
        />
        <SummaryCard
          label="Balance Neto"
          value={formatCurrency(summary.netBalance)}
          colorKey="blue"
          icon={<Wallet size={16} />}
        />
        <SummaryCard
          label="Tu 20%"
          value={formatCurrency(summary.vendorShare)}
          colorKey="gold"
          icon={<DollarSign size={16} />}
        />
      </div>

      {/* Share Breakdown */}
      <div className="rounded-lg mb-5" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', padding: '14px 16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#555', marginBottom: '10px', textTransform: 'uppercase' }}>
          Distribucion
        </h4>
        <div className="flex justify-between items-center mb-2">
          <span style={{ fontSize: '13px', color: '#555' }}>Administrador (80%)</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1565C0' }}>{formatCurrency(summary.adminShare)}</span>
        </div>
        <div className="w-full rounded-full mb-2" style={{ height: '8px', backgroundColor: '#e9ecef', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '80%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', backgroundColor: '#42A5F5', borderRadius: '9999px' }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span style={{ fontSize: '13px', color: '#555' }}>Vendedor (20%)</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F57F17' }}>{formatCurrency(summary.vendorShare)}</span>
        </div>
        <div className="w-full rounded-full" style={{ height: '8px', backgroundColor: '#e9ecef', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '20%' }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            style={{ height: '100%', backgroundColor: '#FFB300', borderRadius: '9999px' }}
          />
        </div>
      </div>

      {/* Pending Balances */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg" style={{ backgroundColor: '#E3F2FD', border: '1px solid #BBDEFB', padding: '12px 14px' }}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpCircle size={14} color="#1565C0" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#1565C0', textTransform: 'uppercase' }}>Pendiente Admin</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1565C0' }}>{formatCurrency(summary.pendingAdmin)}</div>
          <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>Por abonar</div>
        </div>
        <div className="rounded-lg" style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFECB3', padding: '12px 14px' }}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownCircle size={14} color="#F57F17" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#F57F17', textTransform: 'uppercase' }}>Pendiente Vendedor</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#F57F17' }}>{formatCurrency(summary.pendingVendor)}</div>
          <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>Disponible para retiro</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Abonar */}
        <div className="flex-1 min-w-[160px]">
          <AnimatePresence mode="wait">
            {!showAbonoInput ? (
              <motion.button
                key="abono-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setShowAbonoInput(true); setShowRetiroInput(false); setShowPinInput(false); }}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-white font-bold"
                style={{ backgroundColor: '#42A5F5', fontSize: '13px' }}
              >
                <CreditCard size={15} />
                Abonar a Admin
              </motion.button>
            ) : (
              <motion.div
                key="abono-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg"
                style={{ backgroundColor: '#E3F2FD', border: '1px solid #BBDEFB', padding: '10px' }}
              >
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#1565C0', display: 'block', marginBottom: '4px' }}>
                  Monto a abonar (max: {formatCurrency(summary.pendingAdmin)})
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={abonoAmount}
                    onChange={(e) => setAbonoAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAbono()}
                    placeholder="0.00"
                    className="flex-1 rounded px-3 py-2 text-sm"
                    style={{ border: '1px solid #90CAF9', outline: 'none' }}
                    autoFocus
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAbono}
                    className="flex items-center justify-center rounded px-3 py-2 text-white"
                    style={{ backgroundColor: '#1565C0' }}
                  >
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
              <motion.button
                key="retiro-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setShowRetiroInput(true); setShowAbonoInput(false); setShowPinInput(false); }}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-white font-bold"
                style={{ backgroundColor: '#FFB300', fontSize: '13px' }}
              >
                <DollarSign size={15} />
                Retirar Ganancias
              </motion.button>
            ) : (
              <motion.div
                key="retiro-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg"
                style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFECB3', padding: '10px' }}
              >
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#F57F17', display: 'block', marginBottom: '4px' }}>
                  Monto a retirar (max: {formatCurrency(summary.pendingVendor)})
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={retiroAmount}
                    onChange={(e) => setRetiroAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRetiro()}
                    placeholder="0.00"
                    className="flex-1 rounded px-3 py-2 text-sm"
                    style={{ border: '1px solid #FFD54F', outline: 'none' }}
                    autoFocus
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRetiro}
                    className="flex items-center justify-center rounded px-3 py-2 text-white"
                    style={{ backgroundColor: '#F57F17' }}
                  >
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
              <motion.button
                key="clear-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setShowPinInput(true); setShowAbonoInput(false); setShowRetiroInput(false); }}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-white font-bold"
                style={{ backgroundColor: '#EF5350', fontSize: '13px' }}
              >
                <Trash2 size={15} />
                Limpiar Todo
              </motion.button>
            ) : (
              <motion.div
                key="pin-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg"
                style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', padding: '10px' }}
              >
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#C62828', display: 'block', marginBottom: '4px' }}>
                  <Lock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                  PIN de 4 digitos
                </label>
                {pinError && (
                  <div style={{ fontSize: '11px', color: '#C62828', marginBottom: '4px' }}>{pinError}</div>
                )}
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value.slice(0, 4)); setPinError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePinVerify()}
                    placeholder="****"
                    maxLength={4}
                    className="flex-1 rounded px-3 py-2 text-sm text-center"
                    style={{ border: '1px solid #EF9A9A', outline: 'none', letterSpacing: '0.3em' }}
                    autoFocus
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePinVerify}
                    className="flex items-center justify-center rounded px-3 py-2 text-white"
                    style={{ backgroundColor: '#C62828' }}
                  >
                    <Check size={16} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h4
          className="flex items-center gap-2 mb-3"
          style={{ fontSize: '13px', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}
        >
          <Clock size={14} />
          Historial de Transacciones
          <span style={{ fontSize: '11px', color: '#999', fontWeight: 400, textTransform: 'none' }}>
            ({transactions.length} registros)
          </span>
        </h4>

        {transactions.length === 0 ? (
          <div
            className="text-center py-6 rounded-lg"
            style={{ backgroundColor: '#f8f9fa', border: '1px dashed #ddd', color: '#888', fontSize: '13px' }}
          >
            No hay transacciones registradas
          </div>
        ) : (
          <div
            className="overflow-y-auto"
            style={{ maxHeight: '280px', border: '1px solid #e9ecef', borderRadius: '8px' }}
          >
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#666', textAlign: 'left', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#666', textAlign: 'left', textTransform: 'uppercase' }}>Tipo</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#666', textAlign: 'right', textTransform: 'uppercase' }}>Monto</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, color: '#666', textAlign: 'left', textTransform: 'uppercase' }}>Descripcion</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {transactions.map((tx, i) => {
                    const cfg = txTypeConfig[tx.type] || txTypeConfig.venta;
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                      >
                        <td style={{ padding: '8px 10px', fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
                          {formatDate(tx.date)}
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
                          {formatCurrency(tx.amount)}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: '12px', color: '#555' }}>
                          {tx.description}
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
