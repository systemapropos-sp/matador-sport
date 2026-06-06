import { motion } from 'framer-motion';
import { Printer } from 'lucide-react';
import { mockResults } from '@/data/mockResults';

interface ResultsPanelProps {
  isOpen: boolean;
}

export default function ResultsPanel({ isOpen }: ResultsPanelProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed left-0 right-0 bg-white overflow-y-auto"
      style={{
        top: '50px',
        maxHeight: '70vh',
        borderBottom: '2px solid #cccccc',
        zIndex: 40,
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700" style={{ fontSize: '14px' }}>
          Resultados de Hoy
        </h3>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          style={{ fontSize: '12px' }}
        >
          <Printer size={14} />
          Imprimir
        </button>
      </div>

      {/* Results grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {mockResults.map((result) => (
          <div
            key={result.lotteryId}
            className="border border-gray-200 rounded p-2.5"
            style={{ backgroundColor: '#fafafa' }}
          >
            <h4
              className="font-semibold text-gray-800 mb-2 truncate"
              style={{ fontSize: '12px' }}
            >
              {result.lotteryName}
            </h4>
            <div className="grid grid-cols-2 gap-1">
              <div className="text-center">
                <div style={{ fontSize: '10px', color: '#777777', textTransform: 'uppercase' }}>
                  1era
                </div>
                <div
                  className="font-bold text-gray-800"
                  style={{ fontSize: '13px' }}
                >
                  {result.primera}
                </div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '10px', color: '#777777', textTransform: 'uppercase' }}>
                  2da
                </div>
                <div
                  className="font-bold text-gray-800"
                  style={{ fontSize: '13px' }}
                >
                  {result.segunda}
                </div>
              </div>
              {result.tercera && (
                <div className="text-center">
                  <div style={{ fontSize: '10px', color: '#777777', textTransform: 'uppercase' }}>
                    3era
                  </div>
                  <div
                    className="font-bold text-gray-800"
                    style={{ fontSize: '13px' }}
                  >
                    {result.tercera}
                  </div>
                </div>
              )}
              {result.pick3 && (
                <div className="text-center">
                  <div style={{ fontSize: '10px', color: '#777777', textTransform: 'uppercase' }}>
                    Pick 3
                  </div>
                  <div
                    className="font-bold text-gray-800"
                    style={{ fontSize: '13px' }}
                  >
                    {result.pick3}
                  </div>
                </div>
              )}
              {result.pick4 && (
                <div className="text-center">
                  <div style={{ fontSize: '10px', color: '#777777', textTransform: 'uppercase' }}>
                    Pick 4
                  </div>
                  <div
                    className="font-bold text-gray-800"
                    style={{ fontSize: '13px' }}
                  >
                    {result.pick4}
                  </div>
                </div>
              )}
              {result.pick5 && (
                <div className="text-center">
                  <div style={{ fontSize: '10px', color: '#777777', textTransform: 'uppercase' }}>
                    Pick 5
                  </div>
                  <div
                    className="font-bold text-gray-800"
                    style={{ fontSize: '13px' }}
                  >
                    {result.pick5}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
