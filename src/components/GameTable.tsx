import React from "react";
import { Trash2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { formatCurrency } from "@/lib/utils";
import type { Play } from "@/types";

interface GameTableProps {
  title: string;
  plays: Play[];
  onDeletePlay: (id: string) => void;
  emptyRows?: number;
}

export default function GameTable({ title, plays, onDeletePlay, emptyRows = 8 }: GameTableProps) {
  const { gradientStart, gradientEnd } = useTheme();
  const display = [...plays];
  while (display.length < emptyRows) {
    display.push({ id: `empty-${display.length}`, numbers: "", amount: 0, type: "directo", lotteryId: "", lotteryName: "" });
  }

  return (
    <div className="border-2 border-[#bbb] rounded-lg overflow-hidden shadow-md flex flex-col">
      {/* Header */}
      <div
        className="px-3 py-2 text-white text-sm font-bold uppercase tracking-wide"
        style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
      >
        {title}
      </div>

      {/* Column headers */}
      <div
        className="grid grid-cols-[40px_1fr_70px_30px] text-xs font-bold uppercase text-gray-700"
        style={{ background: `linear-gradient(135deg, ${gradientStart}20, ${gradientEnd}20)` }}
      >
        <div className="px-2 py-1.5 border-r text-center">LOT</div>
        <div className="px-2 py-1.5 border-r">NUM</div>
        <div className="px-2 py-1.5 border-r text-center">$</div>
        <div className="py-1.5 text-center"></div>
      </div>

      {/* Body */}
      <div className="flex-1">
        {display.map((play, idx) => {
          const isEmpty = play.id.startsWith("empty-");
          return (
            <div
              key={play.id}
              className={`grid grid-cols-[40px_1fr_70px_30px] text-sm transition-colors ${
                isEmpty
                  ? idx % 2 === 0 ? "bg-[#EEEEEE]" : "bg-[#E0E0E0]"
                  : "bg-white hover:bg-[#BDBDBD]"
              }`}
              style={{ height: "40px", alignItems: "center" }}
            >
              <div className="px-2 border-r text-center text-xs text-gray-500 truncate">
                {!isEmpty && play.lotteryName.slice(0, 4)}
              </div>
              <div className="px-2 border-r font-mono font-bold text-gray-800 truncate">
                {play.numbers}
              </div>
              <div className="px-2 border-r text-right font-medium text-gray-700 text-xs">
                {!isEmpty && formatCurrency(play.amount)}
              </div>
              <div className="text-center">
                {!isEmpty && (
                  <button
                    onClick={() => onDeletePlay(play.id)}
                    className="p-0.5 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 size={12} className="text-red-500" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="grid grid-cols-[40px_1fr_70px_30px] text-xs text-white" style={{ backgroundColor: "#3C3F54" }}>
        <div className="px-2 py-2 border-r text-center font-bold">{plays.length}</div>
        <div className="px-2 py-2 border-r font-medium">Total</div>
        <div className="px-2 py-2 border-r text-right font-bold">
          {formatCurrency(plays.reduce((s, p) => s + p.amount, 0))}
        </div>
        <div></div>
      </div>
    </div>
  );
}
