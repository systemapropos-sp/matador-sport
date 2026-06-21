import { useState } from 'react';
import { Search, Loader2, CreditCard } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { searchMovilClient, recargarMovilClient, type MovilClient } from '@/lib/movilService';
import { useVendedores } from '@/hooks/useVendedores';

export default function MovilRecargasModal() {
  const { closeModal } = useModalContext();
  const { activeVendedor } = useVendedores();
  const [query, setQuery]         = useState('');
  const [client, setClient]       = useState<MovilClient | null>(null);
  const [amount, setAmount]       = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setError(''); setClient(null);
    // Search ONLY this vendor's clients (filtered by banca_code)
    const bancaCode = localStorage.getItem('nmv_vendor_code') || undefined;
    try {
      const c = await searchMovilClient(query.trim(), bancaCode);
      if (!c) setError('Cliente no encontrado.');
      else setClient(c);
    } catch (e: any) { setError(e.message); }
    finally { setSearching(false); }
  };

  const handleConfirm = async () => {
    if (!client?.id || !amount || Number(amount) <= 0) return;
    setLoading(true); setError('');
    try {
      const vendorCode = localStorage.getItem('nmv_vendor_code') || activeVendedor?.id || 'NMV-001';
      const vendorId   = localStorage.getItem('nmv_vendor_id')   || activeVendedor?.id || 'vendor';
      await recargarMovilClient(client.id, Number(amount), {
        banca_code: vendorCode,
        created_by: vendorId,
      });
      setSuccess(`✅ Recarga de $${Number(amount).toFixed(2)} añadida.`);
      setTimeout(() => { setSuccess(''); closeModal(); }, 2000);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Recargas" maxWidth="460px">
      {success && <div className="mb-3 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">{success}</div>}
      {error   && <div className="mb-3 px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium">{error}</div>}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar clientes (Tel, Codigo, Email)</label>
            <div className="flex gap-2">
              <input type="text" value={query} onChange={e=>setQuery(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') handleSearch(); }}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                placeholder="MMW-1001 / 809-000-0000 / email" />
              <button onClick={handleSearch} disabled={searching}
                className="px-4 py-2 rounded-lg text-white text-sm font-bold"
                style={{ backgroundColor: '#337AB7' }}>
                {searching ? <Loader2 size={14} className="animate-spin"/> : <Search size={14}/>}
              </button>
            </div>
          </div>
          {client && (<>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email/Usuario</label>
              <input readOnly value={client.email ?? client.username}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre completo</label>
              <input readOnly value={client.full_name}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Balance actual</label>
              <input readOnly value={`$${(client.balance ?? 0).toFixed(2)}`}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-bold text-green-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto *</label>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                step="0.01" min="0.01"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                placeholder="0.00" />
            </div>
          </>)}
        </div>

        <div className="flex gap-2">
          <button onClick={closeModal} className="flex-1 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={!client || !amount || loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#337AB7' }}>
            {loading ? <Loader2 size={16} className="animate-spin"/> : <CreditCard size={16}/>}
            Confirmar
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
