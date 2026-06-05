import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Play } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

interface GameTableProps {
  title: string;
  plays: Play[];
  onDeletePlay: (id: string) => void;
  emptyRows?: number;
}

export default function GameTable({ title, plays, onDeletePlay, emptyRows = 6 }: GameTableProps) {
  const { gradientStart, gradientEnd, primaryColor, hexToRgba } = useTheme();
  const total = plays.reduce((sum, p) => sum + p.amount, 0);

  const formatNumber = (play: Play): string => {
    const n = play.numbers;
    if (play.type === 'pale' && n.length === 4) {
      return `${n.slice(0, 2)}-${n.slice(2, 4)}`;
    }
    if (play.type === 'tripleta' && n.length === 6) {
      return `${n.slice(0, 2)}-${n.slice(2, 4)}-${n.slice(4, 6)}`;
    }
    return n;
  };

  const displayRows = Math.max(emptyRows, plays.length);

  // Compute column header color from primary
  const colHeaderBg = hexToRgba(primaryColor, 0.35);
  const colHeaderText = primaryColor;

  return (
    <div
      className="flex flex-col overflow-hidden h-full"
      style={{
        border: '2px solid #bbb',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header - dynamic gradient based on lottery color */}
      <div
        className="text-center text-white font-bold uppercase"
        style={{
          background: `linear-gradient(to bottom, ${gradientStart}, ${gradientEnd})`,
          fontSize: '14px',
          fontWeight: 700,
          padding: '12px',
          letterSpacing: '1px',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          borderBottom: `2px solid ${gradientEnd}`,
        }}
      >
        {title}
      </div>

      {/* Column Headers */}
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: '1fr 1.2fr 0.8fr 32px',
          backgroundColor: colHeaderBg,
          padding: '8px 6px',
        }}
      >
        <span className="uppercase font-bold" style={{ fontSize: '11px', fontWeight: 700, color: colHeaderText }}>
          LOT
        </span>
        <span className="uppercase font-bold" style={{ fontSize: '11px', fontWeight: 700, color: colHeaderText }}>
          NUM
        </span>
        <span className="uppercase font-bold text-right" style={{ fontSize: '11px', fontWeight: 700, color: colHeaderText }}>
          $
        </span>
        <span />
      </div>

      {/* Body */}
      <div style={{ backgroundColor: '#EEEEEE', flex: 1, minHeight: '280px' }}>
        <AnimatePresence mode="popLayout">
          {plays.map((play, index) => (
            <motion.div
              key={play.id}
              initial={{ opacity: 0, y: -10, backgroundColor: hexToRgba(primaryColor, 0.3) }}
              animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
              exit={{ opacity: 0, x: 30, transition: { duration: 0.15 } }}
              transition={{ duration: 0.2, delay: 0 }}
              className="grid items-center group cursor-pointer"
              style={{
                gridTemplateColumns: '1fr 1.2fr 0.8fr 32px',
                height: '40px',
                borderBottom: '1px solid #d0d0d0',
                backgroundColor: index % 2 === 1 ? '#E0E0E0' : '#EEEEEE',
                padding: '0 6px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#BDBDBD';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = index % 2 === 1 ? '#E0E0E0' : '#EEEEEE';
              }}
              layout
            >
              <span className="truncate" style={{ fontSize: '13px', color: '#333', fontWeight: 500 }}>
                {play.lotteryName}
              </span>
              <span style={{ fontSize: '13px', color: '#333', fontWeight: 600 }}>
                {formatNumber(play)}
              </span>
              <span className="text-right" style={{ fontSize: '13px', color: '#333', fontWeight: 500 }}>
                {formatCurrency(play.amount)}
              </span>
              <button
                onClick={() => onDeletePlay(play.id)}
                className="flex items-center justify-center rounded transition-all opacity-0 group-hover:opacity-100"
                style={{
                  color: '#d9534f',
                  width: '24px',
                  height: '24px',
                }}
                title="Eliminar jugada"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty placeholder rows */}
        {plays.length < displayRows &&
          Array.from({ length: displayRows - plays.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="grid items-center"
              style={{
                gridTemplateColumns: '1fr 1.2fr 0.8fr 32px',
                height: '40px',
                borderBottom: '1px dashed #cccccc',
                backgroundColor: (plays.length + i) % 2 === 1 ? '#E0E0E0' : '#EEEEEE',
                padding: '0 6px',
              }}
            >
              <span>&nbsp;</span>
              <span>&nbsp;</span>
              <span>&nbsp;</span>
              <span>&nbsp;</span>
            </div>
          ))}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between"
        style={{
          backgroundColor: '#3C3F54',
          padding: '12px',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.5px',
        }}
      >
        <span style={{ color: '#ffffff' }}>
          {plays.length} jugada{plays.length !== 1 ? 's' : ''}
        </span>
        <span style={{ color: '#ffffff' }}>
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
