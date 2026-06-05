import React from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Monitor,
  Wallet,
  BarChart3,
  Printer,
  Copy,
  Shuffle,
  Dices,
  CreditCard,
  Eye,
  Clock,
  HelpCircle,
  Settings,
  Lock,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useModal } from "./modals/ModalContext";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal } = useModal();

  const menuItems = [
    { icon: Monitor, label: "Monitoreo", action: () => { openModal("ticketMonitor"); onClose(); } },
    { icon: Wallet, label: "Ventas historicas", action: () => { navigate("/betting-pool/historical-sale"); onClose(); } },
    { icon: BarChart3, label: "Reportes", action: () => { navigate("/betting-pool/play-monitor"); onClose(); } },
    { icon: Printer, label: "Imprimir", action: () => { window.print(); } },
    { icon: Copy, label: "Duplicar ticket", action: () => { openModal("duplicateTicket"); onClose(); } },
    { icon: Shuffle, label: "Duplicar jugadas", action: () => { openModal("duplicatePlays"); onClose(); } },
    { icon: Dices, label: "Aleatorio", action: () => { openModal("randomGenerator"); onClose(); } },
    { icon: CreditCard, label: "Pagos pendientes", action: () => { openModal("pendingPayments"); onClose(); } },
    { icon: Eye, label: "Ver tickets", action: () => { openModal("ticketMonitor"); onClose(); } },
    { icon: Clock, label: "Horarios", action: () => { openModal("schedule"); onClose(); } },
    { icon: HelpCircle, label: "Ayuda", action: () => { window.open("#", "_blank"); } },
    { icon: Settings, label: "Configuracion", action: () => { openModal("config"); onClose(); } },
    { icon: Lock, label: "Autorizar", action: () => { openModal("authorize"); onClose(); } },
    { icon: Sparkles, label: "Sorteos", action: () => { openModal("schedule"); onClose(); } },
    { icon: LogOut, label: "Cerrar sesion", action: () => { localStorage.removeItem("matador_auth"); window.location.href = "#/sessions/new"; } },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      )}
      <div
        className={`fixed top-[50px] left-0 bottom-0 w-[260px] bg-[#2c2c2c] z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="py-3">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-5 py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
