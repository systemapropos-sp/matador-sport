/**
 * MobileKeypad — Teclado numérico para dispositivos móviles.
 * - Siempre visible en la parte inferior en móvil
 * - Toggle JUGADA / MONTO integrado
 * - Botones AGREGAR + CREAR TICKET + IMPRIMIR
 * - Bloquea el teclado del OS (no abre el nativo)
 */
import { motion } from 'framer-motion';
import { Delete, CheckCircle, Ticket, Printer } from 'lucide-react';

interface MobileKeypadProps {
  onKey: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;           // Agregar jugada
  onCreateTicket: () => void;    // Crear ticket
  onPrint?: () => void;          // Imprimir último ticket
  target: 'jugada' | 'monto';
  onTargetChange: (t: 'jugada' | 'monto') => void;
  jugadaValue: string;
  montoValue: string;
  themeColor?: string;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];

export default function MobileKeypad({
  onKey,
  onBackspace,
  onEnter,
  onCreateTicket,
  onPrint,
  target,
  onTargetChange,
  jugadaValue,
  montoValue,
  themeColor = '#5cb85c',
}: MobileKeypadProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        backgroundColor: '#f0f0f0',
        borderTop: '2px solid #d0d0d0',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.12)',
      }}
    >
      {/* ── Toggle JUGADA / MONTO ── */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 10px 2px' }}>
        {(['jugada', 'monto'] as const).map((t) => (
          <motion.button
            key={t}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTargetChange(t)}
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: 8,
              border: `2px solid ${target === t ? themeColor : '#d0d0d0'}`,
              backgroundColor: target === t ? themeColor : '#fff',
              color: target === t ? '#fff' : '#666',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {t === 'jugada' ? `🔢 ${jugadaValue || '—'}` : `💵 $${montoValue || '0'}`}
          </motion.button>
        ))}
      </div>

      {/* ── Number grid 3×4 ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '5px',
          padding: '4px 10px',
        }}
      >
        {KEYS.map((key) => {
          const isDel = key === '⌫';
          const isEnter = key === '✓';
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.91 }}
              onClick={() => {
                if (isDel) onBackspace();
                else if (isEnter) onEnter();
                else onKey(key);
              }}
              style={{
                height: '48px',
                fontSize: isDel || isEnter ? '13px' : '22px',
                fontWeight: 700,
                backgroundColor: isDel ? '#ffebee' : isEnter ? '#E8F5E9' : '#ffffff',
                color: isDel ? '#d32f2f' : isEnter ? '#2E7D32' : '#1f2937',
                border: `1.5px solid ${isDel ? '#ffcdd2' : isEnter ? '#C5E1A5' : '#e0e0e0'}`,
                borderRadius: 10,
                cursor: 'pointer',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              {isDel ? <Delete size={18} /> : isEnter ? <><CheckCircle size={16} /><span>OK</span></> : key}
            </motion.button>
          );
        })}
      </div>

      {/* ── CREAR TICKET + IMPRIMIR ── */}
      <div style={{ display: 'flex', gap: 6, padding: '2px 10px 8px' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCreateTicket}
          style={{
            flex: 2,
            padding: '11px 0',
            borderRadius: 10,
            backgroundColor: themeColor,
            color: '#fff',
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '0.5px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Ticket size={18} />
          CREAR TICKET
        </motion.button>
        {onPrint && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onPrint}
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: 10,
              backgroundColor: '#455A64',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Printer size={16} />
            Imprimir
          </motion.button>
        )}
      </div>
    </div>
  );
}
