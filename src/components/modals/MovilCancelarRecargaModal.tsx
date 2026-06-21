import { useState } from 'react';
import { Search, Loader2, XCircle } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { cancelarRecarga } from '@/lib/movilService';

export default function MovilCancelarRecargaModal() {
  const { closeModal } = useModalContext();
  const [code, setCode]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleConfirm = async () => {
    if (!code.trim()) { setError('Ingresa el código de la recarga.'); return; }
    setLoading(true); setError('');
    try {
      await cancelarRecarga(code.trim());
      setSuccess('✅ Recarga cancelada exitosamente.');
      setTimeout(() => { setSuccess(''); closeModal(); }, 2000);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Cancelar recarga" maxWidth="400px">
      {success && <div className="mb-3 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">{success}</div>}
      {error   && <div className="mb-3 px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Codigo de recarga</label>
          <div className="flex gap-2">
            <input type="text" value={code} onChange={e=>setCode(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') handleConfirm(); }}
              className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              placeholder="ID de la transacción" />
            <button onClick={() => {}} style={{display:'none'}}><Search size={14}/></button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Ingresa el ID de la recarga que deseas cancelar.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={closeModal} className="flex-1 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={loading || !code.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#337AB7' }}>
            {loading ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>}
            Confirmar
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
