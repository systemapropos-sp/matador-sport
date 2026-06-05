import { useState, useCallback, useMemo } from 'react';
import type { Play, PlayType } from '@/types';
import { detectPlayType } from '@/lib/utils';

let playIdCounter = 0;

function generatePlayId(): string {
  return `play-${++playIdCounter}-${Date.now()}`;
}

export interface UsePlaysReturn {
  plays: Play[];
  addPlay: (numbers: string, amount: number, lotteryId: string, lotteryName: string) => boolean;
  removePlay: (id: string) => void;
  clearPlays: () => void;
  totalPlays: number;
  totalAmount: number;
  playsByType: Record<PlayType, Play[]>;
}

export function usePlays(): UsePlaysReturn {
  const [plays, setPlays] = useState<Play[]>([]);

  const addPlay = useCallback(
    (numbers: string, amount: number, lotteryId: string, lotteryName: string): boolean => {
      const cleanNumbers = numbers.replace(/\D/g, '');
      if (!cleanNumbers || amount <= 0) return false;

      const type = detectPlayType(cleanNumbers);

      const newPlay: Play = {
        id: generatePlayId(),
        numbers: cleanNumbers,
        amount,
        type,
        lotteryId,
        lotteryName,
      };

      setPlays((prev) => [...prev, newPlay]);
      return true;
    },
    []
  );

  const removePlay = useCallback((id: string) => {
    setPlays((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearPlays = useCallback(() => {
    setPlays([]);
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

  return {
    plays,
    addPlay,
    removePlay,
    clearPlays,
    totalPlays,
    totalAmount,
    playsByType,
  };
}

export default usePlays;
