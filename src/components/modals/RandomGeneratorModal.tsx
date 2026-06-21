import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, CheckCircle2, Circle, Zap, RotateCcw, CheckCheck } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { regularLotteries } from '@/data/lotteries';
import { schedules } from '@/data/schedules';
import type { PlayType } from '@/types';

interface RandomGeneratorModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Play type definitions ───────────────────────────────────────────────────
const playTypeOptions: { value: PlayType; label: string; digits: string; color: string }[] = [
  { value: 'directo',  label: 'Directo',  digits: '2 dígitos', color: '#0D9488' },
  { value: 'pale',     label: 'Pale',     digits: '4 dígitos', color: '#7C3AED' },
  { value: 'tripleta', label: 'Tripleta', digits: '6 dígitos', color: '#DC2626' },
  { value: 'cash3',    label: 'Cash 3',   digits: '3 dígitos', color: '#2563EB' },
  { value: 'play4',    label: 'Play 4',   digits: '4 dígitos', color: '#D97706' },
  { value: 'pick5',    label: 'Pick 5',   digits: '5 dígitos', color: '#DB2777' },
];

// ─── Per-type config state ───────────────────────────────────────────────────
type TypeConfig = { amount: string; qty: string; enabled: boolean };
type TypeConfigs = Record<PlayType, TypeConfig>;

function initConfigs(): TypeConfigs {
  const defaults: TypeConfigs = {} as TypeConfigs;
  playTypeOptions.forEach(opt => {
    defaults[opt.value] = { amount: '', qty: '5', enabled: false };
  });
  defaults['directo'].enabled = true; // default enabled
  return defaults;
}

// ─── Random number generators ────────────────────────────────────────────────
function generateRandomNumber(type: PlayType): string {
  switch (type) {
    case 'directo':  return String(Math.floor(Math.random() * 100)).padStart(2, '0');
    case 'pale':     return String(Math.floor(Math.random() * 100)).padStart(2, '0') + String(Math.floor(Math.random() * 100)).padStart(2, '0');
    case 'tripleta': return String(Math.floor(Math.random() * 100)).padStart(2, '0') + String(Math.floor(Math.random() * 100)).padStart(2, '0') + String(Math.floor(Math.random() * 100)).padStart(2, '0');
    case 'cash3':    return String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    case 'play4':    return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    case 'pick5':    return String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    default:         return String(Math.floor(Math.random() * 100)).padStart(2, '0');
  }
}

