import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ModalWrapper from './ModalWrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Play } from '@/types';

interface DuplicatePlaysModalProps {
  open: boolean;
  onClose: () => void;
}

interface LotteryPlay {
  id: string;
  numbers: string;
  amount: number;
  type: string;
  lotteryName: string;
  lotteryId: string;
}

// Mock plays data organized by lottery
const mockPlaysByLottery: Record<string, LotteryPlay[]> = {
  'florida-pm': [
    { id: 'fp1', numbers: '12', amount: 50, type: 'directo', lotteryName: 'FLORIDA PM', lotteryId: 'florida-pm' },
    { id: 'fp2', numbers: '1234', amount: 25, type: 'pale', lotteryName: 'FLORIDA PM', lotteryId: 'florida-pm' },
    { id: 'fp3', numbers: '123456', amount: 10, type: 'tripleta', lotteryName: 'FLORIDA PM', lotteryId: 'florida-pm' },
    { id: 'fp4', numbers: '25', amount: 100, type: 'directo', lotteryName: 'FLORIDA PM', lotteryId: 'florida-pm' },
  ],
  'newyork-pm': [
    { id: 'ny1', numbers: '34', amount: 75, type: 'directo', lotteryName: 'NEW YORK PM', lotteryId: 'newyork-pm' },
    { id: 'ny2', numbers: '5678', amount: 30, type: 'pale', lotteryName: 'NEW YORK PM', lotteryId: 'newyork-pm' },
    { id: 'ny3', numbers: '789', amount: 20, type: 'cash3', lotteryName: 'NEW YORK PM', lotteryId: 'newyork-pm' },
  ],
  'anguila-9pm': [
    { id: 'a91', numbers: '56', amount: 40, type: 'directo', lotteryName: 'Anguila 9PM', lotteryId: 'anguila-9pm' },
    { id: 'a92', numbers: '9012', amount: 15, type: 'pale', lotteryName: 'Anguila 9PM', lotteryId: 'anguila-9pm' },
  ],
  'nacional': [
    { id: 'nc1', numbers: '78', amount: 60, type: 'directo', lotteryName: 'NACIONAL', lotteryId: 'nacional' },
    { id: 'nc2', numbers: '3456', amount: 20, type: 'pale', lotteryName: 'NACIONAL', lotteryId: 'nacional' },
    { id: 'nc3', numbers: '12345', amount: 10, type: 'pick5', lotteryName: 'NACIONAL', lotteryId: 'nacional' },
  ],
};

const lotteryOptions = [
  { value: 'florida-pm', label: 'FLORIDA PM' },
  { value: 'newyork-pm', label: 'NEW YORK PM' },
  { value: 'anguila-9pm', label: 'Anguila 9PM' },
  { value: 'nacional', label: 'NACIONAL' },
  { value: 'anguila-10am', label: 'Anguila 10AM' },
  { value: 'la-primera', label: 'LA PRIMERA' },
  { value: 'la-suerte', label: 'LA SUERTE' },
  { value: 'lotedom', label: 'LOTEDOM' },
];

