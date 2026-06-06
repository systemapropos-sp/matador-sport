import { useState } from 'react';
import { motion } from 'framer-motion';
import ModalWrapper from './ModalWrapper';

interface AuthorizeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthorizeModal({ open, onClose }: AuthorizeModalProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const handleClose = () => {
    setPassword('');
    setConfirm('');
    setError('');
    setShaking(false);
    onClose();
  };

  const handleAuthorize = () => {
    setError('');

    if (!password.trim() || !confirm.trim()) {
      setError('Ambos campos son requeridos');
      triggerShake();
      return;
    }

    if (password !== confirm) {
      setError('Las contrasenas no coinciden');
      triggerShake();
      return;
    }

    // Success - authorized
    handleClose();
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  const shakeAnimation: { animate?: { x: number[]; transition: { duration: number } } } = shaking
    ? { animate: { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4 } } }
    : {};

  const inputStyle: React.CSSProperties = {
    height: '44px',
    width: '100%',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    padding: '0 12px',
    fontSize: '14px',
    outline: 'none',
  };

  const inputFocusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#337ab7';
    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(51,122,183,0.2)';
  };

  const inputBlurStyle = (e: React.FocusEvent<HTMLInputElement>, hasError: boolean) => {
    e.currentTarget.style.borderColor = hasError ? '#d9534f' : '#cccccc';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <ModalWrapper open={open} onClose={handleClose} title="Autorizar ponchado" maxWidth="400px">
      <motion.div {...shakeAnimation}>
        <div className="flex flex-col gap-4">
          {/* Password */}
          <div>
            <label
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#555555',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onFocus={inputFocusStyle}
              onBlur={(e) => inputBlurStyle(e, false)}
              style={{
                ...inputStyle,
                borderColor: error && !password.trim() ? '#d9534f' : '#cccccc',
              }}
            />
          </div>

          {/* Confirm */}
          <div>
            <label
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#555555',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Confirmacion
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(''); }}
              onFocus={inputFocusStyle}
              onBlur={(e) => inputBlurStyle(e, false)}
              style={{
                ...inputStyle,
                borderColor: error && !confirm.trim() ? '#d9534f' : '#cccccc',
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: '#d9534f', fontSize: '13px', marginTop: '-4px' }}
            >
              {error}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleAuthorize}
          className="w-full rounded transition-colors"
          style={{
            height: '44px',
            backgroundColor: '#5cb85c',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4cae4c'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#5cb85c'; }}
        >
          Autorizar
        </motion.button>
      </div>
    </ModalWrapper>
  );
}
