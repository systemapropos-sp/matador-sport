import React, { useState } from "react";
import { Zap, Monitor, Wallet, BarChart3, Clock, Settings, Copy, Shuffle, HelpCircle, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useModal } from "./modals/ModalContext";

export default function ShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { openModal } = useModal();

  const shortcuts = [
    { icon: Monitor, label: "Monitor", action: () => openModal("ticketMonitor") },
    { icon: Wallet, label: "Ventas", action: () => navigate("/betting-pool/historical-sale") },
    { icon: BarChart3, label: "Reportes", action: () => navigate("/betting-pool/play-monitor") },
    { icon: Clock, label: "Horarios", action: () => openModal("schedule") },
    { icon: Settings, label: "Config", action: () => openModal("config") },
    { icon: Copy, label: "Duplicar", action: () => openModal("duplicateTicket") },
    { icon: Shuffle, label: "Aleatorio", action: () => openModal("randomGenerator") },
    { icon: HelpCircle, label: "Ayuda", action: () => window.open("#", "_blank") },
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-full shadow-xl flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-transform"
      >
        {isOpen ? <X size={24} /> : <Zap size={24} />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute bottom-24 right-6 w-72 bg-white rounded-2xl shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Accesos Rapidos</h3>
            <div className="grid grid-cols-4 gap-2">
              {shortcuts.map((s) => (
                <button
                  key={s.label}
                  onClick={() => { s.action(); setIsOpen(false); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <s.icon size={18} className="text-gray-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
