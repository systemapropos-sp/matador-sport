import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import SideMenu from "@/components/SideMenu";
import { formatCurrency } from "@/lib/utils";
import { lotteries } from "@/data/lotteries";
import type { Ticket, Play } from "@/types";

function getTickets(): Ticket[] {
  try {
    return JSON.parse(localStorage.getItem("matador_tickets") || "[]");
  } catch {
    return [];
  }
}

function PlayTable({ title, plays }: { title: string; plays: Play[] }) {
  return (
    <div className="border-2 border-[#bbb] rounded-lg overflow-hidden shadow-md">
      <div className="px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-bold uppercase">
        {title} ({plays.length})
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-3 py-2 text-left">Numero</th>
            <th className="px-3 py-2 text-left">Loteria</th>
            <th className="px-3 py-2 text-right">Monto</th>
            <th className="px-3 py-2 text-center">Tipo</th>
          </tr>
        </thead>
        <tbody>
          {plays.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-xs">Sin jugadas</td>
            </tr>
          ) : (
            plays.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono font-bold">{p.numbers}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{p.lotteryName}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(p.amount)}</td>
                <td className="px-3 py-2 text-center">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 capitalize">{p.type}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function PlayMonitor() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [date, setDate] = useState("");
  const [lotteryFilter, setLotteryFilter] = useState<string>("all");

  const tickets = useMemo(() => getTickets(), []);

  const allPlays = useMemo(() => {
    const plays: Play[] = [];
    tickets.forEach((t) => plays.push(...t.plays));
    if (lotteryFilter !== "all") {
      return plays.filter((p) => p.lotteryId === lotteryFilter);
    }
    return plays;
  }, [tickets, lotteryFilter]);

  const directo = allPlays.filter((p) => p.type === "directo");
  const pale = allPlays.filter((p) => p.type === "pale");
  const tripleta = allPlays.filter((p) => p.type === "tripleta");

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
          <h1 className="text-xl font-bold text-gray-800">Monitoreo de Jugadas</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={lotteryFilter}
                onChange={(e) => setLotteryFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">Todas las loterias</option>
                {lotteries.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-3 gap-4">
          <PlayTable title="DIRECTO" plays={directo} />
          <PlayTable title="PALE" plays={pale} />
          <PlayTable title="TRIPLETA" plays={tripleta} />
        </div>
      </div>
    </div>
  );
}
