import { MessageCircle, Send, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import ModalWrapper from './ModalWrapper';
import type { Play } from '@/types';

interface ShareTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticketNumber?: string;
  plays?: Play[];
  totalAmount?: number;
  createdAt?: Date;
}

function buildTicketText(
  ticketNumber: string,
  plays: Play[],
  totalAmount: number,
  createdAt: Date
): string {
  const dateStr = createdAt.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let text = `MATADOR-SPORT\n`;
  text += `Ticket: ${ticketNumber}\n`;
  text += `Fecha: ${dateStr}\n\n`;

  if (plays.length > 0) {
    plays.forEach((p) => {
      text += `${p.lotteryName} - ${p.numbers} (${p.type.toUpperCase()}) - $${p.amount.toFixed(2)}\n`;
    });
  } else {
    text += 'Sin jugadas\n';
  }

  text += `\nTotal: $${totalAmount.toFixed(2)}`;
  return encodeURIComponent(text);
}

export default function ShareTicketModal({
  open,
  onClose,
  ticketNumber = 'MWR-001-000058000',
  plays = [],
  totalAmount = 0,
  createdAt = new Date(),
}: ShareTicketModalProps) {
  const ticketText = buildTicketText(ticketNumber, plays, totalAmount, createdAt);

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${ticketText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=&text=${ticketText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSMS = () => {
    const body = decodeURIComponent(ticketText);
    const url = `sms:?body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  const buttonBaseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  return (
    <ModalWrapper open={open} onClose={onClose} title="Enviar ticket" maxWidth="400px">
      <div className="flex flex-col gap-3" style={{ padding: '8px 0' }}>
        {/* WhatsApp Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleWhatsApp}
          style={{
            ...buttonBaseStyle,
            backgroundColor: '#25D366',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1da851';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#25D366';
          }}
        >
          <MessageCircle size={20} />
          WhatsApp
        </motion.button>

        {/* Telegram Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTelegram}
          style={{
            ...buttonBaseStyle,
            backgroundColor: '#0088cc',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0077b3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0088cc';
          }}
        >
          <Send size={20} />
          Telegram
        </motion.button>

        {/* SMS Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSMS}
          style={{
            ...buttonBaseStyle,
            backgroundColor: '#777777',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#666666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#777777';
          }}
        >
          <MessageSquare size={20} />
          SMS
        </motion.button>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#e0e0e0',
            margin: '8px 0',
          }}
        />

        {/* Cancel Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          style={{
            ...buttonBaseStyle,
            backgroundColor: '#ffffff',
            color: '#555555',
            border: '1px solid #cccccc',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          Cancelar
        </motion.button>
      </div>
    </ModalWrapper>
  );
}
