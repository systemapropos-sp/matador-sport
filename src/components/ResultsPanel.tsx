import { motion } from 'framer-motion';
import { Printer } from 'lucide-react';
import { mockResults } from '@/data/mockResults';
import { lotteryColors } from '@/data/lotteryColors';
import { getLotteryInitials } from '@/data/lotteryColors';

interface ResultsPanelProps {
  isOpen: boolean;
}

/* ------------------------------------------------------------------ */
/*  Period classification by schedule                                  */
/* ------------------------------------------------------------------ */

function getPeriodBySchedule(schedule: string): string {
  const hour = parseInt(schedule.split(':')[0], 10);
  const ampm = schedule.includes('PM') ? 'PM' : 'AM';
  if (ampm === 'AM' || hour < 12) return 'AM';
  if (hour >= 12 && hour < 6) return 'PM';
  if (hour >= 6 && hour < 9) return 'Evening';
  return 'Night';
}

const periodLabels: Record<string, string> = {
  AM: 'Manana (AM)',
  PM: 'Tarde (PM)',
  Evening: 'Noche (Evening)',
  Night: 'Noche (Night)',
};

/* Static schedule map derived from lotteries.ts */
const scheduleMap: Record<string, string> = {
  'anguila-10am': '10:00 AM',
  'la-primera': '12:00 PM',
  'lotedom': '1:30 PM',
  'la-suerte': '12:30 PM',
  'king-lottery-am': '12:30 PM',
  'quiniela-real': '2:00 PM',
  'anguila-1pm': '1:00 PM',
  'gana-mas': '6:00 PM',
  'florida-am': '1:30 PM',
  'newyork-am': '2:30 PM',
  'anguila-6pm': '6:00 PM',
  'la-suerte-6pm': '6:00 PM',
  'king-lottery-pm': '7:30 PM',
  'loteca': '7:00 PM',
  'la-primera-7pm': '7:00 PM',
  'nacional': '2:00 PM',
  'quiniela-pale': '2:30 PM',
  'anguila-9pm': '9:00 PM',
  'florida-pm': '9:30 PM',
  'newyork-pm': '10:30 PM',
  'super-pale-real-ganamas': '6:00 PM',
  'super-pale-ny-ganamas': '10:30 PM',
  'super-pale-nacional-qp': '2:30 PM',
  'super-pale-ny-nacional': '10:30 PM',
};

export default function ResultsPanel({ isOpen }: ResultsPanelProps) {
  if (!isOpen) return null;

  /* Group results by time period */
  const grouped = mockResults.map((r) => ({
    ...r,
    period: getPeriodBySchedule(scheduleMap[r.lotteryId] || '12:00 PM'),
  }));

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
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700" style={{ fontSize: '14px' }}>
          Resultados de Hoy
        </h3>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          style={{ fontSize: '12px' }}
          onClick={() => window.print()}
        >
          <Printer size={14} />
          Imprimir
        </button>
      </div>

      {/* Results grouped by period */}
      <div className="p-4">
        {periods.map((period) => {
          const periodResults = grouped.filter((r) => r.period === period);
          if (periodResults.length === 0) return null;

          return (
            <div key={period} className="mb-4">
              {/* Period header */}
              <div
                className="flex items-center gap-2 mb-3"
                style={{
                  borderBottom: '1px solid #e0e0e0',
                  paddingBottom: '6px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#5cb85c',
                  }}
                />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#555555',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {periodLabels[period] || period}
                </span>
              </div>

              {/* Results grid for this period */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {periodResults.map((result) => {
                  const color = lotteryColors[result.lotteryId] || '#5cb85c';
                  const initials = getLotteryInitials(result.lotteryName);

                  return (
                    <div
                      key={result.lotteryId}
                      className="border rounded p-2.5"
                      style={{
                        backgroundColor: '#fafafa',
                        borderColor: color,
                        borderLeftWidth: '4px',
                      }}
                    >
                      {/* Logo circle + Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="flex items-center justify-center rounded-full shrink-0"
                          style={{
                            width: '28px',
                            height: '28px',
                            backgroundColor: color,
                            fontSize: '9px',
                            fontWeight: 700,
                            color: '#ffffff',
                          }}
                        >
                          {initials}
                        </div>
                        <h4
                          className="font-semibold text-gray-800 truncate"
                          style={{ fontSize: '11px' }}
                        >
                          {result.lotteryName}
                        </h4>
                      </div>

                      {/* Numbers grid */}
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
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
