import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Check } from 'lucide-react';
import ModalWrapper from './ModalWrapper';

interface PagarModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PagarModal({ open, onClose }: PagarModalProps) {
  const [ticketNumber, setTicketNumber] = useState('');
  const [found, setFound] = useState(false);

  const handleSearch = () => {
    if (ticketNumber.trim().length > 3) {
      setFound(true);
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose} title="Pagar Ticket">
      <div style={{ padding: '24px', minWidth: '360px' }}>
        {/* Search */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Numero de ticket"
            value={ticketNumber}
            onChange={(e) => {
              setTicketNumber(e.target.value);
              setFound(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 rounded border px-3 py-2"
            style={{ borderColor: '#cccccc', fontSize: '14px' }}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            className="flex items-center gap-1 rounded px-4 py-2 text-white font-medium"
            style={{ backgroundColor: '#689F38', fontSize: '13px' }}
          >
            <Search size={14} />
            Buscar
          </motion.button>
        </div>

        {/* Result */}
        {found && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded p-4"
            style={{ backgroundColor: '#E8F5E9', border: '1px solid #C5E1A5' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#33691E' }}>
                Ticket: {ticketNumber}
              </span>
              <span style={{ fontSize: '13px', color: '#689F38', fontWeight: 600 }}>
                Pendiente
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: '13px', color: '#555' }}>Monto:</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>
                $100.00
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setFound(false);
                setTicketNumber('');
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 rounded py-2.5 text-white font-bold"
              style={{ backgroundColor: '#5cb85c', fontSize: '14px' }}
            >
              <Check size={16} />
              Confirmar Pago
            </motion.button>
          </motion.div>
        )}

        {!found && ticketNumber.trim().length === 0 && (
          <div className="text-center py-6" style={{ color: '#888', fontSize: '13px' }}>
            Ingrese el numero de ticket para buscar
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}
