/**
 * BarcodeScanner — NMV Lottery
 *
 * Two scan modes:
 * 1. Text input — USB physical barcode scanner (simulates keyboard)
 * 2. Camera     — Mobile camera via BarcodeDetector Web API (Chrome/Edge)
 *
 * On scan → queries Supabase for ticket by `barcode` column
 * Actions: Duplicate ticket | Pay ticket
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanBarcode, Camera, CameraOff, X, Copy, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Play, TicketStatus } from '@/types';

interface ScannedTicket {
  id: string;
  ticketNumber: string;
  totalAmount: number;
  status: TicketStatus;
  plays: Play[];
  vendorName: string;
  barcode: string;
  createdAt: string;
}

interface BarcodeScannerProps {
  /** Called when user wants to duplicate the scanned ticket's plays */
  onDuplicate: (plays: Play[]) => void;
  /** Called when user wants to pay/process the scanned ticket */
  onPay: (ticket: ScannedTicket) => void;
}

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats: string[] }) => {
      detect: (img: ImageBitmap | HTMLVideoElement | HTMLCanvasElement) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

async function lookupByBarcode(barcode: string): Promise<ScannedTicket | null> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('id, ticket_number, amount, status, metadata, created_at, vendor_id, barcode')
      .eq('barcode', barcode.trim())
      .maybeSingle();
    if (error || !data) return null;
    const meta = (data.metadata as Record<string, unknown>) || {};
    return {
      id: data.id,
      ticketNumber: String(data.ticket_number || ''),
      totalAmount: Number((meta.total_amount ?? data.amount) || 0),
      status: (data.status as TicketStatus) || 'pending',
      plays: (meta.plays as Play[]) || [],
      vendorName: String(meta.vendor_name || ''),
      barcode: String(data.barcode || barcode),
      createdAt: String(data.created_at || ''),
    };
  } catch {
    return null;
  }
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Pendiente', bg: '#fff3cd', color: '#856404' },
  winner:    { label: 'Ganador 🏆', bg: '#d4edda', color: '#155724' },
  loser:     { label: 'Perdedor', bg: '#f8d7da', color: '#721c24' },
  cancelled: { label: 'Cancelado', bg: '#e2e3e5', color: '#383d41' },
  paid:      { label: 'Pagado', bg: '#cce5ff', color: '#004085' },
};

