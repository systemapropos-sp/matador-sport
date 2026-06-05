import { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { formatCurrencyLong } from '@/lib/utils';

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

export const lotteryOptions: LotteryOption[] = [
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
/*  Play type helpers                                                  */
/* ------------------------------------------------------------------ */

type PlayCategory = 'directo' | 'pale' | 'tripleta';

function categorizePlay(tipo: string): PlayCategory {
  const t = tipo.toLowerCase();
  if (t === 'directo') return 'directo';
  if (t === 'pale' || t === 'super-pale') return 'pale';
  if (t === 'tripleta') return 'tripleta';
  // Default based on jugada length
  return 'directo';
}

const categoryLabels: Record<PlayCategory, string> = {
  directo: 'Directo',
  pale: 'Pale',
  tripleta: 'Tripleta',
};

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function PlayMonitor() {
  const navigate = useNavigate();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedLottery, setSelectedLottery] = useState<string>(allLotteryIds[0]);
  const [loading, setLoading] = useState(false);
  const [plays, setPlays] = useState<MonitoredPlay[]>([]);
  const [_hasRefreshed, setHasRefreshed] = useState(false);

  /* Load data on mount */
  useEffect(() => {
    const data = readMonitorData();
    if (data.length > 0) {
      setPlays(data);
      setHasRefreshed(true);
    }
  }, []);

  /* Filter plays by date and selected lottery */
  const filtered = plays.filter((p) => {
    const dateMatch = !selectedDate || p.date === selectedDate;
    const lotteryMatch = p.lottery === selectedLottery;
    return dateMatch && lotteryMatch;
  });

  /* Get selected lottery label */
  const selectedLotteryLabel = useMemo(() => {
    return lotteryOptions.find((l) => l.id === selectedLottery)?.label || selectedLottery;
  }, [selectedLottery]);

  /* Group filtered plays by category */
  const playsByCategory: Record<PlayCategory, MonitoredPlay[]> = {
    directo: [],
    pale: [],
    tripleta: [],
  };

  filtered.forEach((p) => {
    const cat = categorizePlay(p.tipo);
    playsByCategory[cat].push(p);
  });

  /* Total for the selected sorteo */
  const sorteoTotal = filtered.reduce((sum, p) => sum + p.monto, 0);

  /* Category totals */
  const categoryTotals: Record<PlayCategory, { count: number; total: number }> = {
    directo: {
      count: playsByCategory.directo.length,
      total: playsByCategory.directo.reduce((s, p) => s + p.monto, 0),
    },
    pale: {
      count: playsByCategory.pale.length,
      total: playsByCategory.pale.reduce((s, p) => s + p.monto, 0),
    },
    tripleta: {
      count: playsByCategory.tripleta.length,
      total: playsByCategory.tripleta.reduce((s, p) => s + p.monto, 0),
    },
  };

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

  /* Group lotteries by period for dropdown */
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

        {/* ====== TOTAL SUMMARY FOR SELECTED SORTEO ====== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          style={{
            padding: '14px 16px',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#333333',
            }}
          >
            Total para sorteo {selectedLotteryLabel}:{' '}
          </span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#337ab7',
            }}
          >
            {formatCurrencyLong(sorteoTotal)}
          </span>
        </motion.div>

        {/* ====== FILTERS ROW: Date + Sorteo Dropdown ====== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
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
          {/* Date picker */}
          <div className="flex flex-col gap-1" style={{ width: '160px' }}>
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

          {/* Sorteo dropdown */}
          <div className="flex flex-col gap-1" style={{ minWidth: '220px', flex: 1, maxWidth: '400px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#555555',
              }}
            >
              Sorteo
            </label>
            <select
              value={selectedLottery}
              onChange={(e) => setSelectedLottery(e.target.value)}
              style={{
                height: '40px',
                padding: '0 12px',
                border: '1px solid #cccccc',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: '#ffffff',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#337ab7';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#cccccc';
              }}
            >
              {periods.map((period) => {
                const items = grouped[period];
                if (!items || items.length === 0) return null;
                return (
                  <optgroup key={period} label={periodLabels[period]}>
                    {items.map((lottery) => (
                      <option key={lottery.id} value={lottery.id}>
                        {lottery.label}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
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
            Print
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

        {/* ====== RESULTS AREA: 3 Separate Tables ====== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          style={{
            background: '#ffffff',
            padding: '16px',
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
                <Search
                  size={48}
                  color="#cccccc"
                  style={{ margin: '0 auto 12px' }}
                />
                No hay entradas para el sorteo y la fecha elegidos
              </motion.div>
            ) : (
              /* ---- 3 Category Tables ---- */
              <motion.div
                key="data"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-6"
              >
                {/* Directo Table */}
                <PlayCategoryTable
                  category="directo"
                  label={categoryLabels.directo}
                  plays={playsByCategory.directo}
                  total={categoryTotals.directo.total}
                  count={categoryTotals.directo.count}
                  rowVariants={rowVariants}
                />

                {/* Pale Table */}
                <PlayCategoryTable
                  category="pale"
                  label={categoryLabels.pale}
                  plays={playsByCategory.pale}
                  total={categoryTotals.pale.total}
                  count={categoryTotals.pale.count}
                  rowVariants={rowVariants}
                />

                {/* Tripleta Table */}
                <PlayCategoryTable
                  category="tripleta"
                  label={categoryLabels.tripleta}
                  plays={playsByCategory.tripleta}
                  total={categoryTotals.tripleta.total}
                  count={categoryTotals.tripleta.count}
                  rowVariants={rowVariants}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/*  Individual category table                                          */
/* ------------------------------------------------------------------ */

interface PlayCategoryTableProps {
  category: PlayCategory;
  label: string;
  plays: MonitoredPlay[];
  total: number;
  count: number;
  rowVariants: { hidden: { opacity: number; y: number }; visible: { opacity: number; y: number; transition: { duration: number } } };
}

function PlayCategoryTable({ label, plays, total, count, rowVariants }: PlayCategoryTableProps) {
  if (plays.length === 0) {
    return (
      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#f5f5f5',
            borderBottom: '2px solid #dddddd',
            fontSize: '14px',
            fontWeight: 700,
            color: '#333333',
            textTransform: 'uppercase',
          }}
        >
          {label}
          <span
            style={{
              marginLeft: '8px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#777777',
            }}
          >
            (0 jugadas)
          </span>
        </div>
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#999999',
            fontSize: '13px',
          }}
        >
          No hay jugadas tipo {label} para este sorteo
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 16px',
          backgroundColor: '#f5f5f5',
          borderBottom: '2px solid #dddddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#333333',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: '12px', color: '#777777' }}>
          {count} jugadas — Total:{' '}
          <strong style={{ color: '#333333' }}>{formatCurrencyLong(total)}</strong>
        </span>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow
            style={{
              backgroundColor: '#fafafa',
            }}
          >
            {['JUGADA', 'IMPORTE'].map((col) => (
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
          {plays.map((play, index) => (
            <motion.tr
              key={play.id}
              variants={rowVariants}
              style={{
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
                borderBottom: '1px solid #eeeeee',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
                e.currentTarget.style.transition = 'background-color 0.15s';
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
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                }}
              >
                {play.jugada}
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

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
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
          Total {label}: <strong>{count}</strong> jugadas
        </span>
        <span>
          <strong>{formatCurrencyLong(total)}</strong>
        </span>
      </div>
    </div>
  );
}
