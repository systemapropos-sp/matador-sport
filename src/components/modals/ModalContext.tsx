import React, { createContext, useContext, useState, useCallback } from "react";

export type ModalType =
  | "ticketMonitor"
  | "schedule"
  | "config"
  | "authorize"
  | "randomGenerator"
  | "pendingPayments"
  | "duplicateTicket"
  | "duplicatePlays"
  | "pagar"
  | null;

interface ModalState {
  type: ModalType;
  props?: Record<string, unknown>;
}

interface ModalContextType {
  modalState: ModalState;
  openModal: (type: ModalType, props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType>({
  modalState: { type: null },
  openModal: () => {},
  closeModal: () => {},
});

export function ModalProvider({ children }: { children: React.ReactNode }) {
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

export function useModal() {
  return useContext(ModalContext);
}
