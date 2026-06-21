import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useModalContext } from './ModalContext';

const SHORTCUTS = [
  { key: '↑', desc: '(Arriba) Limpiar campos de jugada y Monto.' },
  { key: 'L', desc: '(Ele) Cancelar el ticket y limpiar la pantalla.' },
  { key: '/', desc: '(Slash) Cambiar de lotería.' },
  { key: '*', desc: '(Asterisco) Imprimir el ticket.' },
  { key: 'c', desc: 'Duplicar ticket.' },
  { key: 'P', desc: 'Marcar ticket como pagado.' },
  { key: 'q', desc: 'Sólo para Cash 3 y Play 4. Digitar la jugada seguida de q (Ej.: 123q) para generar todas las combinaciones del número.' },
  { key: '.', desc: '(Punto) sólo para Directo, Pálé y Tripleta. Digitar la jugada seguida de un punto (Ej.: 1234.) para generar todas las combinaciones del número.' },
  { key: 'd', desc: 'Sólo para Directo. Ingresar una jugada inicial de dos dígitos iguales seguidos de la letra d y luego dos dígitos iguales para la jugada final (Ej.: 33d66) para generar una secuencia de pares iguales desde la jugada inicial has la jugada final.' },
  { key: '-10', desc: 'Sólo Para Cash 3. Ingresar una jugada de tres dígitos seguidos de -10 (Ej.: 123-10) para generar todas las combinaciones que contienen los últimos dos dígitos aumentando en 100 cada valor.' },
  { key: '+xyz', desc: 'Sólo Para Cash 3 Straight. Ingresar una jugada de tres dígitos seguido del signo + y otra jugada de tres dígitos (Ej.: 345+348) para generar una secuencia de straight: 345, 346, 347.' },
];

const HOW_TO_PLAY = [
  {
    title: 'Para jugar Directo',
    steps: [
      'Ingresar en la jugada un número de dos dígitos y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Pale',
    steps: [
      'Ingresar en la jugada un número de cuatro dígitos y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Tripleta',
    steps: [
      'Ingresar en la jugada un número de seis dígitos y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Cash3 Straight',
    steps: [
      'Ingresar en la jugada un número de tres dígitos y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Cash3 Box',
    steps: [
      'Ingresar en la jugada un número de tres dígitos seguido del signo + (Ej.: 123+) y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Play4 Straight',
    steps: [
      'Ingresar en la jugada un número de cuatro dígitos seguido del signo - (Ej.: 1234-) y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Play4 Box',
    steps: [
      'Ingresar en la jugada un número de cuatro dígitos seguido del signo + (Ej.: 1234+) y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Super Pale',
    steps: [
      'Ingresar en la jugada un número de cuatro dígitos y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Bolita',
    steps: [
      'Ingresar en la jugada un número de dos dígitos seguido del signo *, seguido del rango (1 o 2) (Ej.: 12*1) y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Singulación',
    steps: [
      'Ingresar en la jugada un número de un dígito seguido del signo -, seguido del rango (1, 2 o 3) (Ej.: 1-2) y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Pick5 Straight',
    steps: [
      'Ingresar en la jugada un número de cinco dígitos seguido del signo - (Ej.: 12345-) y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Pick5 Box',
    steps: [
      'Ingresar en la jugada un número de cinco dígitos seguido del signo + (Ej.: 12345+) y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Cash3 Front Straight',
    steps: [
      'Ingresar en la jugada un número de tres dígitos luego la letra F y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Cash3 Front Box',
    steps: [
      'Ingresar en la jugada un número de tres dígitos luego la letra F seguido del signo + (Ej.: 123F+) y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Cash3 Back Straight',
    steps: [
      'Ingresar en la jugada un número de tres dígitos luego la letra B y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Cash3 Back Box',
    steps: [
      'Ingresar en la jugada un número de tres dígitos luego la letra B seguido del signo + (Ej.: 123B+) y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Pick Two Front',
    steps: [
      'Ingresar en la jugada un número de dos dígitos, la letra F y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Pick Two Back',
    steps: [
      'Ingresar en la jugada un número de dos dígitos, la letra B y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
  {
    title: 'Para jugar Pick Two Middle',
    steps: [
      'Ingresar en la jugada un número de dos dígitos seguido del signo - y el rango (Ej.: 10-b: 10-15) y presionar enter.',
      'Ingresar el monto y presionar enter.',
    ],
  },
];

export default function HelpModal() {
  const { closeModal } = useModalContext();
  const [activeTab, setActiveTab] = useState<'teclas' | 'como'>('teclas');

  const modal = (
    <AnimatePresence>
      <motion.div
        key="help-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={closeModal}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      >
        <motion.div
          key="help-panel"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: 8,
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e0e0e0' }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#333' }}>Ayuda</span>
            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}>
              <X size={18} color="#777" />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', padding: '0 20px' }}>
            {[
              { key: 'teclas', label: 'Teclas' },
              { key: 'como', label: '¿Cómo jugar?' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as 'teclas' | 'como')}
                style={{
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: activeTab === key ? 700 : 400,
                  color: activeTab === key ? '#0891B2' : '#555',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === key ? '2px solid #0891B2' : '2px solid transparent',
                  cursor: 'pointer',
                  marginBottom: -1,
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {activeTab === 'teclas' ? (
              /* ── Teclas tab ── */
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ textAlign: 'left', padding: '6px 12px 6px 0', fontWeight: 700, color: '#333', width: 56 }}>Tecla</th>
                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 700, color: '#333' }}>Función</th>
                  </tr>
                </thead>
                <tbody>
                  {SHORTCUTS.map(({ key, desc }, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px 10px 0', verticalAlign: 'top' }}>
                        <kbd style={{
                          display: 'inline-block',
                          background: '#f5f5f5',
                          border: '1px solid #ccc',
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: '#333',
                          minWidth: 32,
                          textAlign: 'center',
                        }}>{key}</kbd>
                      </td>
                      <td style={{ padding: '10px 0', verticalAlign: 'top', color: '#444', lineHeight: 1.5 }}>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* ── Cómo jugar tab ── */
              <div>
                {HOW_TO_PLAY.map(({ title, steps }, i) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#222', marginBottom: 6 }}>{title}</div>
                    <ol style={{ paddingLeft: 20, margin: 0 }}>
                      {steps.map((step, j) => (
                        <li key={j} style={{ fontSize: 13, color: '#444', lineHeight: 1.6, marginBottom: 2 }}>{step}</li>
                      ))}
                    </ol>
                    {i < HOW_TO_PLAY.length - 1 && (
                      <hr style={{ margin: '12px 0', borderColor: '#f0f0f0' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #e0e0e0', textAlign: 'right' }}>
            <button
              onClick={closeModal}
              style={{
                background: '#0891B2',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 24px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: 0.5,
              }}
            >
              CERRAR
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
