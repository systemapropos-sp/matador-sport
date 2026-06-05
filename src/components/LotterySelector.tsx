import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Ticket, Clock } from 'lucide-react';
import { regularLotteries } from '@/data/lotteries';
import { schedules } from '@/data/schedules';
import { useTheme } from '@/context/ThemeContext';
import { getLotteryById } from '@/data/lotteries';

interface LotterySelectorProps {
  selectedLotteries: string[];
  onToggleLottery: (id: string) => void;
  multiSelect: boolean;
  onToggleMultiSelect: () => void;
}

const VISIBLE_COUNT = 10;

/**
 * Parse a time string like "09:45 AM" to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Check if a lottery's closing time has already passed today
 */
function isLotteryOpen(lotteryId: string): boolean {
  const schedule = schedules.find((s) => s.lotteryId === lotteryId);
  if (!schedule) return true;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const closingMinutes = parseTimeToMinutes(schedule.closingTime);

  // If closing time has passed, lottery is closed
  return currentMinutes < closingMinutes;
}

export default function LotterySelector({
  selectedLotteries,
  onToggleLottery,
  multiSelect,
  onToggleMultiSelect,
}: LotterySelectorProps) {
  const [page, setPage] = useState(0);
  const { setPrimaryColor } = useTheme();

  // Auto-filter: only show lotteries that haven't closed yet
  const openLotteries = useMemo(() => {
    return regularLotteries.filter((l) => isLotteryOpen(l.id));
  }, []);

  // Also check if currently selected lotteries are still open
  // and auto-deselect any that have closed
  const validSelected = useMemo(() => {
    return selectedLotteries.filter((id) => {
      const lottery = regularLotteries.find((l) => l.id === id);
      if (!lottery) return false;
      return isLotteryOpen(lottery.id);
    });
  }, [selectedLotteries]);

  // Update theme color when selection changes
  useEffect(() => {
    if (validSelected.length === 1) {
      const lottery = getLotteryById(validSelected[0]);
      if (lottery?.color) {
        setPrimaryColor(lottery.color);
      }
    } else if (validSelected.length === 0) {
      // Reset to default green when nothing selected
      setPrimaryColor('#5cb85c');
    }
  }, [validSelected, setPrimaryColor]);

  const totalPages = Math.max(1, Math.ceil(openLotteries.length / VISIBLE_COUNT));

  const goLeft = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const goRight = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  const visibleLotteries = openLotteries.slice(
    page * VISIBLE_COUNT,
    (page + 1) * VISIBLE_COUNT
  );

  // Current time display
  const currentTimeStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      className="flex items-center gap-2"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '8px 12px',
      }}
    >
      {/* Left arrow */}
      <button
        onClick={goLeft}
        disabled={page === 0}
        className="flex-shrink-0 rounded-full flex items-center justify-center transition-colors"
        style={{
          width: '28px',
          height: '28px',
          backgroundColor: page === 0 ? '#eeeeee' : '#f5f5f5',
          cursor: page === 0 ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => { if (page > 0) e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
        onMouseLeave={(e) => { if (page > 0) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
      >
        <ChevronLeft size={16} color={page === 0 ? '#aaaaaa' : '#555555'} />
      </button>

      {/* Lottery cards - compact for 10 visible */}
      <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
        {visibleLotteries.map((lottery, index) => {
          const isSelected = validSelected.includes(lottery.id);
          const lotteryColor = lottery.color || '#5cb85c';
          return (
            <motion.button
              key={lottery.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              onClick={() => onToggleLottery(lottery.id)}
              className="flex items-center justify-center gap-1 rounded transition-all cursor-pointer whitespace-nowrap"
              style={{
                padding: '6px 10px',
                borderRadius: '5px',
                backgroundColor: isSelected ? lotteryColor : '#f0f0f0',
                border: isSelected ? `1px solid ${lotteryColor}` : '1px solid #dddddd',
                color: isSelected ? '#ffffff' : '#444444',
                fontSize: '11px',
                fontWeight: 600,
                flex: 1,
                minWidth: 0,
              }}
              whileHover={{ scale: isSelected ? 1 : 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Ticket size={12} />
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
          width: '28px',
          height: '28px',
          backgroundColor: page >= totalPages - 1 ? '#eeeeee' : '#f5f5f5',
          cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => { if (page < totalPages - 1) e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
        onMouseLeave={(e) => { if (page < totalPages - 1) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
      >
        <ChevronRight size={16} color={page >= totalPages - 1 ? '#aaaaaa' : '#555555'} />
      </button>

      {/* Mult. lot toggle */}
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
        <span style={{ fontSize: '11px', color: '#555555', fontWeight: 500 }}>Mult. lot</span>
        <button
          onClick={onToggleMultiSelect}
          className="relative transition-colors"
          style={{
            width: '36px',
            height: '18px',
            borderRadius: '9px',
            backgroundColor: multiSelect ? '#5cb85c' : '#cccccc',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          <motion.div
            className="absolute top-0.5 rounded-full"
            style={{
              width: '14px',
              height: '14px',
              backgroundColor: '#ffffff',
            }}
            animate={{ left: multiSelect ? '20px' : '2px' }}
            transition={{ duration: 0.2 }}
          />
        </button>
      </div>

      {/* Current time indicator */}
      <div
        className="flex items-center gap-1 flex-shrink-0 ml-1"
        style={{
          fontSize: '11px',
          color: '#888888',
          backgroundColor: '#f5f5f5',
          padding: '4px 8px',
          borderRadius: '4px',
        }}
      >
        <Clock size={12} />
        {currentTimeStr}
      </div>
    </div>
  );
}
