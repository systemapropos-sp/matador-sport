import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, Filter, DollarSign, TicketIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import SideMenu from "@/components/SideMenu";
import { formatCurrency } from "@/lib/utils";
import type { Ticket } from "@/types";

function getTickets(): Ticket[] {
  try {
    return JSON.parse(localStorage.getItem("matador_tickets") || "[]");
  } catch {
    return [];
  }
}

export default function HistoricalSales() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const tickets = useMemo(() => getTickets(), []);
  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      // Simple date filtering could be added here
      return true;
    });
  }, [tickets, statusFilter]);

  const total = useMemo(() => filtered.reduce((s, t) => s + t.totalAmount, 0), [filtered]);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Navbar onMenuToggle={() => setMenuOpen(!menuOpen)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="pt-[50px] p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/betting-pool/ticket/create")}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Ventas Historicas</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="winner">Ganadores</option>
                <option value="loser">Perdedores</option>
                <option value="cancelled">Anulados</option>
              </select>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm">
                <TicketIcon size={16} className="text-gray-400" />
                <span className="font-bold">{filtered.length}</span>
                <span className="text-gray-500">tickets</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <DollarSign size={16} className="text-gray-400" />
                <span className="font-bold text-green-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Ticket #</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-center">Jugadas</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No hay tickets para mostrar
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold">{t.ticketNumber}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.createdAt}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">
                        {t.plays.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(t.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
