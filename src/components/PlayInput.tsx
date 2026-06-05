import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Printer, ChevronDown } from 'lucide-react';
import type { Ticket } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface PlayInputProps {
  jugada: string;
  onJugadaChange: (v: string) => void;
  monto: string;
  onMontoChange: (v: string) => void;
  selectedLotteryName: string;
  detectedType: string;
  onAddPlay: () => boolean;
  onCreateTicket: () => void;
  recentTickets: Ticket[];
  totalPlays: number;
  totalAmount: number;
  capacityRemaining?: Record<string, number>;
  isAtCapacity?: (type: string) => boolean;
}

export default function PlayInput({
  jugada,
  onJugadaChange,
  monto,
  onMontoChange,
  selectedLotteryName,
  detectedType,
  onAddPlay,
  onCreateTicket,
  recentTickets,
  totalPlays,
  totalAmount,
  capacityRemaining,
  isAtCapacity,
}: PlayInputProps) {
  const jugadaRef = useRef<HTMLInputElement>(null);
  const montoRef = useRef<HTMLInputElement>(null);
  const [jugadaFlash, setJugadaFlash] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Auto-focus JUGADA on mount
  useEffect(() => {
    jugadaRef.current?.focus();
  }, []);

  // Get display text for N/A field
  const getDisplayText = (): string => {
    if (detectedType && detectedType !== 'directo') {
      return detectedType.toUpperCase();
    }
    return selectedLotteryName || '-';
  };

  const handleJugadaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      montoRef.current?.focus();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      montoRef.current?.focus();
    }
  };

  const handleMontoKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Check capacity before adding
      if (isAtCapacity && detectedType && isAtCapacity(detectedType)) {
        return;
      }
      const added = onAddPlay();
      if (added) {
        setJugadaFlash(true);
        setTimeout(() => setJugadaFlash(false), 300);
        setTimeout(() => jugadaRef.current?.focus(), 50);
      }
    }
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      jugadaRef.current?.focus();
    }
  };

  // Ctrl+Enter creates ticket
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        onCreateTicket();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCreateTicket]);

  // Capacity warning color
  const getCapacityColor = (): string => {
    if (!detectedType || !capacityRemaining) return '#555555';
    const remaining = capacityRemaining[detectedType];
    if (remaining === undefined) return '#555555';
    if (remaining <= 0) return '#d9534f';
    if (remaining <= 5) return '#f0ad4e';
    return '#555555';
  };

  return (
    <div>
      {/* Input row */}
      <div
        className="grid items-end gap-3"
        style={{
          gridTemplateColumns: '1fr 140px 1fr auto',
          padding: '12px 16px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {/* JUGADA Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
        >
          <label
            className="block uppercase"
            style={{
              fontSize: '11px',
              color: '#777777',
              letterSpacing: '1px',
              marginBottom: '4px',
            }}
          >
            JUGADA
          </label>
          <input
            ref={jugadaRef}
            type="text"
            inputMode="numeric"
            value={jugada}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6);
              onJugadaChange(v);
            }}
            onKeyDown={handleJugadaKeyDown}
            className="w-full rounded-md text-center font-semibold outline-none transition-all"
            style={{
              height: '52px',
              fontSize: '22px',
              border: jugadaFlash ? '2px solid #5cb85c' : '2px solid #cccccc',
              backgroundColor: jugadaFlash ? '#e8f5e9' : '#fafafa',
              boxShadow: jugadaFlash ? '0 0 0 3px rgba(92,184,92,0.2)' : 'none',
              transition: 'border-color 0.3s, background-color 0.3s, box-shadow 0.3s',
            }}
            placeholder=""
          />
        </motion.div>

        {/* N/A Display */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <label
            className="block uppercase"
            style={{
              fontSize: '11px',
              color: '#777777',
              letterSpacing: '1px',
              marginBottom: '4px',
            }}
          >
            N/A
          </label>
          <div
            className="w-full rounded-md flex items-center justify-center font-medium"
            style={{
              height: '52px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #e0e0e0',
              fontSize: '13px',
              color: getCapacityColor(),
            }}
          >
            {getDisplayText()}
          </div>
        </motion.div>

        {/* MONTO Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <label
            className="block uppercase"
            style={{
              fontSize: '11px',
              color: '#777777',
              letterSpacing: '1px',
              marginBottom: '4px',
            }}
          >
            MONTO
          </label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold"
              style={{ fontSize: '20px', color: '#555555' }}
            >
              $
            </span>
            <input
              ref={montoRef}
              type="number"
              inputMode="decimal"
              value={monto}
              onChange={(e) => onMontoChange(e.target.value)}
              onKeyDown={handleMontoKeyDown}
              className="w-full rounded-md text-right font-semibold outline-none transition-all"
              style={{
                height: '52px',
                fontSize: '20px',
                border: '2px solid #cccccc',
                backgroundColor: '#fafafa',
                paddingLeft: '28px',
                paddingRight: '12px',
              }}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </motion.div>

        {/* Ticket dropdown + action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex items-center gap-2"
        >
          {/* Recent tickets dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 rounded outline-none transition-colors"
              style={{
                height: '40px',
                border: '1px solid #cccccc',
                fontSize: '12px',
                color: '#333333',
                padding: '0 10px',
                backgroundColor: '#ffffff',
              }}
            >
              <span>Tickets recientes</span>
              <ChevronDown size={14} />
            </button>
            {dropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg overflow-hidden"
                style={{
                  width: '220px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 50,
                  border: '1px solid #e0e0e0',
                }}
              >
                {recentTickets.length === 0 && (
                  <div className="px-3 py-2 text-gray-400" style={{ fontSize: '12px' }}>
                    Sin tickets recientes
                  </div>
                )}
                {recentTickets.map((t) => (
                  <button
                    key={t.id}
                    className="w-full text-left px-3 py-2 transition-colors hover:bg-gray-100"
                    style={{ fontSize: '12px', color: '#333333' }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="font-medium">{t.ticketNumber}</div>
                    <div style={{ fontSize: '11px', color: '#888888' }}>
                      {formatCurrency(t.totalAmount)} - {t.plays.length} jugadas
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="flex items-center justify-center rounded transition-colors"
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid #cccccc',
              color: '#d9534f',
              backgroundColor: '#ffffff',
            }}
            title="Eliminar ticket"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="flex items-center justify-center rounded transition-colors"
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid #cccccc',
              color: '#333333',
              backgroundColor: '#ffffff',
            }}
            title="Imprimir ticket"
          >
            <Printer size={14} />
          </button>
        </motion.div>
      </div>

      {/* Play counters */}
      <div
        className="flex items-center justify-between"
        style={{
          backgroundColor: '#f5f5f5',
          padding: '10px 16px',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '13px', color: '#555555' }}>Jugadas:</span>
          <motion.span
            key={totalPlays}
            initial={{ scale: 1.2, color: '#5cb85c' }}
            animate={{ scale: 1, color: '#333333' }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: '18px', fontWeight: 700 }}
          >
            {totalPlays}
          </motion.span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '13px', color: '#555555' }}>Total</span>
          <motion.span
            key={totalAmount}
            initial={{ scale: 1.2, color: '#5cb85c' }}
            animate={{ scale: 1, color: '#333333' }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: '18px', fontWeight: 700 }}
          >
            {formatCurrency(totalAmount)}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
