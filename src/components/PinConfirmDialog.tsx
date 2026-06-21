/**
 * PinConfirmDialog — Diálogo PIN de seguridad antes de acciones destructivas.
 * Verifica el PIN del vendedor activo en Supabase.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Delete } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PinConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PinConfirmDialog({
  open,
  title = 'PIN de seguridad',
  message = 'Ingresa tu PIN para continuar',
  onConfirm,
  onCancel,
}: PinConfirmDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) { setPin(''); setError(''); }
  }, [open]);

  const handleKey = (k: string) => {
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    setError('');
    if (next.length === 4) verifyPin(next);
  };

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1));
    setError('');
  };

  const verifyPin = async (enteredPin: string) => {
    setLoading(true);
    const vendorId = localStorage.getItem('nmv_vendor_id');
    if (!vendorId) {
      // No vendor id: just accept (fallback)
      setLoading(false);
      onConfirm();
      return;
    }

    const { data, error: dbError } = await supabase
      .from('vendors')
      .select('pin')
      .eq('id', vendorId)
      .single();

    setLoading(false);

    if (dbError || !data) {
      // If can't verify, just accept (no block)
      onConfirm();
      return;
    }

    if (data.pin === enteredPin) {
      onConfirm();
    } else {
      setError('PIN incorrecto');
      setPin('');
    }
  };

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl"
            style={{ width: '320px', padding: '24px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} color="#d32f2f" />
                <span className="font-bold" style={{ fontSize: '16px', color: '#1f2937' }}>
                  {title}
                </span>
              </div>
              <button
                onClick={onCancel}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={16} color="#6b7280" />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              {message}
            </p>

            {/* PIN dots */}
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: i < pin.length ? '#d32f2f' : '#e5e7eb',
                    transition: 'background-color 0.15s',
                  }}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-3 font-semibold"
                style={{ fontSize: '12px', color: '#d32f2f' }}
              >
                {error}
              </motion.p>
            )}

            {/* Loading */}
            {loading && (
              <p className="text-center text-sm text-gray-400 mb-3">Verificando...</p>
            )}

            {/* Keypad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {KEYS.map((key, idx) => {
                if (key === '') return <div key={idx} />;
                const isDel = key === 'DEL';
                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (isDel) handleBackspace();
                      else handleKey(key);
                    }}
                    disabled={loading}
                    className="flex items-center justify-center rounded-xl font-bold"
                    style={{
                      height: '52px',
                      fontSize: isDel ? '12px' : '20px',
                      fontWeight: 700,
                      backgroundColor: isDel ? '#fef2f2' : '#f9fafb',
                      color: isDel ? '#d32f2f' : '#1f2937',
                      border: `1.5px solid ${isDel ? '#fecaca' : '#e5e7eb'}`,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {isDel ? <Delete size={18} /> : key}
                  </motion.button>
                );
              })}
            </div>

            {/* Cancel */}
            <button
              onClick={onCancel}
              className="w-full mt-4 py-2 rounded-xl font-semibold"
              style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '14px' }}
            >
              Cancelar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
