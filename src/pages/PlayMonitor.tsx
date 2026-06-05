import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Printer,
  Search,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn, formatCurrencyLong } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MonitoredPlay {
  id: string;
  ticketNumber: string;
  date: string;
  time: string;
  vendor: string;
  lottery: string;
  jugada: string;
  tipo: string;
  monto: number;
}

/* ------------------------------------------------------------------ */
/*  Lottery groups (25 sorteos grouped by time period)                 */
/* ------------------------------------------------------------------ */

interface LotteryOption {
  id: string;
  label: string;
  period: 'AM' | 'PM' | 'Evening' | 'Night';
}

const lotteryOptions: LotteryOption[] = [
  // AM (Morning)
  { id: 'anguila-10am', label: 'Anguila 10AM', period: 'AM' },
  { id: 'la-primera', label: 'LA PRIMERA', period: 'AM' },
  { id: 'lotedom', label: 'LOTEDOM', period: 'AM' },
  { id: 'la-suerte', label: 'LA SUERTE', period: 'AM' },
  { id: 'king-lottery-am', label: 'King Lottery AM', period: 'AM' },
  { id: 'quiniela-real', label: 'QUINIELA REAL', period: 'AM' },
  // PM (Afternoon)
  { id: 'anguila-1pm', label: 'Anguila 1PM', period: 'PM' },
  { id: 'super-pale-real-ganamas', label: 'SUPER PALE REAL-GANA MAS', period: 'PM' },
  { id: 'gana-mas', label: 'GANA MAS', period: 'PM' },
  { id: 'super-pale-ny-ganamas', label: 'SUPER PALE NY-GANA MAS', period: 'PM' },
  { id: 'florida-am', label: 'FLORIDA AM', period: 'PM' },
  { id: 'newyork-am', label: 'NEW YORK AM', period: 'PM' },
  // Evening
  { id: 'anguila-6pm', label: 'Anguila 6PM', period: 'Evening' },
  { id: 'la-suerte-6pm', label: 'LA SUERTE 6PM', period: 'Evening' },
  { id: 'king-lottery-pm', label: 'King Lottery PM', period: 'Evening' },
  { id: 'loteca', label: 'LOTECA', period: 'Evening' },
  { id: 'la-primera-7pm', label: 'LA PRIMERA 7PM', period: 'Evening' },
  { id: 'nacional', label: 'NACIONAL', period: 'Evening' },
  { id: 'quiniela-pale', label: 'QUINIELA PALE', period: 'Evening' },
  { id: 'super-pale-nacional-qp', label: 'SUPER PALE NACIONAL-QP', period: 'Evening' },
  // Night
  { id: 'super-pale-ny-nacional', label: 'SUPER PALE NY-NACIONAL', period: 'Night' },
  { id: 'anguila-9pm', label: 'Anguila 9PM', period: 'Night' },
  { id: 'florida-pm', label: 'FLORIDA PM', period: 'Night' },
  { id: 'newyork-pm', label: 'NEW YORK PM', period: 'Night' },
];

const allLotteryIds = lotteryOptions.map((l) => l.id);

/* Period display labels */
const periodLabels: Record<string, string> = {
  AM: 'Manana (AM)',
  PM: 'Tarde (PM)',
  Evening: 'Noche (Evening)',
  Night: 'Noche (Night)',
};

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const MONITOR_STORAGE_KEY = 'matador_monitor_plays';

