/**
 * CerrarCajaModal — Cierre de caja con:
 *  · Resumen del día (ventas totales, crédito, efectivo esperado)
 *  · Contador de denominaciones (contar el cash físico)
 *  · Cuadre: diferencia contado vs esperado → sobra / falta / cuadrado
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  DollarSign,
  CreditCard,
  Banknote,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';

// ── Denomination config ────────────────────────────────────────────────────
const BILLS: { value: number; label: string }[] = [
  { value: 1000, label: '$1,000' },
  { value: 500,  label: '$500'   },
  { value: 200,  label: '$200'   },
  { value: 100,  label: '$100'   },
  { value: 50,   label: '$50'    },
  { value: 20,   label: '$20'    },
  { value: 10,   label: '$10'    },
  { value: 5,    label: '$5'     },
  { value: 2,    label: '$2'     },
  { value: 1,    label: '$1'     },
];
function fmt(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ── Read today's tickets from localStorage ──────────────────────────────────
interface StoredTicket {
  id?: string;
  ticketNumber?: string;
  amount?: number;
  totalAmount?: number;
  metadata?: { total_amount?: number };
  createdAt?: string;
  created_at?: string;
  clientType?: string;
}

function readTodayTickets(): StoredTicket[] {
  try {
    const raw = localStorage.getItem('matador_tickets');
    if (!raw) return [];
    const all: StoredTicket[] = JSON.parse(raw);
    const todayStart = startOfToday();
    return all.filter((t) => {
      const ts = t.createdAt ?? t.created_at ?? '';
      if (!ts) return true; // include if no date
      return new Date(ts).getTime() >= todayStart;
    });
  } catch { return []; }
}

// ── Read paid prizes from localStorage ─────────────────────────────────────
function readTodayPremios(): number {
  try {
    const raw = localStorage.getItem('matador_pagos') ?? localStorage.getItem('matador_payments');
    if (!raw) return 0;
    const all: Array<{ amount?: number; monto?: number; createdAt?: string; created_at?: string; date?: string }> = JSON.parse(raw);
    const todayStart = startOfToday();
    return all
      .filter((p) => {
        const ts = p.createdAt ?? p.created_at ?? p.date ?? '';
        return !ts || new Date(ts).getTime() >= todayStart;
      })
      .reduce((s, p) => s + (p.amount ?? p.monto ?? 0), 0);
  } catch { return 0; }
}

export default function CerrarCajaModal() {
  const { closeModal } = useModalContext();

  // ── Bills & coins counters ──────────────────────────────────────────────
  const initialCounts = () => {
    const obj: Record<number, number> = {};
    [...BILLS].forEach((d) => { obj[d.value] = 0; });
    return obj;
  };
  const [counts, setCounts] = useState<Record<number, number>>(initialCounts);
  const [premiosManual, setPremiosManual] = useState('');

  // ── Today's data ─────────────────────────────────────────────────────────
  const tickets = useMemo(() => readTodayTickets(), []);
  const premiosAuto = useMemo(() => readTodayPremios(), []);

  const premiosVal = premiosManual !== '' ? parseFloat(premiosManual) || 0 : premiosAuto;

  const totalVentas = tickets.reduce((s, t) => {
    const amt = t.totalAmount ?? t.amount ?? (t.metadata?.total_amount ?? 0);
    return s + amt;
  }, 0);

  const ventasCredito = tickets.reduce((s, t) => {
    if (t.clientType === 'credito') {
      const amt = t.totalAmount ?? t.amount ?? (t.metadata?.total_amount ?? 0);
      return s + amt;
    }
    return s;
  }, 0);

  const ventasEfectivo  = totalVentas - ventasCredito;
  const efectivoEsperado = Math.max(0, ventasEfectivo - premiosVal);

  // ── Denomination totals ───────────────────────────────────────────────────
  const totalContado = Object.entries(counts).reduce(
    (s, [val, qty]) => s + parseFloat(val) * qty, 0
  );

  const diferencia = totalContado - efectivoEsperado;
  const isDiff0  = Math.abs(diferencia) < 0.005;
  const isSobra  = diferencia > 0.005;
  const isFalta  = diferencia < -0.005;

  const setCount = (val: number, qty: number) =>
    setCounts((prev) => ({ ...prev, [val]: Math.max(0, qty) }));

  const resetCounts = () => setCounts(initialCounts());

  // ── Denomination row ──────────────────────────────────────────────────────
  const DenomRow = ({ value, label }: { value: number; label: string }) => {
    const qty = counts[value] ?? 0;
    const subtotal = value * qty;
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '70px 1fr 110px', alignItems: 'center', gap: 8,
        padding: '5px 10px', borderBottom: '1px solid #f0f0f0',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{label}</span>
        <input
          type="number"
          min={0}
          value={qty === 0 ? '' : qty}
          placeholder="0"
          onChange={(e) => setCount(value, parseInt(e.target.value) || 0)}
          style={{
            width: '100%', height: 34, padding: '0 10px',
            border: '1px solid #e2e8f0', borderRadius: 6,
            fontSize: 14, fontWeight: 600, textAlign: 'center', outline: 'none',
            background: qty > 0 ? '#f0fff4' : '#fff',
            borderColor: qty > 0 ? '#86efac' : '#e2e8f0',
          }}
        />
        <span style={{
          fontSize: 13, fontWeight: 700, textAlign: 'right', paddingRight: 4,
          color: qty > 0 ? '#16a34a' : '#94a3b8',
        }}>
          {subtotal > 0 ? fmt(subtotal) : '—'}
        </span>
      </div>
    );
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Cerrar Caja" maxWidth="640px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── RESUMEN DEL DÍA ──────────────────────────────────────────── */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={15} color="#94a3b8" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
              Resumen de Hoy — {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {/* Total ventas */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Total Ventas</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{fmt(totalVentas)}</div>
            </div>
            {/* Crédito */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: ventasCredito > 0 ? '#fffbeb' : undefined }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CreditCard size={10} /> Ventas Crédito
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>{fmt(ventasCredito)}</div>
              {ventasCredito === 0 && <div style={{ fontSize: 10, color: '#94a3b8' }}>Sin ventas a crédito</div>}
            </div>
            {/* Efectivo ventas */}
            <div style={{ padding: '12px 16px', borderRight: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <DollarSign size={10} /> Ventas Efectivo
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0891b2' }}>{fmt(ventasEfectivo)}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>Total − Crédito</div>
            </div>
            {/* Premios pagados */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingDown size={10} /> Premios Pagados
              </div>
              <input
                type="number"
                value={premiosManual}
                onChange={(e) => setPremiosManual(e.target.value)}
                placeholder={premiosAuto > 0 ? `Auto: ${fmt(premiosAuto)}` : '0.00'}
                style={{
                  width: '100%', height: 32, padding: '0 10px', borderRadius: 6,
                  border: '1px solid #fecaca', fontSize: 14, fontWeight: 700, outline: 'none',
                  background: premiosManual ? '#fef2f2' : '#fff', color: '#dc2626',
                }}
              />
            </div>
          </div>

          {/* Efectivo esperado */}
          <div style={{
            background: 'linear-gradient(135deg,#0891b2,#0D9488)',
            padding: '10px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#e0f2fe', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
              💰 Efectivo Esperado en Caja
            </span>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>
              {fmt(efectivoEsperado)}
            </span>
          </div>
        </div>

        {/* ── DENOMINACIONES ──────────────────────────────────────────────── */}
        <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#f1f5f9', padding: '9px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Banknote size={15} color="#475569" />
              <span style={{ fontWeight: 700, fontSize: 13, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Contar Efectivo
              </span>
            </div>
            <button
              onClick={resetCounts}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <RefreshCw size={12} /> Limpiar
            </button>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9' }}>
            <div style={{ padding: '6px 10px', background: '#f8fafc', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
              Billetes
            </div>
            {BILLS.map((d) => <DenomRow key={d.value} {...d} />)}
          </div>

          {/* Total contado */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', background: '#1e293b',
          }}>
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Total Contado</span>
            <span style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 900 }}>{fmt(totalContado)}</span>
          </div>
        </div>

        {/* ── CUADRE ──────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isDiff0 ? 'ok' : isSobra ? 'sobra' : 'falta'}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              borderRadius: 14, padding: '18px 20px',
              background: isDiff0 ? 'linear-gradient(135deg,#14532d,#16a34a)'
                : isSobra ? 'linear-gradient(135deg,#1e3a5f,#1d4ed8)'
                : 'linear-gradient(135deg,#7f1d1d,#dc2626)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}
          >
            {isDiff0 && (
              <>
                <CheckCircle size={32} color="#86efac" />
                <span style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>✅ CAJA CUADRADA</span>
                <span style={{ color: '#86efac', fontSize: 13 }}>El efectivo contado coincide exactamente con lo esperado</span>
              </>
            )}
            {isSobra && (
              <>
                <AlertTriangle size={32} color="#93c5fd" />
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, opacity: 0.8 }}>SOBRA EN CAJA</span>
                <span style={{ color: '#fff', fontSize: 32, fontWeight: 900 }}>+{fmt(diferencia)}</span>
                <span style={{ color: '#93c5fd', fontSize: 12 }}>
                  Contado {fmt(totalContado)} · Esperado {fmt(efectivoEsperado)}
                </span>
              </>
            )}
            {isFalta && (
              <>
                <X size={32} color="#fca5a5" />
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, opacity: 0.8 }}>FALTA EN CAJA</span>
                <span style={{ color: '#fff', fontSize: 32, fontWeight: 900 }}>-{fmt(Math.abs(diferencia))}</span>
                <span style={{ color: '#fca5a5', fontSize: 12 }}>
                  Contado {fmt(totalContado)} · Esperado {fmt(efectivoEsperado)}
                </span>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── DESGLOSE FINAL (tabla resumen) ───────────────────────────── */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', fontSize: 13 }}>
          {[
            { label: 'Ventas totales del día', value: totalVentas, color: '#0f172a' },
            { label: '− Ventas a crédito', value: -ventasCredito, color: '#d97706' },
            { label: '= Ventas en efectivo', value: ventasEfectivo, color: '#0891b2', bold: true },
            { label: '− Premios pagados', value: -premiosVal, color: '#dc2626' },
            { label: '= Esperado en caja', value: efectivoEsperado, color: '#0D9488', bold: true },
            { label: 'Efectivo contado', value: totalContado, color: '#334155', bold: true },
            {
              label: diferencia >= 0 ? 'Diferencia (sobra)' : 'Diferencia (falta)',
              value: diferencia,
              color: isDiff0 ? '#16a34a' : isSobra ? '#1d4ed8' : '#dc2626',
              bold: true,
            },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', padding: '7px 14px',
              borderBottom: i < 6 ? '1px solid #f1f5f9' : 'none',
              background: i % 2 === 0 ? '#fff' : '#f8fafc',
            }}>
              <span style={{ color: '#64748b', fontSize: 12 }}>{row.label}</span>
              <span style={{ color: row.color, fontWeight: row.bold ? 800 : 600, fontSize: 13 }}>
                {row.value < 0 ? `−${fmt(Math.abs(row.value))}` : fmt(row.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={closeModal}
          style={{
            height: 44, background: '#334155', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <X size={16} /> Cerrar
        </button>
      </div>
    </ModalWrapper>
  );
}
