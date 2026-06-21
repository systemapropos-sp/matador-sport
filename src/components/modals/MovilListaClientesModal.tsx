// ============================================================
// MovilListaClientesModal — Lista de clientes MOVIL (nmv_clients)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, User, Phone, DollarSign, CheckCircle, XCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalWrapper from './ModalWrapper';
import { useModalContext } from './ModalContext';
import { supabase as sb } from '@/lib/supabase';
import { toggleMovilClientActive } from '@/lib/movilService';

interface MovilClient {
  id: string;
  code: string;
  username: string;
  full_name: string;
  phone?: string;
  email?: string;
  balance: number;
  is_active: boolean;
  business_id?: string;
  created_at: string;
  last_login?: string;
}

function formatBalance(n: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 2 }).format(n);
}

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function MovilListaClientesModal() {
  const { closeModal } = useModalContext();
  const [clients, setClients]   = useState<MovilClient[]>([]);
  const [filtered, setFiltered] = useState<MovilClient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [copied, setCopied]       = useState<string | null>(null);
  const [toggling, setToggling]   = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    // Filter by banca_code so each vendor sees ONLY their own clients
    const bancaCode = localStorage.getItem('nmv_vendor_code') || '';
    let query = sb
      .from('nmv_clients')
      .select('id,code,username,full_name,phone,email,balance,is_active,business_id,created_at')
      .order('created_at', { ascending: false });
    if (bancaCode) query = query.eq('banca_code', bancaCode);
    const { data, error } = await query;
    if (!error && data) {
      setClients(data as MovilClient[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter
  useEffect(() => {
    let list = clients;
    if (filterActive === 'active')   list = list.filter(c => c.is_active);
    if (filterActive === 'inactive') list = list.filter(c => !c.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.username?.toLowerCase().includes(q) ||
        c.full_name?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [clients, search, filterActive]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    setToggling(id);
    try {
      await toggleMovilClientActive(id, !current);
      setClients(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
    } catch { /* ignore */ }
    setToggling(null);
  };

  const total         = clients.length;
  const totalActivos  = clients.filter(c => c.is_active).length;
  const totalBalance  = clients.reduce((s, c) => s + (c.balance || 0), 0);

  return (
    <ModalWrapper open={true} title="Lista de Clientes MOVIL" onClose={closeModal} maxWidth="720px">
      {/* Header stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total clientes', value: String(total),                   color:'#5B8DD9' },
          { label:'Activos',        value: String(totalActivos),            color:'#22C55E' },
          { label:'Balance total',  value: formatBalance(totalBalance),     color:'#F59E0B' },
        ].map(s => (
          <div key={s.label} style={{ background:'#F8FAFC', borderRadius:10, padding:'10px 14px', textAlign:'center', border:`1.5px solid ${s.color}22` }}>
            <div style={{ fontSize:18, fontWeight:700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:160, position:'relative' }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código, teléfono…"
            style={{ width:'100%', paddingLeft:30, paddingRight:10, paddingTop:8, paddingBottom:8, borderRadius:8, border:'1.5px solid #E5E7EB', fontSize:13, outline:'none', boxSizing:'border-box' }}
          />
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {(['all','active','inactive'] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              style={{ padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight: filterActive===f ? 700 : 500,
                background: filterActive===f ? '#5B8DD9' : '#F3F4F6',
                color: filterActive===f ? '#fff' : '#6B7280' }}>
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
        <button onClick={load} style={{ padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer', background:'#F3F4F6', color:'#374151', display:'flex', alignItems:'center', gap:4, fontSize:12 }}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* Table */}
      <div style={{ maxHeight:400, overflowY:'auto', borderRadius:10, border:'1px solid #E5E7EB' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>
            <div style={{ fontSize:24, marginBottom:8 }}>⏳</div>
            Cargando clientes…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#9CA3AF', fontSize:14 }}>
            <Users size={32} style={{ marginBottom:8, opacity:0.4 }} />
            <div>{search ? 'Sin resultados para la búsqueda' : 'No hay clientes registrados aún'}</div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #E5E7EB' }}>
                {['Código','Nombre','Usuario','Teléfono','Balance','Estado','Registro'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:600, color:'#374151', fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id}
                    initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ borderBottom:'1px solid #F3F4F6', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA')}
                  >
                    <td style={{ padding:'8px 12px', whiteSpace:'nowrap' }}>
                      <button onClick={() => copyCode(c.code)}
                        style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', fontFamily:'monospace', fontSize:12, fontWeight:600, color:'#5B8DD9', padding:0 }}
                        title="Copiar código">
                        {c.code}
                        {copied === c.code
                          ? <CheckCircle size={11} color="#22C55E" />
                          : <Copy size={11} color="#9CA3AF" />}
                      </button>
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <User size={13} color="#5B8DD9" />
                        </div>
                        <span style={{ fontWeight:500, color:'#1F2937' }}>{c.full_name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding:'8px 12px', color:'#6B7280', fontFamily:'monospace', fontSize:12 }}>{c.username}</td>
                    <td style={{ padding:'8px 12px', whiteSpace:'nowrap' }}>
                      {c.phone
                        ? <div style={{ display:'flex', alignItems:'center', gap:4, color:'#374151' }}><Phone size={12} color="#6B7280" />{c.phone}</div>
                        : <span style={{ color:'#D1D5DB' }}>—</span>}
                    </td>
                    <td style={{ padding:'8px 12px', fontWeight:600, color: (c.balance || 0) > 0 ? '#16A34A' : '#6B7280', whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <DollarSign size={12} />
                        {formatBalance(c.balance || 0)}
                      </div>
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      {/* Toggle switch + badge */}
                      <button
                        onClick={() => handleToggleActive(c.id, c.is_active)}
                        disabled={toggling === c.id}
                        title={c.is_active ? 'Click para desactivar' : 'Click para activar'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: 'none', border: 'none', cursor: toggling === c.id ? 'wait' : 'pointer',
                          padding: 0,
                        }}
                      >
                        {/* Toggle pill */}
                        <div style={{
                          width: 36, height: 20, borderRadius: 10,
                          background: c.is_active ? '#22c55e' : '#d1d5db',
                          position: 'relative', transition: 'background 0.2s',
                          flexShrink: 0, opacity: toggling === c.id ? 0.5 : 1,
                        }}>
                          <div style={{
                            position: 'absolute', top: 2, left: c.is_active ? 18 : 2,
                            width: 16, height: 16, borderRadius: '50%', background: '#fff',
                            transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }} />
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: c.is_active ? '#16A34A' : '#DC2626',
                        }}>
                          {c.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </button>
                    </td>
                    <td style={{ padding:'8px 12px', color:'#9CA3AF', fontSize:12, whiteSpace:'nowrap' }}>{formatDate(c.created_at)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      <div style={{ marginTop:10, fontSize:12, color:'#9CA3AF', textAlign:'right' }}>
        Mostrando {filtered.length} de {total} clientes
      </div>
    </ModalWrapper>
  );
}
