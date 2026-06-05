import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, Loader2 } from 'lucide-react';

const easeValues = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor ingrese usuario y contrasena');
      triggerShake();
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (username === 'mr01' && password === '253935') {
        setLoading(false);
        navigate('/betting-pool/ticket/create');
      } else {
        setLoading(false);
        setError('Usuario o contrasena incorrectos');
        triggerShake();
      }
    }, 800);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2C1810 0%, #8B2500 35%, #2D1B69 70%, #1a1a2e 100%)',
      }}
    >
      {/* Background pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.03) 0%, transparent 50%)',
        }}
      />

      {/* "Banca" label */}
      <div
        className="absolute top-5 left-5"
        style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase' as const,
          letterSpacing: '2px',
        }}
      >
        Banca
      </div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        transition={
          shake
            ? { duration: 0.4 }
            : { duration: 0.6, ease: easeValues, delay: 0.1 }
        }
        className="relative w-[90vw] max-w-[380px]"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '48px 40px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          textAlign: 'center' as const,
        }}
      >
        {/* Logo */}
        <motion.img
          src="/matador-logo.png"
          alt="MATADOR-SPORT"
          className="mx-auto mb-6"
          style={{ maxWidth: '200px', height: 'auto' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        />

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeValues, delay: 0.15 }}
          style={{
            fontSize: '28px',
            fontWeight: 300,
            color: '#ffffff',
            marginBottom: '32px',
            letterSpacing: '1px',
          }}
        >
          Lottery
        </motion.h1>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeValues, delay: 0.2 }}
          >
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full outline-none transition-all"
              style={{
                height: '44px',
                padding: '0 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${error && !username ? 'rgba(217, 83, 79, 0.8)' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                marginBottom: '16px',
              }}
              autoComplete="username"
            />
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeValues, delay: 0.3 }}
          >
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full outline-none transition-all"
              style={{
                height: '44px',
                padding: '0 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${error && !password ? 'rgba(217, 83, 79, 0.8)' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                marginBottom: error ? '8px' : '24px',
              }}
              autoComplete="current-password"
            />
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-left mb-4"
              style={{ color: '#d9534f', fontSize: '12px' }}
            >
              {error}
            </motion.p>
          )}

          {/* Login button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeValues, delay: 0.4 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold outline-none transition-all"
              style={{
                height: '44px',
                backgroundColor: '#337ab7',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                letterSpacing: '1px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#286090';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#337ab7';
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Key size={16} />
              )}
              LOGIN
            </button>
          </motion.div>
        </form>

        {/* Printer drivers link */}
        <motion.a
          href="https://printers.apk.lol"
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-colors"
          style={{
            marginTop: '20px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            textDecoration: 'underline',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
        >
          Descargar Drivers de printers
        </motion.a>

        {/* Firefox Silent Print note */}
        <motion.span
          className="block"
          style={{
            marginTop: '12px',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.4)',
            fontFamily: 'monospace',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          Firefox Silent Print: print.always_print_silent
        </motion.span>
      </motion.div>
    </div>
  );
}