export default function BarcodeScanner({ onDuplicate, onPay }: BarcodeScannerProps) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState<ScannedTicket | null>(null);

  // Camera state
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check BarcodeDetector support
  useEffect(() => {
    setCameraSupported(typeof window.BarcodeDetector !== 'undefined');
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open && !cameraOn) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, cameraOn]);

  // Stop camera on close
  useEffect(() => {
    if (!open) {
      stopCamera();
      setFound(null);
      setInputVal('');
      setError('');
    }
  }, [open]);

  const handleScan = useCallback(async (code: string) => {
    const raw = code.trim();
    if (!raw || raw.length < 4) return;
    setLoading(true);
    setError('');
    setFound(null);
    const ticket = await lookupByBarcode(raw);
    setLoading(false);
    if (ticket) {
      setFound(ticket);
    } else {
      setError(`No se encontró ticket con código: ${raw}`);
    }
    setInputVal('');
  }, []);

  // Auto-submit after pause (USB scanner sends Enter; some send fast chars)
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleInputChange = (val: string) => {
    setInputVal(val);
    setError('');
    if (submitTimer.current) clearTimeout(submitTimer.current);
    if (val.length >= 8) {
      submitTimer.current = setTimeout(() => handleScan(val), 400);
    }
  };

  // ── Camera ─────────────────────────────────────────────────────────────────

  const startCamera = async () => {
    if (!window.BarcodeDetector) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      scanLoop();
    } catch (e) {
      setError('No se pudo acceder a la cámara');
      console.warn('Camera error:', e);
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const scanLoop = () => {
    if (!window.BarcodeDetector || !videoRef.current) return;
    const detector = new window.BarcodeDetector({ formats: ['code_128', 'code_39', 'qr_code'] });
    const loop = async () => {
      if (!videoRef.current || videoRef.current.paused) return;
      try {
        const results = await detector.detect(videoRef.current);
        if (results.length > 0) {
          stopCamera();
          handleScan(results[0].rawValue);
          return;
        }
      } catch { /* ignore */ }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  // ──────────────────────────────────────────────────────────────────────────

  const triggerBtn = (
    <button
      onClick={() => setOpen(true)}
      title="Escanear ticket"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg,#0D9488,#0891B2)',
        color: '#fff', fontWeight: 700, fontSize: 13,
        cursor: 'pointer', boxShadow: '0 2px 8px rgba(13,148,136,0.3)',
      }}
    >
      <ScanBarcode size={16} /> Escanear
    </button>
  );

  const statusInfo = found ? (STATUS_LABELS[found.status] || STATUS_LABELS.pending) : null;

  return (
    <>
      {triggerBtn}

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000 }}
            />

            {/* Panel — centrado profesional (wrapper div hace el centering, motion.div solo anima) */}
            <div style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3001,
              width: '92vw',
              maxWidth: 460,
            }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              style={{
                background: '#fff',
                borderRadius: 20,
                boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)',
                padding: '28px 28px 24px',
                maxHeight: '88vh',
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 22, paddingBottom: 16,
                borderBottom: '2px solid #f0f0f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: 'linear-gradient(135deg, #0D9488, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(13,148,136,0.35)',
                  }}>
                    <ScanBarcode size={22} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: '#1F2937', lineHeight: 1.2 }}>Escanear Ticket</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>NMV Lottery · Verificación</div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)}
                  style={{
                    background: '#F9FAFB', border: '1px solid #E5E7EB',
                    borderRadius: 10, padding: '7px 8px', cursor: 'pointer',
                    display: 'flex', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB'; }}
                >
                  <X size={18} color="#6B7280" />
                </button>
              </div>

              {/* Input mode */}
              {!cameraOn && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Código de barras (escáner USB o manual)
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputVal}
                      onChange={e => handleInputChange(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleScan(inputVal)}
                      placeholder="Escanea o escribe el código..."
                      autoFocus
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: 10,
                        border: '1.5px solid #0D9488', fontSize: 14, outline: 'none',
                        fontFamily: 'monospace', letterSpacing: 1,
                      }}
                    />
                    <button onClick={() => handleScan(inputVal)} disabled={!inputVal.trim() || loading}
                      style={{
                        padding: '0 16px', borderRadius: 10, border: 'none',
                        background: inputVal.trim() ? '#0D9488' : '#e5e7eb',
                        color: '#fff', fontWeight: 700, cursor: inputVal.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                      {loading ? <Loader2 size={16} className="animate-spin" /> : '→'}
                    </button>
                  </div>
                </div>
              )}

              {/* Camera button */}
              {cameraSupported && (
                <div style={{ marginBottom: 16 }}>
                  <button
                    onClick={() => { if (cameraOn) { stopCamera(); } else { startCamera(); } }}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 10,
                      border: `1.5px solid ${cameraOn ? '#ef4444' : '#0D9488'}`,
                      background: cameraOn ? '#fef2f2' : '#f0fdfa',
                      color: cameraOn ? '#ef4444' : '#0D9488',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {cameraOn ? <><CameraOff size={16} /> Detener cámara</> : <><Camera size={16} /> Usar cámara</>}
                  </button>
                </div>
              )}

              {/* Video feed */}
              {cameraOn && (
                <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', background: '#000', position: 'relative' }}>
                  <video ref={videoRef} playsInline muted
                    style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0, border: '2px solid #0D9488',
                    borderRadius: 12, pointerEvents: 'none',
                    boxShadow: 'inset 0 0 0 40px rgba(0,0,0,0.3)',
                  }}>
                    <div style={{
                      position: 'absolute', top: '50%', left: '10%', right: '10%',
                      height: 2, background: 'rgba(13,184,136,0.8)',
                      transform: 'translateY(-50%)',
                    }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>
                    Apunta al código de barras del ticket
                  </div>
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
                  ⚠️ {error}
                </motion.div>
              )}

              {/* Loading */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#0D9488' }}>
                  <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Buscando ticket...</div>
                </div>
              )}

              {/* Found ticket */}
              {found && !loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ border: '2px solid #0D9488', borderRadius: 14, overflow: 'hidden' }}
                >
                  {/* Ticket header */}
                  <div style={{ background: 'linear-gradient(135deg,#0D9488,#0891B2)', padding: '12px 16px', color: '#fff' }}>
                    <div style={{ fontSize: 11, opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase' }}>Ticket encontrado</div>
                    <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>{found.ticketNumber}</div>
                  </div>

                  {/* Details */}
                  <div style={{ padding: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginBottom: 12, fontSize: 13 }}>
                      <div>
                        <span style={{ color: '#6B7280', fontSize: 11 }}>Estado</span>
                        <div>
                          <span style={{
                            background: statusInfo?.bg, color: statusInfo?.color,
                            padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          }}>
                            {statusInfo?.label}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#6B7280', fontSize: 11 }}>Total</span>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#0D9488' }}>${found.totalAmount.toFixed(2)}</div>
                      </div>
                      <div>
                        <span style={{ color: '#6B7280', fontSize: 11 }}>Barcode</span>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#374151' }}>{found.barcode}</div>
                      </div>
                      <div>
                        <span style={{ color: '#6B7280', fontSize: 11 }}>Jugadas</span>
                        <div style={{ fontWeight: 700, color: '#374151' }}>{found.plays.length} jugada{found.plays.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>

                    {/* Plays preview */}
                    {found.plays.length > 0 && (
                      <div style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 10px', marginBottom: 14, maxHeight: 120, overflowY: 'auto' }}>
                        {found.plays.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: i < found.plays.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                            <span style={{ color: '#6B7280' }}>{p.lotteryName || 'Lotería'}</span>
                            <b style={{ color: '#111' }}>{p.numbers}</b>
                            <span style={{ color: '#0D9488', fontWeight: 700 }}>${p.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          if (found.plays.length > 0) {
                            onDuplicate(found.plays);
                            setOpen(false);
                          }
                        }}
                        disabled={found.plays.length === 0}
                        style={{
                          flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                          background: found.plays.length > 0 ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : '#e5e7eb',
                          color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <Copy size={15} /> Duplicar
                      </button>
                      <button
                        onClick={() => {
                          onPay(found);
                          setOpen(false);
                        }}
                        style={{
                          flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                          background: found.status === 'winner'
                            ? 'linear-gradient(135deg,#F59E0B,#D97706)'
                            : 'linear-gradient(135deg,#10B981,#059669)',
                          color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <DollarSign size={15} /> {found.status === 'winner' ? 'Pagar' : 'Ver/Pagar'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tip */}
              {!found && !loading && !error && (
                <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, margin: '8px 0 0' }}>
                  Usa un escáner USB o la cámara del dispositivo para leer el código de barras del ticket.
                </p>
              )}
            </motion.div>
            </div>{/* /centering wrapper */}
          </>
        )}
      </AnimatePresence>
    </>
  );
}
