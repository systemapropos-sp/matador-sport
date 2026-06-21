import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ArrowRight, Layers, Shuffle } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { regularLotteries } from '@/data/lotteries';

interface DuplicatePlaysModalProps {
  open: boolean;
  onClose: () => void;
}

interface LotteryPlay {
  id: string;
  numbers: string;
  amount: number;
  type: string;
  lotteryName: string;
  lotteryId: string;
}

// Build lottery list from real data (never hardcoded)
const allLotteries = regularLotteries.map(l => ({
  id: l.id,
  label: l.name,
  color: l.color || '#0D9488',
  icon: l.icon || null,
}));

// Load plays from localStorage (saved tickets)
function loadCurrentPlays(): LotteryPlay[] {
  try {
    const raw = localStorage.getItem('matador_current_plays');
    if (raw) return JSON.parse(raw);
    // fallback: extract from tickets
    const tickets: any[] = JSON.parse(localStorage.getItem('matador_tickets') || '[]');
    if (tickets.length === 0) return [];
    const last = tickets[tickets.length - 1];
    return (last.plays || []).map((p: any, i: number) => ({
      id: `play-${i}`,
      numbers: p.numbers,
      amount: p.amount,
      type: p.type,
      lotteryName: p.lotteryName || p.lotteryId || 'Sorteo',
      lotteryId: p.lotteryId || 'unknown',
    }));
  } catch { return []; }
}

// Sample plays when nothing is in localStorage
const samplePlays: LotteryPlay[] = [
  { id: 'sp1', numbers: '12',   amount: 50, type: 'directo',   lotteryName: 'FLORIDA PM',  lotteryId: 'florida-pm' },
  { id: 'sp2', numbers: '3456', amount: 25, type: 'pale',      lotteryName: 'FLORIDA PM',  lotteryId: 'florida-pm' },
  { id: 'sp3', numbers: '789',  amount: 10, type: 'cash3',     lotteryName: 'FLORIDA PM',  lotteryId: 'florida-pm' },
];

