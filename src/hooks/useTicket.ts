import { useState, useCallback, useEffect } from 'react';
import type { Ticket, Play } from '@/types';
import { generateTicketNumber } from '@/lib/utils';

const STORAGE_KEY = 'matador_tickets';

function loadTicketsFromStorage(): Ticket[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((t: Ticket) => ({
        ...t,
        createdAt: new Date(t.createdAt),
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

function saveTicketsToStorage(tickets: Ticket[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch {
    // ignore
  }
}

export interface UseTicketReturn {
  tickets: Ticket[];
  createTicket: (plays: Play[], vendorName?: string) => Ticket | null;
  deleteTicket: (id: string) => void;
  recentTickets: Ticket[];
}

export function useTicket(): UseTicketReturn {
  const [tickets, setTickets] = useState<Ticket[]>(() => loadTicketsFromStorage());

  useEffect(() => {
    saveTicketsToStorage(tickets);
  }, [tickets]);

  const createTicket = useCallback(
    (plays: Play[], vendorName: string = 'Vendedor'): Ticket | null => {
      if (plays.length === 0) return null;

      const totalAmount = plays.reduce((sum, p) => sum + p.amount, 0);

      const ticket: Ticket = {
        id: `ticket-${Date.now()}`,
        ticketNumber: generateTicketNumber(),
        plays: [...plays],
        totalAmount,
        status: 'pending',
        createdAt: new Date(),
        vendorId: '001',
        vendorName,
      };

      setTickets((prev) => [ticket, ...prev]);
      return ticket;
    },
    []
  );

  const deleteTicket = useCallback((id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const recentTickets = tickets.slice(0, 10);

  return {
    tickets,
    createTicket,
    deleteTicket,
    recentTickets,
  };
}

export default useTicket;
