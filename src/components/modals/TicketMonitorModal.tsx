import React, { useState, useMemo } from "react";
import { Eye, Trash2, X, CheckCircle, Clock, DollarSign, TicketIcon } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import { useModal } from "./ModalContext";
import { formatCurrency } from "@/lib/utils";
import type { Ticket } from "@/types";

type FilterTab = "all" | "pending" | "winner" | "loser" | "cancelled";

function getTickets(): Ticket[] {
  try {
    return JSON.parse(localStorage.getItem("matador_tickets") || "[]");
  } catch {
    return [];
  }
}

export default function TicketMonitorModal() {
  const { closeModal } = useModal();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const tickets = useMemo(() => getTickets(), []);
  const filtered = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = useMemo(() => {
    const total = tickets.reduce((s, t) => s + t.totalAmount, 0);
    const pending = tickets.filter((t) => t.status === "pending").length;
    const winner = tickets.filter((t) => t.status === "winner").length;
    return { count: tickets.length, total, pending, winner };
  }, [tickets]);

  const filters: { key: FilterTab; label: string; color: string }[] = [
    { key: "all", label: "Todos", color: "bg-gray-600" },
    { key: "pending", label: "Pendientes", color: "bg-yellow-500" },
    { key: "winner", label: "Ganadores", color: "bg-green-500" },
    { key: "loser", label: "Perdedores", color: "bg-red-500" },
    { key: "cancelled", label: "Anulados", color: "bg-gray-400" },
  ];

  return (
    <ModalWrapper title="Monitor de Tickets" onClose={closeModal} width="700px">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Tickets", value: stats.count, icon: TicketIcon, color: "text-blue-600" },
            { label: "Total $", value: formatCurrency(stats.total), icon: DollarSign, color: "text-green-600" },
            { label: "Pendientes", value: stats.pending, icon: Clock, color: "text-yellow-600" },
            { label: "Ganadores", value: stats.winner, icon: CheckCircle, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center border">
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <div className="text-lg font-bold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.key ? `${f.color} text-white` : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Ticket #</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-center">Jugadas</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                    No hay tickets
                  </td>
                </tr>
              ) : (
                paginated.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">{t.ticketNumber}</td>
                    <td className="px-3 py-2 text-xs">{t.createdAt}</td>
                    <td className="px-3 py-2 text-center">{t.plays.length}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(t.totalAmount)}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.status === "winner"
                            ? "bg-green-100 text-green-700"
                            : t.status === "loser"
                            ? "bg-red-100 text-red-700"
                            : t.status === "cancelled"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Eye size={14} className="text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Mostrando {paginated.length} de {filtered.length} tickets
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              {currentPage}/{totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
