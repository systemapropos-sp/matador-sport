import React, { useMemo } from "react";
import { DollarSign, Clock } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import { useModal } from "./ModalContext";
import { formatCurrency } from "@/lib/utils";
import type { Ticket } from "@/types";

function getTickets(): Ticket[] {
  try {
    return JSON.parse(localStorage.getItem("matador_tickets") || "[]");
  } catch {
    return [];
  }
}

export default function PendingPaymentsModal() {
  const { closeModal } = useModal();
  const tickets = useMemo(() => {
    const all = getTickets();
    return all.filter((t) => t.status === "pending");
  }, []);

  const total = useMemo(() => tickets.reduce((s, t) => s + t.totalAmount, 0), [tickets]);

  return (
    <ModalWrapper title="Pagos Pendientes" onClose={closeModal} width="550px">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">
              {tickets.length} tickets pendientes
            </span>
          </div>
          <span className="text-lg font-bold text-yellow-700">{formatCurrency(total)}</span>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Ticket #</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-center">Jugadas</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                    No hay pagos pendientes
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">{t.ticketNumber}</td>
                    <td className="px-3 py-2 text-xs">{t.createdAt}</td>
                    <td className="px-3 py-2 text-center">{t.plays.length}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(t.totalAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={closeModal}
          className="w-full py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-colors"
        >
          PAGAR SELECCIONADOS
        </button>
      </div>
    </ModalWrapper>
  );
}
