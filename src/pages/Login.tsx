import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Delete, FileText, Search, Clock, HelpCircle } from "lucide-react";

const CORRECT_PIN = "2539";
const AUTH_DURATION = 8 * 60 * 60 * 1000; // 8 hours in ms

/* ─── Floating Orb Component ─── */
function FloatingOrb({
  color,
  size,
  x,
  y,
  duration,
  delay = 0,
}: {
  color: string;
  size: number;
  x: string;
  y: string;
  duration: number;
  delay?: number;
}) {
  return (
    <motion.div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        left: x,
        top: y,
        filter: "blur(40px)",
        pointerEvents: "none",
        zIndex: 0,
      }}
      animate={{
        x: [0, 30, -20, 15, 0],
        y: [0, -25, 20, -15, 0],
        scale: [1, 1.1, 0.95, 1.05, 1],
      }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

/* ─── PIN Dots Component ─── */
function PinDots({
  count,
  shake,
  errorMode,
}: {
  count: number;
  shake: boolean;
  errorMode: boolean;
}) {
  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -12, 12, -12, 12, -8, 8, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.45 }}
      className="flex items-center justify-center gap-5"
    >
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: `2px solid ${errorMode && i < count ? "rgba(217,83,79,0.6)" : i < count ? "rgba(92,184,92,0.8)" : "rgba(255,255,255,0.25)"}`,
            background:
              errorMode && i < count
                ? "rgba(217,83,79,0.3)"
                : i < count
                ? "#5cb85c"
                : "transparent",
            boxShadow:
              errorMode && i < count
                ? "0 0 25px rgba(217,83,79,0.4)"
                : i < count
                ? "0 0 25px rgba(92,184,92,0.5)"
                : "none",
          }}
          initial={false}
          animate={
            i < count
              ? { scale: [0, 1.2, 1] }
              : { scale: 1 }
          }
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 15,
            delay: i < count ? 0 : 0,
          }}
        >
          <AnimatePresence>
            {i < count && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-white font-bold text-2xl select-none"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
              >
                {"*"}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── Keypad Button Component ─── */
function KeypadButton({
  label,
  onClick,
  variant = "default",
  index = 0,
  className = "",
}: {
  label: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "enter" | "esc" | "backspace";
  index?: number;
  className?: string;
}) {
  const getBg = () => {
    switch (variant) {
      case "enter":
        return "linear-gradient(135deg, #5cb85c, #4cae4c)";
      case "esc":
        return "rgba(217,83,79,0.8)";
      case "backspace":
        return "rgba(255,255,255,0.06)";
      default:
        return "rgba(255,255,255,0.06)";
    }
  };

  const getHoverBg = () => {
    switch (variant) {
      case "enter":
        return "linear-gradient(135deg, #4cae4c, #449d44)";
      case "esc":
        return "rgba(217,83,79,1)";
      default:
        return "rgba(255,255,255,0.12)";
    }
  };

  const getActiveBg = () => {
    switch (variant) {
      case "enter":
        return "linear-gradient(135deg, #449d44, #3d8b3d)";
      case "esc":
        return "rgba(201,48,44,1)";
      default:
        return "rgba(255,255,255,0.2)";
    }
  };

  const getColor = () => {
    switch (variant) {
      case "enter":
        return "#fff";
      case "esc":
        return "#fff";
      default:
        return "#fff";
    }
  };

  return (
    <motion.button
      className={className}
      style={{
        height: 64,
        borderRadius: 16,
        fontSize: variant === "enter" ? 18 : 22,
        fontWeight: variant === "enter" ? 700 : 600,
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border:
          variant === "enter" || variant === "esc"
            ? "none"
            : "1px solid rgba(255,255,255,0.1)",
        outline: "none",
        background: getBg(),
        color: getColor(),
        transition: "background 0.15s ease",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.3 + index * 0.04,
        duration: 0.35,
        ease: "easeOut",
      }}
      whileHover={{
        scale: 1.05,
        background: getHoverBg(),
      }}
      whileTap={{
        scale: 0.95,
        background: getActiveBg(),
      }}
      onClick={onClick}
    >
      {label}
    </motion.button>
  );
}

/* ─── Shortcuts Bar ─── */
function ShortcutsBar({ navigate }: { navigate: (path: string) => void }) {
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
      transition={{ delay: 1, duration: 0.5 }}
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

/* ─── Main Login Component ─── */
export default function Login() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [errorMode, setErrorMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const autoValidateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Check existing auth
  useEffect(() => {
    const ts = localStorage.getItem("matador_auth_timestamp");
    if (ts && Date.now() - parseInt(ts, 10) < AUTH_DURATION) {
      navigate("/betting-pool/ticket/create");
    }
  }, [navigate]);

  // Validate PIN
  const validatePin = useCallback(
    (p: string) => {
      if (p === CORRECT_PIN) {
        localStorage.setItem("matador_auth_pin", CORRECT_PIN);
        localStorage.setItem("matador_auth_timestamp", Date.now().toString());
        navigate("/betting-pool/ticket/create");
      } else {
        setError("PIN incorrecto");
        setErrorMode(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin("");
          setErrorMode(false);
        }, 800);
      }
    },
    [navigate]
  );

  // Auto-submit on 4 digits
  useEffect(() => {
    if (pin.length === 4) {
      autoValidateTimer.current = setTimeout(() => {
        validatePin(pin);
      }, 400);
    }
    return () => {
      if (autoValidateTimer.current) clearTimeout(autoValidateTimer.current);
    };
  }, [pin, validatePin]);

  // Digit input
  const handleDigit = useCallback((digit: string) => {
    setError("");
    setPin((prev) => (prev.length >= 4 ? prev : prev + digit));
  }, []);

  // Backspace
  const handleBackspace = useCallback(() => {
    setError("");
    setErrorMode(false);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  // Clear
  const handleClear = useCallback(() => {
    setError("");
    setErrorMode(false);
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

  const timeStr = currentTime.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateStr = currentTime.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Keypad rows
  const keypadNumbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

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
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 25%, #16213e 60%, #0d2137 100%)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      }}
    >
      {/* ── Floating Orbs ── */}
      <FloatingOrb
        color="rgba(92,184,92,0.15)"
        size={400}
        x="-5%"
        y="-10%"
        duration={10}
        delay={0}
      />
      <FloatingOrb
        color="rgba(51,122,183,0.12)"
        size={500}
        x="70%"
        y="60%"
        duration={12}
        delay={2}
      />
      <FloatingOrb
        color="rgba(240,173,78,0.08)"
        size={350}
        x="30%"
        y="40%"
        duration={9}
        delay={1}
      />
      <FloatingOrb
        color="rgba(92,184,92,0.06)"
        size={300}
        x="80%"
        y="-5%"
        duration={11}
        delay={3}
      />

      {/* ── Glassmorphism Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          width: 420,
          padding: "48px 40px",
          borderRadius: 24,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow:
            "0 25px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center"
        >
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: 3,
              textShadow: "0 2px 20px rgba(92,184,92,0.3)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            MATADOR-SPORT
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
              marginTop: 6,
              marginBottom: 30,
              letterSpacing: 1,
            }}
          >
            Sistema de Banca de Loteria
          </p>
        </motion.div>

        {/* Date/Time */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-center"
          style={{ marginBottom: 24 }}
        >
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              textTransform: "capitalize",
              marginBottom: 2,
            }}
          >
            {dateStr}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 300,
              color: "rgba(255,255,255,0.7)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: 1,
            }}
          >
            {timeStr}
          </div>
        </motion.div>

        {/* PIN Dots */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{ marginBottom: 28 }}
        >
          <PinDots count={pin.length} shake={shake} errorMode={errorMode} />
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                color: "#ff6b6b",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 16,
                textAlign: "center",
                textShadow: "0 0 10px rgba(255,107,107,0.3)",
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keypad Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            width: "100%",
          }}
        >
          {/* Number rows */}
          {keypadNumbers.map((row, rowIdx) =>
            row.map((num, colIdx) => {
              const idx = rowIdx * 3 + colIdx;
              return (
                <KeypadButton
                  key={num}
                  label={num}
                  onClick={() => handleDigit(num)}
                  variant="default"
                  index={idx}
                />
              );
            })
          )}

          {/* Bottom row: ESC, 0, Backspace */}
          <KeypadButton
            label="ESC"
            onClick={handleClear}
            variant="esc"
            index={9}
          />
          <KeypadButton
            label="0"
            onClick={() => handleDigit("0")}
            variant="default"
            index={10}
          />
          <KeypadButton
            label={<Delete size={22} />}
            onClick={handleBackspace}
            variant="backspace"
            index={11}
          />

          {/* ENTRAR button - spans 3 columns */}
          <motion.button
            style={{
              gridColumn: "1 / -1",
              height: 56,
              borderRadius: 16,
              fontSize: 17,
              fontWeight: 700,
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              outline: "none",
              background: "linear-gradient(135deg, #5cb85c, #4cae4c)",
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: 2,
              boxShadow: "0 4px 20px rgba(92,184,92,0.3)",
            }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.35 }}
            whileHover={{
              scale: 1.02,
              background: "linear-gradient(135deg, #4cae4c, #449d44)",
              boxShadow: "0 6px 25px rgba(92,184,92,0.4)",
            }}
            whileTap={{
              scale: 0.98,
              background: "linear-gradient(135deg, #449d44, #3d8b3d)",
            }}
            onClick={() => pin.length === 4 && validatePin(pin)}
          >
            ENTRAR
          </motion.button>
        </div>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "rgba(255,255,255,0.25)",
            textAlign: "center",
          }}
        >
          Ingrese su PIN de 4 digitos
        </motion.p>
      </motion.div>

      {/* ── Footer Links ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            lineHeight: 1.6,
          }}
        >
          <div>Firefox Silent Print: print.always_print_silent</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        style={{
          position: "fixed",
          bottom: 20,
          right: 100,
          zIndex: 20,
        }}
      >
        <a
          href="/drivers"
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.6)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.35)")
          }
        >
          Descargar Drivers de printers
        </a>
      </motion.div>

      {/* ── Shortcuts Bar ── */}
      <ShortcutsBar navigate={navigate} />
    </div>
  );
}
