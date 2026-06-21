import { useState, useEffect } from 'react';
import { Users, Edit3, Trash2, Receipt, DollarSign, MessageCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { supabase } from '@/lib/supabase';

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
  closed?: boolean;
}

interface Payment {
  id: string;
  clientId: string;
  amount: number;
  date: string;
  note?: string;
}

function loadPayments(): Payment[] {
  try { return JSON.parse(localStorage.getItem('nmv_payments') || '[]'); } catch { return []; }
}

function savePayments(payments: Payment[]) {
  localStorage.setItem('nmv_payments', JSON.stringify(payments));
}

export default function ClientListModal() {
  const { closeModal } = useModalContext();
  const [clients, setClients] = useState<Client[]>(() =>
    JSON.parse(localStorage.getItem('matador_clients') || '[]')
  );
  const [payments, setPayments] = useState<Payment[]>(() => loadPayments());
  const [viewingClient, setViewingClient] = useState<string | null>(null);
  const [historyTab, setHistoryTab] = useState<'tickets' | 'pagos'>('tickets');
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [toast, setToast] = useState('');
  // WhatsApp state
  const [waClient, setWaClient] = useState<Client | null>(null);
  const [waPhone, setWaPhone] = useState('');
  // Close account confirmation
  const [closeConfirm, setCloseConfirm] = useState<Client | null>(null);
  // Delete confirmation + PIN
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deletePin, setDeletePin] = useState('');
  const [deletePinError, setDeletePinError] = useState('');

  // ── Load clients from Supabase on mount, merge with localStorage ──────────
  useEffect(() => {
    const businessId = localStorage.getItem('nmv_business_id') || '';
    const vendorId   = localStorage.getItem('nmv_vendor_pin')  || localStorage.getItem('vendor_pin') || '';

    // Build query with best available filter
    const clientQuery = businessId
      ? supabase.from('vendor_clients').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
      : vendorId
        ? supabase.from('vendor_clients').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
        : supabase.from('vendor_clients').select('*').order('created_at', { ascending: false });

    clientQuery.then(({ data }) => {
        if (!data || data.length === 0) return;
        // Convert DB rows to local Client shape and merge (DB wins)
        const dbClients: Client[] = data.map(r => ({
          id:          r.id,
          name:        r.name,
          phone:       r.phone || '',
          cedula:      r.cedula || '',
          address:     r.address || '',
          type:        (r.type as 'contado' | 'credito') || 'contado',
          creditLimit: Number(r.credit_limit ?? 0),
          balance:     Number(r.balance ?? 0),
          createdAt:   r.created_at || new Date().toISOString(),
          closed:      r.is_closed || false,
        }));
        // Merge: DB ids take priority, add any local-only entries
        const localIds = new Set(dbClients.map(c => c.id));
        const localOnly = (JSON.parse(localStorage.getItem('matador_clients') || '[]') as Client[])
          .filter(c => !localIds.has(c.id));
        const merged = [...dbClients, ...localOnly];
        setClients(merged);
        localStorage.setItem('matador_clients', JSON.stringify(merged));
      });

    // Load payments from Supabase (same fallback)
    const payQuery = businessId
      ? supabase.from('vendor_payments').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
      : vendorId
        ? supabase.from('vendor_payments').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
        : supabase.from('vendor_payments').select('*').order('created_at', { ascending: false });
    payQuery
      .then(({ data: pd }) => {
        if (!pd || pd.length === 0) return;
        const dbPays: Payment[] = pd.map(r => ({
          id:       r.id,
          clientId: r.client_id || '',
          amount:   Number(r.amount),
          date:     r.created_at,
          note:     r.note || undefined,
        }));
        setPayments(dbPays);
        savePayments(dbPays);
      });
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const getClientTickets = (clientId: string) => {
    try { return (JSON.parse(localStorage.getItem('matador_tickets') || '[]') as any[]).filter(t => t.clientId === clientId); }
    catch { return []; }
  };

  const getClientPayments = (clientId: string) => payments.filter(p => p.clientId === clientId);

  const getClientTotal = (clientId: string) =>
    getClientTickets(clientId).reduce((s: number, t: any) => s + (t.totalAmount || 0), 0);

  const handleDelete = (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    localStorage.setItem('matador_clients', JSON.stringify(updated));
    // Also delete from Supabase
    supabase.from('vendor_clients').delete().eq('id', id).then(() => {});
    showToast('Cliente eliminado');
  };

  const handlePayment = (client: Client) => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    const businessId = localStorage.getItem('nmv_business_id') || null;
    const vendorId   = localStorage.getItem('nmv_vendor_pin') || null;
    const newBalance = Math.max(0, client.balance - amount);

    // Save payment record locally
    const newPayment: Payment = { id: `pay-${Date.now()}`, clientId: client.id, amount, date: new Date().toISOString(), note: paymentNote || undefined };
    const allPayments = [...payments, newPayment];
    setPayments(allPayments);
    savePayments(allPayments);
    // Update balance locally
    const updated = clients.map(c => c.id === client.id ? { ...c, balance: newBalance } : c);
    setClients(updated);
    localStorage.setItem('matador_clients', JSON.stringify(updated));
    setPaymentAmount('');
    setPaymentNote('');
    showToast(`✅ Pago de $${amount.toFixed(2)} aplicado`);

    // Sync to Supabase
    supabase.from('vendor_payments').insert({
      client_id:   client.id,
      business_id: businessId,
      vendor_id:   vendorId,
      amount,
      note: paymentNote || null,
    }).then(() => {});
    supabase.from('vendor_clients').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', client.id).then(() => {});
  };

  const handleSaveEdit = () => {
    if (!editClient) return;
    const updated = clients.map(c => c.id === editClient.id ? editClient : c);
    setClients(updated);
    localStorage.setItem('matador_clients', JSON.stringify(updated));
    // Sync to Supabase
    supabase.from('vendor_clients').update({
      name:  editClient.name,
      phone: editClient.phone || null,
      cedula: editClient.cedula || null,
      address: editClient.address || null,
      updated_at: new Date().toISOString(),
    }).eq('id', editClient.id).then(() => {});
    setEditClient(null);
    showToast('Cliente actualizado');
  };

  const handleCloseAccount = (client: Client) => {
    const updated = clients.map(c => c.id === client.id ? { ...c, closed: true, balance: 0 } : c);
    setClients(updated);
    localStorage.setItem('matador_clients', JSON.stringify(updated));
    // Sync to Supabase
    supabase.from('vendor_clients').update({ is_closed: true, balance: 0, updated_at: new Date().toISOString() }).eq('id', client.id).then(() => {});
    setCloseConfirm(null);
    setViewingClient(null);
    showToast(`🔒 Cuenta de ${client.name} cerrada`);
  };

  const handleWhatsApp = (client: Client, phone?: string) => {
    const num = (phone || client.phone || '').replace(/\D/g, '');
    if (!num) return;
    const tickets = getClientTickets(client.id);
    const total = getClientTotal(client.id);
    const paid = getClientPayments(client.id).reduce((s, p) => s + p.amount, 0);
    const balance = total - paid;
    const msg = `🎰 *NMV Lottery*\n*Cliente:* ${client.name}\n*Tickets:* ${tickets.length}\n*Total jugado:* $${total.toFixed(2)}\n*Pagos recibidos:* $${paid.toFixed(2)}\n*Balance:* $${balance.toFixed(2)}\n\n_NMV Lottery - Sistema de Ventas_`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    setWaClient(null);
  };

  return (
    <ModalWrapper open={true} onClose={closeModal} title="Clientes" maxWidth="720px">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="mb-3 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit form */}
      {editClient ? (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-700">Editar Cliente</h3>
          <input value={editClient.name} onChange={e => setEditClient({...editClient, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Nombre" />
          <input value={editClient.phone} onChange={e => setEditClient({...editClient, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Teléfono" />
          <input value={editClient.cedula} onChange={e => setEditClient({...editClient, cedula: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cédula" />
          <input value={editClient.address} onChange={e => setEditClient({...editClient, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Dirección" />
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
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {clients.map(client => {
                const tickets = getClientTickets(client.id);
                const clientPays = getClientPayments(client.id);
                const totalTickets = getClientTotal(client.id);
                const totalPaid = clientPays.reduce((s, p) => s + p.amount, 0);
                const isViewing = viewingClient === client.id;

                return (
                  <div key={client.id} className={`border rounded-lg overflow-hidden ${client.closed ? 'opacity-60' : ''}`}>
                    {/* Client row */}
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${client.closed ? 'bg-gray-400' : client.type === 'credito' ? 'bg-amber-500' : 'bg-green-500'}`} />
                        <div className="min-w-0">
                          <span className="font-bold text-sm">{client.name}</span>
                          {client.closed && <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">CERRADA</span>}
                          {client.phone && <span className="ml-2 text-xs text-gray-400">{client.phone}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Balance badge */}
                        {client.type === 'credito' && client.balance > 0 && (
                          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full mr-1">
                            ${client.balance.toFixed(2)}
                          </span>
                        )}
                        {/* WhatsApp */}
                        {client.phone ? (
                          <button onClick={() => handleWhatsApp(client)} className="p-1 hover:bg-green-100 rounded" title="WhatsApp directo">
                            <MessageCircle size={14} className="text-green-600" />
                          </button>
                        ) : (
                          <button onClick={() => { setWaClient(client); setWaPhone(''); }} className="p-1 hover:bg-green-100 rounded" title="Enviar WhatsApp">
                            <MessageCircle size={14} className="text-gray-400" />
                          </button>
                        )}
                        {/* History toggle */}
                        <button onClick={() => setViewingClient(isViewing ? null : client.id)} className="p-1 hover:bg-gray-200 rounded" title="Ver historial">
                          {isViewing ? <ChevronUp size={14} className="text-blue-600" /> : <Receipt size={14} className="text-gray-600" />}
                        </button>
                        {/* Edit */}
                        <button onClick={() => setEditClient(client)} className="p-1 hover:bg-gray-200 rounded" title="Editar">
                          <Edit3 size={14} className="text-blue-600" />
                        </button>
                        {/* Delete */}
                        <button onClick={() => { setDeleteTarget(client); setDeletePin(''); setDeletePinError(''); }} className="p-1 hover:bg-red-100 rounded" title="Eliminar cliente">
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded history */}
                    <AnimatePresence>
                      {isViewing && (
                        <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}}
                          className="border-t overflow-hidden">
                          <div className="px-3 pt-2 pb-3 bg-white">
                            {/* Summary cards */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {[
                                { label: 'Tickets', value: tickets.length, color: '#337ab7' },
                                { label: 'Total jugado', value: `$${totalTickets.toFixed(2)}`, color: '#0D9488' },
                                { label: 'Balance', value: `$${Math.max(0, totalTickets - totalPaid).toFixed(2)}`, color: totalTickets - totalPaid > 0 ? '#d9534f' : '#5cb85c' },
                              ].map((s, i) => (
                                <div key={i} className="rounded-lg p-2 text-center" style={{background:'#f9f9f9', border:'1px solid #e0e0e0'}}>
                                  <div className="text-xs text-gray-500">{s.label}</div>
                                  <div className="text-sm font-bold" style={{color: s.color}}>{s.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 mb-2">
                              {(['tickets','pagos'] as const).map(tab => (
                                <button key={tab} onClick={() => setHistoryTab(tab)}
                                  className="px-3 py-1 text-xs font-bold rounded-full transition-colors capitalize"
                                  style={{
                                    background: historyTab === tab ? '#337ab7' : '#f0f0f0',
                                    color: historyTab === tab ? '#fff' : '#555',
                                  }}>
                                  {tab === 'tickets' ? `Tickets (${tickets.length})` : `Pagos (${clientPays.length})`}
                                </button>
                              ))}
                            </div>

                            {/* Tab content */}
                            {historyTab === 'tickets' && (
                              <div className="max-h-[140px] overflow-y-auto space-y-1 mb-3">
                                {tickets.length === 0 ? (
                                  <p className="text-xs text-gray-400 text-center py-3">Sin tickets</p>
                                ) : tickets.map((t: any) => (
                                  <div key={t.id} className="flex justify-between items-center text-xs px-2 py-1.5 bg-gray-50 rounded border border-gray-100">
                                    <span className="font-mono font-bold text-blue-700">{t.ticketNumber}</span>
                                    <span className="text-gray-400 mx-2">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-DO') : '-'}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                                      t.status === 'winner' ? 'bg-green-100 text-green-700' :
                                      t.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                                      t.status === 'loser' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
                                    }`}>{t.status}</span>
                                    <span className="font-bold text-teal-700 ml-2">${(t.totalAmount || 0).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {historyTab === 'pagos' && (
                              <div className="max-h-[140px] overflow-y-auto space-y-1 mb-3">
                                {clientPays.length === 0 ? (
                                  <p className="text-xs text-gray-400 text-center py-3">Sin pagos registrados</p>
                                ) : clientPays.map(p => (
                                  <div key={p.id} className="flex justify-between items-center text-xs px-2 py-1.5 bg-green-50 rounded border border-green-100">
                                    <span className="text-gray-500">{new Date(p.date).toLocaleDateString('es-DO')}</span>
                                    {p.note && <span className="text-gray-400 mx-2 italic">{p.note}</span>}
                                    <span className="font-bold text-green-700">+${p.amount.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Payment form (crédito only) */}
                            {client.type === 'credito' && !client.closed && (
                              <div className="border-t pt-2 mt-1">
                                <p className="text-xs font-bold text-gray-600 mb-1.5">Registrar abono:</p>
                                <div className="flex gap-2">
                                  <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                                    placeholder="Monto" className="w-24 px-2 py-1 border rounded text-sm" />
                                  <input value={paymentNote} onChange={e => setPaymentNote(e.target.value)}
                                    placeholder="Nota (opcional)" className="flex-1 px-2 py-1 border rounded text-sm" />
                                  <button onClick={() => handlePayment(client)}
                                    className="px-3 py-1 bg-green-500 text-white rounded text-sm font-bold flex items-center gap-1 whitespace-nowrap">
                                    <DollarSign size={12} />Pagar
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Close account */}
                            {!client.closed && (
                              <div className="flex justify-end mt-2 pt-2 border-t">
                                <button onClick={() => setCloseConfirm(client)}
                                  className="flex items-center gap-1 text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded">
                                  <XCircle size={12} /> Cerrar cuenta
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── PORTAL: WhatsApp input (client with no phone) ── */}
      {waClient && createPortal(
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={() => setWaClient(null)}>
          <motion.div initial={{opacity:0,scale:0.93}} animate={{opacity:1,scale:1}} transition={{duration:0.16}}
            style={{background:'#fff',borderRadius:14,width:'min(340px,90vw)',padding:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}
            onClick={e => e.stopPropagation()}>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:32,marginBottom:6}}>💬</div>
              <h3 style={{margin:0,color:'#25D366',fontSize:16,fontWeight:800}}>WhatsApp — {waClient.name}</h3>
            </div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#555',marginBottom:6}}>Número de teléfono</label>
            <input type="tel" value={waPhone} onChange={e => setWaPhone(e.target.value.replace(/\D/g,''))}
              placeholder="18095551234" autoFocus
              style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1.5px solid #e0e0e0',fontSize:14,boxSizing:'border-box',marginBottom:14,outline:'none'}} />
            <button disabled={waPhone.length < 7}
              onClick={() => handleWhatsApp(waClient, waPhone)}
              style={{width:'100%',padding:'12px',borderRadius:10,background:waPhone.length>=7?'#25D366':'#ccc',color:'#fff',fontWeight:800,fontSize:14,border:'none',cursor:waPhone.length>=7?'pointer':'not-allowed',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <MessageCircle size={18}/> Enviar resumen
            </button>
            <button onClick={() => setWaClient(null)}
              style={{width:'100%',padding:'8px',borderRadius:8,background:'#f5f5f5',border:'1px solid #ddd',cursor:'pointer',fontSize:13,color:'#666'}}>
              Cancelar
            </button>
          </motion.div>
        </div>,
        document.body
      )}

      {/* ── PORTAL: Delete confirmation + PIN ── */}
      {deleteTarget && createPortal(
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={() => setDeleteTarget(null)}>
          <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} transition={{duration:0.18}}
            style={{background:'#fff',borderRadius:16,width:'min(360px,92vw)',padding:'28px 24px',boxShadow:'0 24px 64px rgba(0,0,0,0.4)'}}
            onClick={e => e.stopPropagation()}>
            {/* Warning header */}
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{fontSize:48,marginBottom:8}}>⚠️</div>
              <h3 style={{margin:0,color:'#d9534f',fontSize:18,fontWeight:900}}>¡Advertencia!</h3>
              <p style={{margin:'10px 0 4px',fontSize:14,color:'#444'}}>
                Está a punto de eliminar al cliente
              </p>
              <p style={{margin:'0 0 4px',fontSize:16,fontWeight:800,color:'#d9534f'}}>
                {deleteTarget.name}
              </p>
              <p style={{margin:0,fontSize:12,color:'#999'}}>
                Esta acción <b>no se puede deshacer</b>. Se eliminarán todos sus datos.
              </p>
            </div>

            {/* PIN input */}
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:13,fontWeight:700,color:'#555',marginBottom:8,textAlign:'center'}}>
                🔐 Ingrese su PIN para confirmar
              </label>
              <div style={{display:'flex',justifyContent:'center',gap:10}}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width:48, height:56, borderRadius:10, border:`2px solid ${deletePin.length > i ? '#d9534f' : '#ddd'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:24, fontWeight:900, color:'#d9534f',
                    background: deletePin.length > i ? '#fff5f5' : '#fafafa',
                    transition:'all 0.15s',
                  }}>
                    {deletePin.length > i ? '●' : ''}
                  </div>
                ))}
              </div>
              {/* Numeric keypad */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:14,maxWidth:220,margin:'14px auto 0'}}>
                {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, idx) => (
                  k === '' ? <div key={idx} /> :
                  <button key={k} onClick={() => {
                    if (k === '⌫') {
                      setDeletePin(p => p.slice(0,-1));
                      setDeletePinError('');
                    } else if (deletePin.length < 4) {
                      setDeletePin(p => p + k);
                      setDeletePinError('');
                    }
                  }}
                  style={{
                    height:44, borderRadius:10, border:'1.5px solid #f0d0d0',
                    background: k === '⌫' ? '#fff5f5' : '#fff',
                    fontSize: k === '⌫' ? 16 : 18, fontWeight:700, color:'#444',
                    cursor:'pointer',
                  }}>
                    {k}
                  </button>
                ))}
              </div>
              {deletePinError && (
                <p style={{textAlign:'center',color:'#d9534f',fontSize:12,fontWeight:700,marginTop:8}}>{deletePinError}</p>
              )}
            </div>

            {/* Buttons */}
            <div style={{display:'flex',gap:10,marginTop:4}}>
              <button onClick={() => { setDeleteTarget(null); setDeletePin(''); setDeletePinError(''); }}
                style={{flex:1,padding:'11px',borderRadius:10,background:'#f5f5f5',border:'1px solid #ddd',cursor:'pointer',fontSize:14,color:'#666',fontWeight:700}}>
                Cancelar
              </button>
              <button
                disabled={deletePin.length < 4}
                onClick={() => {
                  // Verify PIN against stored vendor PIN
                  const storedPin = localStorage.getItem('nmv_vendor_pin') || localStorage.getItem('vendor_pin') || '1234';
                  if (deletePin !== storedPin) {
                    setDeletePinError('PIN incorrecto. Inténtelo de nuevo.');
                    setDeletePin('');
                    return;
                  }
                  handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                  setDeletePin('');
                  setDeletePinError('');
                }}
                style={{flex:1,padding:'11px',borderRadius:10,background:deletePin.length>=4?'#d9534f':'#eaa',color:'#fff',border:'none',cursor:deletePin.length>=4?'pointer':'not-allowed',fontSize:14,fontWeight:900}}>
                🗑️ Eliminar
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* ── PORTAL: Close account confirmation ── */}
      {closeConfirm && createPortal(
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={() => setCloseConfirm(null)}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.18}}
            style={{background:'#fff',borderRadius:14,width:'min(340px,90vw)',padding:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.35)'}}
            onClick={e => e.stopPropagation()}>
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{fontSize:40,marginBottom:8}}>🔒</div>
              <h3 style={{margin:0,color:'#d9534f',fontSize:18,fontWeight:800}}>Cerrar Cuenta</h3>
              <p style={{margin:'10px 0 0',fontSize:13,color:'#666'}}>
                ¿Cerrar la cuenta de <b>{closeConfirm.name}</b>?
              </p>
              <p style={{margin:'4px 0',fontSize:12,color:'#999'}}>
                El balance será saldado y la cuenta archivada.
              </p>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={() => setCloseConfirm(null)}
                style={{flex:1,padding:'10px',borderRadius:8,background:'#f5f5f5',border:'1px solid #ddd',cursor:'pointer',fontSize:14,color:'#666',fontWeight:600}}>
                Cancelar
              </button>
              <button onClick={() => handleCloseAccount(closeConfirm)}
                style={{flex:1,padding:'10px',borderRadius:8,background:'#d9534f',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:800}}>
                Cerrar cuenta
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </ModalWrapper>
  );
}
