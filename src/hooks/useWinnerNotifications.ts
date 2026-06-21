/**
 * useWinnerNotifications — Realtime winner ticket alerts for Navbar bell icon
 * Subscribes to Supabase postgres_changes on the tickets table (status=winner)
 * Persists "seen" IDs in localStorage so badge resets correctly.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface WinnerNotification {
  id: string;
  ticketNumber: string;
  prizeAmount: number;
  totalAmount: number;
  vendorName?: string;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = 'nmv_seen_winner_notifs';

function getSeenIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}
function persistSeen(ids: string[]) {
  const seen = getSeenIds();
  ids.forEach(id => seen.add(id));
  // Keep only last 200 to avoid bloat
  const arr = [...seen].slice(-200);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

export function useWinnerNotifications(businessId: string | null) {
  const [notifications, setNotifications] = useState<WinnerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadWinners = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('tickets')
        .select('id, ticket_number, metadata, created_at, status, total_amount')
        .eq('business_id', businessId)
        .eq('status', 'paid')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!data) return;
      const seen = getSeenIds();
      const notifs: WinnerNotification[] = data.map(row => {
        const meta = (row.metadata as Record<string, unknown>) || {};
        const prizeAmt = Number((meta.prize_amount as number) ?? (meta.payout as number) ?? 0);
        return {
          id: row.id,
          ticketNumber: String(row.ticket_number || '???'),
          prizeAmount: prizeAmt,
          totalAmount: Number(row.total_amount ?? (meta.total_amount as number) ?? 0),
          vendorName: (meta.vendor_name as string) || undefined,
          createdAt: row.created_at || new Date().toISOString(),
          read: seen.has(row.id),
        };
      });
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (e) {
      console.warn('[useWinnerNotifications] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Initial load
  useEffect(() => {
    loadWinners();
  }, [loadWinners]);

  // Supabase Realtime — watch for ticket status changes to 'winner'
  useEffect(() => {
    if (!businessId) return;
    const channel = supabase
      .channel(`winner-notif-${businessId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets' },
        (payload) => {
          const newRow = payload.new as Record<string, unknown>;
          if (newRow?.status === 'paid' && newRow?.business_id === businessId) {
            // New winner found — reload
            loadWinners();
            // Play a subtle sound if available
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain); gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              osc.frequency.setValueAtTime(1046, ctx.currentTime + 0.1);
              gain.gain.setValueAtTime(0.15, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
              osc.start(); osc.stop(ctx.currentTime + 0.3);
            } catch { /* audio not critical */ }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [businessId, loadWinners]);

  const markAllRead = useCallback(() => {
    const ids = notifications.map(n => n.id);
    persistSeen(ids);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications]);

  const markOneRead = useCallback((id: string) => {
    persistSeen([id]);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  return { notifications, unreadCount, loading, markAllRead, markOneRead, refresh: loadWinners };
}
