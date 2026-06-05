import React, { useState, useMemo } from "react";
import { Copy, CheckSquare } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import { useModal } from "./ModalContext";
import { formatCurrency } from "@/lib/utils";
import { regularLotteries } from "@/data/lotteries";
import type { Ticket, Play } from "@/types";

function getTickets(): Ticket[] {
  try {
    return JSON.parse(localStorage.getItem("matador_tickets") || "[]");
  } catch {
    return [];
  }
}

export default function DuplicatePlaysModal() {
  const { closeModal } = useModal();
  const [ticketNumber, setTicketNumber] = useState("");
  const [selectedPlays, setSelectedPlays] = useState<string[]>([]);
  const [destLottery, setDestLottery] = useState(regularLotteries[0]?.id || "");
  const [found, setFound] = useState<Ticket | null>(null);

  const handleSearch = () => {
    const tickets = getTickets();
    const t = tickets.find((x) => x.ticketNumber.includes(ticketNumber));
    setFound(t || null);
    setSelectedPlays([]);
  };

  const togglePlay = (playId: string) => {
    setSelectedPlays((prev) =>
      prev.includes(playId) ? prev.filter((id) => id !== playId) : [...prev, playId]
    );
  };

  return (
    <ModalWrapper title="Duplicar Jugadas" onClose={closeModal} width="450px">
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
              Buscar
            </button>
          </div>
        </div>

        {found && (
          <>
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

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 uppercase">
                Seleccionar jugadas
              </div>
              {found.plays.map((play) => (
                <div
                  key={play.id}
                  onClick={() => togglePlay(play.id)}
                  className={`flex items-center justify-between px-3 py-2 border-t cursor-pointer transition-colors ${
                    selectedPlays.includes(play.id) ? "bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedPlays.includes(play.id)
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedPlays.includes(play.id) && <CheckSquare size={14} className="text-white" />}
                    </div>
                    <span className="font-mono font-bold text-sm">{play.numbers}</span>
                    <span className="text-xs text-gray-500 capitalize">{play.type}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(play.amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {ticketNumber && !found && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            Ticket no encontrado
          </div>
        )}

        <button
          onClick={closeModal}
          disabled={selectedPlays.length === 0}
          className="w-full py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Copy size={18} />
          DUPLICAR {selectedPlays.length > 0 && `(${selectedPlays.length})`}
        </button>
      </div>
    </ModalWrapper>
  );
}
