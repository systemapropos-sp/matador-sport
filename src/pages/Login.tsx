import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Delete, ArrowLeft } from "lucide-react";

const CORRECT_PIN = "2539";

export default function Login() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("matador_auth");
    if (auth) {
      const parsed = JSON.parse(auth);
      if (parsed.expires && parsed.expires > Date.now()) {
        navigate("/betting-pool/ticket/create");
      }
    }
  }, [navigate]);

  const handlePinSubmit = useCallback(
    (finalPin: string) => {
      if (finalPin === CORRECT_PIN) {
        const expires = Date.now() + 8 * 60 * 60 * 1000;
        localStorage.setItem("matador_auth", JSON.stringify({ expires }));
        navigate("/betting-pool/ticket/create");
      } else {
        setError("PIN incorrecto");
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin("");
        }, 600);
      }
    },
    [navigate]
  );

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        setPin((prev) => {
          if (prev.length >= 4) return prev;
          const next = prev + e.key;
          if (next.length === 4) {
            setTimeout(() => handlePinSubmit(next), 100);
          }
          setError("");
          return next;
        });
      } else if (e.key === "Backspace") {
        setPin((prev) => prev.slice(0, -1));
        setError("");
      } else if (e.key === "Enter") {
        if (pin.length === 4) handlePinSubmit(pin);
      } else if (e.key === "Escape") {
        setPin("");
        setError("");
      }
    },
    [pin, handlePinSubmit]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError("");
    if (next.length === 4) {
      setTimeout(() => handlePinSubmit(next), 100);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      {/* Animated orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-green-500/20 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] animate-pulse" />

      <div
        className={`relative z-10 bg-white/[0.08] backdrop-blur-[20px] border border-white/15 rounded-2xl p-8 w-[360px] shadow-2xl transition-transform ${
          shake ? "animate-[shake_0.5s_ease-in-out]" : ""
        }`}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h1
            className="text-[32px] font-bold text-white"
            style={{ textShadow: "0 0 20px rgba(92,184,92,0.5)" }}
          >
            MATADOR-SPORT
          </h1>
          <p className="text-sm text-gray-400 mt-1">Sistema de Loteria</p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                i < pin.length
                  ? "bg-green-500 border-green-400 shadow-[0_0_15px_rgba(92,184,92,0.6)]"
                  : "bg-transparent border-white/30"
              }`}
            >
              {i < pin.length && (
                <div className="w-3 h-3 bg-white rounded-full" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="text-center text-red-400 text-sm mb-4">{error}</div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="h-14 rounded-xl bg-white/10 text-white text-xl font-bold hover:scale-105 hover:bg-white/20 active:scale-95 transition-all"
            >
              {d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleClear}
            className="h-14 rounded-xl bg-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/30 active:scale-95 transition-all flex items-center justify-center"
          >
            ESC
          </button>
          <button
            onClick={() => handleDigit("0")}
            className="h-14 rounded-xl bg-white/10 text-white text-xl font-bold hover:scale-105 hover:bg-white/20 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-14 rounded-xl bg-white/10 text-white hover:scale-105 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete size={20} />
          </button>
        </div>

        <button
          onClick={() => pin.length === 4 && handlePinSubmit(pin)}
          className={`w-full mt-6 py-3 rounded-xl font-bold text-white transition-all ${
            pin.length === 4
              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
              : "bg-gray-600 cursor-not-allowed"
          }`}
        >
          ENTRAR
        </button>

        <div className="mt-4 text-center">
          <a href="#" className="text-xs text-gray-400 hover:text-green-400 transition-colors">
            Descargar Drivers de printers
          </a>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }
      `}</style>
    </div>
  );
}
