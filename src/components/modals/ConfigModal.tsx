import React, { useState } from "react";
import { Settings, Printer, MessageSquare, Monitor, Globe } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import { useModal } from "./ModalContext";

export default function ConfigModal() {
  const { closeModal } = useModal();
  const [autoPrint, setAutoPrint] = useState(false);
  const [soloSMS, setSoloSMS] = useState(false);
  const [printMode, setPrintMode] = useState("driver");
  const [language, setLanguage] = useState("es");

  return (
    <ModalWrapper title="Configuracion" onClose={closeModal} width="450px">
      <div className="space-y-5">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Printer size={18} className="text-gray-500" />
            <div>
              <div className="text-sm font-medium">Imprimir automaticamente</div>
              <div className="text-xs text-gray-400">Imprime tickets al crearse</div>
            </div>
          </div>
          <button
            onClick={() => setAutoPrint(!autoPrint)}
            className={`w-11 h-6 rounded-full transition-colors ${autoPrint ? "bg-green-500" : "bg-gray-300"}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${autoPrint ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <MessageSquare size={18} className="text-gray-500" />
            <div>
              <div className="text-sm font-medium">Solo SMS</div>
              <div className="text-xs text-gray-400">Enviar solo por SMS</div>
            </div>
          </div>
          <button
            onClick={() => setSoloSMS(!soloSMS)}
            className={`w-11 h-6 rounded-full transition-colors ${soloSMS ? "bg-green-500" : "bg-gray-300"}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${soloSMS ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Monitor size={18} className="text-gray-500" />
            <div className="text-sm font-medium">Modo de impresion</div>
          </div>
          <div className="flex gap-2">
            {["driver", "generic"].map((mode) => (
              <button
                key={mode}
                onClick={() => setPrintMode(mode)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  printMode === mode ? "bg-green-500 text-white" : "bg-white border hover:bg-gray-100"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Globe size={18} className="text-gray-500" />
            <div className="text-sm font-medium">Idioma</div>
          </div>
          <div className="flex gap-2">
            {[
              { key: "es", label: "Espanol" },
              { key: "en", label: "English" },
            ].map((lang) => (
              <button
                key={lang.key}
                onClick={() => setLanguage(lang.key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  language === lang.key ? "bg-green-500 text-white" : "bg-white border hover:bg-gray-100"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
