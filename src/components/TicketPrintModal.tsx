import { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, MessageCircle } from 'lucide-react';
import type { Ticket } from '@/types';
import { supabase } from '@/lib/supabase';
import html2canvas from 'html2canvas';

/** Track printed ticket IDs in localStorage to detect reprints */
const PRINTED_KEY = 'nmv_printed_tickets';

function getPrintedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(PRINTED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set<string>();
}

export function markAsPrinted(ticketId: string) {
  const set = getPrintedSet();
  set.add(ticketId);
  try {
    localStorage.setItem(PRINTED_KEY, JSON.stringify(Array.from(set).slice(-500)));
  } catch { /* ignore */ }
  supabase
    .from('tickets')
    .update({ print_count: 99 })
    .eq('id', ticketId)
    .select('print_count')
    .maybeSingle()
    .then(() => {});
}

const TICKET_FONT = `'Share Tech Mono', 'Courier New', Courier, monospace`;

const PRINT_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
@page { size: 80mm auto; margin: 2mm 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; padding: 0; background: #fff; }
.ticket-receipt {
  font-family: 'Share Tech Mono', 'Courier New', Courier, monospace;
  font-size: 12px;
  font-weight: bold;
  padding: 4px 8px;
  width: 100%;
  color: #000;
  background: #fff;
  line-height: 1.2;
}
.tkt-center { text-align: center; }
.tkt-header { font-size: 18px; font-weight: 900; letter-spacing: 3px; text-align: center; margin: 1px 0; }
.tkt-type { font-size: 14px; font-weight: 900; letter-spacing: 2px; text-align: center; margin: 1px 0; }
.tkt-sep { border: none; border-top: 2px solid #000; margin: 2px 0; }
.tkt-info { font-size: 11px; font-weight: bold; margin: 0; line-height: 1.3; }
.tkt-hash { font-size: 9px; word-break: break-all; margin: 1px 0; font-weight: bold; }
.tkt-verif { font-size: 15px; font-weight: 900; text-align: center; margin: 2px 0; letter-spacing: 3px; background: #fff; border: 2px solid #000; padding: 2px 4px; display: inline-block; }
.tkt-lot-header { font-size: 13px; font-weight: 900; text-align: center; margin: 2px 0 1px; }
.tkt-col-header { display: grid; grid-template-columns: 1fr auto 1fr auto; gap: 1px; font-size: 11px; font-weight: 900; border-bottom: 2px solid #000; padding: 1px 0; }
.tkt-plays-grid { display: grid; grid-template-columns: 1fr auto 1fr auto; gap: 1px; align-items: start; }
.tkt-play-num { font-size: 13px; font-weight: 900; line-height: 1.2; }
.tkt-play-amt { font-size: 13px; font-weight: 900; text-align: right; padding-right: 4px; line-height: 1.2; }
.tkt-total { font-size: 16px; font-weight: 900; text-align: center; margin: 3px 0 2px; }
.tkt-footer { font-size: 11px; font-weight: 900; text-align: center; margin-top: 2px; }
.tkt-footer-small { font-size: 10px; font-weight: bold; text-align: center; }
`;

export function printTicketWindow(html: string) {
  const w = window.open('', '_blank', 'width=320,height=900,scrollbars=no,toolbar=no,menubar=no');
  if (!w) { window.print(); return; }
  w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <style>${PRINT_STYLES}</style>
  </head><body>${html}
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <script>
    window.addEventListener('load', function(){
      var el = document.getElementById('nmv-bc');
      if (el && typeof JsBarcode !== 'undefined') {
        JsBarcode(el, el.getAttribute('data-v'),
          { format:'CODE128', width:2, height:46, margin:4, displayValue:true, textMargin:2, fontSize:10 });
      }
      setTimeout(function(){ window.print(); window.close(); }, 600);
    });
  <\/script>
  </body></html>`);
  w.document.close();
}

interface TicketPrintModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  clientPhone?: string;
  /** When true, always renders as COPIA regardless of age/localStorage */
  forceReprint?: boolean;
}

export default function TicketPrintModal({ ticket, onClose, clientPhone, forceReprint }: TicketPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [waPhone, setWaPhone] = useState('');
  const [showWaInput, setShowWaInput] = useState(false);
  const [waCapturing, setWaCapturing] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      // #4: Enter → imprimir automáticamente
      if (e.key === 'Enter' && ticket) {
        e.preventDefault();
        markAsPrinted(ticket.id);
        if (printRef.current) printTicketWindow(printRef.current.outerHTML);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, ticket]);

  // ── Barcode: init JsBarcode on canvas in preview ────────────────────
  useEffect(() => {
    if (!ticket?.barcode) return;
    const init = () => {
      if ((window as any).JsBarcode) {
        const el = document.getElementById('nmv-bc');
        if (el) {
          try {
            (window as any).JsBarcode(el, ticket.barcode, {
              format: 'CODE128', width: 2, height: 40, margin: 4,
              displayValue: true, textMargin: 2, fontSize: 10,
            });
          } catch {/* invalid barcode value — ignore */}
        }
        return;
      }
      // Load CDN only once
      if (!document.getElementById('jsbarcode-cdn')) {
        const s = document.createElement('script');
        s.id = 'jsbarcode-cdn';
        s.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
        s.onload = () => {
          const el = document.getElementById('nmv-bc');
          if (el && (window as any).JsBarcode) {
            try {
              (window as any).JsBarcode(el, ticket.barcode, {
                format: 'CODE128', width: 2, height: 40, margin: 4,
                displayValue: true, textMargin: 2, fontSize: 10,
              });
            } catch {/* ignore */}
          }
        };
        document.head.appendChild(s);
      }
    };
    const timer = setTimeout(init, 200);
    return () => clearTimeout(timer);
  }, [ticket?.barcode]);

  const isReprint = useMemo(() => {
    // forceReprint prop always wins (e.g. reprinting from TicketMonitorModal)
    if (forceReprint) return true;
    // Already in the printed set → definitely a copy
    if (getPrintedSet().has(ticket?.id ?? '')) return true;
    // Ticket created > 90 seconds ago → treat as reprint (came from Recientes)
    const createdAt = ticket?.createdAt ? new Date(ticket.createdAt).getTime() : 0;
    if (createdAt > 0 && Date.now() - createdAt > 90_000) return true;
    return false;
  }, [ticket?.id, ticket?.createdAt, forceReprint]);

  const handlePrint = () => {
    if (ticket) markAsPrinted(ticket.id);
    if (printRef.current) {
      printTicketWindow(printRef.current.outerHTML);
    }
  };

  const handleWhatsApp = async (phone: string) => {
    const num = phone.replace(/\D/g, '');
    if (!num || num.length < 7) return;
    setWaCapturing(true);
    try {
      if (printRef.current) {
        const canvas = await html2canvas(printRef.current, {
          backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false,
        });
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error('no blob');
          const file = new File([blob], `ticket-${ticket?.ticketNumber || 'NMV'}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: `Ticket ${ticket?.ticketNumber}` });
              setShowWaInput(false); setWaPhone(''); return;
            } catch { /* fall through */ }
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `ticket-${ticket?.ticketNumber || 'NMV'}.png`; a.click();
          URL.revokeObjectURL(url);
          const msg = `🎰 *NMV Lottery* — Ticket: ${ticket?.ticketNumber}\n(Adjunta la imagen descargada)`;
          window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
        }, 'image/png');
      }
    } catch {
      const msg = `🎰 *NMV Lottery*\nTicket: ${ticket?.ticketNumber}\nTotal: $${(ticket?.totalAmount ?? 0).toFixed(2)}`;
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    } finally {
      setWaCapturing(false); setShowWaInput(false); setWaPhone('');
    }
  };

  if (!ticket) return null;
  const totalAmount = ticket.plays?.reduce((s, p) => s + (p.amount || 0), 0) ?? ticket.totalAmount ?? 0;
  const phoneToUse = clientPhone || '';

  const ticketTypeLabel = ticket.status === 'cancelled'
    ? '* CANCELADO *'
    : isReprint
      ? '** COPIA **'
      : '** ORIGINAL **';

  return (
    <AnimatePresence>
      {ticket && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, backdropFilter: 'blur(2px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}
          >
            <div style={{ pointerEvents: 'all', width: '100%', maxWidth: 310 }}>
              {/* Header bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0D9488', borderRadius: '12px 12px 0 0' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>🖨️ Preview Ticket</span>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '4px 6px', display: 'flex' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Ticket preview */}
              <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '72vh', overflowY: 'auto' }}>
                <div ref={printRef}>
                  <TicketReceipt
                    ticket={ticket}
                    totalAmount={totalAmount}
                    typeLabel={ticketTypeLabel}
                  />
                </div>

                {/* Buttons */}
                <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f0f0' }}>
                  {showWaInput && (
                    <div style={{ marginBottom: 8 }}>
                      <input
                        type="tel"
                        value={waPhone}
                        onChange={e => setWaPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Nº teléfono (ej: 18095551234)"
                        autoFocus
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #25D366', fontSize: 13, marginBottom: 6, outline: 'none', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleWhatsApp(waPhone)} disabled={waPhone.length < 7}
                          style={{ flex: 1, height: 36, background: waPhone.length >= 7 ? '#25D366' : '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: waPhone.length >= 7 ? 'pointer' : 'not-allowed' }}>
                          Enviar ✓
                        </button>
                        <button onClick={() => { setShowWaInput(false); setWaPhone(''); }}
                          style={{ height: 36, padding: '0 12px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: '#666' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handlePrint}
                      style={{ flex: 1, height: 42, background: 'linear-gradient(135deg,#0D9488,#0891B2)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Printer size={16} /> Imprimir
                    </button>
                    <button
                      disabled={waCapturing}
                      onClick={() => {
                        if (phoneToUse) { handleWhatsApp(phoneToUse); }
                        else { setShowWaInput(v => !v); setWaPhone(''); }
                      }}
                      style={{ height: 42, minWidth: 42, background: waCapturing ? '#888' : '#25D366', color: '#fff', border: 'none', borderRadius: 8, cursor: waCapturing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {waCapturing ? '⏳' : <MessageCircle size={18} />}
                    </button>
                    <button onClick={onClose}
                      style={{ height: 42, padding: '0 12px', background: '#f3f4f6', color: '#555', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      ESC
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────
// Ticket Receipt — Thermal-printer format, ALL BOLD
// ─────────────────────────────────────────────────────────────────

function formatDT(d: Date | string) {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const yy = dt.getFullYear();
    let hh = dt.getHours();
    const min = String(dt.getMinutes()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12 || 12;
    return `${mm}/${dd}/${yy} ${String(hh).padStart(2, '0')}:${min} ${ampm}`;
  } catch { return '—'; }
}

function generateHash(id: string): string {
  let hash = 0;
  const str = id + 'NMV2026';
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return (hex + hex + hex + hex).slice(0, 32);
}

/** Format 12-digit code as "#### #### ####" for readability */
function formatVerifCode(code: string): string {
  const c = code.replace(/\D/g, '').padStart(12, '0');
  return `${c.slice(0,4)} ${c.slice(4,8)} ${c.slice(8,12)}`;
}

export function TicketReceipt({
  ticket,
  totalAmount,
  typeLabel,
}: {
  ticket: Ticket;
  totalAmount: number;
  typeLabel: string;
}) {
  const now = new Date();
  const createdAt = ticket.createdAt;
  const hash = generateHash(ticket.id);
  const isOriginal = typeLabel === '** ORIGINAL **';
  const isCancelled = ticket.status === 'cancelled';

  // Group plays by lottery
  const playsByLottery: Record<string, Array<{ numbers: string; amount: number; type?: string }>> = {};
  (ticket.plays || []).forEach(p => {
    const lot = p.lotteryName || p.lotteryId || 'SORTEO';
    if (!playsByLottery[lot]) playsByLottery[lot] = [];
    playsByLottery[lot].push({ numbers: p.numbers || '—', amount: p.amount || 0, type: p.type });
  });

  if (Object.keys(playsByLottery).length === 0 && totalAmount > 0) {
    playsByLottery['SORTEO'] = [{ numbers: '—', amount: totalAmount }];
  }

  const mono: React.CSSProperties = {
    fontFamily: TICKET_FONT,
    fontWeight: 700,
    color: '#000',
    background: '#fff',
  };

  const divider = (char = '=') => (
    <div style={{ ...mono, fontSize: 11, textAlign: 'center', margin: '2px 0', letterSpacing: 0.5 }}>
      {char.repeat(34)}
    </div>
  );

  return (
    <div className="ticket-receipt" style={{
      fontFamily: TICKET_FONT,
      fontWeight: 700,
      padding: '10px 12px',
      width: '100%',
      boxSizing: 'border-box',
      background: '#fff',
      color: '#000',
    }}>
      {/* ── HEADER ── */}
      <div style={{ textAlign: 'center', marginBottom: 2 }}>
        <div style={{ fontFamily: TICKET_FONT, fontSize: 24, fontWeight: 900, letterSpacing: 5, textAlign: 'center', display: 'block', lineHeight: 1.3 }}>NMV LOTTERY</div>
        {ticket.vendorName && (
          <div style={{ fontFamily: TICKET_FONT, fontSize: 15, fontWeight: 900, textAlign: 'center', letterSpacing: 1, marginTop: 2 }}>
            {ticket.vendorName}
          </div>
        )}
      </div>

      {/* ── TYPE LABEL ── */}
      <div style={{ textAlign: 'center', margin: '4px 0' }}>
        <span style={{
          fontFamily: TICKET_FONT,
          fontSize: isCancelled ? 16 : 18,
          fontWeight: 900,
          letterSpacing: 2,
          display: 'block',
          textAlign: 'center',
          lineHeight: 1.5,
          background: isCancelled ? '#eee' : 'transparent',
          padding: isCancelled ? '1px 4px' : 0,
        }}>
          {typeLabel}
        </span>
      </div>

      {divider('-')}

      {/* ── TICKET INFO ── */}
      <div style={{ ...mono, fontSize: 13, lineHeight: 1.8, margin: '3px 0' }}>
        <div style={{ fontWeight: 900 }}>{formatDT(now)}</div>
        <div>Ticket: <b>{ticket.ticketNumber || ticket.id?.slice(0, 20).toUpperCase()}</b></div>
        <div>Fecha: {formatDT(createdAt)}</div>
        {ticket.vendorId && <div>Vendedor: <b>{ticket.vendorName || ticket.vendorId}</b></div>}
      </div>

      {/* ── 32-char HASH (security) ── */}
      <div style={{ ...mono, fontSize: 10, wordBreak: 'break-all', margin: '1px 0', letterSpacing: 0.5, fontWeight: 700 }}>
        {hash}
      </div>

      {/* ── 12-DIGIT VERIFICATION CODE — ORIGINAL ONLY ── */}
      {isOriginal && ticket.verificationCode && (
        <div style={{ margin: '5px 0 3px', textAlign: 'center' }}>
          <div style={{
            fontFamily: TICKET_FONT,
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: 4,
            display: 'inline-block',
            padding: '4px 10px',
            background: '#fff',
            border: '3px solid #000',
            borderRadius: 3,
            lineHeight: 1.4,
          }}>
            {formatVerifCode(ticket.verificationCode)}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#555', marginTop: 2, letterSpacing: 0.5 }}>
            CÓD. VERIFICACIÓN — REQUERIDO PARA COBRO
          </div>
        </div>
      )}


      {/* ── PLAYS BY LOTTERY ── */}
      {Object.entries(playsByLottery).map(([lotteryName, plays]) => {
        const lotTotal = plays.reduce((s, p) => s + p.amount, 0);

        return (
          <div key={lotteryName}>
            {divider('=')}
            <div style={{ ...mono, fontSize: 16, fontWeight: 900, textAlign: 'center', margin: '3px 0', letterSpacing: 1 }}>
              {lotteryName}: {lotTotal.toFixed(2)}
            </div>
            {divider('=')}

            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr auto',
              gap: '0 4px',
              ...mono,
              fontSize: 12,
              fontWeight: 900,
              borderBottom: '2px solid #000',
              padding: '3px 0',
              letterSpacing: 0.5,
            }}>
              <span>JUGADA</span>
              <span style={{ textAlign: 'right', paddingRight: 6 }}>MONTO</span>
              <span style={{ paddingLeft: 4 }}>JUGADA</span>
              <span style={{ textAlign: 'right' }}>MONTO</span>
            </div>

            {/* Plays 2-column grid */}
            {Array.from({ length: Math.ceil(plays.length / 2) }, (_, row) => {
              const left = plays[row * 2];
              const right = plays[row * 2 + 1];
              return (
                <div key={row} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr auto',
                  gap: '0 4px',
                  ...mono,
                  fontSize: 15,
                  fontWeight: 900,
                  padding: '3px 0',
                  borderBottom: '1px dotted #666',
                }}>
                  <span>{left.numbers}</span>
                  <span style={{ textAlign: 'right', paddingRight: 6 }}>{left.amount.toFixed(2)}</span>
                  {right ? (
                    <>
                      <span style={{ paddingLeft: 4 }}>{right.numbers}</span>
                      <span style={{ textAlign: 'right' }}>{right.amount.toFixed(2)}</span>
                    </>
                  ) : (
                    <><span /><span /></>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ── GRAND TOTAL ── */}
      {divider('-')}
      <div style={{ ...mono, fontSize: 20, fontWeight: 900, textAlign: 'center', margin: '5px 0', letterSpacing: 1 }}>
        -- TOTAL: {totalAmount.toFixed(2)} --
      </div>
      {divider('-')}

      {/* ── QR CODE — verificación sincronizada con el sistema — ORIGINAL ONLY ── */}
      {isOriginal && (ticket.ticketNumber || ticket.id) && (() => {
        const tNum = ticket.ticketNumber || ticket.id;
        const vCode = ticket.verificationCode || '';
        const verifyUrl = `https://nmvapp.com/verify?t=${encodeURIComponent(tNum)}${vCode ? `&v=${vCode}` : ''}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=6&data=${encodeURIComponent(verifyUrl)}`;
        return (
          <div style={{ textAlign: 'center', margin: '4px 0 6px' }}>
            <img
              src={qrUrl}
              alt="QR Verificación"
              width={130}
              height={130}
              style={{ display: 'block', margin: '0 auto', border: '1px solid #ddd' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div style={{ ...mono, fontSize: 8, fontWeight: 700, color: '#666', marginTop: 2, letterSpacing: 0.5 }}>
              ESCANEA PARA VERIFICAR TICKET
            </div>
          </div>
        );
      })()}

      {divider('-')}

      {/* ── LEGAL FOOTER ── */}
      <div style={{ ...mono, fontSize: 13, fontWeight: 900, textAlign: 'center', lineHeight: 1.8, marginTop: 4 }}>
        <div>NO SE PAGAN TICKET CON LOTERIA</div>
        <div>INICIADA</div>
        <div>SIN TICKET NO SE PAGA.</div>
        <div>REVISE SU JUGADA. BUENA SUERTE</div>
        <div>!!</div>
      </div>
      <div style={{ ...mono, fontSize: 12, fontWeight: 700, textAlign: 'center', lineHeight: 1.6, marginTop: 2 }}>
        <div>No Pagamos Doble Pale. Buena</div>
        <div>Suerte.</div>
      </div>
    </div>
  );
}