export default function DuplicatePlaysModal({ open, onClose }: DuplicatePlaysModalProps) {
  const [lotteryId, setLotteryId] = useState('florida-pm');
  const [selectedPlays, setSelectedPlays] = useState<Set<string>>(new Set());
  const [duplicated, setDuplicated] = useState(false);

  const plays = useMemo(() => mockPlaysByLottery[lotteryId] || [], [lotteryId]);

  const togglePlay = (playId: string) => {
    setSelectedPlays((prev) => {
      const next = new Set(prev);
      if (next.has(playId)) {
        next.delete(playId);
      } else {
        next.add(playId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPlays.size === plays.length) {
      setSelectedPlays(new Set());
    } else {
      setSelectedPlays(new Set(plays.map((p) => p.id)));
    }
  };

  const handleDuplicate = () => {
    if (selectedPlays.size === 0) return;

    const playsToDup = plays.filter((p) => selectedPlays.has(p.id));
    const existing = JSON.parse(localStorage.getItem('matador_pending_plays') || '[]');
    const duplicated = playsToDup.map((p) => ({
      ...p,
      id: `dup-play-${Date.now()}-${p.id}`,
    }));
    localStorage.setItem('matador_pending_plays', JSON.stringify([...existing, ...duplicated]));

    setDuplicated(true);
    setTimeout(() => {
      handleClose();
    }, 800);
  };

  const handleClose = () => {
    setLotteryId('florida-pm');
    setSelectedPlays(new Set());
    setDuplicated(false);
    onClose();
  };

  return (
    <ModalWrapper open={open} onClose={handleClose} title="Duplicar jugadas" maxWidth="500px">
      <div className="flex flex-col gap-4">
        {/* Lottery selector */}
        <div>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#555555',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Sorteo
          </label>
          <Select value={lotteryId} onValueChange={(val) => { setLotteryId(val); setSelectedPlays(new Set()); }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lotteryOptions.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Select all */}
        {plays.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="rounded transition-colors"
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #cccccc',
                color: '#555555',
                cursor: 'pointer',
              }}
            >
              {selectedPlays.size === plays.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
            <span style={{ fontSize: '12px', color: '#777777' }}>
              {selectedPlays.size} de {plays.length} seleccionadas
            </span>
          </div>
        )}

        {/* Plays list */}
        <div
          className="rounded-md overflow-hidden"
          style={{ border: '1px solid #e0e0e0' }}
        >
          {plays.length > 0 ? (
            plays.map((play, idx) => (
              <motion.div
                key={play.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-3 transition-colors cursor-pointer"
                style={{
                  padding: '10px 12px',
                  backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
                  borderBottom: idx < plays.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
                onClick={() => togglePlay(play.id)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f9f9f9';
                }}
              >
                {/* Checkbox */}
                <div
                  className="flex items-center justify-center shrink-0 rounded"
                  style={{
                    width: '20px',
                    height: '20px',
                    border: selectedPlays.has(play.id) ? '2px solid #5cb85c' : '2px solid #cccccc',
                    backgroundColor: selectedPlays.has(play.id) ? '#5cb85c' : '#ffffff',
                    transition: 'all 0.15s',
                  }}
                >
                  {selectedPlays.has(play.id) && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  )}
                </div>

                {/* Play details */}
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#333333' }}>
                      {play.numbers}
                    </span>
                    <span
                      className="ml-2 rounded"
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: '#e8e8e8',
                        color: '#555555',
                        textTransform: 'uppercase',
                      }}
                    >
                      {play.type}
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#333333' }}>
                    ${play.amount.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div
              className="text-center"
              style={{ padding: '24px', color: '#777777', fontSize: '14px' }}
            >
              No hay jugadas disponibles para este sorteo
            </div>
          )}
        </div>

        {/* Success message */}
        {duplicated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-md text-center"
            style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', fontSize: '14px' }}
          >
            Jugadas duplicadas exitosamente!
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex justify-end gap-2"
        style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleClose}
          className="rounded transition-colors"
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #cccccc',
            color: '#555555',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
        >
          Cancelar
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleDuplicate}
          disabled={selectedPlays.size === 0 || duplicated}
          className="rounded transition-colors"
          style={{
            padding: '8px 24px',
            fontSize: '14px',
            backgroundColor: selectedPlays.size === 0 || duplicated ? '#cccccc' : '#5cb85c',
            border: 'none',
            color: '#ffffff',
            cursor: selectedPlays.size === 0 || duplicated ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            if (selectedPlays.size > 0 && !duplicated) e.currentTarget.style.backgroundColor = '#4cae4c';
          }}
          onMouseLeave={(e) => {
            if (selectedPlays.size > 0 && !duplicated) e.currentTarget.style.backgroundColor = '#5cb85c';
          }}
        >
          {duplicated ? 'Duplicado!' : 'Duplicar seleccionadas'}
        </motion.button>
      </div>
    </ModalWrapper>
  );
}