// ─── Schedule helpers (same logic as LotterySelector) ───────────────────────
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function isLotteryOpen(lotteryId: string, now: Date): boolean {
  const schedule = schedules.find((s) => s.lotteryId === lotteryId);
  if (!schedule) return true;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const closingMinutes = parseTimeToMinutes(schedule.closingTime);
  return currentMinutes < closingMinutes;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RandomGeneratorModal({ open, onClose }: RandomGeneratorModalProps) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000); // refresh every 30s
    return () => clearInterval(t);
  }, []);

  // Only OPEN lotteries, sorted by closing time
  const openLotteries = useMemo(() => {
    const open = regularLotteries.filter((l) => isLotteryOpen(l.id, now));
    return [...open].sort((a, b) => {
      const sa = schedules.find(s => s.lotteryId === a.id);
      const sb = schedules.find(s => s.lotteryId === b.id);
      return parseTimeToMinutes(sa?.closingTime ?? '11:59 PM')
           - parseTimeToMinutes(sb?.closingTime ?? '11:59 PM');
    });
  }, [now]);

  const [selectedLotteries, setSelectedLotteries] = useState<Set<string>>(new Set());
  const [typeConfigs, setTypeConfigs] = useState<TypeConfigs>(initConfigs);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [preview, setPreview] = useState<any[] | null>(null);

  const toggleLottery = (id: string) => setSelectedLotteries(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const selectAllLotteries = () => {
    if (selectedLotteries.size === openLotteries.length) setSelectedLotteries(new Set());
    else setSelectedLotteries(new Set(openLotteries.map(l => l.id)));
  };

  const toggleType = (t: PlayType) => {
    setTypeConfigs(prev => ({
      ...prev,
      [t]: { ...prev[t], enabled: !prev[t].enabled },
    }));
  };

  const setTypeAmount = (t: PlayType, val: string) => {
    setTypeConfigs(prev => ({ ...prev, [t]: { ...prev[t], amount: val } }));
    setError('');
  };

  const setTypeQty = (t: PlayType, val: string) => {
    setTypeConfigs(prev => ({ ...prev, [t]: { ...prev[t], qty: val } }));
    setError('');
  };

  const enabledTypes = playTypeOptions.filter(opt => typeConfigs[opt.value].enabled);

  // Total preview count
  const previewCount = useMemo(() => {
    return selectedLotteries.size * enabledTypes.reduce((sum, opt) => {
      const qty = parseInt(typeConfigs[opt.value].qty, 10) || 0;
      return sum + qty;
    }, 0);
  }, [selectedLotteries.size, enabledTypes, typeConfigs]);

  const handleCreate = useCallback(() => {
    setError('');
    if (selectedLotteries.size === 0) { setError('Selecciona al menos un sorteo'); return; }
    if (enabledTypes.length === 0) { setError('Selecciona al menos un tipo de jugada'); return; }

    // Validate each enabled type
    for (const opt of enabledTypes) {
      const cfg = typeConfigs[opt.value];
      const amount = parseFloat(cfg.amount);
      const qty = parseInt(cfg.qty, 10);
      if (!cfg.amount.trim() || isNaN(amount) || amount <= 0) {
        setError(`Ingrese el monto para ${opt.label}`);
        return;
      }
      if (isNaN(qty) || qty <= 0 || qty > 100) {
        setError(`Cantidad de ${opt.label} debe ser entre 1 y 100`);
        return;
      }
    }

    const generatedPlays: any[] = [];
    selectedLotteries.forEach(lotteryId => {
      const lottery = openLotteries.find(l => l.id === lotteryId);
      enabledTypes.forEach(opt => {
        const cfg = typeConfigs[opt.value];
        const amount = parseFloat(cfg.amount);
        const qty = parseInt(cfg.qty, 10);
        for (let i = 0; i < qty; i++) {
          generatedPlays.push({
            id:          `random-${lotteryId}-${opt.value}-${Date.now()}-${i}`,
            numbers:     generateRandomNumber(opt.value),
            amount,
            type:        opt.value,
            lotteryId,
            lotteryName: lottery?.name || lotteryId,
          });
        }
      });
    });

    // Show preview instead of immediately saving
    setPreview(generatedPlays);
  }, [selectedLotteries, enabledTypes, typeConfigs, openLotteries]);

  const handleConfirm = useCallback(() => {
    if (!preview) return;
    // ── Dispatch event → Dashboard adds plays directly to DIRECTO/PALE/etc tables ──
    window.dispatchEvent(new CustomEvent('nmv:add-generated-plays', { detail: preview }));
    setToast(`✅ ${preview.length} jugadas del generador agregadas al ticket`);
    setTimeout(() => { setToast(''); handleClose(); }, 1500);
  }, [preview]);

  const handleClose = () => {
    setSelectedLotteries(new Set());
    setTypeConfigs(initConfigs());
    setError('');
    setToast('');
    setPreview(null);
    onClose();
  };

  // ── Group preview plays by type ────────────────────────────────────────
  const previewByType = useMemo(() => {
    if (!preview) return {};
    const map: Record<string, any[]> = {};
    preview.forEach(p => {
      if (!map[p.type]) map[p.type] = [];
      map[p.type].push(p);
    });
    return map;
  }, [preview]);

  const previewTypes = preview ? playTypeOptions.filter(o => previewByType[o.value]?.length) : [];

  return (
    <ModalWrapper open={open} onClose={handleClose} title="Generador de Jugadas Aleatorias" maxWidth={preview ? '920px' : '560px'}>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="mb-4 px-3 py-2 rounded-lg text-sm font-bold text-center"
            style={{ background:'#E8F5E9', color:'#2E7D32', border:'1px solid #C8E6C9' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PREVIEW MODE: 2 tables side-by-side ───────────────────────────── */}
      {preview && (
        <div>
          {/* Summary bar */}
          <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'8px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <CheckCircle2 size={15} color="#16a34a" />
            <span style={{ fontSize:13, fontWeight:700, color:'#166534' }}>
              {preview.length} jugadas generadas en {selectedLotteries.size} sorteo(s) — confirma para agregar al ticket
            </span>
          </div>

          {/* 2-column grid of play type tables */}
          <div style={{ display:'grid', gridTemplateColumns: previewTypes.length === 1 ? '1fr' : '1fr 1fr', gap:10 }}>
            {previewTypes.map(opt => {
              const plays = previewByType[opt.value] ?? [];
              return (
                <div key={opt.value} style={{ border:`2px solid ${opt.color}30`, borderRadius:10, overflow:'hidden' }}>
                  {/* Table header */}
                  <div style={{ background:`${opt.color}15`, padding:'7px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${opt.color}20` }}>
                    <span style={{ fontSize:13, fontWeight:800, color: opt.color }}>{opt.label}</span>
                    <span style={{ fontSize:11, color: opt.color, fontWeight:600, background:`${opt.color}20`, padding:'2px 8px', borderRadius:20 }}>
                      {plays.length} jugadas
                    </span>
                  </div>
                  {/* Scrollable rows */}
                  <div style={{ maxHeight:260, overflowY:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead>
                        <tr style={{ background:'#fafafa', position:'sticky', top:0 }}>
                          <th style={{ padding:'5px 8px', textAlign:'left', color:'#888', fontWeight:600, borderBottom:'1px solid #f0f0f0' }}>#</th>
                          <th style={{ padding:'5px 8px', textAlign:'center', color:'#888', fontWeight:600, borderBottom:'1px solid #f0f0f0' }}>Número</th>
                          <th style={{ padding:'5px 8px', textAlign:'right', color:'#888', fontWeight:600, borderBottom:'1px solid #f0f0f0' }}>Monto</th>
                          <th style={{ padding:'5px 8px', textAlign:'left', color:'#888', fontWeight:600, borderBottom:'1px solid #f0f0f0' }}>Sorteo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plays.map((p, i) => (
                          <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding:'5px 8px', color:'#aaa', fontWeight:500 }}>{i + 1}</td>
                            <td style={{ padding:'5px 8px', textAlign:'center', fontWeight:800, color: opt.color, letterSpacing:2 }}>{p.numbers}</td>
                            <td style={{ padding:'5px 8px', textAlign:'right', fontWeight:700, color:'#333' }}>${p.amount}</td>
                            <td style={{ padding:'5px 8px', color:'#666', fontSize:11, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:90 }}>{p.lotteryName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:14, paddingTop:14, borderTop:'1px solid #e0e0e0' }}>
            <motion.button whileTap={{ scale:0.97 }} onClick={() => setPreview(null)}
              style={{ padding:'9px 18px', fontSize:13, fontWeight:700, borderRadius:6, cursor:'pointer',
                background:'#f5f5f5', border:'1px solid #ccc', color:'#555',
                display:'flex', alignItems:'center', gap:6 }}>
              <RotateCcw size={14} /> Regenerar
            </motion.button>
            <motion.button whileTap={{ scale:0.97 }} onClick={handleConfirm}
              style={{ padding:'9px 24px', fontSize:14, fontWeight:700, borderRadius:6, cursor:'pointer',
                background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff', border:'none',
                boxShadow:'0 4px 14px rgba(22,163,74,0.35)',
                display:'flex', alignItems:'center', gap:8 }}>
              <CheckCheck size={16}/> Confirmar y Agregar
            </motion.button>
          </div>
        </div>
      )}

      {/* ── CONFIG MODE (when not previewing) ──────────────────────────────── */}
      {!preview && <div className="flex flex-col gap-4">
        {/* ── SORTEOS (solo abiertos) ────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label style={{ fontSize:13, fontWeight:700, color:'#333' }}>Sorteos</label>
              <span style={{ fontSize:11, color:'#0D9488', marginLeft:8, fontWeight:600 }}>
                {openLotteries.length} abiertos
              </span>
            </div>
            <button onClick={selectAllLotteries}
              style={{ fontSize:11, color:'#0D9488', background:'#E0F2F1', border:'none', borderRadius:6, padding:'3px 10px', cursor:'pointer', fontWeight:600 }}>
              {selectedLotteries.size === openLotteries.length ? 'Ninguno' : 'Todos'}
            </button>
          </div>

          {openLotteries.length === 0 ? (
            <div style={{ textAlign:'center', padding:'16px', color:'#888', fontSize:13, background:'#f9f9f9', borderRadius:8, border:'1px dashed #e0e0e0' }}>
              🔒 No hay sorteos abiertos en este momento
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:6, maxHeight:180, overflowY:'auto', padding:2 }}>
              {openLotteries.map(lot => {
                const sel = selectedLotteries.has(lot.id);
                const sch = schedules.find(s => s.lotteryId === lot.id);
                return (
                  <motion.button key={lot.id} whileTap={{ scale:0.96 }} onClick={() => { toggleLottery(lot.id); setError(''); }}
                    style={{ padding:'7px 10px', borderRadius:8, border: sel ? '2px solid #0D9488' : '1px solid #e0e0e0',
                      background: sel ? '#E0F2F1' : '#fafafa', display:'flex', alignItems:'center', gap:8, cursor:'pointer', transition:'all 0.12s', textAlign:'left' }}>
                    {sel ? <CheckCircle2 size={15} color="#0D9488" /> : <Circle size={15} color="#ccc" />}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight: sel ? 700 : 500, color: sel ? '#0D9488' : '#555', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {lot.name}
                      </div>
                      {sch && (
                        <div style={{ fontSize:10, color:'#888' }}>Cierra {sch.closingTime}</div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
          {selectedLotteries.size > 0 && (
            <div style={{ fontSize:11, color:'#888', marginTop:4, textAlign:'right' }}>
              {selectedLotteries.size} sorteo(s) seleccionado(s)
            </div>
          )}
        </div>

        {/* ── TIPOS DE JUGADA (con monto+cantidad por tipo) ─────────────── */}
        <div>
          <label style={{ fontSize:13, fontWeight:700, color:'#333', display:'block', marginBottom:8 }}>
            Tipos de jugada <span style={{ fontSize:11, color:'#888', fontWeight:400 }}>(monto y cantidad por tipo)</span>
          </label>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {playTypeOptions.map(opt => {
              const cfg = typeConfigs[opt.value];
              const sel = cfg.enabled;
              return (
                <div key={opt.value}
                  style={{
                    borderRadius:10, border: sel ? `2px solid ${opt.color}` : '1px solid #e0e0e0',
                    background: sel ? `${opt.color}0E` : '#fafafa',
                    overflow:'hidden', transition:'all 0.15s',
                  }}>
                  {/* Type toggle row */}
                  <button type="button" onClick={() => toggleType(opt.value)}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
                    {sel
                      ? <CheckCircle2 size={16} color={opt.color} style={{ flexShrink:0 }} />
                      : <Circle size={16} color="#ccc" style={{ flexShrink:0 }} />
                    }
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:13, fontWeight: sel ? 800 : 500, color: sel ? opt.color : '#555' }}>{opt.label}</span>
                      <span style={{ fontSize:11, color: sel ? opt.color : '#aaa', marginLeft:8, fontWeight:400 }}>{opt.digits}</span>
                    </div>
                    {sel && cfg.amount && (
                      <span style={{ fontSize:11, color: opt.color, fontWeight:700, marginRight:4 }}>
                        ${cfg.amount} × {cfg.qty}
                      </span>
                    )}
                  </button>

                  {/* Per-type inputs (only when type is enabled) */}
                  <AnimatePresence>
                    {sel && (
                      <motion.div
                        initial={{ height:0, opacity:0 }}
                        animate={{ height:'auto', opacity:1 }}
                        exit={{ height:0, opacity:0 }}
                        transition={{ duration:0.18 }}
                        style={{ overflow:'hidden' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'0 12px 10px' }}>
                          {/* Monto */}
                          <div>
                            <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:4 }}>Monto por jugada</label>
                            <div style={{ position:'relative' }}>
                              <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', fontWeight:700, color:'#888', pointerEvents:'none', fontSize:13 }}>$</span>
                              <input
                                type="number" min="0.01" step="0.01"
                                value={cfg.amount}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setTypeAmount(opt.value, e.target.value)}
                                placeholder="0.00"
                                style={{ width:'100%', height:36, border:`1.5px solid ${opt.color}40`, borderRadius:6, padding:'0 10px 0 22px', fontSize:13, outline:'none', boxSizing:'border-box', background:'#fff' }}
                              />
                            </div>
                          </div>
                          {/* Cantidad */}
                          <div>
                            <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:4 }}>Cantidad (1-100)</label>
                            <input
                              type="number" min="1" max="100"
                              value={cfg.qty}
                              onClick={e => e.stopPropagation()}
                              onChange={e => setTypeQty(opt.value, e.target.value)}
                              style={{ width:'100%', height:36, border:`1.5px solid ${opt.color}40`, borderRadius:6, padding:'0 10px', fontSize:13, outline:'none', boxSizing:'border-box', background:'#fff' }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        {previewCount > 0 && !error && (
          <div className="rounded-lg px-3 py-2" style={{ background:'#F0FDF4', border:'1px solid #BBF7D0' }}>
            <span style={{ fontSize:12, color:'#16a34a', fontWeight:700 }}>
              <Zap size={12} style={{ display:'inline', marginRight:5 }} />
              Se generarán <b>{previewCount}</b> jugadas
              &nbsp;({selectedLotteries.size} sorteo{selectedLotteries.size !== 1 ? 's' : ''} × {enabledTypes.length} tipo{enabledTypes.length !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', borderRadius:8, padding:'8px 12px', fontSize:12, fontWeight:600 }}>
            {error}
          </div>
        )}
      </div>}

      {/* Footer (only in config mode) */}
      {!preview && (
        <div className="flex justify-end gap-2 mt-4 pt-4" style={{ borderTop:'1px solid #e0e0e0' }}>
          <motion.button whileTap={{ scale:0.98 }} onClick={handleClose}
            style={{ padding:'9px 20px', fontSize:14, background:'#f5f5f5', border:'1px solid #ccc', color:'#555', borderRadius:6, cursor:'pointer' }}>
            Cancelar
          </motion.button>
          <motion.button whileTap={{ scale:0.98 }} onClick={handleCreate}
            disabled={selectedLotteries.size === 0 || enabledTypes.length === 0}
            style={{
              padding:'9px 24px', fontSize:14, fontWeight:700, borderRadius:6,
              cursor: (selectedLotteries.size === 0 || enabledTypes.length === 0) ? 'not-allowed' : 'pointer',
              background: (selectedLotteries.size === 0 || enabledTypes.length === 0)
                ? '#e0e0e0'
                : 'linear-gradient(135deg,#16a34a,#15803d)',
              color: (selectedLotteries.size === 0 || enabledTypes.length === 0) ? '#aaa' : '#fff',
              border:'none', display:'flex', alignItems:'center', gap:8,
              boxShadow: (selectedLotteries.size === 0 || enabledTypes.length === 0)
                ? 'none'
                : '0 4px 14px rgba(22,163,74,0.35)',
            }}>
            <Shuffle size={16}/> Generar →
          </motion.button>
        </div>
      )}
    </ModalWrapper>
  );
}