function readMonitorData(): MonitoredPlay[] {
  try {
    const raw = localStorage.getItem(MONITOR_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MonitoredPlay[];
    return parsed.map((p) => ({
      ...p,
      monto: Number(p.monto),
    }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function PlayMonitor() {
  const navigate = useNavigate();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedLotteries, setSelectedLotteries] = useState<string[]>(allLotteryIds);
  const [loading, setLoading] = useState(false);
  const [plays, setPlays] = useState<MonitoredPlay[]>([]);
  const [hasRefreshed, setHasRefreshed] = useState(false);

  /* Load data on mount */
  useEffect(() => {
    const data = readMonitorData();
    if (data.length > 0) {
      setPlays(data);
      setHasRefreshed(true);
    }
  }, []);

  /* Filter plays by date and selected lotteries */
  const filtered = plays.filter((p) => {
    const dateMatch = !selectedDate || p.date === selectedDate;
    const lotteryMatch = selectedLotteries.includes(p.lottery);
    return dateMatch && lotteryMatch;
  });

  /* Checkbox handlers */
  const toggleLottery = useCallback((id: string) => {
    setSelectedLotteries((prev) => {
      if (prev.includes(id)) {
        // Don't allow unchecking the last one
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedLotteries(allLotteryIds);
  }, []);

  const deselectAll = useCallback(() => {
    // Keep at least one
    setSelectedLotteries([allLotteryIds[0]]);
  }, []);

  const allSelected = selectedLotteries.length === allLotteryIds.length;

  /* Actions */
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const data = readMonitorData();
      setPlays(data);
      setHasRefreshed(true);
      setLoading(false);
    }, 600);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleBackToPOS = useCallback(() => {
    navigate('/betting-pool/ticket/create');
  }, [navigate]);

  /* Animation helpers */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.02, delayChildren: 0.05 },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 4 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  };

  /* Group lotteries by period */
  const grouped = lotteryOptions.reduce<Record<string, LotteryOption[]>>(
    (acc, opt) => {
      if (!acc[opt.period]) acc[opt.period] = [];
      acc[opt.period].push(opt);
      return acc;
    },
    {}
  );

  const periods = ['AM', 'PM', 'Evening', 'Night'];

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
            Monitoreo de jugadas
          </h1>
        </motion.div>

        {/* ====== DATE FILTER ====== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          style={{
            background: '#ffffff',
            padding: '16px',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <div className="flex flex-col gap-1" style={{ width: '200px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#555555',
              }}
            >
              Fecha
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
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
        </motion.div>

        {/* ====== SORTEOS FILTER (Fieldset) ====== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          style={{
            margin: '0 16px 16px',
            marginTop: '16px',
          }}
        >
          <fieldset
            style={{
              background: '#fafafa',
              padding: '16px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              position: 'relative',
            }}
          >
            {/* Legend */}
            <legend
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#555555',
                padding: '0 8px',
                background: '#fafafa',
              }}
            >
              Sorteos
            </legend>

            {/* Select all / deselect */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '12px',
                fontSize: '12px',
              }}
            >
              <button
                onClick={selectAll}
                className="text-[#337ab7] hover:underline"
                style={{ fontSize: '12px', fontWeight: 500 }}
              >
                Seleccionar todos
              </button>
              <button
                onClick={deselectAll}
                className="text-[#777777] hover:underline"
                style={{ fontSize: '12px', fontWeight: 500 }}
              >
                Deseleccionar todos
              </button>
            </div>

            {/* Period groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {periods.map((period) => {
                const items = grouped[period];
                if (!items || items.length === 0) return null;
                return (
                  <div key={period}>
                    {/* Period label */}
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#777777',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {periodLabels[period]}
                    </div>
                    {/* Checkbox grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '10px 16px',
                      }}
                    >
                      {items.map((lottery) => {
                        const checked = selectedLotteries.includes(lottery.id);
                        return (
                          <motion.div
                            key={lottery.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <Checkbox
                              id={`lottery-${lottery.id}`}
                              checked={checked}
                              onCheckedChange={() => toggleLottery(lottery.id)}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '3px',
                                border: checked
                                  ? '2px solid #5cb85c'
                                  : '2px solid #cccccc',
                                backgroundColor: checked ? '#5cb85c' : 'transparent',
                              }}
                            />
                            <label
                              htmlFor={`lottery-${lottery.id}`}
                              style={{
                                fontSize: '13px',
                                color: '#333333',
                                cursor: 'pointer',
                                userSelect: 'none',
                              }}
                            >
                              {lottery.label}
                            </label>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>
        </motion.div>

        {/* ====== ACTION BUTTONS ====== */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.25 }}
          style={{
            padding: '12px 16px',
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid #e0e0e0',
            background: '#ffffff',
          }}
        >
          {/* Refrescar */}
          <Button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              backgroundColor: '#337ab7',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '4px',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#286090';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#337ab7';
            }}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin mr-1.5" />
            ) : (
              <RefreshCw size={14} className="mr-1.5" />
            )}
            Refrescar
          </Button>

          {/* Print */}
          <Button
            variant="outline"
            onClick={handlePrint}
            style={{
              backgroundColor: '#f5f5f5',
              color: '#333333',
              border: '1px solid #cccccc',
              padding: '10px 20px',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
          >
            <Printer size={14} className="mr-1.5" />
            print
          </Button>

          {/* Volver a punto de venta */}
          <Button
            variant="outline"
            onClick={handleBackToPOS}
            style={{
              backgroundColor: '#f5f5f5',
              color: '#555555',
              border: '1px solid #cccccc',
              padding: '10px 20px',
              borderRadius: '4px',
              fontSize: '13px',
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

        {/* ====== RESULTS AREA ====== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          style={{
            background: '#ffffff',
            padding: '24px 16px',
            minHeight: '200px',
          }}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              /* ---- Loading state ---- */
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center"
                style={{ minHeight: '200px' }}
              >
                <Loader2 size={32} className="animate-spin text-[#cccccc]" />
              </motion.div>
            ) : filtered.length === 0 ? (
              /* ---- Empty state ---- */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  textAlign: 'center',
                  padding: '48px',
                  color: '#777777',
                  fontSize: '14px',
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Search
                    size={48}
                    color="#cccccc"
                    style={{ margin: '0 auto 12px' }}
                  />
                </motion.div>
                No hay entradas para el sorteo y la fecha elegidos
              </motion.div>
            ) : (
              /* ---- Data table ---- */
              <motion.div
                key="data"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <Table>
                  <TableHeader>
                    <TableRow
                      style={{
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      {[
                        '#',
                        'Ticket',
                        'Fecha',
                        'Usuario',
                        'Sorteo',
                        'Jugada',
                        'Tipo',
                        'Monto',
                      ].map((col) => (
                        <TableHead
                          key={col}
                          style={{
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            color: '#555555',
                            fontWeight: 600,
                            padding: '12px',
                          }}
                        >
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((play, index) => (
                      <motion.tr
                        key={play.id}
                        variants={rowVariants}
                        style={{
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
                          }}
                        >
                          {index + 1}
                        </TableCell>
                        <TableCell
                          style={{
                            fontSize: '13px',
                            color: '#333333',
                            padding: '10px 12px',
                          }}
                        >
                          {play.ticketNumber}
                        </TableCell>
                        <TableCell
                          style={{
                            fontSize: '13px',
                            color: '#333333',
                            padding: '10px 12px',
                          }}
                        >
                          {play.date} {play.time}
                        </TableCell>
                        <TableCell
                          style={{
                            fontSize: '13px',
                            color: '#333333',
                            padding: '10px 12px',
                          }}
                        >
                          {play.vendor}
                        </TableCell>
                        <TableCell
                          style={{
                            fontSize: '13px',
                            color: '#333333',
                            padding: '10px 12px',
                          }}
                        >
                          {play.lottery}
                        </TableCell>
                        <TableCell
                          style={{
                            fontSize: '13px',
                            color: '#333333',
                            padding: '10px 12px',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                          }}
                        >
                          {play.jugada}
                        </TableCell>
                        <TableCell
                          style={{
                            fontSize: '13px',
                            color: '#333333',
                            padding: '10px 12px',
                            textTransform: 'capitalize',
                          }}
                        >
                          {play.tipo}
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
                          {formatCurrencyLong(play.monto)}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>

                {/* Summary footer */}
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f5f5f5',
                    borderTop: '1px solid #e0e0e0',
                    fontSize: '13px',
                    color: '#555555',
                    fontWeight: 500,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    Total jugadas: <strong>{filtered.length}</strong>
                  </span>
                  <span>
                    Monto total:{" "}
                    <strong>
                      {formatCurrencyLong(
                        filtered.reduce((sum, p) => sum + p.monto, 0)
                      )}
                    </strong>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Layout>
  );
}
