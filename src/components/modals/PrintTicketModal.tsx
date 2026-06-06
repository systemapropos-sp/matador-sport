import { useState } from 'react';
import { motion } from 'framer-motion';
import { Printer, ArrowLeft } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { formatCurrencyLong } from '@/lib/utils';
import { toast } from 'sonner';
import type { Ticket } from '@/types';

interface PrintTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticket?: Ticket;
}

export default function PrintTicketModal({ open, onClose, ticket }: PrintTicketModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const ticketNumber = ticket?.ticketNumber || 'MWR-001-000000';
  const dateStr = ticket?.createdAt
    ? new Date(ticket.createdAt).toLocaleDateString('es-ES')
    : new Date().toLocaleDateString('es-ES');
  const plays = ticket?.plays || [];
  const total = ticket?.totalAmount || 0;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      toast.success('Ticket impreso exitosamente');
      onClose();
    }, 300);
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={`Imprimir ticket (${ticketNumber})`}
      maxWidth="480px"
    >
      <div className="flex flex-col gap-5">
        {/* Confirmation message */}
        <p style={{ fontSize: '14px', color: '#555555', margin: 0 }}>
          Esta seguro que desea imprimir este ticket?
        </p>

        {/* Action buttons */}
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded transition-colors"
            style={{
              flex: 1,
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: '#ffffff',
              border: '1px solid #cccccc',
              color: '#555555',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <ArrowLeft size={14} />
            VOLVER
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center justify-center gap-2 rounded transition-colors"
            style={{
              flex: 1,
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: '#5bc0de',
              border: 'none',
              color: '#ffffff',
              cursor: isPrinting ? 'wait' : 'pointer',
              opacity: isPrinting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isPrinting) e.currentTarget.style.backgroundColor = '#46b8da';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5bc0de';
            }}
          >
            <Printer size={14} />
            {isPrinting ? 'Imprimiendo...' : 'IMPRIMIR'}
          </motion.button>
        </div>

        {/* Ticket preview */}
        <div
          className="rounded-md"
          style={{
            backgroundColor: '#fafafa',
            border: '1px solid #e0e0e0',
            padding: '16px',
          }}
        >
          <div className="flex flex-col gap-3">
            {/* Header */}
            <div
              className="text-center"
              style={{
                borderBottom: '1px dashed #cccccc',
                paddingBottom: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#333333',
                  marginBottom: '4px',
                }}
              >
                MATADOR-SPORT
              </div>
              <div style={{ fontSize: '12px', color: '#777777' }}>
                Ticket: {ticketNumber}
              </div>
              <div style={{ fontSize: '12px', color: '#777777' }}>
                Fecha: {dateStr}
              </div>
            </div>

            {/* Plays list */}
            {plays.length > 0 ? (
              <div className="flex flex-col gap-1">
                <div
                  className="flex justify-between"
                  style={{
                    fontSize: '11px',
                    color: '#777777',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    borderBottom: '1px solid #e0e0e0',
                    paddingBottom: '4px',
                    marginBottom: '4px',
                  }}
                >
                  <span>Jugada</span>
                  <span>Monto</span>
                </div>
                {plays.map((play) => (
                  <div
                    key={play.id}
                    className="flex justify-between"
                    style={{
                      fontSize: '13px',
                      padding: '3px 0',
                    }}
                  >
                    <span style={{ color: '#555555' }}>
                      {play.lotteryName} - {play.type.toUpperCase()} - {play.numbers}
                    </span>
                    <span style={{ color: '#333333', fontWeight: 500 }}>
                      {formatCurrencyLong(play.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="text-center"
                style={{ fontSize: '13px', color: '#999999', padding: '12px' }}
              >
                No hay jugadas para mostrar
              </div>
            )}

            {/* Total */}
            <div
              className="flex justify-between"
              style={{
                borderTop: '1px dashed #cccccc',
                paddingTop: '12px',
                marginTop: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#333333',
                }}
              >
                Total:
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#333333',
                }}
              >
                {formatCurrencyLong(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
