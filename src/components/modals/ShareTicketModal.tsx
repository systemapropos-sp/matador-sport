import { motion } from 'framer-motion';
import { MessageCircle, Send, MessageSquare, X } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import type { Ticket } from '@/types';

interface ShareTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticket?: Ticket;
}

function buildTicketText(ticket: Ticket | undefined): string {
  if (!ticket) return '';

  const dateStr = ticket.createdAt
    ? new Date(ticket.createdAt).toLocaleDateString('es-ES')
    : new Date().toLocaleDateString('es-ES');

  const lines: string[] = [
    'MATADOR-SPORT',
    `Ticket: ${ticket.ticketNumber}`,
    `Fecha: ${dateStr}`,
    '',
  ];

  ticket.plays.forEach((play) => {
    lines.push(`${play.lotteryName} - ${play.type.toUpperCase()} - ${play.numbers} - $${play.amount.toFixed(2)}`);
  });

  lines.push('');
  lines.push(`Total: $${ticket.totalAmount.toFixed(2)}`);

  return lines.join('\n');
}

export default function ShareTicketModal({ open, onClose, ticket }: ShareTicketModalProps) {
  const ticketText = buildTicketText(ticket);
  const encodedText = encodeURIComponent(ticketText);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleTelegram = () => {
    window.open(`https://t.me/share/url?text=${encodedText}`, '_blank');
  };

  const handleSMS = () => {
    const smsBody = encodeURIComponent(ticketText.substring(0, 160));
    window.open(`sms:?body=${smsBody}`, '_blank');
  };

  return (
    <ModalWrapper open={open} onClose={onClose} title="Enviar ticket" maxWidth="420px">
      <div className="flex flex-col gap-4">
        {/* Ticket preview */}
        <div
          className="rounded-md"
          style={{
            backgroundColor: '#fafafa',
            border: '1px solid #e0e0e0',
            padding: '12px',
          }}
        >
          <pre
            style={{
              fontSize: '12px',
              color: '#555555',
              fontFamily: 'monospace',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {ticketText || 'No ticket data'}
          </pre>
        </div>

        {/* Share buttons */}
        <div className="flex flex-col gap-3">
          {/* WhatsApp */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 rounded transition-colors"
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: '#25D366',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1da851';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#25D366';
            }}
          >
            <MessageCircle size={18} />
            WhatsApp
          </motion.button>

          {/* Telegram */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleTelegram}
            className="flex items-center justify-center gap-2 rounded transition-colors"
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: '#0088cc',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0077b3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0088cc';
            }}
          >
            <Send size={18} />
            Telegram
          </motion.button>

          {/* SMS */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSMS}
            className="flex items-center justify-center gap-2 rounded transition-colors"
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: '#f5f5f5',
              border: '1px solid #cccccc',
              color: '#555555',
              cursor: 'pointer',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
          >
            <MessageSquare size={18} />
            SMS
          </motion.button>
        </div>

        {/* Cancel */}
        <div className="flex justify-center" style={{ marginTop: '8px' }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex items-center gap-1 transition-colors"
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              color: '#777777',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
            Cancelar
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}
