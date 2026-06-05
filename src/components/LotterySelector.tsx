import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { regularLotteries } from '@/data/lotteries';

interface LotterySelectorProps {
  selectedLotteries: string[];
  onToggleLottery: (id: string) => void;
  multiSelect: boolean;
  onToggleMultiSelect: () => void;
}

const CARD_WIDTH = 2; // Show 2 cards at a time

export default function LotterySelector({
  selectedLotteries,
  onToggleLottery,
  multiSelect,
  onToggleMultiSelect,
}: LotterySelectorProps) {
  const [page, setPage] = useState(0);

  const lotteries = regularLotteries;
  const totalPages = Math.ceil(lotteries.length / CARD_WIDTH);

  const goLeft = () => setPage((p) => Math.max(0, p - 1));
  const goRight = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  const visibleLotteries = lotteries.slice(page * CARD_WIDTH, (page + 1) * CARD_WIDTH);

  return (
    <div
      className="flex items-center gap-4"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 16px',
      }}
    >
      {/* Left arrow */}
      <button
        onClick={goLeft}
        disabled={page === 0}
        className="flex-shrink-0 rounded-full flex items-center justify-center transition-colors"
        style={{
          width: '32px',
          height: '32px',
          backgroundColor: page === 0 ? '#eeeeee' : '#f5f5f5',
          cursor: page === 0 ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => { if (page > 0) e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
        onMouseLeave={(e) => { if (page > 0) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
      >
        <ChevronLeft size={16} color={page === 0 ? '#aaaaaa' : '#555555'} />
      </button>

      {/* Lottery cards */}
      <div className="flex items-center gap-3 flex-1">
        {visibleLotteries.map((lottery, index) => {
          const isSelected = selectedLotteries.includes(lottery.id);
          return (
            <motion.button
              key={lottery.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => onToggleLottery(lottery.id)}
              className="flex items-center gap-2 rounded-md transition-all cursor-pointer"
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                backgroundColor: isSelected ? '#5cb85c' : '#f5f5f5',
                border: isSelected ? '1px solid #4cae4c' : '1px solid #dddddd',
                color: isSelected ? '#ffffff' : '#555555',
                fontSize: '14px',
                fontWeight: 500,
                minWidth: '140px',
                flex: 1,
              }}
              whileHover={{ scale: isSelected ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Ticket size={16} />
              <span className="truncate">{lottery.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Right arrow */}
      <button
        onClick={goRight}
        disabled={page >= totalPages - 1}
        className="flex-shrink-0 rounded-full flex items-center justify-center transition-colors"
        style={{
          width: '32px',
          height: '32px',
          backgroundColor: page >= totalPages - 1 ? '#eeeeee' : '#f5f5f5',
          cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => { if (page < totalPages - 1) e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
        onMouseLeave={(e) => { if (page < totalPages - 1) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
      >
        <ChevronRight size={16} color={page >= totalPages - 1 ? '#aaaaaa' : '#555555'} />
      </button>

      {/* Mult. lot toggle */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span style={{ fontSize: '13px', color: '#555555' }}>Mult. lot</span>
        <button
          onClick={onToggleMultiSelect}
          className="relative transition-colors"
          style={{
            width: '40px',
            height: '20px',
            borderRadius: '10px',
            backgroundColor: multiSelect ? '#5cb85c' : '#cccccc',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          <motion.div
            className="absolute top-0.5 rounded-full"
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#ffffff',
            }}
            animate={{ left: multiSelect ? '22px' : '2px' }}
            transition={{ duration: 0.2 }}
          />
        </button>
      </div>
    </div>
  );
}
