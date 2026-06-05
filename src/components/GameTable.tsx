import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Play } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface GameTableProps {
  title: string;
  plays: Play[];
  onDeletePlay: (id: string) => void;
  emptyRows?: number;
}

const rowVariants = {
  initial: { opacity: 0, y: -20, backgroundColor: '#d4edda' },
  animate: { opacity: 1, y: 0, backgroundColor: 'transparent' },
  exit: { opacity: 0, x: 50, transition: { duration: 0.2 } },
};

export default function GameTable({ title, plays, onDeletePlay, emptyRows = 5 }: GameTableProps) {
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
    <div className="flex flex-col rounded overflow-hidden" style={{ border: '1px solid #dddddd' }}>
      {/* Header */}
      <div
        className="text-center text-white font-semibold uppercase"
        style={{
          background: 'linear-gradient(to bottom, #8BC34A, #4CAF50)',
          padding: '10px 16px',
          fontSize: '14px',
        }}
      >
        {title}
      </div>

      {/* Column Headers */}
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: '1fr 1.2fr 1fr 36px',
          backgroundColor: '#e0e0e0',
          padding: '8px 12px',
        }}
      >
        <span className="uppercase font-semibold" style={{ fontSize: '11px', color: '#555555' }}>LOT</span>
        <span className="uppercase font-semibold" style={{ fontSize: '11px', color: '#555555' }}>NUM</span>
        <span className="uppercase font-semibold text-right" style={{ fontSize: '11px', color: '#555555' }}>$</span>
        <span className="uppercase font-semibold text-center" style={{ fontSize: '11px', color: '#555555' }}></span>
      </div>

      {/* Body */}
      <div style={{ backgroundColor: '#f0f0f0', minHeight: '150px' }}>
        <AnimatePresence mode="popLayout">
          {plays.map((play, index) => (
            <motion.div
              key={play.id}
              variants={rowVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, delay: 0 }}
              className="grid items-center group cursor-pointer"
              style={{
                gridTemplateColumns: '1fr 1.2fr 1fr 36px',
                height: '36px',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: index % 2 === 1 ? '#e8e8e8' : '#f0f0f0',
                padding: '0 12px',
              }}
              layout
            >
              <span style={{ fontSize: '12px', color: '#333333' }}>{play.lotteryName}</span>
              <span className="font-medium" style={{ fontSize: '13px', color: '#333333' }}>
                {formatNumber(play)}
              </span>
              <span className="text-right" style={{ fontSize: '13px', color: '#333333' }}>
                {formatCurrency(play.amount)}
              </span>
              <button
                onClick={() => onDeletePlay(play.id)}
                className="flex items-center justify-center rounded transition-colors opacity-60 group-hover:opacity-100"
                style={{ color: '#d9534f', width: '28px', height: '28px' }}
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
                gridTemplateColumns: '1fr 1.2fr 1fr 36px',
                height: '36px',
                borderBottom: '1px dashed #dddddd',
                backgroundColor: (plays.length + i) % 2 === 1 ? '#e8e8e8' : '#f0f0f0',
                padding: '0 12px',
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
          padding: '10px 16px',
          fontSize: '13px',
        }}
      >
        TOTAL: {formatCurrency(total)}
      </div>
    </div>
  );
}
