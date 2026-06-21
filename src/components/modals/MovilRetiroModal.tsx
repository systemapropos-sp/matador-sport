import { useState } from 'react';
import { Search, Loader2, ArrowDownCircle } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { searchMovilClient, retirarMovilClient, type MovilClient } from '@/lib/movilService';
import { useVendedores } from '@/hooks/useVendedores';

export default function MovilRetiroModal() {
  const { closeModal } = useModalContext();
  const { activeVendedor } = useVendedores();

  const [code, setCode]           = useState('');
  const [client, setClient]       = useState<MovilClient | null>(null);
  const [amount, setAmount]       = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const handleSearch = async () => {
    if (!code.trim()) return;
    setSearching(true); setError(''); setClient(null);
    const bancaCode = localStorage.getItem('nmv_vendor_code') || undefined;
    try {
      const c = await searchMovilClient(code.trim(), bancaCode);
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
      await retirarMovilClient(client.id, Number(amount), {
        banca_code: vendorCode,
        created_by: vendorId,
      });
      setSuccess(`✅ Retiro de $${Number(amount).toFixed(2)} realizado.`);
      setTimeout(() => { setSuccess(''); closeModal(); }, 2000);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Retiro de balance" maxWidth="460px">
      {success && <div className="mb-3 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">{success}</div>}
      {error   && <div className="mb-3 px-3 py-2 bg-red-100   text-red-800   rounded-lg text-sm font-medium">{error}</div>}

      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code</label>
          <div className="flex gap-2">
            <input type="text" value={code} onChange={e=>setCode(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') handleSearch(); }}
              className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              placeholder="MMW-1001 / teléfono / email" />
            <button onClick={handleSearch} disabled={searching}
              className="px-4 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2"
              style={{ backgroundColor: '#337AB7' }}>
              {searching ? <Loader2 size={14} className="animate-spin"/> : <Search size={14}/>}
              Buscar
            </button>
          </div>
        </div>

        {/* Client info */}
        {client && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Información de cliente</label>
              <p className="text-sm font-semibold text-gray-800">{client.full_name}</p>
              <p className="text-xs text-gray-500">{client.code}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Balance actual</label>
              <p className="text-lg font-bold text-green-600">${(client.balance ?? 0).toFixed(2)}</p>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto a retirar *</label>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                max={client.balance ?? 0} step="0.01" min="0.01"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                placeholder="0.00" />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={closeModal} className="flex-1 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={!client || !amount || loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#337AB7' }}>
            {loading ? <Loader2 size={16} className="animate-spin"/> : <ArrowDownCircle size={16}/>}
            Confirmar
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
