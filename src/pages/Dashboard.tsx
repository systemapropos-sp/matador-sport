import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ClipboardList,
  Printer,
  Share2,
  HelpCircle,
  Hash,
  Plus,
  X,
  CheckCircle,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useModal } from "@/components/modals/ModalContext";
import Navbar from "@/components/Navbar";
import SideMenu from "@/components/SideMenu";
import ResultsPanel from "@/components/ResultsPanel";
import LotterySelector from "@/components/LotterySelector";
import GameTable from "@/components/GameTable";
import ShortcutsPanel from "@/components/ShortcutsPanel";
import {
  detectPlayType,
  formatCurrency,
  generateTicketNumber,
  formatDateTime,
} from "@/lib/utils";
import type { Play, Ticket, PlayType } from "@/types";

function saveTicketToStorage(ticket: Ticket) {
  const existing = JSON.parse(localStorage.getItem("matador_tickets") || "[]");
  existing.push(ticket);
  localStorage.setItem("matador_tickets", JSON.stringify(existing));
}

function getRecentTickets(): Ticket[] {
  return JSON.parse(localStorage.getItem("matador_tickets") || "[]").slice(-10);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { primaryColor, gradientStart, gradientEnd } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedLotteries, setSelectedLotteries] = useState<string[]>([]);
  const [multiMode, setMultiMode] = useState(false);
  const [plays, setPlays] = useState<Play[]>([]);
  const [jugada, setJugada] = useState("");
  const [monto, setMonto] = useState("");
  const [showRecent, setShowRecent] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Auth check
  useEffect(() => {
    const auth = localStorage.getItem("matador_auth");
    if (!auth) {
      navigate("/sessions/new");
      return;
    }
    const parsed = JSON.parse(auth);
    if (parsed.expires && parsed.expires <= Date.now()) {
      localStorage.removeItem("matador_auth");
      navigate("/sessions/new");
    }
  }, [navigate]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleAddPlay = useCallback(() => {
    if (!jugada.trim() || !monto.trim()) {
      showToast("Ingrese jugada y monto", "error");
      return;
    }
    const amount = Number(monto);
    if (isNaN(amount) || amount <= 0) {
      showToast("Monto invalido", "error");
      return;
    }
    if (selectedLotteries.length === 0) {
      showToast("Seleccione al menos una loteria", "error");
      return;
    }
    const type = detectPlayType(jugada);
    const newPlays: Play[] = selectedLotteries.map((lotteryId) => ({
      id: `play-${Date.now()}-${lotteryId}`,
      numbers: jugada,
      amount,
      type,
      lotteryId,
      lotteryName: lotteryId.slice(0, 4).toUpperCase(),
    }));
    setPlays((prev) => [...prev, ...newPlays]);
    setJugada("");
    showToast(`${newPlays.length} jugada(s) agregada(s)`);
  }, [jugada, monto, selectedLotteries, showToast]);

  const handleDeletePlay = useCallback((id: string) => {
    setPlays((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleCreateTicket = useCallback(() => {
    if (plays.length === 0) {
      showToast("No hay jugadas", "error");
      return;
    }
    const ticket: Ticket = {
      id: `ticket-${Date.now()}`,
      ticketNumber: generateTicketNumber(),
      plays,
      totalAmount: plays.reduce((s, p) => s + p.amount, 0),
      status: "pending",
      createdAt: formatDateTime(new Date()),
      vendorId: "V001",
      vendorName: "Admin",
    };
    saveTicketToStorage(ticket);
    setPlays([]);
    showToast(`Ticket ${ticket.ticketNumber} creado!`);
  }, [plays, showToast]);

  const directo = plays.filter((p) => p.type === "directo");
  const paleTripleta = plays.filter((p) => p.type === "pale" || p.type === "tripleta");
  const cash3 = plays.filter((p) => p.type === "cash3");
  const play4pick5 = plays.filter((p) => p.type === "play4" || p.type === "pick5");

  const totalAmount = plays.reduce((s, p) => s + p.amount, 0);
  const recentTickets = getRecentTickets();

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Navbar onMenuToggle={() => setMenuOpen(!menuOpen)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="pt-[50px]">
        <ResultsPanel />
        <LotterySelector
          selectedLotteries={selectedLotteries}
          onSelectLottery={setSelectedLotteries}
          multiMode={multiMode}
          onToggleMulti={() => setMultiMode(!multiMode)}
        />

        <div className="p-3">
          {/* Action bar */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={handleCreateTicket}
              className="px-4 py-2 rounded-lg text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
            >
              CREAR TICKET
            </button>
            <button
              onClick={() => {
                if (plays.length > 0) { navigator.clipboard.writeText(plays.map(p => `${p.numbers} $${p.amount}`).join("\n")); showToast("Copiado!"); }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border hover:bg-gray-50 transition-colors"
            >
              <ClipboardList size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => window.print()}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border hover:bg-gray-50 transition-colors"
            >
              <Printer size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => { /* share */ }}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border hover:bg-gray-50 transition-colors"
            >
              <Share2 size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => openModal("authorize")}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border hover:bg-gray-50 transition-colors"
            >
              <HelpCircle size={16} className="text-gray-600" />
            </button>
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border">
              <Hash size={14} className="text-gray-500" />
              <span className="text-sm font-bold text-gray-700">{plays.length} PLAYS</span>
            </div>
          </div>

          {/* Input row */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">JUGADA</label>
              <input
                type="text"
                value={jugada}
                onChange={(e) => setJugada(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleAddPlay()}
                placeholder="00-000000"
                className="w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 tracking-widest"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-500 mb-1">N/A</label>
              <div className="h-[54px] flex items-center justify-center bg-gray-100 rounded-lg text-lg font-bold text-gray-400 border">
                -
              </div>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-500 mb-1">MONTO ($)</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPlay()}
                placeholder="0.00"
                className="w-full px-3 py-3 text-center text-xl font-mono font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="w-48 relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">RECENT</label>
              <button
                onClick={() => setShowRecent(!showRecent)}
                className="w-full h-[54px] px-3 text-left border-2 border-gray-300 rounded-lg text-sm text-gray-600 hover:border-green-500 focus:outline-none"
              >
                {recentTickets.length > 0
                  ? `${recentTickets[recentTickets.length - 1].ticketNumber}`
                  : "Select..."}
              </button>
              {showRecent && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-30 max-h-40 overflow-y-auto">
                  {recentTickets.map((t) => (
                    <div
                      key={t.id}
                      className="px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer border-b"
                      onClick={() => setShowRecent(false)}
                    >
                      <div className="font-mono font-bold">{t.ticketNumber}</div>
                      <div className="text-gray-400">{t.plays.length} jugadas - ${t.totalAmount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-medium text-gray-500 mb-1 opacity-0">.</label>
              <button
                onClick={handleAddPlay}
                className="h-[54px] w-[54px] flex items-center justify-center rounded-lg text-white font-bold hover:opacity-90 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
              >
                <Plus size={24} />
              </button>
            </div>
          </div>

          {/* Counters */}
          <div className="flex gap-4 mb-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
              <span className="text-xs text-gray-500">Jugadas:</span>
              <span className="text-lg font-bold text-gray-800">{plays.length}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
              <span className="text-xs text-gray-500">Total:</span>
              <span className="text-lg font-bold" style={{ color: primaryColor }}>
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Game Tables */}
          <div className="grid grid-cols-2 gap-3">
            <GameTable title="DIRECTO" plays={directo} onDeletePlay={handleDeletePlay} />
            <GameTable title="PALE & TRIPLETA" plays={paleTripleta} onDeletePlay={handleDeletePlay} />
            <GameTable title="CASH 3" plays={cash3} onDeletePlay={handleDeletePlay} />
            <GameTable title="PLAY 4 & PICK 5" plays={play4pick5} onDeletePlay={handleDeletePlay} />
          </div>
        </div>
      </div>

      <ShortcutsPanel />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-16 right-4 px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 text-white font-medium transition-all ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.type === "success" && <CheckCircle size={16} />}
          <X size={16} className="cursor-pointer" onClick={() => setToast(null)} />
          {toast.message}
        </div>
      )}
    </div>
  );
}
