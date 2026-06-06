import { useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { regularLotteries } from '@/data/lotteries';
import { schedules } from '@/data/schedules';
import { useThemeContext } from '@/context/ThemeContext';

interface LotterySelectorProps {
  selectedLotteries: string[];
  onToggleLottery: (id: string) => void;
  multiSelect: boolean;
  onToggleMultiSelect: () => void;
}

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

function isLotteryOpen(lotteryId: string): boolean {
  const schedule = schedules.find((s) => s.lotteryId === lotteryId);
  if (!schedule) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const closingMinutes = parseTimeToMinutes(schedule.closingTime);
  return currentMinutes < closingMinutes;
}

function getSchedule(lotteryId: string) {
  return schedules.find((s) => s.lotteryId === lotteryId);
}

export default function LotterySelector({
  selectedLotteries,
  onToggleLottery,
  multiSelect,
  onToggleMultiSelect,
}: LotterySelectorProps) {
  const { setPrimaryColor } = useThemeContext();

  const openLotteries = useMemo(() => {
    return regularLotteries.filter((l) => isLotteryOpen(l.id));
  }, []);

  const validSelected = useMemo(() => {
    return selectedLotteries.filter((id) => {
      const lottery = regularLotteries.find((l) => l.id === id);
      if (!lottery) return false;
      return isLotteryOpen(lottery.id);
    });
  }, [selectedLotteries]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const goLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  }, []);

  const goRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 30) {
      if (diff > 0) goRight();
      else goLeft();
    }
    touchStartX.current = null;
  }, [goLeft, goRight]);

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
        className="flex-shrink-0 rounded-full flex items-center justify-center transition-colors"
        style={{
          width: '28px',
          height: '28px',
          backgroundColor: '#f5f5f5',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
      >
        <ChevronLeft size={16} color="#555555" />
      </button>

      {/* Lottery cards - scrollable */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 flex-1 overflow-x-auto"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ scrollbarWidth: 'thin' }}
      >
        {openLotteries.map((lottery, index) => {
          const isSelected = validSelected.includes(lottery.id);
          const schedule = getSchedule(lottery.id);
          return (
            <motion.button
              key={lottery.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              onClick={() => {
                onToggleLottery(lottery.id);
                if (lottery.color) setPrimaryColor(lottery.color);
              }}
              className="flex items-center justify-center gap-1.5 rounded transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: isSelected ? (lottery.color || '#5cb85c') : '#f0f0f0',
                border: isSelected ? '1px solid rgba(0,0,0,0.15)' : '1px solid #dddddd',
                color: isSelected ? '#ffffff' : '#444444',
                fontSize: '11px',
                fontWeight: 600,
                minWidth: 0,
                boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
              }}
              whileHover={{ scale: isSelected ? 1 : 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Logo image or fallback */}
              {lottery.icon ? (
                <img
                  src={lottery.icon}
                  alt={lottery.name}
                  className="rounded-full flex-shrink-0"
                  style={{ width: '20px', height: '20px', objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <span
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : (lottery.color || '#ccc'),
                  fontSize: '8px',
                  fontWeight: 800,
                  color: '#fff',
                  display: lottery.icon ? 'none' : 'flex',
                }}
              >
                {lottery.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </span>
              <div className="flex flex-col items-start">
                <span className="truncate">{lottery.name}</span>
                <span style={{ fontSize: '9px', fontWeight: 700, opacity: 0.9 }}>
                  {schedule ? `Cierra ${schedule.closingTime}` : ''}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Right arrow */}
      <button
        onClick={goRight}
        className="flex-shrink-0 rounded-full flex items-center justify-center transition-colors"
        style={{
          width: '28px',
          height: '28px',
          backgroundColor: '#f5f5f5',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
      >
        <ChevronRight size={16} color="#555555" />
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

      {/* Current time */}
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
