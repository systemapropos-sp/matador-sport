import { useState, useEffect, useCallback, useMemo } from 'react';
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
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyLong } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TicketEntry {
  id: string;
  ticketNumber: string;
  date: string;
  time: string;
  user: string;
  plays: number;
  total: number;
  status: 'pending' | 'winner' | 'loser' | 'cancelled';
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const TICKETS_STORAGE_KEY = 'matador_tickets';

function readTickets(): TicketEntry[] {
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (!raw) return generateMockTickets();
    const tickets = JSON.parse(raw);
    return tickets.map((t: any) => ({
      id: t.id || `tk-${Date.now()}`,
      ticketNumber: t.ticketNumber || 'N/A',
      date: t.createdAt ? t.createdAt.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
      time: t.createdAt ? t.createdAt.split('T')[1]?.slice(0, 8) || '--:--:--' : '--:--:--',
      user: t.vendorName || 'mr01',
      plays: t.plays?.length || 0,
      total: Number(t.totalAmount) || 0,
      status: t.status || 'pending',
    }));
  } catch {
    return generateMockTickets();
  }
}

function generateMockTickets(): TicketEntry[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  return [
    { id: '1', ticketNumber: 'MWR-001-000058001', date: today, time: '09:15:32', user: 'mr01', plays: 3, total: 125.0, status: 'winner' },
    { id: '2', ticketNumber: 'MWR-001-000058002', date: today, time: '10:42:18', user: 'mr01', plays: 5, total: 250.0, status: 'pending' },
    { id: '3', ticketNumber: 'MWR-001-000058003', date: today, time: '11:20:05', user: 'admin', plays: 2, total: 50.0, status: 'loser' },
  ];
}

/* Status badge helper */
function statusLabel(status: string): string {
  switch (status) {
    case 'winner': return 'Ganador';
    case 'loser': return 'Perdedor';
    case 'cancelled': return 'Cancelado';
    default: return 'Pendiente';
  }
}

function statusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'winner': return { bg: '#d4edda', text: '#155724' };
    case 'loser': return { bg: '#f8d7da', text: '#721c24' };
    case 'cancelled': return { bg: '#e2e3e5', text: '#383d41' };
    default: return { bg: '#fff3cd', text: '#856404' };
  }
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader sub-component                                      */
/* ------------------------------------------------------------------ */

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
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
  const [entries, setEntries] = useState<TicketEntry[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  /* Load data on mount */
  useEffect(() => {
    const data = readTickets();
    if (data.length > 0) {
      setEntries(data);
      setHasSearched(true);
    }
  }, []);

  /* Filter by date range */
  const filtered = useMemo(() => {
    if (!startDate && !endDate) return entries;
    return entries.filter((e) => {
      if (!e.date) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }, [entries, startDate, endDate]);

  /* Totals */
  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, e) => ({
          tickets: acc.tickets + 1,
          plays: acc.plays + e.plays,
          total: acc.total + e.total,
        }),
        { tickets: 0, plays: 0, total: 0 }
      ),
    [filtered]
  );

  /* Actions */
  const handleViewSales = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const data = readTickets();
      setEntries(data);
      setHasSearched(true);
      setLoading(false);
    }, 600);
  }, []);

  const handleBackToPOS = useCallback(() => {
    navigate('/betting-pool/ticket/create');
  }, [navigate]);

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
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: '#333333',
              margin: 0,
            }}
          >
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
            gap: '16px',
            alignItems: 'flex-end',
          }}
        >
          {/* Fecha inicial */}
          <div className="flex flex-col gap-1">
            <label
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#555555',
              }}
            >
              Fecha inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                height: '40px',
                padding: '0 12px',
                border: '1px solid #cccccc',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#337ab7';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#cccccc';
              }}
            />
          </div>

          {/* Fecha final */}
          <div className="flex flex-col gap-1">
            <label
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#555555',
              }}
            >
              Fecha final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                height: '40px',
                padding: '0 12px',
                border: '1px solid #cccccc',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#337ab7';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#cccccc';
              }}
            />
          </div>

          {/* Ver ventas button */}
          <Button
            onClick={handleViewSales}
            disabled={loading}
            style={{
              backgroundColor: '#337ab7',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#286090';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#337ab7';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Search size={16} className="mr-2" />
            )}
            Ver ventas
          </Button>

          {/* Volver a punto de venta button */}
          <Button
            variant="outline"
            onClick={handleBackToPOS}
            style={{
              backgroundColor: '#f5f5f5',
              color: '#555555',
              border: '1px solid #cccccc',
              padding: '10px 24px',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
          >
            Volver a punto de venta
          </Button>
        </motion.div>

        {/* ====== TOTAL SUMMARY ====== */}
        {hasSearched && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              padding: '16px',
              borderBottom: '2px solid #e0e0e0',
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span style={{ fontSize: '12px', color: '#777777' }}>Tickets: </span>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#333333' }}>
                {totals.tickets}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#777777' }}>Jugadas: </span>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#333333' }}>
                {totals.plays}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#777777' }}>Total: </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#333333' }}>
                {formatCurrencyLong(totals.total)}
              </span>
            </div>
          </motion.div>
        )}

        {/* ====== DATA TABLE ====== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          style={{ background: '#ffffff', overflowX: 'auto' }}
        >
          <Table>
            <TableHeader>
              <TableRow
                style={{
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #dddddd',
                }}
              >
                {[
                  'Ticket #',
                  'Fecha',
                  'Usuario',
                  'Jugadas',
                  'Total',
                  'Estado',
                ].map((col) => (
                  <TableHead
                    key={col}
                    style={{
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      color: '#555555',
                      fontWeight: 600,
                      padding: '10px 12px',
                    }}
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              <AnimatePresence mode="wait">
                {loading ? (
                  /* ---- Loading skeleton ---- */
                  <motion.tr
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={7} style={{ padding: 0 }}>
                      <table className="w-full">
                        <tbody>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <SkeletonRow key={i} />
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </motion.tr>
                ) : filtered.length === 0 ? (
                  /* ---- Empty state ---- */
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={7}>
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '48px',
                          color: '#777777',
                          fontSize: '14px',
                        }}
                      >
                        <FileText
                          size={48}
                          color="#cccccc"
                          style={{ margin: '0 auto 12px' }}
                        />
                        {hasSearched
                          ? 'No hay entradas para el rango de fechas seleccionado'
                          : 'Presione "Ver ventas" para cargar los datos'}
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  /* ---- Data rows ---- */
                  <motion.tr
                    key="data"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <td colSpan={7} style={{ padding: 0 }}>
                      <table className="w-full">
                        <tbody>
                          {filtered.map((entry, index) => {
                            const sColor = statusColor(entry.status);
                            return (
                              <motion.tr
                                key={entry.id}
                                variants={rowVariants}
                                style={{
                                  height: '44px',
                                  backgroundColor:
                                    index % 2 === 0 ? '#ffffff' : '#f9f9f9',
                                  borderBottom: '1px solid #eeeeee',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                                  e.currentTarget.style.transition =
                                    'background-color 0.15s';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    index % 2 === 0 ? '#ffffff' : '#f9f9f9';
                                }}
                              >
                                <TableCell
                                  style={{
                                    fontSize: '13px',
                                    color: '#333333',
                                    padding: '10px 12px',
                                    fontFamily: 'monospace',
                                    fontWeight: 500,
                                  }}
                                >
                                  {entry.ticketNumber}
                                </TableCell>
                                <TableCell
                                  style={{
                                    fontSize: '13px',
                                    color: '#333333',
                                    padding: '10px 12px',
                                  }}
                                >
                                  {entry.date} {entry.time}
                                </TableCell>
                                <TableCell
                                  style={{
                                    fontSize: '13px',
                                    color: '#333333',
                                    padding: '10px 12px',
                                  }}
                                >
                                  {entry.user}
                                </TableCell>
                                <TableCell
                                  style={{
                                    fontSize: '13px',
                                    color: '#333333',
                                    padding: '10px 12px',
                                    textAlign: 'center',
                                  }}
                                >
                                  {entry.plays}
                                </TableCell>
                                <TableCell
                                  style={{
                                    fontSize: '13px',
                                    color: '#333333',
                                    padding: '10px 12px',
                                    textAlign: 'right',
                                    fontWeight: 600,
                                  }}
                                >
                                  {formatCurrencyLong(entry.total)}
                                </TableCell>
                                <TableCell
                                  style={{
                                    fontSize: '12px',
                                    padding: '10px 12px',
                                  }}
                                >
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '3px 10px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      backgroundColor: sColor.bg,
                                      color: sColor.text,
                                    }}
                                  >
                                    {statusLabel(entry.status)}
                                  </span>
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </TableBody>

            {/* ====== TOTALS ROW ====== */}
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderTop: '2px solid #cccccc',
                    fontWeight: 600,
                  }}
                >
                  <td
                    colSpan={3}
                    style={{
                      fontSize: '13px',
                      color: '#333333',
                      padding: '10px 12px',
                      fontWeight: 600,
                    }}
                  >
                    Totales
                  </td>
                  <td
                    style={{
                      fontSize: '13px',
                      color: '#333333',
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {totals.plays}
                  </td>
                  <td
                    style={{
                      fontSize: '13px',
                      color: '#333333',
                      padding: '10px 12px',
                      textAlign: 'right',
                      fontWeight: 700,
                    }}
                  >
                    {formatCurrencyLong(totals.total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </Table>
        </motion.div>

        {/* ====== PAGINATION ====== */}
        {hasSearched && (
          <div
            style={{
              padding: '12px 16px',
              textAlign: 'right',
              fontSize: '12px',
              color: '#777777',
            }}
          >
            Mostrando {filtered.length} de {entries.length} entradas
          </div>
        )}
      </div>
    </Layout>
  );
}
