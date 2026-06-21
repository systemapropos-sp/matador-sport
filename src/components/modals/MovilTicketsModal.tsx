import { useState, useEffect } from 'react';
import { Loader2, Search, Trash2 } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { getMovilTickets, cancelMovilTicket } from '@/lib/movilService';

type Tab = 'todos' | 'ganadores' | 'perdedores' | 'pendientes' | 'cancelados';

export default function MovilTicketsModal() {
  const { closeModal } = useModalContext();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [banca, setBanca] = useState('');
  const [tab, setTab] = useState<Tab>('todos');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try { setTickets(await getMovilTickets(date, banca || undefined)); }
    catch { setTickets([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleCancel = async (t: any) => {
    if (!t.id) return;
    if (!confirm(`¿Cancelar el ticket #${t.ticket_number || t.id?.slice(0, 8)}?`)) return;
    setCancellingId(t.id);
    try {
      await cancelMovilTicket(t.id);
      setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'cancelado' } : x));
      showToast('Ticket cancelado');
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  // Resolve username from ticket — nmv_clients join or vendor_username
  const getUsername = (t: any): string => {
    if (t.nmv_clients?.username) return t.nmv_clients.username;
    if (t.nmv_clients?.full_name) return t.nmv_clients.full_name;
    if (t.vendor_username && t.vendor_username !== '-') return t.vendor_username;
    if (t.vendor_name) return t.vendor_name;
    if (t.client_code) return t.client_code;
    if (t.user_id) return t.user_id.slice(0, 8) + '…';
    return '—';
  };

  const filtered = tickets.filter(t => {
    const matchTab = tab === 'todos' || (t.status ?? '').toLowerCase() === tab ||
      (tab === 'pendientes' && (t.status === 'pending' || t.status === 'pendiente'));
    const matchSearch = !search || JSON.stringify(t).toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    todos:      tickets.length,
    ganadores:  tickets.filter(t => t.status === 'ganador').length,
    perdedores: tickets.filter(t => t.status === 'perdedor').length,
    pendientes: tickets.filter(t => t.status === 'pending' || t.status === 'pendiente').length,
    cancelados: tickets.filter(t => t.status === 'cancelado' || t.status === 'cancelled').length,
  };

  const totalMonto   = filtered.reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalPremios = filtered.filter(t => t.status === 'ganador').reduce((s, t) => s + (t.prize ?? 0), 0);

  const tabs: Tab[] = ['todos', 'ganadores', 'perdedores', 'pendientes', 'cancelados'];

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Manejar tickets" maxWidth="880px">
      <div className="space-y-3">

        {/* Toast */}
        {toast && (
          <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#065F46' }}>
            {toast}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Banca</label>
            <select value={banca} onChange={e => setBanca(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400">
              <option value="">Banca</option>
            </select>
          </div>
          <button onClick={fetchTickets} disabled={loading}
            className="px-4 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2"
            style={{ backgroundColor: '#337AB7' }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Buscar tickets
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${tab === t ? 'text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
              style={tab === t ? { backgroundColor: '#337AB7' } : {}}>
              {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
            </button>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-center">
          <span className="text-sm font-bold text-blue-700">
            Monto total: ${totalMonto.toFixed(2)} &nbsp;&nbsp; Total de premios: ${totalPremios.toFixed(2)}
          </span>
        </div>

        {/* Search */}
        <div className="flex justify-end">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search:"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 w-48" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#337AB7', color: '#fff' }}>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Fecha de creación</th>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Monto</th>
                <th className="px-3 py-2 text-left">Pago</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400"><Loader2 size={18} className="animate-spin mx-auto" /></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400 text-sm">No data available in table</td></tr>}
              {filtered.map((t, i) => {
                const isCancelled = t.status === 'cancelado' || t.status === 'cancelled';
                return (
                  <tr key={t.id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} style={{ opacity: isCancelled ? 0.55 : 1 }}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 text-xs">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</td>
                    {/* Usuario — resolved from join */}
                    <td className="px-3 py-2">
                      <span style={{ fontWeight: 600, color: '#1d4ed8', fontSize: 12 }}>
                        {getUsername(t)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">${(t.amount ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono">${(t.prize ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        t.status === 'ganador'  ? 'bg-green-100 text-green-800'  :
                        isCancelled             ? 'bg-red-100 text-red-800'      :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {t.status ?? 'pendiente'}
                      </span>
                    </td>
                    {/* Trash button */}
                    <td className="px-3 py-2 text-center">
                      {!isCancelled && (
                        <button
                          onClick={() => handleCancel(t)}
                          disabled={cancellingId === t.id}
                          title="Cancelar ticket"
                          style={{
                            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6,
                            padding: '5px 8px', cursor: 'pointer', color: '#DC2626',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {cancellingId === t.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} />}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-3 py-2 text-xs text-gray-400">Showing {filtered.length} entries</div>
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
