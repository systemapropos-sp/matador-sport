import { useState, useCallback, useMemo } from 'react';

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

const STORAGE_KEY = 'matador_balance_transactions';
const ADMIN_SHARE_PERCENT = 0.8;
const VENDOR_SHARE_PERCENT = 0.2;

function loadTransactions(): BalanceTransaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveTransactions(transactions: BalanceTransaction[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch { /* ignore */ }
}

export interface UseBalanceReturn {
  transactions: BalanceTransaction[];
  summary: BalanceSummary;
  registerSale: (amount: number, description?: string) => void;
  registerPrize: (amount: number, description?: string) => void;
  registerAbono: (amount: number) => boolean;
  registerRetiro: (amount: number) => boolean;
  clearTransactions: (pin?: string) => boolean;
}

export function useBalance(): UseBalanceReturn {
  const [transactions, setTransactions] = useState<BalanceTransaction[]>(() => loadTransactions());

  const persist = useCallback((next: BalanceTransaction[]) => {
    setTransactions(next);
    saveTransactions(next);
  }, []);

  const summary = useMemo<BalanceSummary>(() => {
    const totalSales = transactions
      .filter((t) => t.type === 'venta')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPrizes = transactions
      .filter((t) => t.type === 'premio')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalAbonos = transactions
      .filter((t) => t.type === 'abono')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalRetiros = transactions
      .filter((t) => t.type === 'retiro')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalSales - totalPrizes;
    const adminShare = netBalance * ADMIN_SHARE_PERCENT;
    const vendorShare = netBalance * VENDOR_SHARE_PERCENT;
    const pendingAdmin = Math.max(0, adminShare - totalAbonos);
    const pendingVendor = Math.max(0, vendorShare - totalRetiros);

    return {
      totalSales,
      totalPrizes,
      netBalance,
      adminShare,
      vendorShare,
      pendingAdmin,
      pendingVendor,
    };
  }, [transactions]);

  const registerSale = useCallback(
    (amount: number, description = 'Venta registrada') => {
      const tx: BalanceTransaction = {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'venta',
        amount,
        description,
      };
      persist([tx, ...transactions]);
    },
    [transactions, persist]
  );

  const registerPrize = useCallback(
    (amount: number, description = 'Premio pagado') => {
      const tx: BalanceTransaction = {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'premio',
        amount,
        description,
      };
      persist([tx, ...transactions]);
    },
    [transactions, persist]
  );

  const registerAbono = useCallback(
    (amount: number): boolean => {
      if (amount <= 0 || amount > summary.pendingAdmin) return false;
      const tx: BalanceTransaction = {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'abono',
        amount,
        description: `Abono a administrador`,
      };
      persist([tx, ...transactions]);
      return true;
    },
    [transactions, summary.pendingAdmin, persist]
  );

  const registerRetiro = useCallback(
    (amount: number): boolean => {
      if (amount <= 0 || amount > summary.pendingVendor) return false;
      const tx: BalanceTransaction = {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'retiro',
        amount,
        description: `Retiro de ganancias`,
      };
      persist([tx, ...transactions]);
      return true;
    },
    [transactions, summary.pendingVendor, persist]
  );

  const clearTransactions = useCallback(
    (pin?: string): boolean => {
      const storedPin = localStorage.getItem('matador_admin_pin') || '1234';
      if (pin !== storedPin) return false;
      persist([]);
      return true;
    },
    [persist]
  );

  return {
    transactions,
    summary,
    registerSale,
    registerPrize,
    registerAbono,
    registerRetiro,
    clearTransactions,
  };
}

export default useBalance;