export default function DuplicatePlaysModal({ open, onClose }: DuplicatePlaysModalProps) {
  const plays = useMemo(() => { const p = loadCurrentPlays(); return p.length > 0 ? p : samplePlays; }, []);

  // Step 1: Select which plays to duplicate
  const [selectedPlays, setSelectedPlays] = useState<Set<string>>(new Set());
  // Step 2: Select target lotteries
  const [selectedLotteries, setSelectedLotteries] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<1 | 2>(1);
  const [done, setDone] = useState(false);
  const [duplicatedCount, setDuplicatedCount] = useState(0);

  const togglePlay = (id: string) => setSelectedPlays(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const toggleLottery = (id: string) => setSelectedLotteries(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const selectAllPlays = () => {
    if (selectedPlays.size === plays.length) setSelectedPlays(new Set());
    else setSelectedPlays(new Set(plays.map(p => p.id)));
  };

  const selectAllLotteries = () => {
    if (selectedLotteries.size === allLotteries.length) setSelectedLotteries(new Set());
    else setSelectedLotteries(new Set(allLotteries.map(l => l.id)));
  };

  const handleProceed = () => {
    if (selectedPlays.size === 0 || selectedLotteries.size === 0) return;
    const playsToDup = plays.filter(p => selectedPlays.has(p.id));
    const existing: any[] = JSON.parse(localStorage.getItem('matador_pending_plays') || '[]');

    const newEntries: any[] = [];
    selectedLotteries.forEach(lotteryId => {
      const lotteryInfo = allLotteries.find(l => l.id === lotteryId);
      playsToDup.forEach(p => {
        newEntries.push({
          ...p,
          id: `dup-${lotteryId}-${Date.now()}-${p.id}`,
          lotteryId,
          lotteryName: lotteryInfo?.label || lotteryId,
        });
      });
    });

    localStorage.setItem('matador_pending_plays', JSON.stringify([...existing, ...newEntries]));
    setDuplicatedCount(newEntries.length);
    setDone(true);
    setTimeout(() => handleClose(), 2000);
  };

  const handleClose = () => {
    setSelectedPlays(new Set());
    setSelectedLotteries(new Set());
    setStep(1);
    setDone(false);
    setDuplicatedCount(0);
    onClose();
  };

  const typeColor: Record<string, string> = {
    directo: '#0D9488', pale: '#7C3AED', tripleta: '#DC2626',
    cash3: '#2563EB', pick5: '#D97706', pick4: '#D97706',
  };

  return (
    <ModalWrapper open={open} onClose={handleClose} title="Duplicar Jugadas" maxWidth="560px">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
            className="text-center py-8">
            <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#2E7D32' }}>¡Jugadas duplicadas!</div>
            <div style={{ fontSize:13, color:'#666', marginTop:6 }}>
              {duplicatedCount} jugadas creadas en {selectedLotteries.size} loterías
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div style={{ width:28, height:28, borderRadius:'50%', background: step===1 ? '#0D9488' : '#C8E6C9', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color: step===1 ? '#fff' : '#2E7D32' }}>1</div>
                <span style={{ fontSize:12, fontWeight:600, color: step===1 ? '#0D9488' : '#888' }}>Seleccionar jugadas</span>
              </div>
              <ArrowRight size={14} color="#bbb" />
              <div className="flex items-center gap-2">
                <div style={{ width:28, height:28, borderRadius:'50%', background: step===2 ? '#0D9488' : '#e0e0e0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color: step===2 ? '#fff' : '#aaa' }}>2</div>
                <span style={{ fontSize:12, fontWeight:600, color: step===2 ? '#0D9488' : '#aaa' }}>Elegir loterías destino</span>
              </div>
            </div>

            {/* ── STEP 1: Select plays ─────────────────────────────────── */}
            {step === 1 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div style={{ fontSize:13, fontWeight:700, color:'#333', display:'flex', alignItems:'center', gap:6 }}>
                    <Layers size={15} color="#0D9488" />
                    Jugadas disponibles
                  </div>
                  <button onClick={selectAllPlays}
                    style={{ fontSize:12, color:'#0D9488', background:'#E0F2F1', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontWeight:600 }}>
                    {selectedPlays.size === plays.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </button>
                </div>

                <div className="rounded-xl overflow-hidden mb-4" style={{ border:'1px solid #e0e0e0' }}>
                  {plays.map((play, idx) => (
                    <motion.div key={play.id}
                      initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: idx*0.04 }}
                      className="flex items-center gap-3 cursor-pointer transition-colors"
                      style={{ padding:'11px 14px', background: selectedPlays.has(play.id) ? '#F0FDF4' : (idx%2===0?'#fff':'#fafafa'), borderBottom: idx<plays.length-1 ? '1px solid #f0f0f0' : 'none' }}
                      onClick={() => togglePlay(play.id)}>
                      {selectedPlays.has(play.id)
                        ? <CheckCircle2 size={20} color="#16a34a" />
                        : <Circle size={20} color="#ccc" />}
                      <div className="flex-1">
                        <span style={{ fontSize:15, fontWeight:800, color:'#222' }}>{play.numbers}</span>
                        <span style={{ marginLeft:8, fontSize:11, padding:'2px 7px', borderRadius:8, background: typeColor[play.type] ? `${typeColor[play.type]}20` : '#eee', color: typeColor[play.type] || '#555', fontWeight:700, textTransform:'uppercase' }}>{play.type}</span>
                        <span style={{ marginLeft:6, fontSize:11, color:'#888' }}>{play.lotteryName}</span>
                      </div>
                      <span style={{ fontSize:14, fontWeight:700, color:'#0D9488' }}>${play.amount.toFixed(2)}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <span style={{ fontSize:12, color:'#888' }}>{selectedPlays.size} de {plays.length} jugadas seleccionadas</span>
                  <motion.button whileTap={{ scale:0.97 }} onClick={() => setStep(2)}
                    disabled={selectedPlays.size === 0}
                    style={{ padding:'10px 22px', borderRadius:10, border:'none', fontWeight:700, fontSize:14, cursor: selectedPlays.size===0 ? 'not-allowed' : 'pointer',
                      background: selectedPlays.size===0 ? '#e0e0e0' : 'linear-gradient(135deg,#0D9488,#0891B2)',
                      color: selectedPlays.size===0 ? '#aaa' : '#fff',
                      display:'flex', alignItems:'center', gap:8 }}>
                    Continuar <ArrowRight size={16}/>
                  </motion.button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Select target lotteries ─────────────────────── */}
            {step === 2 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div style={{ fontSize:13, fontWeight:700, color:'#333', display:'flex', alignItems:'center', gap:6 }}>
                    <Shuffle size={15} color="#0D9488" />
                    Seleccionar loterías destino
                  </div>
                  <button onClick={selectAllLotteries}
                    style={{ fontSize:12, color:'#0D9488', background:'#E0F2F1', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontWeight:600 }}>
                    {selectedLotteries.size === allLotteries.length ? 'Deseleccionar todo' : 'Todas'}
                  </button>
                </div>

                {/* Grid of lotteries */}
                <div className="grid grid-cols-2 gap-2 mb-4" style={{ maxHeight:320, overflowY:'auto' }}>
                  {allLotteries.map(lot => {
                    const sel = selectedLotteries.has(lot.id);
                    return (
                      <motion.button key={lot.id} whileTap={{ scale:0.97 }} onClick={() => toggleLottery(lot.id)}
                        style={{ padding:'10px 12px', borderRadius:10, border: sel ? '2px solid #0D9488' : '1px solid #e0e0e0', textAlign:'left', cursor:'pointer', transition:'all 0.15s',
                          background: sel ? '#E0F2F1' : '#fff', display:'flex', alignItems:'center', gap:10 }}>
                        {/* Icon or color badge */}
                        {lot.icon ? (
                          <img src={lot.icon} alt={lot.label}
                            style={{ width:22, height:22, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}
                            onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                        ) : (
                          <span style={{ width:22, height:22, borderRadius:'50%', background: lot.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', flexShrink:0 }}>
                            {lot.label.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                          </span>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11, fontWeight:800, color: sel ? '#0D9488' : '#333', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lot.label}</div>
                        </div>
                        {sel && <CheckCircle2 size={15} color="#0D9488" style={{ flexShrink:0 }} />}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Summary */}
                {selectedLotteries.size > 0 && selectedPlays.size > 0 && (
                  <div className="rounded-lg p-3 mb-4" style={{ background:'#F0FDF4', border:'1px solid #BBF7D0' }}>
                    <div style={{ fontSize:12, color:'#16a34a', fontWeight:700 }}>
                      ✅ Se crearán {selectedPlays.size * selectedLotteries.size} jugadas en {selectedLotteries.size} loterías
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button onClick={() => setStep(1)}
                    style={{ padding:'10px 18px', borderRadius:10, border:'1px solid #e0e0e0', background:'#f5f5f5', color:'#666', cursor:'pointer', fontWeight:600, fontSize:14 }}>
                    ← Volver
                  </button>
                  <motion.button whileTap={{ scale:0.97 }} onClick={handleProceed}
                    disabled={selectedLotteries.size === 0}
                    style={{ padding:'10px 24px', borderRadius:10, border:'none', fontWeight:700, fontSize:14,
                      cursor: selectedLotteries.size===0 ? 'not-allowed' : 'pointer',
                      background: selectedLotteries.size===0 ? '#e0e0e0' : 'linear-gradient(135deg,#16a34a,#15803d)',
                      color: selectedLotteries.size===0 ? '#aaa' : '#fff',
                      boxShadow: selectedLotteries.size===0 ? 'none' : '0 4px 14px rgba(22,163,74,0.35)',
                      display:'flex', alignItems:'center', gap:8 }}>
                    ✓ Proceder ({selectedLotteries.size} loterías)
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </ModalWrapper>
  );
}
