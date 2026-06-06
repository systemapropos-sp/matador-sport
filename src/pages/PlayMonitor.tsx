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
import { lotteries } from '@/data/lotteries';

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
  lotteryId: string;
  jugada: string;
  tipo: string;
  monto: number;
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

const MONITOR_STORAGE_KEY = 'matador_monitor_plays';
const TICKETS_STORAGE_KEY = 'matador_tickets';

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

function buildFromTickets(): MonitoredPlay[] {
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (!raw) return [];
    const tickets = JSON.parse(raw);
    const plays: MonitoredPlay[] = [];
    tickets.forEach((t: any) => {
      if (t.plays && Array.isArray(t.plays)) {
        t.plays.forEach((p: any, idx: number) => {
          plays.push({
            id: `${t.id || 'tk'}-p${idx}-${Date.now()}`,
            ticketNumber: t.ticketNumber || 'N/A',
            date: t.createdAt ? t.createdAt.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
            time: t.createdAt ? t.createdAt.split('T')[1]?.slice(0, 5) || '--:--' : '--:--',
            vendor: t.vendorName || 'mr01',
            lottery: p.lotteryName || 'Unknown',
            lotteryId: p.lotteryId || '',
            jugada: p.numbers || '',
            tipo: p.type || 'directo',
            monto: Number(p.amount) || 0,
          });
        });
      }
    });
    return plays;
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Play type helpers                                                  */
/* ------------------------------------------------------------------ */

function normalizeType(tipo: string): 'Directo' | 'Pale' | 'Tripleta' | 'Otro' {
  const t = tipo.toLowerCase().trim();
  if (t === 'directo') return 'Directo';
  if (t === 'pale') return 'Pale';
  if (t === 'tripleta') return 'Tripleta';
  return 'Otro';
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function PlayMonitor() {
  const navigate = useNavigate();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedLotteryId, setSelectedLotteryId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [plays, setPlays] = useState<MonitoredPlay[]>([]);
  const [_hasRefreshed, setHasRefreshed] = useState(false);

  /* Load data on mount */
  useEffect(() => {
    const monitorData = readMonitorData();
    const ticketData = buildFromTickets();
    const allData = [...monitorData, ...ticketData];
    if (allData.length > 0) {
      setPlays(allData);
      setHasRefreshed(true);
    }
  }, []);

  /* Filter plays by date and selected lottery */
  const filtered = useMemo(() => {
    return plays.filter((p) => {
      const dateMatch = !selectedDate || p.date === selectedDate;
      const lotteryMatch = selectedLotteryId === 'all' || p.lotteryId === selectedLotteryId;
      return dateMatch && lotteryMatch;
    });
  }, [plays, selectedDate, selectedLotteryId]);

  /* Group by play type */
  const directoPlays = filtered.filter((p) => normalizeType(p.tipo) === 'Directo');
  const palePlays = filtered.filter((p) => normalizeType(p.tipo) === 'Pale');
  const tripletaPlays = filtered.filter((p) => normalizeType(p.tipo) === 'Tripleta');

  /* Selected lottery name */
  const selectedLotteryName = useMemo(() => {
    if (selectedLotteryId === 'all') return 'todos los sorteos';
    const l = lotteries.find((lot) => lot.id === selectedLotteryId);
    return l?.name || selectedLotteryId;
  }, [selectedLotteryId]);

  /* Actions */
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const monitorData = readMonitorData();
      const ticketData = buildFromTickets();
      setPlays([...monitorData, ...ticketData]);
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

  /* Render table for a play type */
  const renderTable = (
    title: string,
    data: MonitoredPlay[],
    color: string
  ) => {
    if (data.length === 0) return null;

    const total = data.reduce((sum, p) => sum + p.monto, 0);

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-6"
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {/* Table header with color */}
        <div
          style={{
            backgroundColor: color,
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            {title}
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
            {data.length} jugada{data.length !== 1 ? 's' : ''} — {formatCurrencyLong(total)}
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: '#f5f5f5' }}>
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
            {data.map((play, index) => (
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
                    padding: '8px 12px',
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {play.jugada}
                    </span>
                    <span style={{ fontSize: '11px', color: '#777777' }}>
                      {play.lottery} — {play.ticketNumber}
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  style={{
                    fontSize: '13px',
                    color: '#333333',
                    padding: '8px 12px',
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

        {/* Subtotal */}
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#f5f5f5',
            borderTop: '1px solid #e0e0e0',
            fontSize: '12px',
            color: '#555555',
            fontWeight: 500,
            textAlign: 'right',
          }}
        >
          Subtotal {title}:{' '}
          <strong>{formatCurrencyLong(total)}</strong>
        </div>
      </motion.div>
    );
  };

  const grandTotal = filtered.reduce((sum, p) => sum + p.monto, 0);

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

        {/* ====== DATE + SORTEO FILTER ====== */}
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
          {/* Date picker */}
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

          {/* Sorteo dropdown */}
          <div className="flex flex-col gap-1" style={{ width: '260px' }}>
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
              value={selectedLotteryId}
              onChange={(e) => setSelectedLotteryId(e.target.value)}
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
              <option value="all">Todos los sorteos</option>
              {lotteries.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.schedule})
                </option>
              ))}
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

        {/* ====== TOTAL LINE ====== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          style={{
            padding: '14px 16px',
            backgroundColor: '#f9f9f9',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333' }}>
            Total para sorteo {selectedLotteryName}:{' '}
            <span style={{ fontSize: '18px', fontWeight: 700 }}>
              {formatCurrencyLong(grandTotal)}
            </span>
          </span>
        </motion.div>

        {/* ====== RESULTS AREA ====== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
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
              /* ---- Data tables ---- */
              <div>
                {renderTable('Directo', directoPlays, '#5cb85c')}
                {renderTable('Pale', palePlays, '#337ab7')}
                {renderTable('Tripleta', tripletaPlays, '#f0ad4e')}

                {/* Grand total */}
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#333333',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                    Total general ({filtered.length} jugadas)
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                    {formatCurrencyLong(grandTotal)}
                  </span>
                </div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Layout>
  );
}
