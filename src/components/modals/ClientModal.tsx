import { useState } from 'react';
import { Save } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';

export default function ClientModal() {
  const { closeModal } = useModalContext();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cedula, setCedula] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'contado' | 'credito'>('contado');
  const [creditLimit, setCreditLimit] = useState('');
  const [toast, setToast] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setToast('El nombre es requerido');
      return;
    }
    const clients = JSON.parse(localStorage.getItem('matador_clients') || '[]');
    const newClient = {
      id: `client-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      cedula: cedula.trim(),
      address: address.trim(),
      type,
      creditLimit: type === 'credito' ? parseFloat(creditLimit) || 0 : 0,
      balance: 0,
      createdAt: new Date().toISOString(),
    };
    clients.push(newClient);
    localStorage.setItem('matador_clients', JSON.stringify(clients));
    setToast('Cliente creado exitosamente!');
    setTimeout(() => {
      setToast('');
      setName('');
      setPhone('');
      setCedula('');
      setAddress('');
      setCreditLimit('');
      setType('contado');
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
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
            placeholder="Nombre completo"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefono</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
              placeholder="809-000-0000"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cedula</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
              placeholder="000-0000000-0"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Direccion</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
            placeholder="Calle, ciudad"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
          <div className="flex gap-2">
            <button
              onClick={() => setType('contado')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                type === 'contado' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              Contado
            </button>
            <button
              onClick={() => setType('credito')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                type === 'credito' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              Credito
            </button>
          </div>
        </div>
        {type === 'credito' && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Limite de Credito</label>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-amber-400 text-sm"
              placeholder="0.00"
            />
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button
            onClick={closeModal}
            className="flex-1 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: '#f0ad4e' }}
          >
            <Save size={16} />
            Guardar
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
