import React, { useState, useMemo } from "react";
import { Copy, Search } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import { useModal } from "./ModalContext";
import { regularLotteries } from "@/data/lotteries";
import type { Ticket } from "@/types";

function getTickets(): Ticket[] {
  try {
    return JSON.parse(localStorage.getItem("matador_tickets") || "[]");
  } catch {
    return [];
  }
}

export default function DuplicateTicketModal() {
  const { closeModal } = useModal();
  const [ticketNumber, setTicketNumber] = useState("");
  const [destLottery, setDestLottery] = useState(regularLotteries[0]?.id || "");
  const [found, setFound] = useState<Ticket | null>(null);

  const handleSearch = () => {
    const tickets = getTickets();
    const t = tickets.find((x) => x.ticketNumber.includes(ticketNumber));
    setFound(t || null);
  };

  return (
    <ModalWrapper title="Duplicar Ticket" onClose={closeModal} width="450px">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Numero de Ticket</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="MWR-001-..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loteria destino</label>
          <select
            value={destLottery}
            onChange={(e) => setDestLottery(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {regularLotteries.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {found ? (
          <div className="border rounded-lg p-3 bg-green-50">
            <h4 className="text-sm font-medium mb-2">Ticket encontrado:</h4>
            <div className="text-sm font-mono text-gray-700">{found.ticketNumber}</div>
            <div className="text-xs text-gray-500">
              {found.plays.length} jugadas - ${found.totalAmount.toFixed(2)}
            </div>
          </div>
        ) : ticketNumber && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            Ticket no encontrado
          </div>
        )}

        <button
          onClick={closeModal}
          disabled={!found}
          className="w-full py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Copy size={18} />
          DUPLICAR
        </button>
      </div>
    </ModalWrapper>
  );
}
