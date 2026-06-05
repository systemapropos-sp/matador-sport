import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Clock,
  HelpCircle,
  Delete,
  ArrowRight,
} from "lucide-react";

const CORRECT_PIN = "2539";
const AUTH_DURATION = 8 * 60 * 60 * 1000; // 8 hours in ms

// ──── Sub-components ───────────────────────────────────────────────

/** 4 circular PIN dots that fill as digits are entered */
function PinDots({
  count,
  shake,
}: {
  count: number;
  shake: boolean;
}) {
  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -10, 10, -10, 10, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center gap-4"
    >
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="flex items-center justify-center"
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.3)",
            background:
              i < count ? "#5cb85c" : "transparent",
            boxShadow:
              i < count
                ? "0 0 20px rgba(92,184,92,0.5)"
                : "none",
          }}
          initial={false}
          animate={
            i < count
              ? { scale: [0, 1.2, 1], borderColor: "rgba(92,184,92,0.8)" }
              : { scale: 1, borderColor: "rgba(255,255,255,0.3)" }
          }
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {i < count && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-white font-bold text-xl"
            >
              <ArrowRight size={20} strokeWidth={3} />
            </motion.div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

/** Individual keypad button */
function KeypadButton({
  label,
  onClick,
  variant = "default",
  index = 0,
}: {
  label: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "enter" | "clear";
  index?: number;
}) {
  const baseStyle: React.CSSProperties = {
    height: 60,
    borderRadius: 12,
    fontSize: variant === "enter" ? 18 : 24,
    fontWeight: variant === "enter" ? 700 : 500,
    cursor: "pointer",
    userSelect: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    outline: "none",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "rgba(255,255,255,0.1)",
      color: "#fff",
    },
    enter: {
      background: "#5cb85c",
      color: "#fff",
      gridColumn: "1 / -1",
      width: "100%",
    },
    clear: {
      background: "rgba(217,83,79,0.3)",
      color: "#ff6b6b",
      fontSize: 16,
      fontWeight: 600,
    },
  };

  return (
    <motion.button
      style={{ ...baseStyle, ...variantStyles[variant] }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.4 + index * 0.05,
        duration: 0.3,
        ease: "easeOut",
      }}
      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
      whileTap={{ scale: 0.95, backgroundColor: "rgba(255,255,255,0.3)" }}
      onClick={onClick}
    >
      {label}
    </motion.button>
  );
}

/** Bottom-right floating shortcuts bar */
function ShortcutsBar({
  navigate,
}: {
  navigate: (path: string) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const shortcuts = [
    { icon: FileText, label: "Ventas", path: "/betting-pool/historical-sale" },
    { icon: Search, label: "Jugadas", path: "/betting-pool/play-monitor" },
    { icon: Clock, label: "Horarios", path: "" },
    { icon: HelpCircle, label: "Ayuda", path: "" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 8,
        borderRadius: 9999,
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
        zIndex: 50,
      }}
    >
      {shortcuts.map((s, i) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            style={{ position: "relative" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => s.path && navigate(s.path)}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background:
                  hovered === i
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.05)",
                border: "none",
                cursor: s.path ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.7)",
                transition: "background 0.2s",
              }}
            >
              <Icon size={18} />
            </motion.button>
            {/* Tooltip */}
            <AnimatePresence>
              {hovered === i && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute",
                    bottom: 50,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.8)",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 60,
                  }}
                >
                  {s.label}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
}

// ──── Main Login Component ─────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [shake, setShake] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const autoValidateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update clock every second
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Check if already authenticated
  useEffect(() => {
    const ts = localStorage.getItem("matador_auth_timestamp");
    if (ts && Date.now() - parseInt(ts, 10) < AUTH_DURATION) {
      navigate("/betting-pool/ticket/create");
    }
  }, [navigate]);

  // Handle PIN validation
  const validatePin = useCallback(
    (p: string) => {
      if (p === CORRECT_PIN) {
        localStorage.setItem("matador_auth_pin", CORRECT_PIN);
        localStorage.setItem("matador_auth_timestamp", Date.now().toString());
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

  // Auto-validate when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      autoValidateTimer.current = setTimeout(() => {
        validatePin(pin);
      }, 500);
    }
    return () => {
      if (autoValidateTimer.current) clearTimeout(autoValidateTimer.current);
    };
  }, [pin, validatePin]);

  // Handle digit input
  const handleDigit = useCallback((digit: string) => {
    setError("");
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      return prev + digit;
    });
  }, []);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    setError("");
    setPin((prev) => prev.slice(0, -1));
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setError("");
    setPin("");
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (pin.length === 4) validatePin(pin);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, handleDigit, handleBackspace, handleClear, validatePin]);

  // Keypad layout: 1-2-3, 4-5-6, 7-8-9, del-0-enter
  const keypadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  const timeStr = currentTime.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)",
      }}
    >
      {/* Subtle animated background orbs */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "15%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(92,184,92,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "pulse 8s ease-in-out infinite",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "10%",
          width: 250,
          height: 250,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(51,122,183,0.1) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "pulse 10s ease-in-out infinite reverse",
          zIndex: 0,
        }}
      />

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>

      {/* ─── Main Card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: 420,
          margin: "0 16px",
          padding: 40,
          borderRadius: 16,
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Logo area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#fff",
              margin: 0,
              textTransform: "uppercase",
              fontFamily: "Arial, Helvetica, sans-serif",
            }}
          >
            MATADOR-SPORT
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
              margin: "8px 0 0 0",
              letterSpacing: 1,
            }}
          >
            Sistema de Banca de Loteria
          </p>
        </motion.div>

        {/* Time display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: 1,
          }}
        >
          {timeStr}
        </motion.div>

        {/* PIN display dots */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ width: "100%" }}
        >
          <PinDots count={pin.length} shake={shake} />
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                color: "#ff6b6b",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Numeric keypad */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            width: "100%",
          }}
        >
          {keypadRows.map((row, ri) =>
            row.map((digit, ci) => (
              <KeypadButton
                key={digit}
                label={digit}
                onClick={() => handleDigit(digit)}
                index={ri * 3 + ci}
              />
            ))
          )}

          {/* Bottom row: Backspace, 0, (empty spacer for visual balance) */}
          <KeypadButton
            label={<Delete size={20} />}
            onClick={handleBackspace}
            variant="clear"
            index={9}
          />
          <KeypadButton
            label="0"
            onClick={() => handleDigit("0")}
            index={10}
          />
          <KeypadButton
            label={
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
                ESC
              </span>
            }
            onClick={handleClear}
            variant="clear"
            index={11}
          />

          {/* ENTER button */}
          <KeypadButton
            label="ENTRAR"
            onClick={() => pin.length === 4 && validatePin(pin)}
            variant="enter"
            index={12}
          />
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            textAlign: "center",
            marginTop: 8,
          }}
        >
          v1.1 &mdash; PIN de acceso: 2539
        </motion.div>
      </motion.div>

      {/* ─── Bottom shortcuts bar ─── */}
      <ShortcutsBar navigate={(p) => navigate(p)} />
    </div>
  );
}
