import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Menu,
  ChevronDown,
  Printer,
  Settings,
  Ticket,
  User,
  Bell,
} from "lucide-react";
import { useModal } from "./modals/ModalContext";
import { formatDateTime } from "@/lib/utils";
import { lotteries } from "@/data/lotteries";

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const [clock, setClock] = useState(new Date());
  const [showResults, setShowResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        navigate("/betting-pool/ticket/create");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

  return (
    <nav className="fixed top-0 left-0 right-0 h-[50px] bg-[#333] flex items-center justify-between px-3 z-40 text-white shadow-lg">
      {/* Left */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuToggle}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowResults(!showResults)}
            className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-white/10 transition-colors text-sm font-medium"
          >
            RESULTADOS
            <ChevronDown size={14} className={`transition-transform ${showResults ? "rotate-180" : ""}`} />
          </button>
          {showResults && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#444] rounded-lg shadow-xl overflow-hidden z-50 border border-white/10">
              {lotteries.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 cursor-pointer text-sm"
                  onClick={() => setShowResults(false)}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  <span>{l.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => window.print()}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
        >
          <Printer size={18} />
        </button>
      </div>

      {/* Center */}
      <div className="absolute left-1/2 -translate-x-1/2 text-base font-bold tracking-wide">
        MATADOR-SPORT
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/betting-pool/ticket/create")}
          className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-md text-sm transition-colors shadow-md"
        >
          VENTAS
        </button>

        <button
          onClick={() => openModal("config")}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
        >
          <Settings size={18} />
        </button>

        <button
          onClick={() => openModal("ticketMonitor")}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
        >
          <Ticket size={18} />
        </button>

        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowUserMenu(false); }}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          >
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
              3
            </span>
          </button>
          {showNotif && (
            <div className="absolute top-full right-0 mt-1 w-64 bg-white text-gray-800 rounded-lg shadow-xl z-50 border">
              <div className="px-3 py-2 border-b font-medium text-sm">Notificaciones</div>
              <div className="px-3 py-2 text-sm text-gray-500">Sin nuevas notificaciones</div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotif(false); }}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          >
            <User size={18} />
          </button>
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-1 w-40 bg-white text-gray-800 rounded-lg shadow-xl z-50 border">
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm rounded-t-lg">Perfil</button>
              <button
                onClick={() => { localStorage.removeItem("matador_auth"); window.location.reload(); }}
                className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-red-600 rounded-b-lg"
              >
                Cerrar sesion
              </button>
            </div>
          )}
        </div>

        <div className="text-xs font-mono text-gray-300 ml-1">
          {formatDateTime(clock)}
        </div>
      </div>
    </nav>
  );
}
