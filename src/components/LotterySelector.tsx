import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { regularLotteries } from "@/data/lotteries";
import { useTheme } from "@/context/ThemeContext";
import { isTimePassed } from "@/lib/utils";
import { getScheduleByLotteryId } from "@/data/schedules";

interface LotterySelectorProps {
  selectedLotteries: string[];
  onSelectLottery: (ids: string[]) => void;
  multiMode: boolean;
  onToggleMulti: () => void;
}

export default function LotterySelector({
  selectedLotteries,
  onSelectLottery,
  multiMode,
  onToggleMulti,
}: LotterySelectorProps) {
  const { setPrimaryColor } = useTheme();
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = useMemo(
    () =>
      regularLotteries.filter((l) => {
        const sched = getScheduleByLotteryId(l.id);
        return sched ? !isTimePassed(sched.closingTime) : true;
      }),
    []
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSelect = (id: string) => {
    if (multiMode) {
      if (selectedLotteries.includes(id)) {
        onSelectLottery(selectedLotteries.filter((x) => x !== id));
      } else {
        onSelectLottery([...selectedLotteries, id]);
      }
    } else {
      onSelectLottery([id]);
      const lottery = regularLotteries.find((l) => l.id === id);
      if (lottery) setPrimaryColor(lottery.color);
    }
  };

  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-white border-b">
      <button
        onClick={() => setPage(Math.max(0, page - 1))}
        disabled={page === 0}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex-1 flex gap-1.5 overflow-x-auto">
        {visible.map((l) => {
          const isActive = selectedLotteries.includes(l.id);
          return (
            <button
              key={l.id}
              onClick={() => handleSelect(l.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border-2"
              style={{
                borderColor: l.color,
                backgroundColor: isActive ? l.color : "transparent",
                color: isActive ? "#fff" : "#333",
              }}
            >
              {l.name}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
      >
        <ChevronRight size={16} />
      </button>

      <div className="flex items-center gap-1 ml-2 border-l pl-2">
        <span className="text-xs text-gray-500">Mult. lot</span>
        <button
          onClick={onToggleMulti}
          className={`w-10 h-5 rounded-full transition-colors relative ${
            multiMode ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform ${
              multiMode ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
