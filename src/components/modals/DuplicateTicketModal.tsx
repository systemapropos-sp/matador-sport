import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Copy } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { formatCurrencyLong } from '@/lib/utils';
import { lotteries } from '@/data/lotteries';
import type { Ticket } from '@/types';

interface DuplicateTicketModalProps {
  open: boolean;
  onClose: () => void;
}

function searchTicket(ticketNumber: string): Ticket | null {
  try {
    const stored = localStorage.getItem('matador_tickets');
    if (stored) {
      const tickets: Ticket[] = JSON.parse(stored);
      return tickets.find((t) => t.ticketNumber === ticketNumber) || null;
    }
  } catch { /* ignore */ }

  // Mock search
  if (ticketNumber.startsWith('MWR-001-')) {
    return {
      id: `mock-${ticketNumber}`,
      ticketNumber,
      plays: [
        { id: '1', numbers: '12', amount: 50, type: 'directo', lotteryId: 'anguila-10am', lotteryName: 'Anguila 10AM' },
        { id: '2', numbers: '1234', amount: 25, type: 'pale', lotteryId: 'florida-pm', lotteryName: 'FLORIDA PM' },
      ],
      totalAmount: 75,
      status: 'loser',
      createdAt: new Date(Date.now() - 86400000).toISOString() as unknown as Date,
      vendorId: 'mr01',
      vendorName: 'mr01',
    };
  }
  return null;
}

