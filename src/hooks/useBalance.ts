/**
 * useBalance — Supabase-connected balance hook for vendors.
 * Calculates totals from real tickets + balance_transactions tables.
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export interface BalanceTransaction {
  id: string;
  date: string;
  type: 'venta' | 'premio' | 'abono' | 'retiro';
  amount: number;
  description: string;
}

export interface BalanceSummary {
  totalSales: number;
  totalPrizes: number;
  netBalance: number;
  adminShare: number;
  vendorShare: number;
  pendingAdmin: number;
  pendingVendor: number;
}

const ADMIN_SHARE_PERCENT  = 0.8;
const VENDOR_SHARE_PERCENT = 0.2;

function getVendorId(): string | null {
  return localStorage.getItem('nmv_vendor_id');
}

export interface UseBalanceReturn {
  transactions: BalanceTransaction[];
  summary: BalanceSummary;
  loading: boolean;
  registerAbono: (amount: number) => Promise<boolean>;
  registerRetiro: (amount: number) => Promise<boolean>;
  clearTransactions: (pin?: string) => boolean;
  refresh: () => void;
}

export function useBalance(): UseBalanceReturn {
  const vendorId = getVendorId();

  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Load data from Supabase on mount and on refresh
  useEffect(() => {
    if (!vendorId) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      // 1. Fetch tickets (ventas + premios pagados)
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('id, amount, status, created_at, ticket_number, metadata')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      // 2. Fetch manual balance transactions (abonos + retiros)
      const { data: txData } = await supabase
        .from('balance_transactions')
        .select('id, type, amount, description, created_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      const combined: BalanceTransaction[] = [];

      // Convert tickets to venta transactions
      if (ticketsData) {
        for (const t of ticketsData) {
          if (t.status !== 'cancelled') {
            combined.push({
              id: `ticket-${t.id}`,
              date: t.created_at,
              type: 'venta',
              amount: Number((t.metadata as any)?.total_amount ?? t.amount ?? 0),
              description: `Ticket #${t.ticket_number || t.id}`,
            });
          }
          // If ticket has been paid, check metadata for prize amount
          const metaPrize = (t.metadata as any)?.prize_amount ?? 0;
          if (t.status === 'paid' && metaPrize > 0) {
            combined.push({
              id: `prize-${t.id}`,
              date: t.created_at,
              type: 'premio',
              amount: metaPrize,
              description: `Premio ticket #${t.ticket_number || t.id}`,
            });
          }
        }
      }

      // Add manual transactions (abono/retiro)
      if (txData) {
        for (const tx of txData) {
          combined.push({
            id: tx.id,
            date: tx.created_at,
            type: tx.type as 'abono' | 'retiro',
            amount: tx.amount,
            description: tx.description || '',
          });
        }
      }

      // Sort newest first
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(combined);
      setLoading(false);
    };

    load();

    // Realtime subscription: refresh when tickets or balance_transactions change
    const ticketSub = supabase
      .channel(`balance-tickets-${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `vendor_id=eq.${vendorId}` }, refresh)
      .subscribe();

    const txSub = supabase
      .channel(`balance-txns-${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'balance_transactions', filter: `vendor_id=eq.${vendorId}` }, refresh)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ticketSub);
      supabase.removeChannel(txSub);
    };
  }, [vendorId, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo<BalanceSummary>(() => {
    const totalSales = transactions
      .filter((t) => t.type === 'venta')
      .reduce((s, t) => s + t.amount, 0);
    const totalPrizes = transactions
      .filter((t) => t.type === 'premio')
      .reduce((s, t) => s + t.amount, 0);
    const totalAbonos = transactions
      .filter((t) => t.type === 'abono')
      .reduce((s, t) => s + t.amount, 0);
    const totalRetiros = transactions
      .filter((t) => t.type === 'retiro')
      .reduce((s, t) => s + t.amount, 0);

    const netBalance    = totalSales - totalPrizes;
    const adminShare    = netBalance * ADMIN_SHARE_PERCENT;
    const vendorShare   = netBalance * VENDOR_SHARE_PERCENT;
    const pendingAdmin  = Math.max(0, adminShare - totalAbonos);
    const pendingVendor = Math.max(0, vendorShare - totalRetiros);

    return { totalSales, totalPrizes, netBalance, adminShare, vendorShare, pendingAdmin, pendingVendor };
  }, [transactions]);

  const registerAbono = useCallback(async (amount: number): Promise<boolean> => {
    if (!vendorId || amount <= 0 || amount > summary.pendingAdmin) return false;
    const { error } = await supabase.from('balance_transactions').insert({
      vendor_id: vendorId,
      type: 'abono',
      amount,
      description: 'Abono a administrador',
    });
    if (error) { console.error('Abono error:', error); return false; }
    refresh();
    return true;
  }, [vendorId, summary.pendingAdmin, refresh]);

  const registerRetiro = useCallback(async (amount: number): Promise<boolean> => {
    if (!vendorId || amount <= 0 || amount > summary.pendingVendor) return false;
    const { error } = await supabase.from('balance_transactions').insert({
      vendor_id: vendorId,
      type: 'retiro',
      amount,
      description: 'Retiro de ganancias',
    });
    if (error) { console.error('Retiro error:', error); return false; }
    refresh();
    return true;
  }, [vendorId, summary.pendingVendor, refresh]);

  const clearTransactions = useCallback((_pin?: string): boolean => {
    // Clearing is an admin-only operation — not supported from vendor side
    // Admin manages this from the admin panel
    return false;
  }, []);

  return { transactions, summary, loading, registerAbono, registerRetiro, clearTransactions, refresh };
}

export default useBalance;
