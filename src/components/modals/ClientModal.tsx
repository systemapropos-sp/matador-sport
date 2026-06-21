import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { supabase } from '@/lib/supabase';

export default function ClientModal() {
  const { closeModal } = useModalContext();
  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [cedula, setCedula]           = useState('');
  const [address, setAddress]         = useState('');
  const [type, setType]               = useState<'contado' | 'credito'>('contado');
  const [creditLimit, setCreditLimit] = useState('');
  const [loading, setLoading]         = useState(false);
  const [toast, setToast]             = useState('');
  const [error, setError]             = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    setLoading(true);
    setError('');

    const businessId = localStorage.getItem('nmv_business_id') || null;
    const vendorId   = localStorage.getItem('nmv_vendor_pin')  || null;

    // ── 1. Save to Supabase vendor_clients ──────────────────
    const { data: saved, error: sbErr } = await supabase
      .from('vendor_clients')
      .insert({
        business_id:  businessId,
        vendor_id:    vendorId,
        name:         name.trim(),
        phone:        phone.trim() || null,
        cedula:       cedula.trim() || null,
        address:      address.trim() || null,
        type,
        credit_limit: type === 'credito' ? parseFloat(creditLimit) || 0 : 0,
        balance:      0,
        is_closed:    false,
      })
      .select()
      .single();

    // ── 2. Also mirror to localStorage so existing UI still works ──
    const localClients = JSON.parse(localStorage.getItem('matador_clients') || '[]');
    const newLocal = {
      id:          saved?.id ?? `client-${Date.now()}`,
      name:        name.trim(),
      phone:       phone.trim(),
      cedula:      cedula.trim(),
      address:     address.trim(),
      type,
      creditLimit: type === 'credito' ? parseFloat(creditLimit) || 0 : 0,
      balance:     0,
      createdAt:   new Date().toISOString(),
    };
    localClients.push(newLocal);
    localStorage.setItem('matador_clients', JSON.stringify(localClients));

    setLoading(false);

    if (sbErr) {
      // Still show "created" because localStorage was saved, but warn
      console.warn('Supabase save warning:', sbErr.message);
      if (sbErr.message.includes('does not exist')) {
        setToast('⚠️ Cliente guardado localmente. Ejecuta el SQL en Supabase para guardado en nube.');
      } else {
        setToast('✅ Cliente creado (local)');
      }
    } else {
      setToast('✅ Cliente guardado en Supabase!');
    }

    setTimeout(() => {
      setToast('');
      setName(''); setPhone(''); setCedula(''); setAddress('');
      setCreditLimit(''); setType('contado');
      closeModal();
    }, 1500);
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Crear Cliente" maxWidth="420px">
      {toast && (
        <div className="mb-3 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
          {toast}
        </div>
      )}
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre *</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            placeholder="Nombre completo"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            placeholder="809-000-0000"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cédula</label>
          <input
            type="text"
            value={cedula}
            onChange={e => setCedula(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            placeholder="000-0000000-0"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            placeholder="Dirección"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de cliente</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as 'contado' | 'credito')}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400"
          >
            <option value="contado">Contado</option>
            <option value="credito">Crédito</option>
          </select>
        </div>
        {type === 'credito' && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Límite de crédito ($)</label>
            <input
              type="number"
              value={creditLimit}
              onChange={e => setCreditLimit(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#0D9488,#0891B2)' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {loading ? 'Guardando...' : 'Guardar Cliente'}
        </button>
      </div>
    </ModalWrapper>
  );
}
