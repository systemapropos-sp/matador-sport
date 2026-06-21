import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { schedules } from '@/data/schedules';
import { useThemeContext } from '@/context/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSorteosVendor } from '@/hooks/useSorteosVendor';

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

/** isLotteryOpen — checks closingTime from dynamic map first, then hardcoded schedules */
function isLotteryOpen(lotteryId: string, now: Date, dynamicClosingTime?: string): boolean {
  const closingStr = dynamicClosingTime || schedules.find((s) => s.lotteryId === lotteryId)?.closingTime;
  if (!closingStr) return true; // unknown → assume open
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const closingMinutes = parseTimeToMinutes(closingStr);
  return currentMinutes < closingMinutes;
}

function getScheduleClosingTime(lotteryId: string, closingTimesMap: Record<string, string>): string | undefined {
  return closingTimesMap[lotteryId] || schedules.find((s) => s.lotteryId === lotteryId)?.closingTime;
}

export default function LotterySelector({
  selectedLotteries,
  onToggleLottery,
  multiSelect,
  onToggleMultiSelect,
}: LotterySelectorProps) {
  const { setPrimaryColor } = useThemeContext();

  // Dynamic lotteries from Supabase (fallback: hardcoded)
  const { lotteries: supabaseLotteries, closingTimes } = useSorteosVendor();

  // Live clock — updates every second for countdown
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Only open lotteries — sorted by closing time (earliest first)
  const openLotteries = useMemo(() => {
    const open = supabaseLotteries.filter((l) =>
      isLotteryOpen(l.id, now, closingTimes[l.id])
    );
    return [...open].sort((a, b) => {
      const ta = getScheduleClosingTime(a.id, closingTimes) ?? '11:59 PM';
      const tb = getScheduleClosingTime(b.id, closingTimes) ?? '11:59 PM';
      return parseTimeToMinutes(ta) - parseTimeToMinutes(tb);
    });
  }, [supabaseLotteries, closingTimes, now]);

  const validSelected = useMemo(() => {
    return selectedLotteries.filter((id) => {
      const lottery = supabaseLotteries.find((l) => l.id === id);
      if (!lottery) return false;
      return isLotteryOpen(lottery.id, now, closingTimes[lottery.id]);
    });
  }, [selectedLotteries, supabaseLotteries, closingTimes, now]);

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

  const isMobile = useIsMobile();
  // If ≤ 7 open lotteries, expand each card to fill available width
  const shouldFill = !isMobile && openLotteries.length <= 7 && openLotteries.length > 0;

  const currentTimeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Countdown label: when ≤ 30 min left, show MM:SS in red
  function getCountdownLabel(lotteryId: string): { label: string; urgent: boolean } | null {
    const closingTimeStr = getScheduleClosingTime(lotteryId, closingTimes);
    if (!closingTimeStr) return null;
    const closingMins = parseTimeToMinutes(closingTimeStr);
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const minsLeft = closingMins - currentMins;
    if (minsLeft > 30 || minsLeft < 0) return null;
    // seconds remaining
    const closingTotalSecs = closingMins * 60;
    const currentTotalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const secsLeft = closingTotalSecs - currentTotalSecs;
    if (secsLeft <= 0) return null;
    const mm = Math.floor(secsLeft / 60);
    const ss = secsLeft % 60;
    return { label: `${mm}:${ss.toString().padStart(2, '0')}`, urgent: secsLeft <= 300 };
  }

  // Shared lottery card renderer
  const renderCard = (lottery: { id: string; name: string; icon?: string; color?: string }, index: number) => {
    const isSelected = validSelected.includes(lottery.id);
    const closingTimeForCard = getScheduleClosingTime(lottery.id, closingTimes);
    const countdown = getCountdownLabel(lottery.id);
    return (
      <motion.button
        key={lottery.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        onClick={() => {
          onToggleLottery(lottery.id);
          if (lottery.color) setPrimaryColor(lottery.color);
        }}
        className="flex items-center gap-1.5 cursor-pointer"
        style={{
          padding: isMobile ? '8px 10px' : '6px 10px',
          borderRadius: '7px',
          backgroundColor: isSelected ? (lottery.color || '#5cb85c') : '#f0f0f0',
          border: isSelected ? '2px solid rgba(0,0,0,0.15)' : countdown ? '1px solid #f0ad4e' : '1px solid #dddddd',
          color: isSelected ? '#ffffff' : '#444444',
          fontSize: isMobile ? '12px' : '11px',
          fontWeight: 600,
          boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.22)' : countdown ? '0 0 0 1px rgba(240,173,78,0.4)' : 'none',
          width: isMobile ? '100%' : 'auto',
          // Fill available width when few lotteries remain
          flex: shouldFill ? '1 1 0' : '0 0 auto',
          flexShrink: shouldFill ? 1 : 0,
          justifyContent: shouldFill ? 'center' : 'flex-start',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
        whileTap={{ scale: 0.95 }}
      >
        {lottery.icon ? (
          <img
            src={lottery.icon}
            alt={lottery.name}
            className="rounded-full flex-shrink-0"
            style={{ width: '22px', height: '22px', objectFit: 'cover' }}
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              t.style.display = 'none';
              const fb = t.nextElementSibling as HTMLElement;
              if (fb) fb.style.display = 'flex';
            }}
          />
        ) : null}
        <span
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: '22px', height: '22px',
            backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : (lottery.color || '#ccc'),
            fontSize: '8px', fontWeight: 800, color: '#fff',
            display: lottery.icon ? 'none' : 'flex',
          }}
        >
          {lottery.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </span>
        <div className="flex flex-col items-start overflow-hidden">
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
            {lottery.name}
          </span>
          {/* Show countdown if ≤30 min, else show closing time */}
          {countdown ? (
            <span style={{
              fontSize: '9px', fontWeight: 800,
              color: isSelected ? 'rgba(255,255,255,0.95)' : (countdown.urgent ? '#d9534f' : '#f0ad4e'),
              animation: countdown.urgent ? 'pulse 1s infinite' : undefined,
            }}>
              ⚠ {countdown.label}
            </span>
          ) : closingTimeForCard ? (
            <span style={{ fontSize: '9px', fontWeight: 700, opacity: 0.85 }}>
              ⏱ {closingTimeForCard}
            </span>
          ) : null}
        </div>
      </motion.button>
    );
  };

  // ── MOBILE: 2-column scrollable grid ──────────────────────────────
  if (isMobile) {
    return (
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
        {/* Toggle + time bar */}
        <div className="flex items-center justify-between" style={{ padding: '6px 12px 4px' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '11px', color: '#555', fontWeight: 600 }}>Multi-lotería</span>
            <button
              onClick={onToggleMultiSelect}
              className="relative"
              style={{ width: '36px', height: '18px', borderRadius: '9px', backgroundColor: multiSelect ? '#0D9488' : '#ccc', border: 'none', cursor: 'pointer' }}
            >
              <motion.div
                className="absolute top-0.5 rounded-full"
                style={{ width: '14px', height: '14px', backgroundColor: '#fff' }}
                animate={{ left: multiSelect ? '20px' : '2px' }}
                transition={{ duration: 0.2 }}
              />
            </button>
          </div>
          <div className="flex items-center gap-1" style={{ fontSize: '11px', color: '#888', backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
            <Clock size={11} />
            {currentTimeStr}
          </div>
        </div>
        {/* 2-col grid */}
        <div
          className="loterias-grid"
          style={{ maxHeight: '140px', padding: '0 10px 8px' }}
        >
          {openLotteries.map((lottery, index) => renderCard(lottery, index))}
          {openLotteries.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '12px', fontSize: '12px', color: '#999' }}>
              No hay loterías abiertas en este momento
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DESKTOP: horizontal scroll with arrows ────────────────────────
  return (
    <div
      className="flex items-center gap-2"
      style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0', padding: '8px 12px' }}
    >
      <button
        onClick={goLeft}
        className="flex-shrink-0 rounded-full flex items-center justify-center transition-colors"
        style={{ width: '28px', height: '28px', backgroundColor: '#f5f5f5', cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
      >
        <ChevronLeft size={16} color="#555555" />
      </button>

      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 flex-1 overflow-x-auto"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#ccc transparent' }}
      >
        {openLotteries.map((lottery, index) => renderCard(lottery, index))}
        {openLotteries.length === 0 && (
          <span style={{ fontSize: '12px', color: '#999', padding: '0 8px' }}>
            No hay loterías abiertas
          </span>
        )}
      </div>

      <button
        onClick={goRight}
        className="flex-shrink-0 rounded-full flex items-center justify-center transition-colors"
        style={{ width: '28px', height: '28px', backgroundColor: '#f5f5f5', cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
      >
        <ChevronRight size={16} color="#555555" />
      </button>

      <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
        <span style={{ fontSize: '11px', color: '#555555', fontWeight: 500 }}>Mult. lot</span>
        <button
          onClick={onToggleMultiSelect}
          className="relative transition-colors"
          style={{ width: '36px', height: '18px', borderRadius: '9px', backgroundColor: multiSelect ? '#0D9488' : '#cccccc', cursor: 'pointer', border: 'none' }}
        >
          <motion.div
            className="absolute top-0.5 rounded-full"
            style={{ width: '14px', height: '14px', backgroundColor: '#ffffff' }}
            animate={{ left: multiSelect ? '20px' : '2px' }}
            transition={{ duration: 0.2 }}
          />
        </button>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 ml-1"
        style={{ fontSize: '11px', color: '#888888', backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
        <Clock size={12} />
        {currentTimeStr}
      </div>
    </div>
  );
}
