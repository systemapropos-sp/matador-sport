import { useState } from 'react';
import { Users, Edit3, Trash2, Receipt, DollarSign } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';

interface Client {
  id: string;
  name: string;
  phone: string;
  cedula: string;
  address: string;
  type: 'contado' | 'credito';
  creditLimit: number;
  balance: number;
  createdAt: string;
}

export default function ClientListModal() {
  const { closeModal } = useModalContext();
  const [clients, setClients] = useState<Client[]>(() => {
    return JSON.parse(localStorage.getItem('matador_clients') || '[]');
  });
  const [viewingClient, setViewingClient] = useState<string | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [toast, setToast] = useState('');

  const clientTickets = (clientId: string) => {
    const tickets = JSON.parse(localStorage.getItem('matador_tickets') || '[]');
    return tickets.filter((t: any) => t.clientId === clientId);
  };

  const clientTotal = (clientId: string) => {
    return clientTickets(clientId).reduce((s: number, t: any) => s + (t.totalAmount || 0), 0);
  };

  const handleDelete = (id: string) => {
    const updated = clients.filter((c) => c.id !== id);
    setClients(updated);
    localStorage.setItem('matador_clients', JSON.stringify(updated));
    setToast('Cliente eliminado');
    setTimeout(() => setToast(''), 2000);
  };

  const handlePayment = (client: Client) => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    const updated = clients.map((c) => {
      if (c.id === client.id) {
        return { ...c, balance: Math.max(0, c.balance - amount) };
      }
      return c;
    });
    setClients(updated);
    localStorage.setItem('matador_clients', JSON.stringify(updated));
    setPaymentAmount('');
    setToast(`Pago de $${amount.toFixed(2)} aplicado`);
    setTimeout(() => setToast(''), 2000);
  };

  const handleSaveEdit = () => {
    if (!editClient) return;
    const updated = clients.map((c) => c.id === editClient.id ? editClient : c);
    setClients(updated);
    localStorage.setItem('matador_clients', JSON.stringify(updated));
    setEditClient(null);
    setToast('Cliente actualizado');
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Clientes" maxWidth="700px">
      {toast && (
        <div className="mb-3 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {editClient ? (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-700">Editar Cliente</h3>
          <input value={editClient.name} onChange={(e) => setEditClient({ ...editClient, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Nombre" />
          <input value={editClient.phone} onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Telefono" />
          <input value={editClient.cedula} onChange={(e) => setEditClient({ ...editClient, cedula: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cedula" />
          <input value={editClient.address} onChange={(e) => setEditClient({ ...editClient, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Direccion" />
          <div className="flex gap-2">
            <button onClick={() => setEditClient(null)} className="flex-1 py-2 border rounded-lg text-sm">Cancelar</button>
            <button onClick={handleSaveEdit} className="flex-1 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold">Guardar</button>
          </div>
        </div>
      ) : (
        <>
          {clients.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users size={48} className="mx-auto mb-2 opacity-30" />
              <p>No hay clientes registrados</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {clients.map((client) => {
                const tickets = clientTickets(client.id);
                const total = clientTotal(client.id);
                const isViewing = viewingClient === client.id;

                return (
                  <div key={client.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${client.type === 'credito' ? 'bg-amber-500' : 'bg-green-500'}`} />
                        <span className="font-bold text-sm">{client.name}</span>
                        <span className="text-xs text-gray-400">{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewingClient(isViewing ? null : client.id)} className="p-1 hover:bg-gray-200 rounded" title="Ver tickets">
                          <Receipt size={14} className="text-gray-600" />
                        </button>
                        <button onClick={() => setEditClient(client)} className="p-1 hover:bg-gray-200 rounded" title="Editar">
                          <Edit3 size={14} className="text-blue-600" />
                        </button>
                        <button onClick={() => handleDelete(client.id)} className="p-1 hover:bg-gray-200 rounded" title="Eliminar">
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </div>

                    {isViewing && (
                      <div className="px-3 py-2 bg-white border-t">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-gray-500">Tickets: {tickets.length}</span>
                          <span className="font-bold">Total: ${total.toFixed(2)}</span>
                        </div>
                        {tickets.length > 0 && (
                          <div className="space-y-1 mb-2 max-h-[100px] overflow-y-auto">
                            {tickets.map((t: any) => (
                              <div key={t.id} className="flex justify-between text-xs px-2 py-1 bg-gray-50 rounded">
                                <span className="font-mono">{t.ticketNumber}</span>
                                <span>${(t.totalAmount || 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {client.type === 'credito' && (
                          <div className="flex gap-2 mt-2">
                            <input
                              type="number"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder="Monto"
                              className="flex-1 px-2 py-1 border rounded text-sm"
                            />
                            <button
                              onClick={() => handlePayment(client)}
                              className="px-3 py-1 bg-green-500 text-white rounded text-sm font-bold flex items-center gap-1"
                            >
                              <DollarSign size={12} />
                              Pagar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </ModalWrapper>
  );
}
