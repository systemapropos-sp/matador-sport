import { useState, useCallback } from 'react';

export interface Vendedor {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'matador_vendedores';
const ACTIVE_KEY = 'matador_vendedor_active';

function loadVendedores(): Vendedor[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  // Default: single vendor
  return [{ id: 'v-001', name: 'Vendedor 1', active: true, createdAt: new Date().toISOString() }];
}

function saveVendedores(vendedores: Vendedor[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(vendedores)); } catch { /* ignore */ }
}

function loadActiveVendedorId(): string | null {
  try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

function saveActiveVendedorId(id: string) {
  try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* ignore */ }
}

export function useVendedores() {
  const [vendedores, setVendedores] = useState<Vendedor[]>(() => loadVendedores());
  const [activeVendedorId, setActiveVendedorId] = useState<string | null>(() => loadActiveVendedorId());

  const activeVendedor = vendedores.find(v => v.id === activeVendedorId) || vendedores[0] || null;

  const setActive = useCallback((id: string) => {
    setActiveVendedorId(id);
    saveActiveVendedorId(id);
  }, []);

  const addVendedor = useCallback((name: string) => {
    const v: Vendedor = {
      id: `v-${Date.now()}`,
      name,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setVendedores(prev => {
      const updated = [...prev, v];
      saveVendedores(updated);
      return updated;
    });
    return v.id;
  }, []);

  const removeVendedor = useCallback((id: string) => {
    setVendedores(prev => {
      const updated = prev.filter(v => v.id !== id);
      saveVendedores(updated);
      return updated;
    });
  }, []);

  const renameVendedor = useCallback((id: string, name: string) => {
    setVendedores(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, name } : v);
      saveVendedores(updated);
      return updated;
    });
  }, []);

  return {
    vendedores,
    activeVendedor,
    activeVendedorId,
    setActive,
    addVendedor,
    removeVendedor,
    renameVendedor,
  };
}

export default useVendedores;
