import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export type ModalType =
  | 'ticketMonitor'
  | 'schedule'
  | 'config'
  | 'authorize'
  | 'randomGenerator'
  | 'pendingPayments'
  | 'duplicateTicket'
  | 'duplicatePlays'
  | 'pagar'
  | null;

export interface ModalState {
  type: ModalType;
  props?: Record<string, unknown>;
}

interface ModalContextValue {
  modalState: ModalState;
  openModal: (type: ModalType, props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  const openModal = useCallback((type: ModalType, props?: Record<string, unknown>) => {
    setModalState({ type, props });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ type: null });
  }, []);

  return (
    <ModalContext.Provider value={{ modalState, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModalContext(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return ctx;
}
