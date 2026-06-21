import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Printer, Download, TrendingUp, Ticket, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { supabase } from '@/lib/supabase';

interface Play {
  lotteryName?: string;
  lotteryId?: string;
  numbers: string;
  type: string;
  amount: number;
}

interface StoredTicket {
  id: string;
  ticketNumber: string;
  status: string;
  totalAmount: number;
  prize?: number;
  createdAt: string;
  vendorName?: string;
  plays?: Play[];
}

const LOTTERIES_SCHEDULE: Record<string, string> = {
  'Anguila Mañana': '10:30',
  'Anguila Tarde': '14:00',
  'King Lottery': '12:30',
  'Loteka': '19:30',
  'Nacional': '15:30',
  'Nueva York': '14:30',
  'Quiniela Pale': '13:00',
  'Real': '13:00',
  'Primera del Día': '10:00',
};

export default function ReportesModal() {
  const { closeModal } = useModalContext();
  const [allTickets, setAllTickets] = useState<StoredTicket[]>([]);
  const [activeTab, setActiveTab] = useState<'resumen' | 'cierre'>('resumen');

  // Load today's tickets from Supabase — local date, no business_id required
  useEffect(() => {
    const businessId = localStorage.getItem('nmv_business_id') || '';
    const vendorPin  = localStorage.getItem('nmv_vendor_pin')  || '';
    // Local date (never UTC — avoids day mismatch at night)
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    const baseQuery = supabase
      .from('tickets')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .order('created_at', { ascending: false })
      .limit(500);

    // Build the final promise based on available filter
    const finalPromise = businessId
      ? baseQuery.eq('business_id', businessId)
      : vendorPin
        ? baseQuery.eq('vendor_id', vendorPin)
        : baseQuery;

    finalPromise.then(({ data }) => {
      if (data) {
        setAllTickets(data.map(row => {
          const meta = (row.metadata as Record<string, unknown>) || {};
          return {
            id: row.id,
            ticketNumber: row.ticket_number || '',
            status: row.status || 'pending',
            totalAmount: Number(row.total_amount ?? (meta.total_amount as number) ?? 0),
            prize: Number(row.prize_amount ?? 0),
            createdAt: row.created_at || '',
            vendorName: (meta.vendor_name as string) || (row as any).vendor_name || '',
            plays: (meta.plays as any[]) || (row as any).plays || [],
          };
        }));
      }
    });
  }, []);
  const [cajaCerrada, setCajaCerrada] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cierreData, setCierreData] = useState<null | {
    totalTickets: number;
    totalVendido: number;
    totalPremios: number;
    neto: number;
    porLoteria: Record<string, { tickets: number; total: number }>;
    porVendedor: Record<string, { tickets: number; total: number; prizes: number }>;
    timestamp: string;
  }>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = allTickets.reduce((s, t) => s + (t.totalAmount || 0), 0);
    const prizes = allTickets.reduce((s, t) => s + (t.prize || 0), 0);
    const cancelled = allTickets.filter(t => t.status === 'cancelled').length;
    const winners = allTickets.filter(t => t.status === 'winner').length;
    const pending = allTickets.filter(t => t.status === 'pending').length;

    // Group by lottery
    const byLottery: Record<string, { tickets: number; total: number }> = {};
    for (const t of allTickets) {
      if (!t.plays) continue;
      for (const p of t.plays) {
        const name = p.lotteryName || p.lotteryId || 'Sin lotería';
        if (!byLottery[name]) byLottery[name] = { tickets: 0, total: 0 };
        byLottery[name].tickets += 1;
        byLottery[name].total += p.amount || 0;
      }
    }

    return { total, prizes, cancelled, winners, pending, byLottery, count: allTickets.length };
  }, [allTickets]);

  // ── Send email via Resend API ──────────────────────────────────────────
  const sendCierreEmail = async (data: typeof cierreData) => {
    if (!data) return;
    const emails: string[] = ['smartboyslab@gmail.com'];
    // Check for admin-configured emails
    try {
      const extra = localStorage.getItem('nmv_report_emails');
      if (extra) {
        const parsed: string[] = JSON.parse(extra);
        parsed.forEach(e => { if (e && !emails.includes(e)) emails.push(e); });
      }
    } catch { /* ignore */ }

    const lotTable = Object.entries(data.porLoteria)
      .map(([name, d]) => `<tr><td style="padding:4px 12px;border:1px solid #ddd">${name}</td><td style="padding:4px 12px;border:1px solid #ddd;text-align:center">${d.tickets}</td><td style="padding:4px 12px;border:1px solid #ddd;text-align:right"><b>$${d.total.toFixed(2)}</b></td></tr>`)
      .join('');

    const vendTable = Object.entries(data.porVendedor)
      .map(([name, d]) => `<tr><td style="padding:4px 12px;border:1px solid #ddd">${name}</td><td style="padding:4px 12px;border:1px solid #ddd;text-align:center">${d.tickets}</td><td style="padding:4px 12px;border:1px solid #ddd;text-align:right">$${d.total.toFixed(2)}</td><td style="padding:4px 12px;border:1px solid #ddd;text-align:right;color:#d97706">$${d.prizes.toFixed(2)}</td><td style="padding:4px 12px;border:1px solid #ddd;text-align:right;color:${(d.total-d.prizes)>=0?'#15803d':'#dc2626'};font-weight:bold">$${(d.total-d.prizes).toFixed(2)}</td></tr>`)
      .join('');

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff">
      <div style="background:#0D9488;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px">NMV LOTTERY</h1>
        <p style="color:#ccfbf1;margin:4px 0 0;font-size:13px">Reporte de Cierre de Caja</p>
      </div>
      <div style="padding:20px">
        <p style="color:#666;font-size:13px;margin:0 0 16px">${data.timestamp}</p>
        <table width="100%" style="border-collapse:collapse;margin-bottom:20px">
          <tr style="background:#f0fdf4"><td style="padding:10px 16px;font-weight:bold;color:#555">Total Tickets</td><td style="padding:10px 16px;font-size:18px;font-weight:900;color:#0D9488;text-align:right">${data.totalTickets}</td></tr>
          <tr><td style="padding:10px 16px;font-weight:bold;color:#555">Total Vendido</td><td style="padding:10px 16px;font-size:18px;font-weight:900;color:#0D9488;text-align:right">$${data.totalVendido.toFixed(2)}</td></tr>
          <tr style="background:#f0fdf4"><td style="padding:10px 16px;font-weight:bold;color:#555">Premios Pagados</td><td style="padding:10px 16px;font-size:18px;font-weight:900;color:#d97706;text-align:right">$${data.totalPremios.toFixed(2)}</td></tr>
          <tr style="background:${data.neto>=0?'#f0fdf4':'#fef2f2'}"><td style="padding:12px 16px;font-weight:900;color:#333;font-size:15px">NETO FINAL</td><td style="padding:12px 16px;font-size:22px;font-weight:900;color:${data.neto>=0?'#15803d':'#dc2626'};text-align:right">$${data.neto.toFixed(2)}</td></tr>
        </table>
        ${Object.keys(data.porVendedor).length > 0 ? `
        <h3 style="color:#333;border-bottom:2px solid #0D9488;padding-bottom:6px">Por Vendedor</h3>
        <table width="100%" style="border-collapse:collapse;margin-bottom:20px;font-size:13px">
          <thead><tr style="background:#0D9488;color:#fff"><th style="padding:8px 12px;text-align:left">Vendedor</th><th style="padding:8px 12px">Tickets</th><th style="padding:8px 12px">Vendido</th><th style="padding:8px 12px">Premios</th><th style="padding:8px 12px">Neto</th></tr></thead>
          <tbody>${vendTable}</tbody>
        </table>` : ''}
        ${Object.keys(data.porLoteria).length > 0 ? `
        <h3 style="color:#333;border-bottom:2px solid #0D9488;padding-bottom:6px">Por Lotería</h3>
        <table width="100%" style="border-collapse:collapse;margin-bottom:20px;font-size:13px">
          <thead><tr style="background:#0D9488;color:#fff"><th style="padding:8px 12px;text-align:left">Lotería</th><th style="padding:8px 12px">Jugadas</th><th style="padding:8px 12px">Total</th></tr></thead>
          <tbody>${lotTable}</tbody>
        </table>` : ''}
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#888;border-top:1px solid #e5e7eb">
        NMV Lottery · nmvapp.com · Reporte generado automáticamente
      </div>
    </div>`;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer re_YywZNmTh_DBu7vY22TrErBDNR76zRxzLb',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'NMV Lottery <onboarding@resend.dev>',
          to: emails,
          subject: `NMV Lottery — Cierre de Caja ${data.timestamp}`,
          html,
        }),
      });
    } catch (err) {
      console.warn('Email send error:', err);
    }
  };

  const handleCerrarCaja = () => {
    const porLoteria: Record<string, { tickets: number; total: number }> = {};
    const porVendedor: Record<string, { tickets: number; total: number; prizes: number }> = {};
    for (const t of allTickets) {
      // By vendor
      const vname = t.vendorName || 'Sin vendedor';
      if (!porVendedor[vname]) porVendedor[vname] = { tickets: 0, total: 0, prizes: 0 };
      porVendedor[vname].tickets += 1;
      porVendedor[vname].total += t.totalAmount || 0;
      porVendedor[vname].prizes += t.prize || 0;
      // By lottery
      if (!t.plays) continue;
      for (const p of t.plays) {
        const name = p.lotteryName || p.lotteryId || 'Sin lotería';
        if (!porLoteria[name]) porLoteria[name] = { tickets: 0, total: 0 };
        porLoteria[name].tickets += 1;
        porLoteria[name].total += p.amount || 0;
      }
    }
    const data = {
      totalTickets: allTickets.length,
      totalVendido: stats.total,
      totalPremios: stats.prizes,
      neto: stats.total - stats.prizes,
      porLoteria,
      porVendedor,
      timestamp: new Date().toLocaleString('es-DO'),
    };
    setCierreData(data);
    setCajaCerrada(true);
    localStorage.setItem('nmv_last_cierre', JSON.stringify(data));
    // Auto-send email report 10 seconds after closing
    setTimeout(() => sendCierreEmail(data), 10000);
  };

  const handleSendEmailNow = async () => {
    if (!cierreData || emailSending || emailSent) return;
    setEmailSending(true);
    await sendCierreEmail(cierreData);
    setEmailSending(false);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 4000);
  };

  const handlePrintCierre = () => {
    window.print();
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Reportes" maxWidth="680px">
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([['resumen', 'Resumen del día'], ['cierre', 'Cierre de caja']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="px-4 py-2 rounded-full text-sm font-bold transition-colors"
            style={{
              background: activeTab === key ? '#0D9488' : '#f0f0f0',
              color: activeTab === key ? '#fff' : '#555',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ── */}
      {activeTab === 'resumen' && (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon: Ticket, label: 'Total tickets', value: stats.count, color: '#337ab7', bg: '#EBF5FB' },
              { icon: DollarSign, label: 'Total vendido', value: `$${stats.total.toFixed(2)}`, color: '#0D9488', bg: '#E8F8F5' },
              { icon: TrendingUp, label: 'Total premios', value: `$${stats.prizes.toFixed(2)}`, color: '#d4a017', bg: '#FEF9E7' },
              { icon: CheckCircle2, label: 'Neto estimado', value: `$${(stats.total - stats.prizes).toFixed(2)}`, color: '#27AE60', bg: '#EAFAF1' },
            ].map((card, i) => (
              <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                className="rounded-xl p-4 flex items-center gap-3" style={{background:card.bg, border:`1px solid ${card.color}22`}}>
                <div className="rounded-lg p-2" style={{background:card.color+'20'}}>
                  <card.icon size={20} color={card.color} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{card.label}</div>
                  <div className="text-xl font-black" style={{color:card.color}}>{card.value}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="rounded-xl border p-4 mb-4" style={{background:'#f9f9f9'}}>
            <h4 className="text-sm font-bold text-gray-600 mb-3">Estado de tickets</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Pendientes', count: stats.pending, color: '#f0ad4e' },
                { label: 'Ganadores', count: stats.winners, color: '#5cb85c' },
                { label: 'Cancelados', count: stats.cancelled, color: '#999' },
              ].map((s, i) => (
                <div key={i} className="text-center rounded-lg p-2" style={{background:s.color+'15', border:`1px solid ${s.color}44`}}>
                  <div className="text-2xl font-black" style={{color:s.color}}>{s.count}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ventas por lotería */}
          {Object.keys(stats.byLottery).length > 0 && (
            <div className="rounded-xl border overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b">
                <h4 className="text-sm font-bold text-gray-600">Ventas por lotería</h4>
              </div>
              <div className="divide-y">
                {Object.entries(stats.byLottery)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([name, data]) => (
                    <div key={name} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                      <div>
                        <span className="font-bold text-gray-800">{name}</span>
                        {LOTTERIES_SCHEDULE[name] && (
                          <span className="ml-2 text-xs text-gray-400">Cierre: {LOTTERIES_SCHEDULE[name]}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 text-xs">{data.tickets} jugadas</span>
                        <span className="font-black text-teal-700">${data.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CIERRE DE CAJA ── */}
      {activeTab === 'cierre' && (
        <div>
          {!cajaCerrada ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🧾</div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Cierre de Caja</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Esta acción generará el reporte final del turno con todos los tickets, totales y detalles por lotería.
              </p>
              {/* Preview */}
              <div className="text-left rounded-xl border p-4 mb-6 max-w-sm mx-auto" style={{background:'#f9f9f9'}}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Tickets creados:</span>
                  <b>{stats.count}</b>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Total vendido:</span>
                  <b className="text-teal-700">${stats.total.toFixed(2)}</b>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Premios pagados:</span>
                  <b className="text-amber-700">${stats.prizes.toFixed(2)}</b>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t mt-2">
                  <span className="font-bold text-gray-700">Neto estimado:</span>
                  <b className="text-green-700 text-base">${(stats.total - stats.prizes).toFixed(2)}</b>
                </div>
              </div>
              <button onClick={handleCerrarCaja}
                className="px-8 py-3 rounded-xl font-black text-white text-sm flex items-center gap-2 mx-auto"
                style={{background:'#0D9488', boxShadow:'0 4px 15px rgba(13,148,136,0.3)'}}>
                <DollarSign size={18}/> Cerrar caja
              </button>
            </div>
          ) : (
            /* Cierre report */
            <div id="cierre-report">
              {/* Success header */}
              <div className="text-center mb-5 pb-5 border-b">
                <CheckCircle2 size={40} className="mx-auto mb-2" color="#0D9488" />
                <h3 className="text-lg font-black text-gray-800">✅ Caja cerrada</h3>
                <p className="text-xs text-gray-500">{cierreData?.timestamp}</p>
              </div>

              {/* ── Por Vendedor ── */}
              {cierreData && Object.keys(cierreData.porVendedor).length > 0 && (
                <div className="rounded-xl border overflow-hidden mb-4">
                  <div className="px-4 py-2 flex items-center gap-2" style={{background:'#0D9488', color:'#fff'}}>
                    <span style={{fontSize:14, fontWeight:800}}>👤 Caja por Vendedor</span>
                  </div>
                  {Object.entries(cierreData.porVendedor).map(([vname, vdata]) => (
                    <div key={vname} style={{borderTop:'1px solid #f0f0f0', padding:'12px 16px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                        <span style={{fontSize:15, fontWeight:800, color:'#333'}}>{vname}</span>
                        <span style={{fontSize:12, color:'#888'}}>{vdata.tickets} tickets</span>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
                        <div style={{background:'#E8F8F5', borderRadius:8, padding:'8px 10px', textAlign:'center'}}>
                          <div style={{fontSize:9, color:'#555', textTransform:'uppercase', letterSpacing:0.5}}>Vendido</div>
                          <div style={{fontSize:15, fontWeight:900, color:'#0D9488'}}>${vdata.total.toFixed(2)}</div>
                        </div>
                        <div style={{background:'#FEF9E7', borderRadius:8, padding:'8px 10px', textAlign:'center'}}>
                          <div style={{fontSize:9, color:'#555', textTransform:'uppercase', letterSpacing:0.5}}>Premios</div>
                          <div style={{fontSize:15, fontWeight:900, color:'#d4a017'}}>${vdata.prizes.toFixed(2)}</div>
                        </div>
                        <div style={{background:((vdata.total - vdata.prizes) >= 0)?'#EAFAF1':'#fde8e8', borderRadius:8, padding:'8px 10px', textAlign:'center'}}>
                          <div style={{fontSize:9, color:'#555', textTransform:'uppercase', letterSpacing:0.5}}>Neto</div>
                          <div style={{fontSize:15, fontWeight:900, color:((vdata.total - vdata.prizes) >= 0)?'#27AE60':'#d9534f'}}>${(vdata.total - vdata.prizes).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Tickets', value: cierreData?.totalTickets, color: '#337ab7' },
                  { label: 'Total vendido', value: `$${cierreData?.totalVendido.toFixed(2)}`, color: '#0D9488' },
                  { label: 'Premios pagados', value: `$${cierreData?.totalPremios.toFixed(2)}`, color: '#d4a017' },
                  { label: 'Neto', value: `$${cierreData?.neto.toFixed(2)}`, color: (cierreData?.neto ?? 0) >= 0 ? '#27AE60' : '#d9534f' },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg p-3 text-center border">
                    <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                    <div className="text-lg font-black" style={{color:item.color}}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* By lottery */}
              {cierreData && Object.keys(cierreData.porLoteria).length > 0 && (
                <div className="rounded-xl border overflow-hidden mb-5">
                  <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-600 uppercase tracking-wide">Detalle por lotería</div>
                  {Object.entries(cierreData.porLoteria).map(([name, data]) => (
                    <div key={name} className="flex justify-between items-center px-4 py-2 border-t text-sm">
                      <span className="font-bold text-gray-700">{name}</span>
                      <div className="flex gap-3">
                        <span className="text-gray-400 text-xs">{data.tickets} jugadas</span>
                        <span className="font-black text-teal-700">${data.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Email confirmation toast */}
              {emailSent && (
                <div style={{ background:'#d1fae5', border:'1px solid #6ee7b7', borderRadius:10, padding:'10px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#065f46', fontWeight:600 }}>
                  ✅ Email enviado a smartboyslab@gmail.com
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mb-2">
                <button onClick={handleSendEmailNow} disabled={emailSending || emailSent}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: emailSent ? '#d1fae5' : emailSending ? '#aaa' : '#0891B2', color: emailSent ? '#065f46' : '#fff', border: 'none', cursor: emailSending ? 'wait' : 'pointer', opacity: emailSent ? 0.9 : 1 }}>
                  {emailSending ? '⏳ Enviando...' : emailSent ? '✅ Enviado' : '📧 Enviar email'}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePrintCierre}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{background:'#f5f5f5', border:'1px solid #ddd', color:'#555'}}>
                  <Printer size={16}/> Imprimir
                </button>
                <button onClick={async () => {
                  const { jsPDF } = await import('jspdf');
                  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                  const margin = 20;
                  let y = 20;

                  // Title
                  doc.setFontSize(20); doc.setFont('helvetica','bold');
                  doc.text('NMV Lottery', margin, y); y += 8;
                  doc.setFontSize(13); doc.setFont('helvetica','normal');
                  doc.text('Cierre de Caja', margin, y); y += 6;
                  doc.setFontSize(10); doc.setTextColor(100);
                  doc.text(cierreData?.timestamp || '', margin, y); y += 10;

                  // Divider
                  doc.setDrawColor(13, 148, 136); doc.setLineWidth(0.5);
                  doc.line(margin, y, 210 - margin, y); y += 6;
                  doc.setTextColor(0);

                  // Main totals
                  doc.setFontSize(11); doc.setFont('helvetica','bold');
                  doc.text('RESUMEN GENERAL', margin, y); y += 6;
                  doc.setFont('helvetica','normal'); doc.setFontSize(10);
                  const rows = [
                    ['Total Tickets', String(cierreData?.totalTickets || 0)],
                    ['Total Vendido', `$${(cierreData?.totalVendido || 0).toFixed(2)}`],
                    ['Premios Pagados', `$${(cierreData?.totalPremios || 0).toFixed(2)}`],
                    ['Neto', `$${(cierreData?.neto || 0).toFixed(2)}`],
                  ];
                  rows.forEach(([label, val]) => {
                    doc.text(label, margin + 4, y);
                    doc.text(val, 190 - margin, y, { align: 'right' });
                    y += 6;
                  });
                  y += 4;

                  // By vendor
                  if (cierreData && Object.keys(cierreData.porVendedor).length > 0) {
                    doc.setFont('helvetica','bold'); doc.setFontSize(11);
                    doc.text('POR VENDEDOR', margin, y); y += 6;
                    doc.setFont('helvetica','normal'); doc.setFontSize(10);
                    Object.entries(cierreData.porVendedor).forEach(([vname, vdata]) => {
                      doc.setFont('helvetica','bold');
                      doc.text(vname, margin + 4, y); y += 5;
                      doc.setFont('helvetica','normal');
                      doc.text(`  Tickets: ${vdata.tickets}  Vendido: $${vdata.total.toFixed(2)}  Premios: $${vdata.prizes.toFixed(2)}  Neto: $${(vdata.total - vdata.prizes).toFixed(2)}`, margin + 4, y);
                      y += 7;
                    });
                  }

                  // By lottery
                  if (cierreData && Object.keys(cierreData.porLoteria).length > 0) {
                    doc.line(margin, y, 210 - margin, y); y += 5;
                    doc.setFont('helvetica','bold'); doc.setFontSize(11);
                    doc.text('DETALLE POR LOTERÍA', margin, y); y += 6;
                    doc.setFontSize(9); doc.setFont('helvetica','bold');
                    doc.text('Lotería', margin + 4, y);
                    doc.text('Jugadas', 120, y, {align:'right'});
                    doc.text('Total', 170, y, {align:'right'});
                    y += 5;
                    doc.setFont('helvetica','normal');
                    Object.entries(cierreData.porLoteria).forEach(([name, data]) => {
                      if (y > 270) { doc.addPage(); y = 20; }
                      doc.text(name, margin + 4, y);
                      doc.text(String(data.tickets), 120, y, {align:'right'});
                      doc.text(`$${data.total.toFixed(2)}`, 170, y, {align:'right'});
                      y += 5;
                    });
                  }

                  // Footer
                  doc.setFontSize(8); doc.setTextColor(150);
                  doc.text('NMV Lottery · nmvapp.com', 105, 290, {align:'center'});

                  doc.save(`cierre-${new Date().toISOString().slice(0,10)}.pdf`);
                }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{background:'#0D9488', color:'#fff', border:'none', cursor:'pointer'}}>
                  <Download size={16}/> Descargar
                </button>
              </div>

              {/* Alert for next shift */}
              <div className="mt-4 rounded-lg p-3 flex items-start gap-2" style={{background:'#FEF3C7', border:'1px solid #FCD34D'}}>
                <AlertCircle size={16} color="#D97706" className="flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-amber-800">
                  Para iniciar un nuevo turno, actualiza la página. Los datos del cierre quedan guardados en el historial.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </ModalWrapper>
  );
}
