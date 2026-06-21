import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Trophy } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { getMovilTransactions, getMovilDaySummary } from '@/lib/movilService';

type ReportTab = 'recargas' | 'retiro' | 'cancelaciones' | 'info_cliente';

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MovilReporteModal() {
  const { closeModal } = useModalContext();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [tab, setTab] = useState<ReportTab>('recargas');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ jugado: 0, premios: 0 });

  const fetchReport = async () => {
    setLoading(true);
    // Only show transactions for THIS vendor's banca
    const bancaCode = localStorage.getItem('nmv_vendor_code') || undefined;
    try {
      const [txns, summ] = await Promise.all([
        getMovilTransactions(date, bancaCode),
        getMovilDaySummary(date),
      ]);
      setData(txns);
      setSummary(summ);
    } catch {
      setData([]);
      setSummary({ jugado: 0, premios: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const recargas   = data.filter(t => t.type === 'recarga' && t.status === 'completed');
  const retiros    = data.filter(t => t.type === 'retiro');
  const cancelados = data.filter(t => t.status === 'cancelled');

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return '-'; }
  };

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'recargas',     label: 'Recargas'              },
    { key: 'retiro',       label: 'Retiro'                },
    { key: 'cancelaciones',label: 'Cancelaciones'         },
    { key: 'info_cliente', label: 'Información de cliente'},
  ];

  const currentData = tab === 'recargas'      ? recargas
    : tab === 'retiro'                         ? retiros
    : tab === 'cancelaciones'                  ? cancelados
    : data;

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Reporte de recargas" maxWidth="720px">
      <div className="space-y-3">

        {/* ── STAT CARDS: Jugado + Premios ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
          {/* Jugado */}
          <div style={{
            background: 'linear-gradient(135deg,#15803d,#16a34a)',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 8, display: 'flex' }}>
              <TrendingUp size={22} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#bbf7d0', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Jugado del Día
              </div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>
                {loading ? '…' : fmt(summary.jugado)}
              </div>
            </div>
          </div>

          {/* Premios */}
          <div style={{
            background: 'linear-gradient(135deg,#b45309,#d97706)',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 8, display: 'flex' }}>
              <Trophy size={22} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fde68a', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Premios del Día
              </div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>
                {loading ? '…' : fmt(summary.premios)}
              </div>
            </div>
          </div>
        </div>

        {/* Date + fetch */}
        <div className="flex gap-3 items-end">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
          <button onClick={fetchReport} disabled={loading}
            className="px-4 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2"
            style={{ backgroundColor: '#337AB7' }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : '🔍'}
            Ver reporte
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-600 text-white">
              <tr>
                {tab === 'info_cliente' ? (
                  <>
                    <th className="px-3 py-2 text-left">Nombre completo</th>
                    <th className="px-3 py-2 text-left">Código</th>
                    <th className="px-3 py-2 text-left">Balance</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 text-left">Nombre completo</th>
                    <th className="px-3 py-2 text-left">Correo electrónico</th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Hora</th>
                    <th className="px-3 py-2 text-right">Débito</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-3 py-6 text-center"><Loader2 size={18} className="animate-spin mx-auto text-gray-400" /></td></tr>}
              {!loading && currentData.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400 text-sm">Sin datos</td></tr>}
              {currentData.map((row, i) => (
                <tr key={row.id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {tab === 'info_cliente' ? (
                    <>
                      <td className="px-3 py-2">{row.client_name ?? '-'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.client_code ?? '-'}</td>
                      <td className="px-3 py-2 font-bold text-green-600">${(row.balance ?? 0).toFixed(2)}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2">{row.client_name ?? '-'}</td>
                      <td className="px-3 py-2 text-xs">{row.nmv_clients?.email ?? '-'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.client_code ?? '-'}</td>
                      <td className="px-3 py-2 text-xs">{formatTime(row.created_at)}</td>
                      <td className="px-3 py-2 text-right font-bold">${(row.amount ?? 0).toFixed(2)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 text-xs text-gray-400">
            Showing {currentData.length} entries
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={closeModal} className="px-6 py-2 border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
            Cerrar
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