export default function DuplicateTicketModal({ open, onClose }: DuplicateTicketModalProps) {
  const [ticketNum, setTicketNum] = useState('');
  const [foundTicket, setFoundTicket] = useState<Ticket | null>(null);
  const [targetLotteryId, setTargetLotteryId] = useState('');
  const [error, setError] = useState('');
  const [duplicated, setDuplicated] = useState(false);

  const handleClose = () => {
    setTicketNum('');
    setFoundTicket(null);
    setTargetLotteryId('');
    setError('');
    setDuplicated(false);
    onClose();
  };

  const handleSearch = () => {
    setError('');
    setFoundTicket(null);
    setTargetLotteryId('');
    setDuplicated(false);

    const fullNumber = ticketNum.startsWith('MWR-001-') ? ticketNum : `MWR-001-${ticketNum}`;
    const result = searchTicket(fullNumber);

    if (result) {
      setFoundTicket(result);
    } else {
      setError('Ticket no encontrado');
    }
  };

  const handleDuplicate = () => {
    if (!foundTicket) return;

    const targetLottery = lotteries.find((l) => l.id === targetLotteryId);
    if (!targetLottery) {
      setError('Seleccione una loteria destino');
      return;
    }

    // Create new duplicated plays for the selected target lottery
    const existing = JSON.parse(localStorage.getItem('matador_pending_plays') || '[]');
    const dupPlays = foundTicket.plays.map((p) => ({
      ...p,
      id: `dup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      lotteryId: targetLottery.id,
      lotteryName: targetLottery.name,
    }));

    localStorage.setItem('matador_pending_plays', JSON.stringify([...existing, ...dupPlays]));
    setDuplicated(true);
    setTimeout(() => {
      handleClose();
    }, 1200);
  };

  return (
    <ModalWrapper open={open} onClose={handleClose} title="Duplicar Ticket" maxWidth="560px">
      <div className="flex flex-col gap-4">
        {/* Ticket number input */}
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
            Numero de ticket
          </label>
          <div className="flex gap-2">
            <div
              className="flex items-center rounded"
              style={{
                border: '1px solid #cccccc',
                flex: 1,
                overflow: 'hidden',
              }}
            >
              <span
                className="shrink-0"
                style={{
                  padding: '0 8px',
                  fontSize: '13px',
                  color: '#777777',
                  borderRight: '1px solid #e0e0e0',
                  backgroundColor: '#f5f5f5',
                  lineHeight: '42px',
                }}
              >
                MWR-001-
              </span>
              <input
                type="text"
                value={ticketNum}
                onChange={(e) => { setTicketNum(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="000058XXX"
                style={{
                  height: '42px',
                  flex: 1,
                  border: 'none',
                  padding: '0 12px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              className="flex items-center gap-1 rounded transition-colors"
              style={{
                padding: '0 16px',
                backgroundColor: '#337ab7',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#286090'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#337ab7'; }}
            >
              <Search size={14} />
              Buscar
            </motion.button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: '#d9534f', fontSize: '13px' }}
          >
            {error}
          </motion.p>
        )}

        {/* Ticket details */}
        {foundTicket && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md"
            style={{
              backgroundColor: '#f9f9f9',
              border: '1px solid #e0e0e0',
              padding: '16px',
            }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span style={{ fontSize: '12px', color: '#777777' }}>Ticket:</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333', fontFamily: 'monospace' }}>
                  {foundTicket.ticketNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: '12px', color: '#777777' }}>Fecha:</span>
                <span style={{ fontSize: '13px', color: '#333333' }}>
                  {new Date(foundTicket.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: '12px', color: '#777777' }}>Usuario:</span>
                <span style={{ fontSize: '13px', color: '#333333' }}>{foundTicket.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: '12px', color: '#777777' }}>Monto:</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333' }}>
                  {formatCurrencyLong(foundTicket.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: '12px', color: '#777777' }}>Jugadas:</span>
                <span style={{ fontSize: '13px', color: '#333333' }}>{foundTicket.plays.length}</span>
              </div>

              {/* Plays list */}
              {foundTicket.plays.length > 0 && (
                <div className="mt-2" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#777777', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Jugadas del ticket
                  </span>
                  <div className="flex flex-col gap-1">
                    {foundTicket.plays.map((play) => (
                      <div
                        key={play.id}
                        className="flex justify-between"
                        style={{
                          padding: '6px 8px',
                          backgroundColor: '#ffffff',
                          borderRadius: '4px',
                          fontSize: '13px',
                          border: '1px solid #eeeeee',
                        }}
                      >
                        <span style={{ color: '#555555' }}>
                          <strong>{play.numbers}</strong> — {play.lotteryName}
                        </span>
                        <span style={{ color: '#333333', fontWeight: 500 }}>
                          {play.type.toUpperCase()} — ${play.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target lottery dropdown */}
              <div className="mt-2" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '12px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#555555',
                    display: 'block',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Loteria destino
                </label>
                <select
                  value={targetLotteryId}
                  onChange={(e) => { setTargetLotteryId(e.target.value); setError(''); }}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    border: '1px solid #cccccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#337ab7'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#cccccc'; }}
                >
                  <option value="">Seleccionar loteria...</option>
                  {lotteries.map((lottery) => (
                    <option key={lottery.id} value={lottery.id}>
                      {lottery.name} ({lottery.schedule})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success message */}
        {duplicated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-md text-center"
            style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', fontSize: '14px' }}
          >
            <Copy size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Ticket duplicado exitosamente a la loteria seleccionada!
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
          disabled={!foundTicket || !targetLotteryId || duplicated}
          className="rounded transition-colors"
          style={{
            padding: '8px 24px',
            fontSize: '14px',
            backgroundColor: !foundTicket || !targetLotteryId || duplicated ? '#cccccc' : '#5cb85c',
            border: 'none',
            color: '#ffffff',
            cursor: !foundTicket || !targetLotteryId || duplicated ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            if (foundTicket && targetLotteryId && !duplicated) e.currentTarget.style.backgroundColor = '#4cae4c';
          }}
          onMouseLeave={(e) => {
            if (foundTicket && targetLotteryId && !duplicated) e.currentTarget.style.backgroundColor = '#5cb85c';
          }}
        >
          <Copy size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          {duplicated ? 'Duplicado!' : 'Duplicar'}
        </motion.button>
      </div>
    </ModalWrapper>
  );
}
