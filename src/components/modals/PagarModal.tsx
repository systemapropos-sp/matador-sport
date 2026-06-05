import React, { useState, useMemo } from "react";
import { DollarSign, CreditCard, Banknote } from "lucide-react";
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

export default function PagarModal() {
  const { closeModal } = useModal();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [amount, setAmount] = useState("");

  const pending = useMemo(() => {
    const all = getTickets();
    return all.filter((t) => t.status === "pending");
  }, []);

  const totalPending = useMemo(() => pending.reduce((s, t) => s + t.totalAmount, 0), [pending]);

  return (
    <ModalWrapper title="Procesar Pago" onClose={closeModal} width="400px">
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <div className="text-sm text-blue-600 mb-1">Total a pagar</div>
          <div className="text-3xl font-bold text-blue-800">{formatCurrency(totalPending)}</div>
          <div className="text-xs text-blue-400">{pending.length} tickets pendientes</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Metodo de pago</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                paymentMethod === "cash" ? "bg-green-500 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <Banknote size={18} />
              Efectivo
            </button>
            <button
              onClick={() => setPaymentMethod("card")}
              className={`py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                paymentMethod === "card" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <CreditCard size={18} />
              Tarjeta
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto recibido ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold text-center"
          />
        </div>

        {amount && Number(amount) > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cambio:</span>
              <span className="font-bold text-lg text-green-600">
                {formatCurrency(Math.max(0, Number(amount) - totalPending))}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={closeModal}
          className="w-full py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <DollarSign size={18} />
          CONFIRMAR PAGO
        </button>
      </div>
    </ModalWrapper>
  );
}
