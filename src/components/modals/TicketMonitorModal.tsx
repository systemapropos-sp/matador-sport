import { useState, useMemo } from 'react';
import { Eye, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ModalWrapper from './ModalWrapper';
import { formatCurrencyLong } from '@/lib/utils';
import type { Ticket, TicketStatus } from '@/types';

interface TicketMonitorModalProps {
  open: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'winner' | 'pending' | 'loser' | 'cancelled';

const filterTabs: { key: FilterTab; label: string; color?: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'winner', label: 'Ganadores', color: '#5cb85c' },
  { key: 'pending', label: 'Pendientes', color: '#f0ad4e' },
  { key: 'loser', label: 'Perdedores', color: '#d9534f' },
  { key: 'cancelled', label: 'Cancelado', color: '#777777' },
];

const statusStyles: Record<TicketStatus, { bg: string; color: string; label: string }> = {
  winner: { bg: '#d4edda', color: '#155724', label: 'Ganador' },
  pending: { bg: '#fff3cd', color: '#856404', label: 'Pendiente' },
  loser: { bg: '#f8d7da', color: '#721c24', label: 'Perdedor' },
  cancelled: { bg: '#e2e3e5', color: '#383d41', label: 'Cancelado' },
};

function loadTickets(): Ticket[] {
  try {
    const stored = localStorage.getItem('matador_tickets');
    if (stored) return JSON.parse(stored) as Ticket[];
  } catch { /* ignore */ }
  // Generate mock tickets if none stored
  return generateMockTickets();
}

function generateMockTickets(): Ticket[] {
  const statuses: TicketStatus[] = ['pending', 'winner', 'loser', 'cancelled'];
  const vendors = ['mr01', 'jd02', 'ak03', 'ls04', 'rp05'];
  const tickets: Ticket[] = [];
  const now = new Date();
  for (let i = 0; i < 584; i++) {
    const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.round(Math.random() * 500 * 100) / 100;
    const prize = status === 'winner' ? Math.round(amount * (2 + Math.random() * 10) * 100) / 100 : 0;
    tickets.push({
      id: `ticket-${i}`,
      ticketNumber: `MWR-001-${(58000 + i).toString().padStart(6, '0')}`,
      plays: [],
      totalAmount: amount,
      status,
      createdAt: date.toISOString() as unknown as Date,
      vendorId: vendors[Math.floor(Math.random() * vendors.length)],
      vendorName: vendors[Math.floor(Math.random() * vendors.length)],
      prize,
      cancelledAt: status === 'cancelled' ? new Date(date.getTime() + 3600000).toISOString() : undefined,
    });
  }
  return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function TicketMonitorModal({ open, onClose }: TicketMonitorModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>(() => loadTickets());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (activeFilter !== 'all') {
      result = result.filter((t) => t.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.vendorName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tickets, activeFilter, search]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(start, start + itemsPerPage);
  }, [filteredTickets, currentPage]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tickets.length };
    for (const t of tickets) {
      c[t.status] = (c[t.status] || 0) + 1;
    }
    return c;
  }, [tickets]);

  const stats = useMemo(() => {
    const total = tickets.reduce((s, t) => s + t.totalAmount, 0);
    const prizes = tickets.reduce((s, t) => s + (t.prize || 0), 0);
    const pending = tickets
      .filter((t) => t.status === 'pending')
      .reduce((s, t) => s + t.totalAmount, 0);
    return { total, prizes, pending };
  }, [tickets]);

  const handleCancel = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: 'cancelled' as TicketStatus, cancelledAt: new Date().toISOString() }
          : t
      )
    );
  };

  const getStatusDisplay = (status: TicketStatus) => {
    const s = statusStyles[status] || statusStyles.pending;
    return (
      <span
        style={{
          backgroundColor: s.bg,
          color: s.color,
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500,
          display: 'inline-block',
        }}
      >
        {s.label}
      </span>
    );
  };

  const formatDateDisplay = (date: Date | string) => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return format(d, 'dd/MM/yyyy hh:mm a', { locale: es });
    } catch {
      return '-';
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose} title="Monitor de tickets" maxWidth="900px">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2" style={{ marginBottom: '16px' }}>
        {filterTabs.map((tab) => (
          <motion.button
            key={tab.key}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setActiveFilter(tab.key); setCurrentPage(1); }}
            className="rounded-full transition-colors"
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              backgroundColor: activeFilter === tab.key ? '#337ab7' : '#f5f5f5',
              color: activeFilter === tab.key ? '#ffffff' : '#555555',
              border: activeFilter === tab.key ? '1px solid #337ab7' : '1px solid #e0e0e0',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (activeFilter !== tab.key) e.currentTarget.style.backgroundColor = '#e8e8e8';
            }}
            onMouseLeave={(e) => {
              if (activeFilter !== tab.key) e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
          >
            {tab.label} ({counts[tab.key] || 0})
          </motion.button>
        ))}
      </div>

      {/* Statistics cards */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        style={{ marginBottom: '16px' }}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        {[
          { label: 'Monto total:', value: stats.total },
          { label: 'Total de premios:', value: stats.prizes },
          { label: 'Total pendiente de pago:', value: stats.pending },
        ].map((card, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            className="rounded-md"
            style={{
              backgroundColor: '#f9f9f9',
              border: '1px solid #e0e0e0',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#777777', marginBottom: '4px' }}>{card.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#333333' }}>
              {formatCurrencyLong(card.value)}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Print button */}
      <div style={{ marginBottom: '12px' }}>
        <button
          className="rounded transition-colors"
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #cccccc',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
        >
          Imprimir pendientes de pago
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        style={{
          height: '36px',
          width: '250px',
          border: '1px solid #cccccc',
          borderRadius: '4px',
          padding: '0 12px',
          marginBottom: '12px',
          fontSize: '14px',
        }}
      />

      {/* Table */}
      <div
        className="rounded-md overflow-hidden"
        style={{ border: '1px solid #e0e0e0' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                {['Numero', 'Fecha', 'Usuario', 'Monto', 'Premio', 'Fecha cancelacion', 'Estado', 'Acciones'].map((h) => (
                  <th
                    key={h}
                    className="text-left"
                    style={{
                      padding: '10px 12px',
                      fontWeight: 600,
                      color: '#555555',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.map((ticket, idx) => (
                <motion.tr
                  key={ticket.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.01 }}
                  className="transition-colors"
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f9f9f9'; }}
                >
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{ticket.ticketNumber}</td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{formatDateDisplay(ticket.createdAt)}</td>
                  <td style={{ padding: '10px 12px' }}>{ticket.vendorName || '-'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {formatCurrencyLong(ticket.totalAmount)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {formatCurrencyLong(ticket.prize || 0)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {ticket.cancelledAt ? formatDateDisplay(ticket.cancelledAt) : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {getStatusDisplay(ticket.status)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="rounded transition-colors"
                        style={{ padding: '4px' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8f0fe'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        title="Ver"
                      >
                        <Eye size={16} color="#337ab7" />
                      </button>
                      {ticket.status !== 'cancelled' && (
                        <button
                          className="rounded transition-colors"
                          style={{ padding: '4px' }}
                          onClick={() => handleCancel(ticket.id)}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fde8e8'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          title="Cancelar"
                        >
                          <XCircle size={16} color="#d9534f" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between" style={{ padding: '12px 0' }}>
        <span style={{ fontSize: '12px', color: '#777777' }}>
          Mostrando {filteredTickets.length} entradas
        </span>
        {totalPages > 1 && (
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className="rounded transition-colors"
                style={{
                  width: '32px',
                  height: '32px',
                  fontSize: '13px',
                  backgroundColor: currentPage === page ? '#337ab7' : '#f5f5f5',
                  color: currentPage === page ? '#ffffff' : '#555555',
                  border: '1px solid ' + (currentPage === page ? '#337ab7' : '#e0e0e0'),
                  cursor: 'pointer',
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end" style={{ marginTop: '8px' }}>
        <button
          onClick={onClose}
          className="rounded transition-colors"
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #cccccc',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
        >
          Cerrar
        </button>
      </div>
    </ModalWrapper>
  );
}
