import { motion } from 'framer-motion';
import { Printer } from 'lucide-react';
import { mockResults } from '@/data/mockResults';
import { getLotteryColor } from '@/data/lotteryColors';
import { lotteryOptions } from '@/pages/PlayMonitor';

interface ResultsPanelProps {
  isOpen: boolean;
}

/* ------------------------------------------------------------------ */
/*  Period grouping for results                                        */
/* ------------------------------------------------------------------ */

const periodLabels: Record<string, string> = {
  AM: 'Manana (AM)',
  PM: 'Tarde (PM)',
  Evening: 'Noche (Evening)',
  Night: 'Noche (Night)',
};

function getLotteryPeriod(lotteryId: string): string {
  const option = lotteryOptions.find((l) => l.id === lotteryId);
  return option?.period || 'AM';
}

/* ------------------------------------------------------------------ */
/*  Logo component (first 2 letters)                                   */
/* ------------------------------------------------------------------ */

function LotteryLogo({ lotteryId, name }: { lotteryId: string; name: string }) {
  const colors = getLotteryColor(lotteryId);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: colors.logoBg,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result card                                                        */
/* ------------------------------------------------------------------ */

function ResultCard({ result }: { result: typeof mockResults[0] }) {
  const colors = getLotteryColor(result.lotteryId);

  return (
    <div
      key={result.lotteryId}
      className="rounded-md overflow-hidden"
      style={{
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        border: `1px solid ${colors.border}33`,
        borderLeftWidth: '4px',
      }}
    >
      {/* Header with logo */}
      <div
        className="flex items-center gap-2"
        style={{
          padding: '8px 10px',
          borderBottom: `1px solid ${colors.border}33`,
        }}
      >
        <LotteryLogo lotteryId={result.lotteryId} name={result.lotteryName} />
        <h4
          className="font-semibold truncate"
          style={{ fontSize: '12px', color: colors.text }}
        >
          {result.lotteryName}
        </h4>
      </div>

      {/* Numbers grid */}
      <div
        className="grid gap-1"
        style={{
          padding: '8px',
          gridTemplateColumns: result.tercera ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
        }}
      >
        <div className="text-center">
          <div style={{ fontSize: '10px', color: '#777777', textTransform: 'uppercase' }}>
            1era
          </div>
          <div
            className="font-bold"
            style={{ fontSize: '14px', color: '#333333' }}
          >
            {result.primera}
          </div>
        </div>
        <div className="text-center">
          <div style={{ fontSize: '10px', color: '#777777', textTransform: 'uppercase' }}>
            2da
          </div>
          <div
            className="font-bold"
            style={{ fontSize: '14px', color: '#333333' }}
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
              className="font-bold"
              style={{ fontSize: '14px', color: '#333333' }}
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
              className="font-bold"
              style={{ fontSize: '13px', color: '#333333' }}
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
              className="font-bold"
              style={{ fontSize: '13px', color: '#333333' }}
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
              className="font-bold"
              style={{ fontSize: '13px', color: '#333333' }}
            >
              {result.pick5}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ResultsPanel({ isOpen }: ResultsPanelProps) {
  if (!isOpen) return null;

  /* Group results by time period */
  const grouped: Record<string, typeof mockResults> = {};
  mockResults.forEach((result) => {
    const period = getLotteryPeriod(result.lotteryId);
    if (!grouped[period]) grouped[period] = [];
    grouped[period].push(result);
  });

  const periods = ['AM', 'PM', 'Evening', 'Night'];

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
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-gray-200"
        style={{ backgroundColor: '#f5f5f5' }}
      >
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

      {/* Results grouped by period */}
      <div className="p-4">
        {periods.map((period) => {
          const results = grouped[period];
          if (!results || results.length === 0) return null;

          return (
            <div key={period} className="mb-4">
              {/* Period header */}
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#555555',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                  padding: '4px 8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                }}
              >
                {periodLabels[period]}
              </div>
              {/* Results grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {results.map((result) => (
                  <ResultCard key={result.lotteryId} result={result} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
