/**
 * PendingPaymentsModal — Tickets ganadores pendientes de cobro.
 * Loads from Supabase tickets table (status = 'winner').
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Eye, XCircle, Banknote, RefreshCw, Search, Loader2, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { supabase } from '@/lib/supabase';
import PinConfirmDialog from '@/components/PinConfirmDialog';
import TicketPrintModal from '@/components/TicketPrintModal';

interface PendingTicket {
  id: string;
  ticketNumber: string;
  totalAmount: number;
  prizeAmount: number | null;
  status: string;
  createdAt: string;
  cancelledAt?: string | null;
  vendorName?: string;
}

function formatCurrencyLong(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

interface ConfirmAction {
  type: 'pay' | 'delete';
  ticketId: string;
  ticketNumber: string;
  amount: number;
}

export default function PendingPaymentsModal() {
  const { closeModal } = useModalContext();
  const [tickets, setTickets] = useState<PendingTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState('');
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [pinAction, setPinAction] = useState<ConfirmAction | null>(null);
  const [viewTicket, setViewTicket] = useState<any>(null);
  const [totalSold, setTotalSold] = useState(0);
  const itemsPerPage = 12;

  const vendorId = localStorage.getItem('nmv_vendor_id');
  const businessId = localStorage.getItem('nmv_business_id');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const bid = businessId || vendorId;

    // 1. Load winner tickets
    const winnerQuery = supabase
      .from('tickets')
      .select('id, ticket_number, total_amount, prize_amount, status, created_at, vendor_id, metadata')
      .eq('status', 'winner')
      .order('created_at', { ascending: false });
    if (vendorId) winnerQuery.eq('vendor_id', vendorId);
    else if (bid) winnerQuery.eq('business_id', bid);

    // 2. Load total sold today (all tickets)
    const soldQuery = supabase
      .from('tickets')
      .select('total_amount, prize_amount')
      .gte('created_at', `${today}T00:00:00`);
    if (vendorId) soldQuery.eq('vendor_id', vendorId);
    else if (bid) soldQuery.eq('business_id', bid);

    const [{ data, error }, { data: soldData }] = await Promise.all([winnerQuery, soldQuery]);

    if (error) { console.error('PendingPayments load error:', error); setLoading(false); return; }

    // Compute totalSold from today
    const sold = (soldData || []).reduce((s: number, r: any) => s + (r.total_amount || 0), 0);
    setTotalSold(sold);

    setTickets((data || []).map((t) => {
      const meta = (t.metadata as Record<string, unknown>) || {};
      return {
        id: t.id,
        ticketNumber: t.ticket_number || t.id,
        totalAmount: t.total_amount || 0,
        prizeAmount: t.prize_amount || null,
        status: t.status,
        createdAt: t.created_at,
        vendorName: (meta.vendor_name as string) || undefined,
      };
    }));
    setLoading(false);
  }, [vendorId, businessId]);

  useEffect(() => {
    loadTickets();

    // Realtime subscription
    if (!vendorId) return;
    const sub = supabase
      .channel('pending-payments-channel')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tickets', filter: `vendor_id=eq.${vendorId}`,
      }, () => loadTickets())
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [loadTickets, vendorId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter((t) => t.ticketNumber.toLowerCase().includes(q));
  }, [tickets, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPending = filtered.reduce((s, t) => s + (t.prizeAmount ?? t.totalAmount), 0);

  // ── Ver ticket — load from Supabase ───────────────────────────────
  const handleViewTicket = async (ticket: PendingTicket) => {
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticket.id)
      .single();
    if (data) {
      setViewTicket({
        id: data.id,
        ticketNumber: data.ticket_number,
        plays: data.plays || [],
        totalAmount: data.total_amount,
        createdAt: new Date(data.created_at),
        vendorName: data.vendor_name || 'Vendedor',
        lotteryName: data.lottery_name || '',
        isReprint: false,
      });
    }
  };

  // ── Pagar premio ────────────────────────────────────────────────────
  const handlePay = async (ticket: PendingTicket) => {
    setActionLoading(ticket.id);
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', ticket.id);

    setActionLoading(null);
    if (error) {
      showToast('Error al registrar pago');
    } else {
      showToast(`✓ Premio pagado: Ticket ${ticket.ticketNumber}`);
      await loadTickets();
    }
    setConfirm(null);
  };

  // ── Eliminar ticket ──────────────────────────────────────────────────
  const handleDelete = async (ticket: PendingTicket) => {
    setActionLoading(ticket.id);
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'cancelled' })
      .eq('id', ticket.id);

    setActionLoading(null);
    if (error) {
      showToast('Error al eliminar ticket');
    } else {
      showToast(`Ticket ${ticket.ticketNumber} eliminado`);
      await loadTickets();
    }
    setConfirm(null);
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Pendientes de Pago" maxWidth="860px">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-3 px-3 py-2 rounded-lg text-sm font-semibold text-center"
            style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
              <h3 className="font-bold text-gray-800 mb-2" style={{ fontSize: '16px' }}>
                {confirm.type === 'pay' ? '💳 Confirmar Pago' : '🗑️ Eliminar Ticket'}
              </h3>
              <p className="text-gray-600 mb-1" style={{ fontSize: '14px' }}>
                Ticket: <strong>{confirm.ticketNumber}</strong>
              </p>
              {confirm.type === 'pay' && (
                <p className="text-green-700 font-bold mb-4" style={{ fontSize: '18px' }}>
                  Premio: {formatCurrencyLong(confirm.amount)}
                </p>
              )}
              {confirm.type === 'delete' && (
                <p className="text-red-600 mb-4 text-sm">Esta acción no se puede deshacer.</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirm(null)}
                  className="flex-1 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: '#F3F4F6', color: '#6B7280', fontSize: '14px' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    const t = tickets.find((x) => x.id === confirm.ticketId);
                    if (!t) return;
                    if (confirm.type === 'pay') await handlePay(t);
                    else await handleDelete(t);
                  }}
                  className="flex-1 py-2 rounded-lg font-bold text-white"
                  style={{ backgroundColor: confirm.type === 'pay' ? '#16A34A' : '#DC2626', fontSize: '14px' }}
                >
                  {confirm.type === 'pay' ? 'Confirmar Pago' : 'Eliminar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3 Totals Cards ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {/* 1. Monto Total Vendido */}
        <div style={{ background: 'linear-gradient(135deg,#1565C0,#1976D2)', borderRadius: 10, padding: '12px 16px', color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: 1, textTransform: 'uppercase' }}>Monto Total:</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{formatCurrencyLong(totalSold)}</div>
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>Ventas del día</div>
        </div>
        {/* 2. Total de Premios */}
        <div style={{ background: 'linear-gradient(135deg,#c62828,#e53935)', borderRadius: 10, padding: '12px 16px', color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: 1, textTransform: 'uppercase' }}>Total de Premios:</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{formatCurrencyLong(tickets.reduce((s, t) => s + (t.prizeAmount ?? 0), 0))}</div>
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} ganador{tickets.length !== 1 ? 'es' : ''}</div>
        </div>
        {/* 3. Total Pendiente de Pago */}
        <div style={{ background: 'linear-gradient(135deg,#2e7d32,#388e3c)', borderRadius: 10, padding: '12px 16px', color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: 1, textTransform: 'uppercase' }}>Total Pendiente de Pago:</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{formatCurrencyLong(totalPending)}</div>
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{filtered.length} pendiente{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Summary bar — search + actions */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-3">
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Buscar ticket..."
              style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', width: 160 }}
            />
          </div>
          <button
            onClick={loadTickets}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium"
            style={{ backgroundColor: '#F3F4F6', fontSize: 12, color: '#374151' }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Actualizar
          </button>
          {/* Item 12: Imprimir listado de pendientes */}
          <button
            onClick={() => {
              const printWin = window.open('', '_blank', 'width=800,height=600');
              if (!printWin) return;
              const rows = filtered.map((t, i) =>
                `<tr style="background:${i%2===0?'#fff':'#f9f9f9'}">
                  <td style="padding:6px 10px">${i+1}</td>
                  <td style="padding:6px 10px;font-family:monospace;font-weight:700">${t.ticketNumber}</td>
                  <td style="padding:6px 10px;text-align:right">$${t.totalAmount.toFixed(2)}</td>
                  <td style="padding:6px 10px;text-align:right;color:#DC2626;font-weight:800">$${(t.prizeAmount ?? t.totalAmount*2).toFixed(2)}</td>
                  <td style="padding:6px 10px;font-size:11px">${formatDate(t.createdAt)}</td>
                </tr>`
              ).join('');
              const total = `$${filtered.reduce((s,t) => s+(t.prizeAmount??t.totalAmount*2),0).toFixed(2)}`;
              printWin.document.write(`<!DOCTYPE html><html><head><title>Pendientes de Pago</title>
                <style>body{font-family:Arial,sans-serif;font-size:13px;padding:16px}
                h2{margin:0 0 12px}table{width:100%;border-collapse:collapse}
                th{background:#f5f5f5;padding:7px 10px;text-align:left;border-bottom:2px solid #ddd;font-size:11px;text-transform:uppercase}
                td{border-bottom:1px solid #eee}
                .total{font-size:18px;font-weight:800;text-align:right;margin-top:12px;color:#B71C1C}
                @media print{button{display:none}}</style></head>
                <body><h2>🏆 Tickets Pendientes de Pago</h2>
                <table><thead><tr><th>#</th><th>Ticket</th><th style="text-align:right">Venta</th><th style="text-align:right">Premio</th><th>Fecha</th></tr></thead>
                <tbody>${rows}</tbody></table>
                <div class="total">Total a pagar: ${total}</div>
                <script>window.onload=function(){window.print();window.close()}<\/script>
                </body></html>`);
              printWin.document.close();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium"
            style={{ backgroundColor: '#EFF6FF', fontSize: 12, color: '#1D4ED8', border: '1px solid #BFDBFE' }}
          >
            <Printer size={14} />
            Imprimir
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10">
          <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: '#9CA3AF' }} />
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>Cargando tickets...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 rounded-xl" style={{ backgroundColor: '#F9FAFB', border: '2px dashed #E5E7EB' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
          <p style={{ color: '#6B7280', fontSize: 14, fontWeight: 600 }}>
            {search ? 'No se encontraron tickets' : 'No hay tickets pendientes de pago'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E5E7EB' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'left', textTransform: 'uppercase' }}>#</th>
                  <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'left', textTransform: 'uppercase' }}>Ticket</th>
                  <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'right', textTransform: 'uppercase' }}>Venta</th>
                  <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'right', textTransform: 'uppercase' }}>Premio</th>
                  <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'left', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', textAlign: 'center', textTransform: 'uppercase' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFBFC' }}
                  >
                    <td style={{ padding: '9px 12px', fontSize: 12, color: '#9CA3AF' }}>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1F2937', fontFamily: 'monospace' }}>{t.ticketNumber}</span>
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: 13, color: '#374151', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {formatCurrencyLong(t.totalAmount)}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 14, fontWeight: 800, color: '#DC2626',
                        backgroundColor: '#FEF2F2', borderRadius: 6, padding: '2px 8px',
                      }}>
                        {t.prizeAmount ? formatCurrencyLong(t.prizeAmount) : formatCurrencyLong(t.totalAmount * 2)}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {formatDate(t.createdAt)}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {/* Pagar */}
                        <motion.button
                          whileTap={{ scale: 0.93 }}
                          disabled={actionLoading === t.id}
                          onClick={() => setConfirm({ type: 'pay', ticketId: t.id, ticketNumber: t.ticketNumber, amount: t.prizeAmount ?? t.totalAmount * 2 })}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', backgroundColor: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700 }}
                        >
                          {actionLoading === t.id ? <Loader2 size={12} className="animate-spin" /> : <Banknote size={13} />}
                          Pagar
                        </motion.button>
                        {/* Ver */}
                        <motion.button
                          whileTap={{ scale: 0.93 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E7EB', cursor: 'pointer', backgroundColor: '#fff', color: '#374151', fontSize: 12, fontWeight: 600 }}
                          onClick={() => handleViewTicket(t)}
                        >
                          <Eye size={13} />
                          Ver
                        </motion.button>
                        {/* Eliminar — requiere PIN */}
                        <motion.button
                          whileTap={{ scale: 0.93 }}
                          disabled={actionLoading === t.id}
                          onClick={() => setPinAction({ type: 'delete', ticketId: t.id, ticketNumber: t.ticketNumber, amount: 0 })}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700 }}
                        >
                          <XCircle size={13} />
                          Cancelar
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded text-sm font-medium"
                style={{ backgroundColor: currentPage === 1 ? '#F3F4F6' : '#F9FAFB', color: currentPage === 1 ? '#9CA3AF' : '#374151', border: '1px solid #E5E7EB' }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: 13, color: '#6B7280' }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded text-sm font-medium"
                style={{ backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#F9FAFB', color: currentPage === totalPages ? '#9CA3AF' : '#374151', border: '1px solid #E5E7EB' }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
      {/* PIN para cancelar ticket */}
      <PinConfirmDialog
        open={pinAction !== null}
        title="Cancelar ticket"
        message={`Ingresa tu PIN para cancelar el ticket ${pinAction?.ticketNumber || ''}`}
        onConfirm={async () => {
          if (!pinAction) return;
          const t = tickets.find((x) => x.id === pinAction.ticketId);
          if (t) await handleDelete(t);
          setPinAction(null);
        }}
        onCancel={() => setPinAction(null)}
      />

      {/* Ver ticket real */}
      {viewTicket && (
        <TicketPrintModal
          ticket={viewTicket}
          onClose={() => setViewTicket(null)}
        />
      )}
    </ModalWrapper>
  );
}
