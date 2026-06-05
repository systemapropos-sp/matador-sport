import { useRef, useState } from 'react';
import { Printer, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ModalWrapper from './ModalWrapper';
import { formatCurrency } from '@/lib/utils';
import type { Play } from '@/types';

interface PrintTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticketNumber?: string;
  plays?: Play[];
  totalAmount?: number;
  createdAt?: Date;
  onShare?: () => void;
}

export default function PrintTicketModal({
  open,
  onClose,
  ticketNumber = 'MWR-001-000058000',
  plays = [],
  totalAmount = 0,
  createdAt = new Date(),
  onShare,
}: PrintTicketModalProps) {
  const [toast, setToast] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handlePrint = () => {
    showToast('Imprimiendo...');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const formatPlaysForDisplay = () => {
    if (plays.length === 0) {
      // Default mock plays for preview
      return [
        { lottery: 'Florida PM', number: '12', type: 'Directo', amount: 5 },
        { lottery: 'Florida PM', number: '34', type: 'Directo', amount: 10 },
        { lottery: 'New York PM', number: '56', type: 'Directo', amount: 20 },
      ];
    }
    return plays.map((p) => ({
      lottery: p.lotteryName,
      number: p.numbers,
      type: p.type.charAt(0).toUpperCase() + p.type.slice(1),
      amount: p.amount,
    }));
  };

  const displayPlays = formatPlaysForDisplay();
  const displayTotal = totalAmount > 0 ? totalAmount : displayPlays.reduce((s, p) => s + p.amount, 0);

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={`Imprimir ticket (${ticketNumber})`}
      maxWidth="480px"
    >
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#5cb85c',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 600,
            zIndex: 10,
          }}
        >
          {toast}
        </motion.div>
      )}

      {/* Confirmation message */}
      <p
        style={{
          fontSize: '14px',
          color: '#555555',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        Esta seguro que desea imprimir este ticket?
      </p>

      {/* Buttons */}
      <div className="flex gap-3" style={{ marginBottom: '20px' }}>
        <button
          onClick={onClose}
          className="flex-1 rounded transition-colors font-semibold"
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#ffffff',
            color: '#555555',
            border: '1px solid #cccccc',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          VOLVER
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 rounded transition-colors font-semibold flex items-center justify-center gap-2"
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#5bc0de',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#46b8da';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#5bc0de';
          }}
        >
          <Printer size={16} />
          IMPRIMIR
        </button>
        {onShare && (
          <button
            onClick={onShare}
            className="rounded transition-colors flex items-center justify-center"
            style={{
              padding: '10px 14px',
              fontSize: '14px',
              backgroundColor: '#f5f5f5',
              color: '#555555',
              border: '1px solid #cccccc',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e8e8e8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            title="Compartir"
          >
            <Share2 size={16} />
          </button>
        )}
      </div>

      {/* Ticket Preview */}
      <div
        ref={printRef}
        className="print-area"
        style={{
          border: '1px dashed #cccccc',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fafafa',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#333333',
              margin: '0 0 4px 0',
              letterSpacing: '1px',
            }}
          >
            MATADOR-SPORT
          </h3>
          <p style={{ fontSize: '11px', color: '#888888', margin: 0 }}>
            {format(createdAt, 'dd/MM/yyyy hh:mm a', { locale: es })}
          </p>
        </div>

        {/* Ticket Number */}
        <div
          style={{
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            padding: '8px 12px',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: '#777777' }}>Ticket: </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#333333' }}>
            {ticketNumber}
          </span>
        </div>

        {/* Plays List */}
        <table
          style={{
            width: '100%',
            fontSize: '12px',
            borderCollapse: 'collapse',
            marginBottom: '12px',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid #333333' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '6px 4px',
                  fontWeight: 600,
                  color: '#333',
                }}
              >
                Loteria
              </th>
              <th
                style={{
                  textAlign: 'center',
                  padding: '6px 4px',
                  fontWeight: 600,
                  color: '#333',
                }}
              >
                Numero
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '6px 4px',
                  fontWeight: 600,
                  color: '#333',
                }}
              >
                Monto
              </th>
            </tr>
          </thead>
          <tbody>
            {displayPlays.map((play, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom:
                    idx < displayPlays.length - 1 ? '1px solid #e0e0e0' : 'none',
                }}
              >
                <td style={{ padding: '6px 4px', color: '#555' }}>
                  {play.lottery}
                </td>
                <td
                  style={{
                    padding: '6px 4px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#333',
                  }}
                >
                  {play.number}
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#888',
                      marginLeft: '4px',
                    }}
                  >
                    ({play.type})
                  </span>
                </td>
                <td
                  style={{
                    padding: '6px 4px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: '#333',
                  }}
                >
                  {formatCurrency(play.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div
          style={{
            borderTop: '2px solid #333333',
            paddingTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#333' }}>
            TOTAL:
          </span>
          <span
            style={{ fontSize: '16px', fontWeight: 700, color: '#2e7d32' }}
          >
            {formatCurrency(displayTotal)}
          </span>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ fontSize: '10px', color: '#aaaaaa', margin: 0 }}>
            Gracias por jugar con MATADOR-SPORT
          </p>
          <p style={{ fontSize: '10px', color: '#aaaaaa', margin: '2px 0 0 0' }}>
            Buena suerte!
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-area,
          .print-area * {
            visibility: visible !important;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            background: white !important;
          }
        }
      `}</style>
    </ModalWrapper>
  );
}
