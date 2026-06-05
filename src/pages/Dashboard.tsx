import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Printer,
  DollarSign,
  HelpCircle,
  FileText,
} from 'lucide-react';
import Layout from '@/components/Layout';
import LotterySelector from '@/components/LotterySelector';
import PlayInput from '@/components/PlayInput';
import GameTable from '@/components/GameTable';
import { usePlays } from '@/hooks/usePlays';
import { useTicket } from '@/hooks/useTicket';
import { detectPlayType } from '@/lib/utils';
import { regularLotteries } from '@/data/lotteries';

// ---- Reusable Icon Button ----
function IconButton({
  icon: Icon,
  onClick,
  title,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center justify-center rounded transition-colors"
      style={{
        width: '40px',
        height: '40px',
        border: '1px solid #cccccc',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
        color: '#555555',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f5f5f5';
        e.currentTarget.style.borderColor = '#aaaaaa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#ffffff';
        e.currentTarget.style.borderColor = '#cccccc';
      }}
      title={title}
    >
      <Icon size={18} />
    </motion.button>
  );
}

// ---- PLAYS Button ----
function PlaysButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 rounded transition-colors"
      style={{
        padding: '8px 16px',
        border: '1px solid #cccccc',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
        fontSize: '13px',
        color: '#555555',
      }}
    >
      <FileText size={16} />
      <span>Plays</span>
    </motion.button>
  );
}

// ---- Main Dashboard ----
export default function Dashboard() {
  // Plays state
  const {
    plays,
    addPlay,
    removePlay,
    clearPlays,
    totalPlays,
    totalAmount,
    playsByType,
  } = usePlays();

  // Ticket state
  const { createTicket, recentTickets } = useTicket();

  // Lottery selection
  const [selectedLotteries, setSelectedLotteries] = useState<string[]>([
    'florida-pm',
  ]);
  const [multiSelect, setMultiSelect] = useState(false);

  // Input state
  const [jugada, setJugada] = useState('');
  const [monto, setMonto] = useState('');

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // Detect play type from current jugada input
  const detectedType = jugada ? detectPlayType(jugada) : '';
  const selectedLotteryName =
    selectedLotteries.length === 1
      ? regularLotteries.find((l) => l.id === selectedLotteries[0])?.name || ''
      : selectedLotteries.length > 1
        ? `${selectedLotteries.length} loterias`
        : '';

  // Toggle lottery selection
  const handleToggleLottery = useCallback(
    (id: string) => {
      if (multiSelect) {
        setSelectedLotteries((prev) =>
          prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
        );
      } else {
        setSelectedLotteries([id]);
      }
    },
    [multiSelect]
  );

  // Add play callback
  const handleAddPlay = useCallback((): boolean => {
    if (!jugada || !monto) return false;

    const amount = parseFloat(monto);
    if (isNaN(amount) || amount <= 0) return false;
    if (selectedLotteries.length === 0) return false;

    // Add play for each selected lottery
    let added = false;
    selectedLotteries.forEach((lotId) => {
      const lottery = regularLotteries.find((l) => l.id === lotId);
      if (lottery) {
        const ok = addPlay(jugada, amount, lottery.id, lottery.name);
        if (ok) added = true;
      }
    });

    if (added) {
      setJugada('');
      setMonto('');
    }

    return added;
  }, [jugada, monto, selectedLotteries, addPlay]);

  // Create ticket callback
  const handleCreateTicket = useCallback(() => {
    if (plays.length === 0) {
      showToast('Agregue al menos una jugada');
      return;
    }

    const ticket = createTicket(plays);
    if (ticket) {
      showToast(`Ticket creado: ${ticket.ticketNumber}`);
      clearPlays();
      setJugada('');
      setMonto('');
    }
  }, [plays, createTicket, clearPlays, showToast]);

  // Keyboard shortcuts: Esc clears input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setJugada('');
        setMonto('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Table categories
  const directoPlays = playsByType['directo'] || [];
  const paleTripletaPlays = [
    ...(playsByType['pale'] || []),
    ...(playsByType['tripleta'] || []),
  ];
  const cash3Plays = playsByType['cash3'] || [];
  const play4Pick5Plays = [
    ...(playsByType['play4'] || []),
    ...(playsByType['pick5'] || []),
  ];

  return (
    <Layout>
      <div className="flex flex-col" style={{ backgroundColor: '#e8e8e8', minHeight: 'calc(100dvh - 50px)' }}>

        {/* Toast notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-[80] px-6 py-3 rounded-md shadow-lg text-white font-medium"
              style={{
                backgroundColor: toast.includes('creado') ? '#5cb85c' : '#d9534f',
                fontSize: '14px',
              }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 2: Lottery Selector Bar */}
        <LotterySelector
          selectedLotteries={selectedLotteries}
          onToggleLottery={handleToggleLottery}
          multiSelect={multiSelect}
          onToggleMultiSelect={() => setMultiSelect((v) => !v)}
        />

        {/* Section 3: Action Button Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="flex items-center gap-2"
          style={{
            backgroundColor: '#f9f9f9',
            borderBottom: '1px solid #e0e0e0',
            padding: '12px 16px',
          }}
        >
          {/* CREAR TICKET */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(92, 184, 92, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateTicket}
            disabled={totalPlays === 0}
            className="font-semibold uppercase transition-all"
            style={{
              backgroundColor: '#5cb85c',
              color: '#ffffff',
              padding: '12px 32px',
              borderRadius: '6px',
              fontSize: '14px',
              letterSpacing: '0.5px',
              opacity: totalPlays === 0 ? 0.5 : 1,
              cursor: totalPlays === 0 ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            CREAR TICKET
          </motion.button>

          {/* Icon buttons */}
          <IconButton icon={ClipboardList} title="Copiar / Duplicar" />
          <IconButton icon={Printer} title="Imprimir" />
          <IconButton icon={DollarSign} title="Pago" />
          <IconButton icon={HelpCircle} title="Ayuda" />

          {/* PLAYS button */}
          <PlaysButton />
        </motion.div>

        {/* Section 4 & 5: Play Input + Counters */}
        <PlayInput
          jugada={jugada}
          onJugadaChange={setJugada}
          monto={monto}
          onMontoChange={setMonto}
          selectedLotteryName={selectedLotteryName}
          detectedType={detectedType}
          onAddPlay={handleAddPlay}
          onCreateTicket={handleCreateTicket}
          recentTickets={recentTickets}
          totalPlays={totalPlays}
          totalAmount={totalAmount}
        />

        {/* Section 6: Game Tables Grid */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: '1fr 1fr',
            padding: '16px',
            flex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0 }}
          >
            <GameTable
              title="DIRECTO"
              plays={directoPlays}
              onDeletePlay={removePlay}
              emptyRows={5}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <GameTable
              title="PALE & TRIPLETA"
              plays={paleTripletaPlays}
              onDeletePlay={removePlay}
              emptyRows={5}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <GameTable
              title="CASH 3"
              plays={cash3Plays}
              onDeletePlay={removePlay}
              emptyRows={5}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <GameTable
              title="PLAY 4 & PICK 5"
              plays={play4Pick5Plays}
              onDeletePlay={removePlay}
              emptyRows={5}
            />
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
