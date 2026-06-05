import { useState, useMemo } from 'react';
import { Eye, XCircle, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ModalWrapper from './ModalWrapper';
import { formatCurrencyLong } from '@/lib/utils';
import type { Ticket, TicketStatus } from '@/types';

interface PendingPaymentsModalProps {
  open: boolean;
  onClose: () => void;
}

function loadTickets(): Ticket[] {
  try {
    const stored = localStorage.getItem('matador_tickets');
    if (stored) return JSON.parse(stored) as Ticket[];
  } catch { /* ignore */ }
  return generateMockPendingTickets();
}

function generateMockPendingTickets(): Ticket[] {
  const vendors = ['mr01', 'jd02', 'ak03', 'ls04', 'rp05'];
  const tickets: Ticket[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const amount = Math.round(Math.random() * 300 * 100) / 100;
    tickets.push({
      id: `pending-${i}`,
      ticketNumber: `MWR-001-${(58200 + i).toString().padStart(6, '0')}`,
      plays: [],
      totalAmount: amount,
      status: 'pending' as TicketStatus,
      createdAt: date.toISOString() as unknown as Date,
      vendorId: vendors[Math.floor(Math.random() * vendors.length)],
      vendorName: vendors[Math.floor(Math.random() * vendors.length)],
    });
  }
  return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function PendingPaymentsModal({ open, onClose }: PendingPaymentsModalProps) {
  const [tickets, setTickets] = useState<Ticket[]>(() => loadTickets());
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const pendingTickets = useMemo(() => {
    let result = tickets.filter((t) => t.status === 'pending');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.vendorName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tickets, search]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return pendingTickets.slice(start, start + itemsPerPage);
  }, [pendingTickets, currentPage]);

  const totalPages = Math.ceil(pendingTickets.length / itemsPerPage);

  const totalPending = useMemo(
    () => pendingTickets.reduce((s, t) => s + t.totalAmount, 0),
    [pendingTickets]
  );

  const handlePay = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, status: 'winner' as TicketStatus, prize: t.totalAmount * 2 } : t
      )
    );
  };

  const handleCancel = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: 'cancelled' as TicketStatus, cancelledAt: new Date().toISOString() }
          : t
      )
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
    <ModalWrapper open={open} onClose={onClose} title="Pendientes de pago" maxWidth="700px">
      {/* Stats summary */}
      <div
        className="flex items-center justify-between rounded-md"
        style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #f0ad4e',
          padding: '12px 16px',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#856404' }}>
          Tickets pendientes: {pendingTickets.length}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#856404' }}>
          Total: {formatCurrencyLong(totalPending)}
        </span>
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
                {['Numero', 'Fecha', 'Usuario', 'Monto', 'Estado', 'Acciones'].map((h) => (
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
                  transition={{ duration: 0.15, delay: idx * 0.02 }}
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
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        display: 'inline-block',
                      }}
                    >
                      Pendiente
                    </span>
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
                      <button
                        className="rounded transition-colors"
                        style={{ padding: '4px' }}
                        onClick={() => handlePay(ticket.id)}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d4edda'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        title="Pagar"
                      >
                        <Banknote size={16} color="#5cb85c" />
                      </button>
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
                    </div>
                  </td>
                </motion.tr>
              ))}
              {paginatedTickets.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center"
                    style={{ padding: '24px', color: '#777777', fontSize: '14px' }}
                  >
                    No hay tickets pendientes de pago
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between" style={{ padding: '12px 0' }}>
        <span style={{ fontSize: '12px', color: '#777777' }}>
          Mostrando {pendingTickets.length} entradas
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
