import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { lotteries } from "@/data/lotteries";
import { mockResults } from "@/data/mockResults";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export default function ResultsPanel() {
  const [isOpen, setIsOpen] = useState(true);

  const periods = [
    { label: "Manana", filter: (_schedule: string, idx: number) => idx < 7 },
    { label: "Tarde", filter: (_schedule: string, idx: number) => idx >= 7 && idx < 12 },
    { label: "Noche", filter: (_schedule: string, idx: number) => idx >= 12 && idx < 21 },
    { label: "Late Night", filter: (_schedule: string, idx: number) => idx >= 21 },
  ];

  return (
    <div className="bg-white border-b shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center py-1.5 hover:bg-gray-50 transition-colors"
      >
        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-3 max-h-[220px] overflow-y-auto">
          {periods.map((period) => {
            const periodLotteries = lotteries.filter((_, idx) => period.filter("", idx));
            return (
              <div key={period.label} className="mb-3">
                <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-1 tracking-wider">
                  {period.label}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {periodLotteries.map((l) => {
                    const result = mockResults.find((r) => r.lotteryId === l.id);
                    return (
                      <div
                        key={l.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs"
                        style={{ borderLeftColor: l.color, borderLeftWidth: "3px" }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ backgroundColor: l.color }}
                        >
                          {getInitials(l.name)}
                        </div>
                        <span className="font-medium text-gray-700 text-[10px]">{l.name}</span>
                        {result && (
                          <div className="flex gap-1 ml-1 font-mono text-[10px]">
                            <span className="px-1 bg-green-100 text-green-700 rounded font-bold">{result.primera}</span>
                            <span className="px-1 bg-blue-100 text-blue-700 rounded font-bold">{result.segunda}</span>
                            <span className="px-1 bg-purple-100 text-purple-700 rounded font-bold">{result.tercera}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
