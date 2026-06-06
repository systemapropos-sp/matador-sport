import { useState } from 'react';
import { motion } from 'framer-motion';
import ModalWrapper from './ModalWrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { lotteries } from '@/data/lotteries';
import type { PlayType } from '@/types';

interface RandomGeneratorModalProps {
  open: boolean;
  onClose: () => void;
}

const playTypeOptions: { value: PlayType; label: string }[] = [
  { value: 'directo', label: 'Directo' },
  { value: 'pale', label: 'Pale' },
  { value: 'tripleta', label: 'Tripleta' },
  { value: 'cash3', label: 'Cash 3' },
  { value: 'play4', label: 'Play 4' },
  { value: 'pick5', label: 'Pick 5' },
];

function generateRandomNumber(type: PlayType): string {
  switch (type) {
    case 'directo':
      return String(Math.floor(Math.random() * 100)).padStart(2, '0');
    case 'pale':
      return String(Math.floor(Math.random() * 100)).padStart(2, '0') +
        String(Math.floor(Math.random() * 100)).padStart(2, '0');
    case 'tripleta':
      return String(Math.floor(Math.random() * 100)).padStart(2, '0') +
        String(Math.floor(Math.random() * 100)).padStart(2, '0') +
        String(Math.floor(Math.random() * 100)).padStart(2, '0');
    case 'cash3':
      return String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    case 'play4':
      return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    case 'pick5':
      return String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    default:
      return String(Math.floor(Math.random() * 100)).padStart(2, '0');
  }
}

const inputStyle: React.CSSProperties = {
  height: '40px',
  width: '100%',
  border: '1px solid #cccccc',
  borderRadius: '4px',
  padding: '0 12px',
  fontSize: '14px',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#555555',
  display: 'block',
  marginBottom: '6px',
};

export default function RandomGeneratorModal({ open, onClose }: RandomGeneratorModalProps) {
  const [lotteryId, setLotteryId] = useState(lotteries[0]?.id || '');
  const [playType, setPlayType] = useState<PlayType>('directo');
  const [monto, setMonto] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setLotteryId(lotteries[0]?.id || '');
    setPlayType('directo');
    setMonto('');
    setCantidad('');
    setError('');
    onClose();
  };

  const handleCreate = () => {
    setError('');

    if (!lotteryId || !playType || !monto.trim() || !cantidad.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    const amount = parseFloat(monto);
    const qty = parseInt(cantidad, 10);

    if (isNaN(amount) || amount <= 0) {
      setError('Monto invalido');
      return;
    }

    if (isNaN(qty) || qty <= 0 || qty > 100) {
      setError('Cantidad debe ser entre 1 y 100');
      return;
    }

    const lottery = lotteries.find((l) => l.id === lotteryId);
    const generatedPlays = [];

    for (let i = 0; i < qty; i++) {
      generatedPlays.push({
        id: `random-${Date.now()}-${i}`,
        numbers: generateRandomNumber(playType as PlayType),
        amount,
        type: playType as PlayType,
        lotteryId,
        lotteryName: lottery?.name || '',
      });
    }

    // Store in localStorage for dashboard to pick up
    const existing = JSON.parse(localStorage.getItem('matador_pending_plays') || '[]');
    localStorage.setItem('matador_pending_plays', JSON.stringify([...existing, ...generatedPlays]));

    handleClose();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#337ab7';
    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(51,122,183,0.2)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#cccccc';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <ModalWrapper open={open} onClose={handleClose} title="Generador de jugadas aleatorias" maxWidth="450px">
      <motion.div
        className="flex flex-col gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
      >
        {/* Sorteos */}
        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
          <label style={labelStyle}>Sorteos</label>
          <Select value={lotteryId} onValueChange={setLotteryId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lotteries.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Tipos de jugadas */}
        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
          <label style={labelStyle}>Tipos de jugadas</label>
          <Select value={playType} onValueChange={(val) => setPlayType(val as PlayType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              {playTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Monto */}
        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
          <label style={labelStyle}>Monto</label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ fontSize: '16px', fontWeight: 600, color: '#555555', pointerEvents: 'none' }}
            >
              $
            </span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={monto}
              onChange={(e) => { setMonto(e.target.value); setError(''); }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={{ ...inputStyle, paddingLeft: '28px' }}
            />
          </div>
        </motion.div>

        {/* Cantidad de jugadas */}
        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
          <label style={labelStyle}>Cantidad de jugadas</label>
          <input
            type="number"
            min="1"
            max="100"
            value={cantidad}
            onChange={(e) => { setCantidad(e.target.value); setError(''); }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={inputStyle}
          />
        </motion.div>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color: '#d9534f', fontSize: '13px' }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>

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
            textTransform: 'lowercase',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
        >
          cancelar
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          className="rounded transition-colors"
          style={{
            padding: '8px 24px',
            fontSize: '14px',
            backgroundColor: '#5cb85c',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4cae4c'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#5cb85c'; }}
        >
          Crear
        </motion.button>
      </div>
    </ModalWrapper>
  );
}
