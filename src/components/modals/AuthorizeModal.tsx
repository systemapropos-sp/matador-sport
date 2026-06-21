import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogIn, LogOut, Trash2, Calendar, Timer } from 'lucide-react';
import ModalWrapper from './ModalWrapper';

interface AuthorizeModalProps {
  open: boolean;
  onClose: () => void;
}

interface PunchRecord {
  id: string;
  type: 'entrada' | 'salida';
  timestamp: string; // ISO string
}

const STORAGE_KEY = 'nmv_punch_records';

function loadPunches(): PunchRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function savePunches(punches: PunchRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(punches));
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function formatDateFull(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Calculate total worked hours from pairs of entrada/salida */
function calcWorkedHours(punches: PunchRecord[]): string {
  let totalMs = 0;
  const entries = punches.filter(p => p.type === 'entrada').sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const exits   = punches.filter(p => p.type === 'salida').sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  entries.forEach((entry, i) => {
    const exit = exits[i];
    if (exit) {
      totalMs += new Date(exit.timestamp).getTime() - new Date(entry.timestamp).getTime();
    } else {
      // Still clocked in — count up to now
      totalMs += Date.now() - new Date(entry.timestamp).getTime();
    }
  });

  const totalMins = Math.floor(totalMs / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${m}m`;
}

export default function AuthorizeModal({ open, onClose }: AuthorizeModalProps) {
  const [clock, setClock] = useState(new Date());
  const [punches, setPunches] = useState<PunchRecord[]>(loadPunches);
  const [toast, setToast] = useState('');

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const todayStr = getTodayStr();
  const todayPunches = punches.filter(p => p.timestamp.slice(0, 10) === todayStr)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Determine current state: last punch of today
  const lastTodayPunch = todayPunches.length > 0 ? todayPunches[todayPunches.length - 1] : null;
  const isClockedIn = lastTodayPunch?.type === 'entrada';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handlePunch = (type: 'entrada' | 'salida') => {
    const newPunch: PunchRecord = {
      id: Date.now().toString(),
      type,
      timestamp: new Date().toISOString(),
    };
    const updated = [...punches, newPunch];
    setPunches(updated);
    savePunches(updated);
    showToast(type === 'entrada' ? '✅ Entrada registrada' : '👋 Salida registrada');
  };

  const handleClearToday = () => {
    if (!window.confirm('¿Borrar todos los ponches de hoy?')) return;
    const updated = punches.filter(p => p.timestamp.slice(0, 10) !== todayStr);
    setPunches(updated);
    savePunches(updated);
    showToast('Ponches de hoy eliminados');
  };

  const workedToday = todayPunches.length > 0 ? calcWorkedHours(todayPunches) : '0h 0m';

  const todayLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ModalWrapper open={open} onClose={onClose} title="Ponchar — Control de Horario" maxWidth="440px">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mb-4 px-3 py-2 rounded-lg text-sm font-bold text-center"
            style={{ background: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Clock */}
      <div className="rounded-xl mb-5 text-center py-5"
        style={{ background: 'linear-gradient(135deg, #1a237e, #0d47a1)', border: '1px solid #3949ab' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize', marginBottom: 4 }}>
          {todayLabel}
        </div>
        <div style={{ fontSize: 42, fontWeight: 300, color: '#fff', letterSpacing: 2, lineHeight: 1 }}>
          {clock.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </div>
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full"
          style={{ background: isClockedIn ? 'rgba(76,175,80,0.25)' : 'rgba(255,255,255,0.12)', border: `1px solid ${isClockedIn ? '#66BB6A' : 'rgba(255,255,255,0.2)'}` }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isClockedIn ? '#66BB6A' : '#9e9e9e', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: isClockedIn ? '#A5D6A7' : 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            {isClockedIn ? 'En turno' : 'Fuera de turno'}
          </span>
        </div>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg p-3 text-center" style={{ background: '#E3F2FD', border: '1px solid #BBDEFB' }}>
          <Timer size={16} color="#1565C0" style={{ margin: '0 auto 4px' }} />
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1565C0' }}>{workedToday}</div>
          <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>Horas trabajadas hoy</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: '#F3E5F5', border: '1px solid #E1BEE7' }}>
          <Calendar size={16} color="#6A1B9A" style={{ margin: '0 auto 4px' }} />
          <div style={{ fontSize: 22, fontWeight: 800, color: '#6A1B9A' }}>{todayPunches.length}</div>
          <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>Ponches hoy</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handlePunch('entrada')}
          disabled={isClockedIn}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-opacity"
          style={{
            background: isClockedIn ? '#ccc' : 'linear-gradient(135deg, #2E7D32, #388E3C)',
            cursor: isClockedIn ? 'not-allowed' : 'pointer',
            fontSize: 15,
            boxShadow: isClockedIn ? 'none' : '0 4px 14px rgba(46,125,50,0.35)',
            opacity: isClockedIn ? 0.6 : 1,
          }}>
          <LogIn size={18} />
          Entrada
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handlePunch('salida')}
          disabled={!isClockedIn}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-opacity"
          style={{
            background: !isClockedIn ? '#ccc' : 'linear-gradient(135deg, #b71c1c, #c62828)',
            cursor: !isClockedIn ? 'not-allowed' : 'pointer',
            fontSize: 15,
            boxShadow: !isClockedIn ? 'none' : '0 4px 14px rgba(198,40,40,0.35)',
            opacity: !isClockedIn ? 0.6 : 1,
          }}>
          <LogOut size={18} />
          Salida
        </motion.button>
      </div>

      {/* Punch history for today */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} /> Ponches de Hoy
          </h4>
          {todayPunches.length > 0 && (
            <button onClick={handleClearToday}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded"
              style={{ background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2', cursor: 'pointer' }}>
              <Trash2 size={11} /> Limpiar
            </button>
          )}
        </div>

        {todayPunches.length === 0 ? (
          <div className="text-center py-5 rounded-lg"
            style={{ background: '#f8f9fa', border: '1px dashed #ddd', color: '#999', fontSize: 13 }}>
            Sin ponches hoy. Presiona <b>Entrada</b> para comenzar.
          </div>
        ) : (
          <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '7px 12px', textAlign: 'left', color: '#666', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>#</th>
                  <th style={{ padding: '7px 12px', textAlign: 'left', color: '#666', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Tipo</th>
                  <th style={{ padding: '7px 12px', textAlign: 'left', color: '#666', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Hora</th>
                  <th style={{ padding: '7px 12px', textAlign: 'left', color: '#666', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {todayPunches.map((p, i) => (
                  <motion.tr key={p.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '8px 12px', color: '#999', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
                        style={{
                          background: p.type === 'entrada' ? '#E8F5E9' : '#FFEBEE',
                          color: p.type === 'entrada' ? '#2E7D32' : '#C62828',
                        }}>
                        {p.type === 'entrada' ? <LogIn size={11} /> : <LogOut size={11} />}
                        {p.type === 'entrada' ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#333', whiteSpace: 'nowrap' }}>
                      {formatTime(p.timestamp)}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>
                      {formatDateFull(p.timestamp)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Close button */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e0e0e0' }}>
        <motion.button whileTap={{ scale: 0.98 }} onClick={onClose}
          className="w-full rounded-xl font-semibold text-sm transition-colors"
          style={{ height: 42, background: '#f5f5f5', color: '#666', border: '1px solid #e0e0e0', cursor: 'pointer' }}>
          Cerrar
        </motion.button>
      </div>
    </ModalWrapper>
  );
}
