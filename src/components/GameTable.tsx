import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Play } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface GameTableProps {
  title: string;
  plays: Play[];
  onDeletePlay: (id: string) => void;
  emptyRows?: number;
  themeColor?: string;
}

const rowVariants = {
  initial: { opacity: 0, y: -10, backgroundColor: '#C8E6C9' },
  animate: { opacity: 1, y: 0, backgroundColor: 'transparent' },
  exit: { opacity: 0, x: 30, transition: { duration: 0.15 } },
};

function hexToRgb(hex: string) {
  const num = parseInt(hex.replace('#', ''), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getGradient(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const start = `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`;
  const end = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
  return { start, end, border: `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})` };
}

function getColumnColor(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.25)`,
    text: `rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)})`,
  };
}

export default function GameTable({ title, plays, onDeletePlay, emptyRows = 6, themeColor = '#5cb85c' }: GameTableProps) {
  const total = plays.reduce((sum, p) => sum + p.amount, 0);
  const gradient = getGradient(themeColor);
  const colColor = getColumnColor(themeColor);

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

  return (
    <div
      className="flex flex-col overflow-hidden h-full"
      style={{
        border: '2px solid #bbb',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header - theme color gradient */}
      <div
        className="text-center text-white font-bold uppercase"
        style={{
          background: `linear-gradient(to bottom, ${gradient.start}, ${gradient.end})`,
          fontSize: '14px',
          fontWeight: 700,
          padding: '12px',
          letterSpacing: '1px',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          borderBottom: `2px solid ${gradient.border}`,
        }}
      >
        {title}
      </div>

      {/* Column Headers */}
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: '1fr 1.2fr 0.8fr 32px',
          backgroundColor: colColor.bg,
          padding: '8px 6px',
        }}
      >
        <span className="uppercase font-bold" style={{ fontSize: '11px', fontWeight: 700, color: colColor.text }}>
          LOT
        </span>
        <span className="uppercase font-bold" style={{ fontSize: '11px', fontWeight: 700, color: colColor.text }}>
          NUM
        </span>
        <span className="uppercase font-bold text-right" style={{ fontSize: '11px', fontWeight: 700, color: colColor.text }}>
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
              variants={rowVariants}
              initial="initial"
              animate="animate"
              exit="exit"
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
