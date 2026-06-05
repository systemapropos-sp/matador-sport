import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Play } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface GameTableProps {
  title: string;
  plays: Play[];
  onDeletePlay: (id: string) => void;
  emptyRows?: number;
  compact?: boolean;
}

const rowVariants = {
  initial: { opacity: 0, y: -10, backgroundColor: '#d4edda' },
  animate: { opacity: 1, y: 0, backgroundColor: 'transparent' },
  exit: { opacity: 0, x: 30, transition: { duration: 0.15 } },
};

export default function GameTable({ title, plays, onDeletePlay, emptyRows = 4, compact = true }: GameTableProps) {
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

  return (
    <div className="flex flex-col rounded overflow-hidden h-full" style={{ border: '1px solid #cccccc' }}>
      {/* Header - green gradient */}
      <div
        className="text-center text-white font-bold uppercase whitespace-nowrap"
        style={{
          background: 'linear-gradient(to bottom, #9CCC65, #7CB342)',
          padding: compact ? '8px 8px' : '10px 16px',
          fontSize: compact ? '12px' : '14px',
        }}
      >
        {title}
      </div>

      {/* Column Headers */}
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: '1fr 1.2fr 0.8fr 28px',
          backgroundColor: '#e8e8e8',
          padding: compact ? '6px 8px' : '8px 12px',
        }}
      >
        <span className="uppercase font-bold" style={{ fontSize: '10px', color: '#555555' }}>LOT</span>
        <span className="uppercase font-bold" style={{ fontSize: '10px', color: '#555555' }}>NUM</span>
        <span className="uppercase font-bold text-right" style={{ fontSize: '10px', color: '#555555' }}>$</span>
        <span />
      </div>

      {/* Body */}
      <div style={{ backgroundColor: '#f0f0f0', flex: 1 }}>
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
                gridTemplateColumns: '1fr 1.2fr 0.8fr 28px',
                height: compact ? '30px' : '36px',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: index % 2 === 1 ? '#e8e8e8' : '#f0f0f0',
                padding: compact ? '0 8px' : '0 12px',
              }}
              layout
            >
              <span className="truncate" style={{ fontSize: '11px', color: '#333333' }}>{play.lotteryName}</span>
              <span className="font-medium" style={{ fontSize: '12px', color: '#333333' }}>
                {formatNumber(play)}
              </span>
              <span className="text-right" style={{ fontSize: '12px', color: '#333333' }}>
                {formatCurrency(play.amount)}
              </span>
              <button
                onClick={() => onDeletePlay(play.id)}
                className="flex items-center justify-center rounded transition-colors opacity-0 group-hover:opacity-100"
                style={{ color: '#d9534f', width: '22px', height: '22px' }}
                title="Eliminar jugada"
              >
                <Trash2 size={12} />
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
                gridTemplateColumns: '1fr 1.2fr 0.8fr 28px',
                height: compact ? '30px' : '36px',
                borderBottom: '1px dashed #dddddd',
                backgroundColor: (plays.length + i) % 2 === 1 ? '#e8e8e8' : '#f0f0f0',
                padding: compact ? '0 8px' : '0 12px',
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
        className="text-right text-white font-semibold"
        style={{
          backgroundColor: '#3C3F54',
          padding: compact ? '8px 10px' : '10px 16px',
          fontSize: '12px',
        }}
      >
        TOTAL: {formatCurrency(total)}
      </div>
    </div>
  );
}
