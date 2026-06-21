/**
 * HistoricalSales — reads from Supabase (tickets table), grouped by date.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Loader2,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyLong } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HistoricalEntry {
  id: string;
  code: string;
  ref: string;
  tickets: number;
  venta: number;
  comisiones: number;
  premios: number;
  neto: number;
  final: number;
  date: string;
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader sub-component                                      */
/* ------------------------------------------------------------------ */

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function HistoricalSales() {
  const navigate = useNavigate();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<HistoricalEntry[]>([]);
  const [dbError, setDbError] = useState('');

  /* ── Load from Supabase ─────────────────────────────────────────── */
  const loadFromSupabase = useCallback(async () => {
    const biz = localStorage.getItem('nmv_business_id');
    if (!biz) { setDbError('No hay sesión activa'); return; }
    setLoading(true);
    setDbError('');

    try {
      const startUTC = `${startDate}T00:00:00.000Z`;
      const endUTC   = `${endDate}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('tickets')
        .select('id, amount, status, metadata, created_at')
        .eq('business_id', biz)
        .neq('status', 'cancelled')
        .gte('created_at', startUTC)
        .lte('created_at', endUTC)
        .order('created_at', { ascending: true });

      if (error) { setDbError(error.message); setLoading(false); return; }
      if (!data || data.length === 0) { setEntries([]); setLoading(false); return; }

      // Group by local date (YYYY-MM-DD)
      const byDate: Record<string, {
        tickets: number; venta: number; premios: number; vendedores: Set<string>;
      }> = {};

      for (const t of data) {
        // Use local date from created_at
        const day = new Date(t.created_at).toISOString().slice(0, 10);
        if (!byDate[day]) byDate[day] = { tickets: 0, venta: 0, premios: 0, vendedores: new Set() };
        byDate[day].tickets += 1;
        byDate[day].venta   += Number(t.amount ?? 0);
        byDate[day].premios += Number((t as any).prize_amount ?? t.metadata?.prize_amount ?? 0);
        const vname = t.metadata?.vendor_name || '-';
        byDate[day].vendedores.add(vname);
      }

      const result = Object.entries(byDate).map(([date, d]) => {
        const neto       = d.venta - d.premios;
        const comisiones = neto * 0.2;
        const final      = neto - comisiones;
        return {
          id:          `sb-${date}`,
          code:        date.replace(/-/g, ''),
          ref:         Array.from(d.vendedores).join(', ') || '-',
          tickets:     d.tickets,
          venta:       d.venta,
          comisiones,
          premios:     d.premios,
          neto,
          final,
          date,
        };
      }).sort((a, b) => b.date.localeCompare(a.date));

      setEntries(result);
    } catch (err: any) {
      setDbError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  /* Load on mount */
  useEffect(() => { loadFromSupabase(); }, []);

  /* Filter by date range (already filtered in Supabase, local filter is extra safety) */
  const filtered = entries.filter((e) => {
    if (!startDate && !endDate) return true;
    const d = e.date;
    if (startDate && d < startDate) return false;
    if (endDate   && d > endDate)   return false;
    return true;
  });

  /* Totals */
  const totals = filtered.reduce(
    (acc, e) => ({
      tickets:    acc.tickets    + e.tickets,
      venta:      acc.venta      + e.venta,
      comisiones: acc.comisiones + e.comisiones,
      premios:    acc.premios    + e.premios,
      neto:       acc.neto       + e.neto,
      final:      acc.final      + e.final,
    }),
    { tickets: 0, venta: 0, comisiones: 0, premios: 0, neto: 0, final: 0 }
  );

  const grandTotal = totals.venta;

  /* Actions */
  const handleViewSales = useCallback(() => { loadFromSupabase(); }, [loadFromSupabase]);

  const handleBackToPOS = useCallback(() => {
    navigate('/betting-pool/ticket/create');
  }, [navigate]);

  /* Set today */
  const handleToday = useCallback(() => {
    const d = format(new Date(), 'yyyy-MM-dd');
    setStartDate(d);
    setEndDate(d);
  }, []);

  /* Animation helpers */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: 0.1 },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
  };

  return (
    <Layout>
      <div className="bg-white min-h-[calc(100dvh-50px)]">
        {/* ====== PAGE TITLE ====== */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            padding: '20px 16px 12px',
            borderBottom: '2px solid #e0e0e0',
          }}
        >
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#333333', margin: 0 }}>
            Historico de ventas
          </h1>
        </motion.div>

        {/* ====== DATE FILTERS ====== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          style={{
            background: '#ffffff',
            padding: '16px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'flex-end',
          }}
        >
          {/* Fecha inicial */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#555555' }}>
              Fecha inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                height: '40px', padding: '0 12px', border: '1px solid #cccccc',
                borderRadius: '4px', fontSize: '14px', outline: 'none',
              }}
              onFocus={(e)  => { e.currentTarget.style.borderColor = '#337ab7'; }}
              onBlur={(e)   => { e.currentTarget.style.borderColor = '#cccccc'; }}
            />
          </div>

          {/* Fecha final */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#555555' }}>
              Fecha final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                height: '40px', padding: '0 12px', border: '1px solid #cccccc',
                borderRadius: '4px', fontSize: '14px', outline: 'none',
              }}
              onFocus={(e)  => { e.currentTarget.style.borderColor = '#337ab7'; }}
              onBlur={(e)   => { e.currentTarget.style.borderColor = '#cccccc'; }}
            />
          </div>

          {/* HOY button */}
          <button
            onClick={handleToday}
            style={{
              height: '40px', padding: '0 16px',
              background: '#16a34a', color: '#fff',
              border: 'none', borderRadius: '4px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              alignSelf: 'flex-end',
            }}
          >
            HOY
          </button>

          {/* Ver ventas button */}
          <Button
            onClick={handleViewSales}
            disabled={loading}
            style={{
              backgroundColor: '#337ab7', color: '#ffffff',
              padding: '10px 24px', borderRadius: '4px',
              fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer',
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Search size={16} className="mr-2" />}
            Ver ventas
          </Button>

          {/* Volver a punto de venta button */}
          <Button
            variant="outline"
            onClick={handleBackToPOS}
            style={{
              backgroundColor: '#f5f5f5', color: '#555555',
              border: '1px solid #cccccc', padding: '10px 24px',
              borderRadius: '4px', fontSize: '14px', cursor: 'pointer',
            }}
          >
            Volver a punto de venta
          </Button>
        </motion.div>

        {/* DB Error */}
        {dbError && (
          <div style={{ padding: '10px 16px', background: '#fef2f2', color: '#dc2626', fontSize: '13px', borderBottom: '1px solid #fecaca' }}>
            ⚠ {dbError}
          </div>
        )}

        {/* ====== TOTAL SUMMARY ====== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={{ padding: '16px', borderBottom: '2px solid #e0e0e0' }}
        >
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#555555' }}>Total:{' '}</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#333333' }}>
            {formatCurrencyLong(grandTotal)}
          </span>
        </motion.div>

        {/* ====== DATA TABLE ====== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          style={{ background: '#ffffff', overflowX: 'auto' }}
        >
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #dddddd' }}>
                {['Codigo', 'Ref.', 'Tickets', 'Venta', 'Comisiones', 'Premios', 'Neto', 'Final'].map((col) => (
                  <TableHead
                    key={col}
                    style={{
                      fontSize: '12px', textTransform: 'uppercase',
                      color: '#555555', fontWeight: 600, padding: '10px 12px',
                    }}
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div style={{ textAlign: 'center', padding: '48px', color: '#777777', fontSize: '14px' }}>
                      <FileText size={48} color="#cccccc" style={{ margin: '0 auto 12px' }} />
                      No hay entradas disponibles para el rango seleccionado
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading && filtered.map((entry, index) => (
                <motion.tr
                  key={entry.id}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  style={{
                    height: '44px',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
                    borderBottom: '1px solid #eeeeee',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9'; }}
                >
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px' }}>{entry.code}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px' }}>{entry.ref}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'center' }}>{entry.tickets}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'right' }}>{formatCurrencyLong(entry.venta)}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'right' }}>{formatCurrencyLong(entry.comisiones)}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'right' }}>{formatCurrencyLong(entry.premios)}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'right' }}>{formatCurrencyLong(entry.neto)}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrencyLong(entry.final)}</TableCell>
                </motion.tr>
              ))}
            </TableBody>

            {!loading && filtered.length > 0 && (
              <TableFooter>
                <TableRow style={{ backgroundColor: '#f5f5f5', borderTop: '2px solid #cccccc', fontWeight: 600 }}>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', fontWeight: 600 }}>Totales</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px' }}>-</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{totals.tickets}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrencyLong(totals.venta)}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrencyLong(totals.comisiones)}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrencyLong(totals.premios)}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrencyLong(totals.neto)}</TableCell>
                  <TableCell style={{ fontSize: '13px', color: '#333333', padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrencyLong(totals.final)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </motion.div>

        {/* ====== PAGINATION ====== */}
        <div style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: '#777777' }}>
          Mostrando {filtered.length} de {entries.length} entradas
        </div>
      </div>
    </Layout>
  );
}
