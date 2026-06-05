import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Search,
  Ticket,
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StoredTicket {
  id: string;
  ticketNumber: string;
  plays: Array<{
    id: string;
    numbers: string;
    amount: number;
    type: string;
    lotteryId: string;
    lotteryName: string;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  vendorId: string;
  vendorName: string;
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const TICKETS_KEY = 'matador_tickets';

function readTickets(): StoredTicket[] {
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredTicket[];
    return parsed.map((t) => ({
      ...t,
      totalAmount: Number(t.totalAmount),
      plays: t.plays || [],
    }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader sub-component                                      */
/* ------------------------------------------------------------------ */

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: '#fff3cd', color: '#856404', label: 'Pendiente' },
    winner: { bg: '#d4edda', color: '#155724', label: 'Ganador' },
    loser: { bg: '#f8d7da', color: '#721c24', label: 'Perdedor' },
    cancelled: { bg: '#e2e3e5', color: '#383d41', label: 'Cancelado' },
  };

  const s = statusStyles[status] || { bg: '#f5f5f5', color: '#555555', label: status };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: s.bg,
        color: s.color,
        textTransform: 'uppercase',
      }}
    >
      {s.label}
    </span>
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
  const [tickets, setTickets] = useState<StoredTicket[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  /* Load data on mount */
  useEffect(() => {
    const data = readTickets();
    if (data.length > 0) {
      setTickets(data);
      setHasSearched(true);
    }
  }, []);

  /* Filter by date range */
  const filtered = tickets.filter((t) => {
    if (!startDate && !endDate) return true;
    const ticketDate = format(new Date(t.createdAt), 'yyyy-MM-dd');
    if (startDate && ticketDate < startDate) return false;
    if (endDate && ticketDate > endDate) return false;
    return true;
  });

  /* Totals */
  const totals = filtered.reduce(
    (acc, t) => ({
      plays: acc.plays + (t.plays?.length || 0),
      total: acc.total + t.totalAmount,
    }),
    { plays: 0, total: 0 }
  );

  /* Actions */
  const handleViewSales = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const data = readTickets();
      setTickets(data);
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
        {hasSearched && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              padding: '16px',
              borderBottom: '2px solid #e0e0e0',
              display: 'flex',
              gap: '32px',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#555555',
                }}
              >
                Tickets:{' '}
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#333333',
                }}
              >
                {filtered.length}
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#555555',
                }}
              >
                Jugadas:{' '}
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#333333',
                }}
              >
                {totals.plays}
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#555555',
                }}
              >
                Total:{' '}
              </span>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#333333',
                }}
              >
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
                  'Numero de Ticket',
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
                    <td colSpan={6} style={{ padding: 0 }}>
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
                    <td colSpan={6}>
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '48px',
                          color: '#777777',
                          fontSize: '14px',
                        }}
                      >
                        <Ticket
                          size={48}
                          color="#cccccc"
                          style={{ margin: '0 auto 12px' }}
                        />
                        No hay tickets disponibles
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
                    <td colSpan={6} style={{ padding: 0 }}>
                      <table className="w-full">
                        <tbody>
                          {filtered.map((ticket, index) => (
                            <motion.tr
                              key={ticket.id}
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
                                  fontWeight: 600,
                                }}
                              >
                                {ticket.ticketNumber}
                              </TableCell>
                              <TableCell
                                style={{
                                  fontSize: '13px',
                                  color: '#333333',
                                  padding: '10px 12px',
                                }}
                              >
                                {format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm')}
                              </TableCell>
                              <TableCell
                                style={{
                                  fontSize: '13px',
                                  color: '#333333',
                                  padding: '10px 12px',
                                }}
                              >
                                {ticket.vendorName}
                              </TableCell>
                              <TableCell
                                style={{
                                  fontSize: '13px',
                                  color: '#333333',
                                  padding: '10px 12px',
                                  textAlign: 'center',
                                }}
                              >
                                {ticket.plays?.length || 0}
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
                                {formatCurrencyLong(ticket.totalAmount)}
                              </TableCell>
                              <TableCell
                                style={{
                                  padding: '10px 12px',
                                }}
                              >
                                <StatusBadge status={ticket.status} />
                              </TableCell>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </TableBody>

            {/* ====== TOTALS ROW ====== */}
            {!loading && filtered.length > 0 && (
              <TableFooter>
                <TableRow
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderTop: '2px solid #cccccc',
                    fontWeight: 600,
                  }}
                >
                  <TableCell
                    style={{
                      fontSize: '13px',
                      color: '#333333',
                      padding: '10px 12px',
                      fontWeight: 600,
                    }}
                  >
                    Totales
                  </TableCell>
                  <TableCell
                    style={{
                      fontSize: '13px',
                      color: '#333333',
                      padding: '10px 12px',
                    }}
                  >
                    -
                  </TableCell>
                  <TableCell
                    style={{
                      fontSize: '13px',
                      color: '#333333',
                      padding: '10px 12px',
                    }}
                  >
                    -
                  </TableCell>
                  <TableCell
                    style={{
                      fontSize: '13px',
                      color: '#333333',
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {totals.plays}
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
                    {formatCurrencyLong(totals.total)}
                  </TableCell>
                  <TableCell
                    style={{
                      fontSize: '13px',
                      color: '#333333',
                      padding: '10px 12px',
                    }}
                  >
                    -
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </motion.div>

        {/* ====== PAGINATION ====== */}
        <div
          style={{
            padding: '12px 16px',
            textAlign: 'right',
            fontSize: '12px',
            color: '#777777',
          }}
        >
          Mostrando {filtered.length} de {tickets.length} tickets
        </div>
      </div>
    </Layout>
  );
}
