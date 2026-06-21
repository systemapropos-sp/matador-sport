import { useState, useCallback, useMemo } from 'react';
import type { Play, PlayType } from '@/types';
import { detectPlayType } from '@/lib/utils';

let playIdCounter = 0;

function generatePlayId(): string {
  return `play-${++playIdCounter}-${Date.now()}`;
}

// Capacity limits per play type
export const CAPACITY_LIMITS: Record<string, number> = {
  directo: 200,
  pale: 50,
  tripleta: 10,
  cash3: 100,
  play4: 100,
  pick5: 100,
};

export interface UsePlaysReturn {
  plays: Play[];
  addPlay: (numbers: string, amount: number, lotteryId: string, lotteryName: string, typeOverride?: string) => boolean;
  removePlay: (id: string) => void;
  clearPlays: () => void;
  totalPlays: number;
  totalAmount: number;
  playsByType: Record<PlayType, Play[]>;
  capacityUsed: Record<string, number>;
  capacityRemaining: Record<string, number>;
  isAtCapacity: (type: string) => boolean;
}

export function usePlays(): UsePlaysReturn {
  const [plays, setPlays] = useState<Play[]>([]);

  const addPlay = useCallback(
    (numbers: string, amount: number, lotteryId: string, lotteryName: string, typeOverride?: string): boolean => {
      const cleanNumbers = numbers.replace(/\D/g, '');
      if (!cleanNumbers || amount <= 0) return false;

      const type = (typeOverride as PlayType) || detectPlayType(cleanNumbers);

      // Check capacity before adding
      const currentCount = plays.filter((p) => p.type === type).length;
      const limit = CAPACITY_LIMITS[type] || 999;
      if (currentCount >= limit) return false;

      const newPlay: Play = {
        id: generatePlayId(),
        numbers: cleanNumbers,
        amount,
        type,
        lotteryId,
        lotteryName,
      };

      setPlays((prev) => [...prev, newPlay]);

      // ── Notificar al DisponibleField para descuento en tiempo real ──
      window.dispatchEvent(new CustomEvent('nmv:play-added', {
        detail: { numbers: cleanNumbers, amount, lotteryId }
      }));

      return true;
    },
    [plays]
  );

  const removePlay = useCallback((id: string) => {
    const play = plays.find(p => p.id === id);
    if (play) {
      window.dispatchEvent(new CustomEvent('nmv:play-removed', {
        detail: { numbers: play.numbers, amount: play.amount, lotteryId: play.lotteryId }
      }));
    }
    setPlays((prev) => prev.filter((p) => p.id !== id));
  }, [plays]);

  const clearPlays = useCallback(() => {
    setPlays([]);
    window.dispatchEvent(new CustomEvent('nmv:plays-cleared'));
  }, []);

  const totalPlays = plays.length;
  const totalAmount = useMemo(() => plays.reduce((sum, p) => sum + p.amount, 0), [plays]);

  const playsByType = useMemo(() => {
    const grouped: Record<string, Play[]> = {
      directo: [],
      pale: [],
      tripleta: [],
      'cash3': [],
      'play4': [],
      'pick5': [],
      'super-pale': [],
    };
    plays.forEach((p) => {
      if (!grouped[p.type]) grouped[p.type] = [];
      grouped[p.type].push(p);
    });
    return grouped;
  }, [plays]);

  // Capacity tracking
  const capacityUsed = useMemo(() => {
    const used: Record<string, number> = {};
    Object.keys(CAPACITY_LIMITS).forEach((type) => {
      used[type] = plays.filter((p) => p.type === type).length;
    });
    return used;
  }, [plays]);

  const capacityRemaining = useMemo(() => {
    const remaining: Record<string, number> = {};
    Object.keys(CAPACITY_LIMITS).forEach((type) => {
      remaining[type] = (CAPACITY_LIMITS[type] || 0) - (capacityUsed[type] || 0);
    });
    return remaining;
  }, [capacityUsed]);

  const isAtCapacity = useCallback(
    (type: string): boolean => {
      return (capacityRemaining[type] || 0) <= 0;
    },
    [capacityRemaining]
  );

  return {
    plays,
    addPlay,
    removePlay,
    clearPlays,
    totalPlays,
    totalAmount,
    playsByType,
    capacityUsed,
    capacityRemaining,
    isAtCapacity,
  };
}

export default usePlays;
