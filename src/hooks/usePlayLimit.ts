/**
 * usePlayLimit — Real-time play limit checker.
 *
 * Counts how much has been sold TODAY for a specific number+lottery,
 * reading plays from tickets.metadata.plays JSONB column.
 *
 * Falls back to type-based defaults if no play_limits row configured.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PlayLimitResult {
  limite: number | null;
  vendidos: number;
  disponible: number | null;
  loading: boolean;
}

/** Default limits by number of digits */
function getTypeDefault(jugada: string): number {
  const clean = jugada.replace(/\D/g, '');
  switch (clean.length) {
    case 2: return 200;   // directo 2 digits
    case 3: return 100;   // cash3
    case 4: return 50;    // pale (4 digits)
    case 5: return 50;    // pick5
    case 6: return 10;    // tripleta
    default: return 100;
  }
}

function normalizeJugada(j: string): string {
  return j.replace(/\D/g, '');
}

export function usePlayLimit(
  jugada: string,
  lotteryId: string | null,
  businessIdProp: string | null
): PlayLimitResult {
  const [result, setResult] = useState<PlayLimitResult>({
    limite: null,
    vendidos: 0,
    disponible: null,
    loading: false,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  // ── Buffer local: acumula jugadas de la sesión actual (auto-descuento) ──
  const [localBuffer, setLocalBuffer] = useState(0);

  // Listen for ticket created, businessId ready, AND local play events
  useEffect(() => {
    const onUpdate = () => { setRefreshKey(k => k + 1); setLocalBuffer(0); };

    // When play is ADDED locally — descontar del disponible sin esperar Supabase
    const onPlayAdded = (e: Event) => {
      const d = (e as CustomEvent<{ numbers: string; amount: number; lotteryId: string }>).detail;
      const normalJugada = jugada.replace(/\D/g, '');
      if (!normalJugada || normalJugada.length < 2) return;
      const matchNum = d.numbers.replace(/\D/g,'') === normalJugada;
      const matchLot = !lotteryId || !d.lotteryId || d.lotteryId === lotteryId;
      if (matchNum && matchLot) {
        setLocalBuffer(b => b + d.amount);
      }
    };

    // When play is REMOVED locally — devolver al disponible
    const onPlayRemoved = (e: Event) => {
      const d = (e as CustomEvent<{ numbers: string; amount: number; lotteryId: string }>).detail;
      const normalJugada = jugada.replace(/\D/g, '');
      if (!normalJugada || normalJugada.length < 2) return;
      const matchNum = d.numbers.replace(/\D/g,'') === normalJugada;
      const matchLot = !lotteryId || !d.lotteryId || d.lotteryId === lotteryId;
      if (matchNum && matchLot) {
        setLocalBuffer(b => Math.max(0, b - d.amount));
      }
    };

    // When all plays are cleared — resetear buffer
    const onCleared = () => setLocalBuffer(0);

    window.addEventListener('nmv:ticket-created', onUpdate);
    window.addEventListener('nmv:businessid-ready', onUpdate);
    window.addEventListener('nmv:play-added', onPlayAdded);
    window.addEventListener('nmv:play-removed', onPlayRemoved);
    window.addEventListener('nmv:plays-cleared', onCleared);
    return () => {
      window.removeEventListener('nmv:ticket-created', onUpdate);
      window.removeEventListener('nmv:businessid-ready', onUpdate);
      window.removeEventListener('nmv:play-added', onPlayAdded);
      window.removeEventListener('nmv:play-removed', onPlayRemoved);
      window.removeEventListener('nmv:plays-cleared', onCleared);
    };
  }, [jugada, lotteryId]);

  const fetchLimit = useCallback(async () => {
    const normalJugada = normalizeJugada(jugada);
    if (!jugada || normalJugada.length < 2 || !lotteryId) {
      setResult({ limite: null, vendidos: 0, disponible: null, loading: false });
      return;
    }

    // Resolve businessId: prop → localStorage fallback
    const biz = businessIdProp || localStorage.getItem('nmv_business_id') || '';

    if (!biz) {
      const defLimit = getTypeDefault(jugada);
      setResult({ limite: defLimit, vendidos: 0, disponible: defLimit, loading: false });
      return;
    }

    setResult(prev => ({ ...prev, loading: true }));

    try {
      // 1. Get configured limit (play_limits table)
      //    play_limits: id, business_id, lottery_game_id(UUID), play_type, max_amount
      //    Since our lotteryIds are not UUIDs, filter by play_type only for now
      const normalLen = normalJugada.length;
      let playType: string;
      if (normalLen === 2) playType = 'directo';
      else if (normalLen === 3) playType = 'cash3';
      else if (normalLen === 4) playType = 'pale';
      else if (normalLen === 5) playType = 'pick5';
      else if (normalLen === 6) playType = 'tripleta';
      else playType = 'directo';

      const { data: limitRow } = await supabase
        .from('play_limits')
        .select('max_amount')
        .eq('business_id', biz)
        .eq('play_type', playType)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const maxValue: number = limitRow?.max_amount ?? getTypeDefault(jugada);

      // 2. Count how much was sold today for this specific number
      //    Each ticket has metadata.plays[] where each play has { numbers, amount, lotteryId }
      const today = new Date().toISOString().split('T')[0];
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('metadata, amount')
        .eq('business_id', biz)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .not('status', 'eq', 'cancelled');

      let totalVendidos = 0;
      if (ticketsData) {
        for (const ticket of ticketsData) {
          const meta = (ticket.metadata as Record<string, unknown>) || {};
          const plays = Array.isArray(meta.plays) ? meta.plays as Array<Record<string, unknown>> : [];

          for (const play of plays) {
            const playNorm = normalizeJugada(String(play.numbers || play.jugada || ''));
            const playLotId = String(play.lotteryId || play.lottery_id || '');
            const matchNum  = playNorm === normalJugada;
            const matchLot  = !lotteryId || !playLotId || playLotId === lotteryId;

            if (matchNum && matchLot) {
              totalVendidos += Number(play.amount || play.monto || 0);
            }
          }
        }
      }

      setResult({
        limite: maxValue,
        vendidos: totalVendidos,
        disponible: Math.max(0, maxValue - totalVendidos),
        loading: false,
      });
    } catch (err) {
      console.warn('usePlayLimit error:', err);
      const defLimit = getTypeDefault(jugada);
      setResult({ limite: defLimit, vendidos: 0, disponible: defLimit, loading: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jugada, lotteryId, businessIdProp, refreshKey]);

  useEffect(() => { fetchLimit(); }, [fetchLimit]);

  // ── Aplicar buffer local al disponible (auto-descuento en tiempo real) ──
  const effectiveResult: PlayLimitResult = {
    ...result,
    vendidos: result.vendidos + localBuffer,
    disponible: result.disponible !== null
      ? Math.max(0, result.disponible - localBuffer)
      : null,
  };

  return effectiveResult;
}
