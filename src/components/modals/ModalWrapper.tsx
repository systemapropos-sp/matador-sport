import React from "react";
import { X } from "lucide-react";

interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export default function ModalWrapper({ title, onClose, children, width = "500px" }: ModalWrapperProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ width: width, maxWidth: "95vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
