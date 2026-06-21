/**
 * useAccounting — Supabase-connected accounting hook for vendors.
 * No more demo data seed — shows real data only.
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type FilterPeriod = 'todos' | 'semanal' | 'mensual';

export interface AccountingRecord {
  id: string;
  date: string;
  type: 'generado' | 'premio' | 'renta' | 'gasto' | 'abono';
  amount: number;
  description: string;
  period: string;
}

export interface AccountingTotals {
  totalGenerado: number;
  totalPremios: number;
  totalRenta: number;
  totalGastos: number;
  totalAbonos: number;
  neto: number;
}

function getVendorId(): string | null {
  return localStorage.getItem('nmv_vendor_id');
}

export interface UseAccountingReturn {
  records: AccountingRecord[];
  loading: boolean;
  addRecord: (record: Omit<AccountingRecord, 'id' | 'date'>) => Promise<void>;
  addRentaPayment: (amount: number, description: string) => Promise<void>;
  getTotals: (filter?: FilterPeriod, startDate?: string, endDate?: string) => AccountingTotals;
  filterRecords: (
    filter: FilterPeriod,
    startDate?: string,
    endDate?: string,
    searchTerm?: string
  ) => AccountingRecord[];
  refresh: () => void;
}

export function useAccounting(): UseAccountingReturn {
  const vendorId = getVendorId();
  const [records, setRecords] = useState<AccountingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Load from Supabase — merges tickets as 'generado' + manual accounting_records
  useEffect(() => {
    if (!vendorId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      // 1. Tickets → generate 'generado' entries (sold) and 'premio' entries (paid prizes)
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('id, amount, status, created_at, ticket_number, metadata')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      // 2. Manual accounting records (renta, gasto, abono, manual entries)
      const { data: acctData } = await supabase
        .from('accounting_records')
        .select('id, type, amount, description, period, created_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      const combined: AccountingRecord[] = [];

      if (ticketData) {
        for (const t of ticketData) {
          if (t.status !== 'cancelled') {
            combined.push({
              id: `ticket-${t.id}`,
              date: t.created_at,
              type: 'generado',
              amount: Number((t.metadata as any)?.total_amount ?? t.amount ?? 0),
              description: `Venta ticket #${t.ticket_number || t.id}`,
              period: 'diario',
            });
          }
          const metaPrize = (t.metadata as any)?.prize_amount ?? 0;
          if (t.status === 'paid' && metaPrize > 0) {
            combined.push({
              id: `prize-${t.id}`,
              date: t.created_at,
              type: 'premio',
              amount: metaPrize,
              description: `Premio ticket #${t.ticket_number || t.id}`,
              period: 'diario',
            });
          }
        }
      }

      if (acctData) {
        for (const r of acctData) {
          combined.push({
            id: r.id,
            date: r.created_at,
            type: r.type as AccountingRecord['type'],
            amount: r.amount,
            description: r.description || '',
            period: r.period || 'diario',
          });
        }
      }

      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords(combined);
      setLoading(false);
    };

    load();

    const sub = supabase
      .channel(`accounting-${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounting_records', filter: `vendor_id=eq.${vendorId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `vendor_id=eq.${vendorId}` }, refresh)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(sub);
    };
  }, [vendorId, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const addRecord = useCallback(
    async (record: Omit<AccountingRecord, 'id' | 'date'>) => {
      if (!vendorId) return;
      const { error } = await supabase.from('accounting_records').insert({
        vendor_id: vendorId,
        type: record.type,
        amount: record.amount,
        description: record.description,
        period: record.period,
      });
      if (error) console.error('addRecord error:', error);
      else refresh();
    },
    [vendorId, refresh]
  );

  const addRentaPayment = useCallback(
    async (amount: number, description: string) => {
      await addRecord({
        type: 'renta',
        amount,
        description: description || 'Pago de renta',
        period: 'mensual',
      });
    },
    [addRecord]
  );

  const filterRecords = useCallback(
    (filter: FilterPeriod, startDate?: string, endDate?: string, searchTerm?: string): AccountingRecord[] => {
      let filtered = [...records];
      const now = new Date();

      if (filter === 'semanal') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        filtered = filtered.filter((r) => new Date(r.date) >= weekStart);
      } else if (filter === 'mensual') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter((r) => new Date(r.date) >= monthStart);
      }

      if (startDate) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        filtered = filtered.filter((r) => new Date(r.date) >= start);
      }
      if (endDate) {
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        filtered = filtered.filter((r) => new Date(r.date) <= end);
      }
      if (searchTerm?.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (r) => r.description.toLowerCase().includes(term) || r.type.toLowerCase().includes(term)
        );
      }
      return filtered;
    },
    [records]
  );

  const getTotals = useCallback(
    (filter?: FilterPeriod, startDate?: string, endDate?: string): AccountingTotals => {
      const filtered = filterRecords(filter || 'todos', startDate, endDate);
      return {
        totalGenerado: filtered.filter((r) => r.type === 'generado').reduce((s, r) => s + r.amount, 0),
        totalPremios:  filtered.filter((r) => r.type === 'premio').reduce((s, r) => s + r.amount, 0),
        totalRenta:    filtered.filter((r) => r.type === 'renta').reduce((s, r) => s + r.amount, 0),
        totalGastos:   filtered.filter((r) => r.type === 'gasto').reduce((s, r) => s + r.amount, 0),
        totalAbonos:   filtered.filter((r) => r.type === 'abono').reduce((s, r) => s + r.amount, 0),
        neto: filtered.filter((r) => r.type === 'generado').reduce((s, r) => s + r.amount, 0)
            - filtered.filter((r) => ['premio','renta','gasto'].includes(r.type)).reduce((s, r) => s + r.amount, 0),
      };
    },
    [filterRecords]
  );

  return { records, loading, addRecord, addRentaPayment, getTotals, filterRecords, refresh };
}

export default useAccounting;
