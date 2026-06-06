import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { formatCurrencyLong } from '@/lib/utils';

interface EmailReportModalProps {
  open: boolean;
  onClose: () => void;
  lotteryName?: string;
  totalSales?: number;
  totalWinners?: number;
  totalPending?: number;
  netAmount?: number;
}

export default function EmailReportModal({
  open,
  onClose,
  lotteryName = 'General',
  totalSales = 0,
  totalWinners = 0,
  totalPending = 0,
  netAmount = 0,
}: EmailReportModalProps) {
  const today = new Date().toLocaleDateString('es-ES');

  const toEmail = 'smartboyslab@gmail.com';
  const subject = `Reporte MATADOR-SPORT - ${lotteryName} - ${today}`;

  const bodyLines = useMemo(
    () => [
      'Reporte de Cierre - MATADOR-SPORT',
      '',
      `Lottery: ${lotteryName}`,
      `Fecha: ${today}`,
      '',
      `Total ventas: ${formatCurrencyLong(totalSales)}`,
      `Total ganadores: ${formatCurrencyLong(totalWinners)}`,
      `Total pendientes: ${formatCurrencyLong(totalPending)}`,
      `Monto neto: ${formatCurrencyLong(netAmount)}`,
      '',
      '---',
      'Enviado desde MATADOR-SPORT System',
    ],
    [lotteryName, today, totalSales, totalWinners, totalPending, netAmount]
  );

  const body = bodyLines.join('\n');
  const mailtoLink = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <ModalWrapper open={open} onClose={onClose} title="Reporte de cierre" maxWidth="500px">
      <div className="flex flex-col gap-5">
        {/* Pre-filled fields */}
        <div className="flex flex-col gap-4">
          {/* To field */}
          <div className="flex flex-col gap-1">
            <label
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#555555',
              }}
            >
              Para:
            </label>
            <input
              type="text"
              value={toEmail}
              readOnly
              style={{
                height: '38px',
                padding: '0 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#333333',
                backgroundColor: '#f5f5f5',
                outline: 'none',
              }}
            />
          </div>

          {/* Subject field */}
          <div className="flex flex-col gap-1">
            <label
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#555555',
              }}
            >
              Asunto:
            </label>
            <input
              type="text"
              value={subject}
              readOnly
              style={{
                height: '38px',
                padding: '0 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#333333',
                backgroundColor: '#f5f5f5',
                outline: 'none',
              }}
            />
          </div>

          {/* Body preview */}
          <div className="flex flex-col gap-1">
            <label
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#555555',
              }}
            >
              Contenido:
            </label>
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
                {body}
              </pre>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div
          className="grid grid-cols-2 gap-3"
        >
          <div
            className="rounded-md text-center"
            style={{
              backgroundColor: '#e3f2fd',
              border: '1px solid #bbdefb',
              padding: '10px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#555555' }}>Total ventas</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1565c0' }}>
              {formatCurrencyLong(totalSales)}
            </div>
          </div>
          <div
            className="rounded-md text-center"
            style={{
              backgroundColor: '#e8f5e9',
              border: '1px solid #c8e6c9',
              padding: '10px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#555555' }}>Total ganadores</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#2e7d32' }}>
              {formatCurrencyLong(totalWinners)}
            </div>
          </div>
          <div
            className="rounded-md text-center"
            style={{
              backgroundColor: '#fff3e0',
              border: '1px solid #ffe0b2',
              padding: '10px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#555555' }}>Total pendientes</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#ef6c00' }}>
              {formatCurrencyLong(totalPending)}
            </div>
          </div>
          <div
            className="rounded-md text-center"
            style={{
              backgroundColor: '#f3e5f5',
              border: '1px solid #e1bee7',
              padding: '10px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#555555' }}>Monto neto</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#6a1b9a' }}>
              {formatCurrencyLong(netAmount)}
            </div>
          </div>
        </div>

        {/* Send button */}
        <div className="flex justify-end" style={{ marginTop: '8px' }}>
          <motion.a
            whileTap={{ scale: 0.98 }}
            href={mailtoLink}
            className="flex items-center gap-2 rounded transition-colors no-underline"
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: '#337ab7',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#286090';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#337ab7';
            }}
          >
            <Mail size={14} />
            Enviar Reporte
          </motion.a>
        </div>
      </div>
    </ModalWrapper>
  );
}
