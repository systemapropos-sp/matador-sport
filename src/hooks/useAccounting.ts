import { useState, useCallback } from 'react';

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

const STORAGE_KEY = 'matador_accounting_records';

function loadRecords(): AccountingRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  // Seed with demo data
  const now = new Date();
  const demo: AccountingRecord[] = [
    {
      id: 'acc-1',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString(),
      type: 'generado',
      amount: 15000,
      description: 'Ventas del dia',
      period: 'diario',
    },
    {
      id: 'acc-2',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString(),
      type: 'premio',
      amount: 3200,
      description: 'Premios pagados',
      period: 'diario',
    },
    {
      id: 'acc-3',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString(),
      type: 'renta',
      amount: 2500,
      description: 'Pago de renta local',
      period: 'mensual',
    },
    {
      id: 'acc-4',
      date: now.toISOString(),
      type: 'gasto',
      amount: 800,
      description: 'Materiales de oficina',
      period: 'semanal',
    },
    {
      id: 'acc-5',
      date: now.toISOString(),
      type: 'abono',
      amount: 5000,
      description: 'Abono a administrador',
      period: 'diario',
    },
  ];
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(demo)); } catch { /* ignore */ }
  return demo;
}

function saveRecords(records: AccountingRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch { /* ignore */ }
}


export interface UseAccountingReturn {
  records: AccountingRecord[];
  addRecord: (record: Omit<AccountingRecord, 'id' | 'date'>) => void;
  addRentaPayment: (amount: number, description: string) => void;
  getTotals: (filter?: FilterPeriod, startDate?: string, endDate?: string) => AccountingTotals;
  filterRecords: (
    filter: FilterPeriod,
    startDate?: string,
    endDate?: string,
    searchTerm?: string
  ) => AccountingRecord[];
}

export function useAccounting(): UseAccountingReturn {
  const [records, setRecords] = useState<AccountingRecord[]>(() => loadRecords());

  const persist = useCallback((next: AccountingRecord[]) => {
    setRecords(next);
    saveRecords(next);
  }, []);

  const addRecord = useCallback(
    (record: Omit<AccountingRecord, 'id' | 'date'>) => {
      const newRecord: AccountingRecord = {
        ...record,
        id: `acc-${Date.now()}`,
        date: new Date().toISOString(),
      };
      persist([newRecord, ...records]);
    },
    [records, persist]
  );

  const addRentaPayment = useCallback(
    (amount: number, description: string) => {
      const newRecord: AccountingRecord = {
        id: `acc-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'renta',
        amount,
        description: description || 'Pago de renta',
        period: 'mensual',
      };
      persist([newRecord, ...records]);
    },
    [records, persist]
  );

  const filterRecords = useCallback(
    (
      filter: FilterPeriod,
      startDate?: string,
      endDate?: string,
      searchTerm?: string
    ): AccountingRecord[] => {
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
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter((r) => new Date(r.date) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter((r) => new Date(r.date) <= end);
      }

      if (searchTerm?.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.description.toLowerCase().includes(term) ||
            r.type.toLowerCase().includes(term)
        );
      }

      return filtered;
    },
    [records]
  );

  const getTotals = useCallback(
    (filter?: FilterPeriod, startDate?: string, endDate?: string): AccountingTotals => {
      const filtered = filterRecords(filter || 'todos', startDate, endDate);

      const totalGenerado = filtered
        .filter((r) => r.type === 'generado')
        .reduce((sum, r) => sum + r.amount, 0);
      const totalPremios = filtered
        .filter((r) => r.type === 'premio')
        .reduce((sum, r) => sum + r.amount, 0);
      const totalRenta = filtered
        .filter((r) => r.type === 'renta')
        .reduce((sum, r) => sum + r.amount, 0);
      const totalGastos = filtered
        .filter((r) => r.type === 'gasto')
        .reduce((sum, r) => sum + r.amount, 0);
      const totalAbonos = filtered
        .filter((r) => r.type === 'abono')
        .reduce((sum, r) => sum + r.amount, 0);

      const neto = totalGenerado - totalPremios - totalRenta - totalGastos;

      return {
        totalGenerado,
        totalPremios,
        totalRenta,
        totalGastos,
        totalAbonos,
        neto,
      };
    },
    [filterRecords]
  );

  return {
    records,
    addRecord,
    addRentaPayment,
    getTotals,
    filterRecords,
  };
}

export default useAccounting;
