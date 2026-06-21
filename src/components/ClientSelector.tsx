import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Users, ChevronDown } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone?: string;
}

interface ClientSelectorProps {
  onSelect: (clientId: string) => void;
  selectedClient: string;
}

export default function ClientSelector({ onSelect, selectedClient }: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('matador_clients');
      if (stored) setClients(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest('[data-cs-drop]') && !t.closest('[data-cs-btn]')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(v => !v);
    setSearch('');
  };

  const filtered = search.trim()
    ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search)))
    : clients;

  const selectedName = clients.find((c) => c.id === selectedClient)?.name;

  return (
    <>
      <motion.button
        ref={btnRef}
        data-cs-btn
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleToggle}
        className="flex items-center gap-1 rounded border transition-colors flex-shrink-0"
        style={{
          padding: '14px 16px',
          fontSize: '13px',
          color: selectedName ? '#333' : '#999',
          borderColor: open ? '#0D9488' : '#cccccc',
          backgroundColor: open ? '#f0fffe' : '#ffffff',
          minHeight: '55px',
          fontWeight: selectedName ? 600 : 400,
          whiteSpace: 'nowrap',
        }}
      >
        <Users size={16} />
        <span>{selectedName || 'Cliente'}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} />
        </motion.span>
      </motion.button>

      {open && createPortal(
        <motion.div
          data-cs-drop
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.14 }}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            width: '265px',
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '10px',
            boxShadow: '0 10px 32px rgba(0,0,0,0.18)',
            overflow: 'hidden',
          }}
        >
          {/* Search */}
          <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              autoFocus
              style={{
                width: '100%', padding: '7px 10px', borderRadius: '6px',
                border: '1px solid #e0e0e0', fontSize: '12px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {/* List */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            <button
              style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '12px', color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
              onClick={() => { onSelect(''); setOpen(false); }}
            >
              Ninguno
            </button>
            {filtered.length === 0 ? (
              <div style={{ padding: '14px', textAlign: 'center', fontSize: '12px', color: '#bbb' }}>No encontrado</div>
            ) : filtered.map((c) => (
              <button
                key={c.id}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '12px',
                  color: '#333', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  borderTop: '1px solid #f8f8f8',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                onClick={() => { onSelect(c.id); setOpen(false); }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#0D9488',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  {c.phone && <span style={{ fontSize: '10px', color: '#888' }}>{c.phone}</span>}
                </div>
              </button>
            ))}
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
}
