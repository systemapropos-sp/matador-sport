import { useState } from 'react';
import Layout from '@/components/Layout';

export default function Dashboard() {
  const [jugada, setJugada] = useState('');
  const [monto, setMonto] = useState('');

  return (
    <Layout>
      <div className="p-4">
        {/* Lottery selector placeholder */}
        <div className="mb-4 p-3 bg-gray-100 rounded text-center text-gray-500" style={{ fontSize: '13px' }}>
          [Lottery Selector - To be implemented by dashboard agent]
        </div>

        {/* Action bar placeholder */}
        <div className="mb-4 p-3 bg-gray-100 rounded text-center text-gray-500" style={{ fontSize: '13px' }}>
          [Action Button Bar - To be implemented by dashboard agent]
        </div>

        {/* Main input area */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">JUGADA</label>
            <input
              type="text"
              value={jugada}
              onChange={(e) => setJugada(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-center font-semibold"
              style={{ fontSize: '24px', height: '48px' }}
              placeholder="00"
            />
          </div>
          <div className="w-16">
            <label className="block text-xs text-gray-500 mb-1">N/A</label>
            <div className="w-full h-12 bg-gray-200 rounded" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">MONTO</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-center font-semibold"
              style={{ fontSize: '18px', height: '48px' }}
              placeholder="$0.00"
            />
          </div>
        </div>

        {/* Ticket dropdown placeholder */}
        <div className="mb-4 p-3 bg-gray-100 rounded text-center text-gray-500" style={{ fontSize: '13px' }}>
          [Ticket Dropdown - To be implemented by dashboard agent]
        </div>

        {/* Stats bar */}
        <div className="flex justify-between items-center p-3 bg-gray-800 text-white rounded mb-4">
          <span style={{ fontSize: '13px' }}>Jugadas: 0</span>
          <span style={{ fontSize: '13px' }}>Total $0.00</span>
        </div>

        {/* Tables placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 rounded text-center text-gray-500" style={{ fontSize: '13px' }}>
            [DIRECTO Table - To be implemented]
          </div>
          <div className="p-4 bg-gray-100 rounded text-center text-gray-500" style={{ fontSize: '13px' }}>
            [PALE & TRIPLETA Table - To be implemented]
          </div>
          <div className="p-4 bg-gray-100 rounded text-center text-gray-500" style={{ fontSize: '13px' }}>
            [CASH 3 Table - To be implemented]
          </div>
          <div className="p-4 bg-gray-100 rounded text-center text-gray-500" style={{ fontSize: '13px' }}>
            [PLAY 4 & PICK 5 Table - To be implemented]
          </div>
        </div>
      </div>
    </Layout>
  );
}
