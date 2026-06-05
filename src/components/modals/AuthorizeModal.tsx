import React, { useState } from "react";
import { Lock, Shield } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import { useModal } from "./ModalContext";

export default function AuthorizeModal() {
  const { closeModal } = useModal();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleAuthorize = () => {
    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }
    if (password.length < 4) {
      setError("Minimo 4 caracteres");
      return;
    }
    setError("");
    closeModal();
  };

  return (
    <ModalWrapper title="Autorizacion" onClose={closeModal} width="400px">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Shield size={20} className="text-amber-600" />
          <p className="text-sm text-amber-700">
            Esta accion requiere autorizacion de supervisor.
          </p>
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Lock size={14} className="inline mr-1" />
            Contrasena
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="****"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Lock size={14} className="inline mr-1" />
            Confirmar Contrasena
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="****"
          />
        </div>

        <button
          onClick={handleAuthorize}
          className="w-full py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-colors"
        >
          AUTORIZAR
        </button>
      </div>
    </ModalWrapper>
  );
}
