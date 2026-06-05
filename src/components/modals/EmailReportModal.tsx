import { useState, useMemo } from 'react';
import { Mail, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import ModalWrapper from './ModalWrapper';
import { formatCurrency } from '@/lib/utils';

interface EmailReportModalProps {
  open: boolean;
  onClose: () => void;
  lotteryName?: string;
  totalSales?: number;
  totalWinners?: number;
  totalPending?: number;
}

export default function EmailReportModal({
  open,
  onClose,
  lotteryName = 'Florida PM',
  totalSales = 0,
  totalWinners = 0,
  totalPending = 0,
}: EmailReportModalProps) {
  const [to, setTo] = useState('smartboyslab@gmail.com');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const today = new Date().toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const defaultSubject = useMemo(
    () => `Reporte MATADOR-SPORT - ${lotteryName} - ${today}`,
    [lotteryName, today]
  );

  const netAmount = totalSales - totalWinners;

  const defaultBody = useMemo(() => {
    return (
      `Reporte de Cierre - MATADOR-SPORT\n` +
      `========================================\n\n` +
      `Loteria: ${lotteryName}\n` +
      `Fecha: ${today}\n\n` +
      `RESUMEN:\n` +
      `- Total de ventas: ${formatCurrency(totalSales)}\n` +
      `- Total de ganadores: ${formatCurrency(totalWinners)}\n` +
      `- Total pendiente: ${formatCurrency(totalPending)}\n` +
      `- Monto neto: ${formatCurrency(netAmount)}\n\n` +
      `---\n` +
      `Enviado desde MATADOR-SPORT System`
    );
  }, [lotteryName, today, totalSales, totalWinners, totalPending, netAmount]);

  // Initialize subject and body on first open
  useState(() => {
    setSubject(defaultSubject);
    setBody(defaultBody);
  });

  const handleSend = () => {
    const mailtoSubject = encodeURIComponent(subject || defaultSubject);
    const mailtoBody = encodeURIComponent(body || defaultBody);
    const mailtoLink = `mailto:${to}?subject=${mailtoSubject}&body=${mailtoBody}`;
    window.location.href = mailtoLink;
    onClose();
  };

  return (
    <ModalWrapper open={open} onClose={onClose} title="Reporte de cierre" maxWidth="520px">
      <div className="flex flex-col gap-4">
        {/* To field */}
        <div className="flex flex-col gap-1">
          <label
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#555555',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Para
          </label>
          <div className="flex items-center gap-2">
            <Mail size={16} color="#888" />
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #cccccc',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#333',
                backgroundColor: '#fafafa',
              }}
            />
          </div>
        </div>

        {/* Subject field */}
        <div className="flex flex-col gap-1">
          <label
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#555555',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Asunto
          </label>
          <input
            type="text"
            value={subject || defaultSubject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #cccccc',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#333',
              backgroundColor: '#fafafa',
            }}
          />
        </div>

        {/* Body field */}
        <div className="flex flex-col gap-1">
          <label
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#555555',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Mensaje
          </label>
          <textarea
            value={body || defaultBody}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #cccccc',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#333',
              backgroundColor: '#fafafa',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Summary Cards */}
        <div
          className="grid grid-cols-4 gap-2"
          style={{
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid #e0e0e0',
          }}
        >
          {[
            { label: 'Ventas', value: totalSales, color: '#5cb85c' },
            { label: 'Ganadores', value: totalWinners, color: '#d9534f' },
            { label: 'Pendiente', value: totalPending, color: '#f0ad4e' },
            { label: 'Neto', value: netAmount, color: '#337ab7' },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '10px',
                  color: '#777',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '2px',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: item.color,
                }}
              >
                {formatCurrency(item.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3" style={{ marginTop: '8px' }}>
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
            Cancelar
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSend}
            className="flex-1 rounded transition-colors font-semibold flex items-center justify-center gap-2"
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: '#337ab7',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#286090';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#337ab7';
            }}
          >
            <Send size={16} />
            Enviar Reporte
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  );
}
