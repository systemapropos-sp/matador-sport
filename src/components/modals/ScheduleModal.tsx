import React from "react";
import { Clock } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import { useModal } from "./ModalContext";
import { schedules } from "@/data/schedules";
import { isTimePassed } from "@/lib/utils";
import { getLotteryById } from "@/data/lotteries";

export default function ScheduleModal() {
  const { closeModal } = useModal();

  const periods = [
    { label: "Manana (AM)", filter: (h: number) => h < 12 },
    { label: "Tarde (PM)", filter: (h: number) => h >= 12 && h < 18 },
    { label: "Noche (Evening)", filter: (h: number) => h >= 18 },
  ];

  return (
    <ModalWrapper title="Horarios de Cierre" onClose={closeModal} width="500px">
      <div className="space-y-4">
        {periods.map((period) => {
          const periodSchedules = schedules.filter((s) => {
            const [h] = s.closingTime.split(":").map(Number);
            return period.filter(h);
          });
          return (
            <div key={period.label}>
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-2 flex items-center gap-1">
                <Clock size={14} />
                {period.label}
              </h3>
              <div className="border rounded-lg overflow-hidden">
                {periodSchedules.map((s) => {
                  const lottery = getLotteryById(s.lotteryId);
                  const passed = isTimePassed(s.closingTime);
                  return (
                    <div
                      key={s.lotteryId}
                      className={`flex items-center justify-between px-3 py-2 border-b last:border-b-0 ${
                        passed ? "bg-gray-50 opacity-60" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {lottery && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: lottery.color }}
                          />
                        )}
                        <span className="text-sm font-medium">{s.lotteryName}</span>
                      </div>
                      <span
                        className={`text-sm font-mono font-bold ${
                          passed ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {s.closingTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ModalWrapper>
  );
}
