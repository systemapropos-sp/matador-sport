export interface LotteryResult {
  lotteryId: string;
  lotteryName: string;
  primera: string;
  segunda: string;
  tercera: string;
  pick3?: string;
  pick4?: string;
  pick5?: string;
  date: string;
}

export const mockResults: LotteryResult[] = [
  {
    lotteryId: 'anguila-10am',
    lotteryName: 'Anguila 10AM',
    primera: '25', segunda: '08', tercera: '91',
    date: '2026-01-15',
  },
  {
    lotteryId: 'la-primera',
    lotteryName: 'LA PRIMERA',
    primera: '42', segunda: '17', tercera: '63',
    date: '2026-01-15',
  },
  {
    lotteryId: 'lotedom',
    lotteryName: 'LOTEDOM',
    primera: '11', segunda: '55', tercera: '39',
    date: '2026-01-15',
  },
  {
    lotteryId: 'la-suerte',
    lotteryName: 'LA SUERTE',
    primera: '77', segunda: '22', tercera: '04',
    date: '2026-01-15',
  },
  {
    lotteryId: 'king-lottery-am',
    lotteryName: 'King Lottery AM',
    primera: '33', segunda: '66', tercera: '99',
    pick3: '366', pick4: '3369', pick5: '33699',
    date: '2026-01-15',
  },
  {
    lotteryId: 'quiniela-real',
    lotteryName: 'QUINIELA REAL',
    primera: '18', segunda: '81', tercera: '27',
    date: '2026-01-15',
  },
  {
    lotteryId: 'anguila-1pm',
    lotteryName: 'Anguila 1PM',
    primera: '05', segunda: '50', tercera: '95',
    date: '2026-01-15',
  },
  {
    lotteryId: 'gana-mas',
    lotteryName: 'GANA MAS',
    primera: '71', segunda: '36', tercera: '48',
    date: '2026-01-15',
  },
  {
    lotteryId: 'florida-am',
    lotteryName: 'FLORIDA AM',
    primera: '12', segunda: '67', tercera: '83',
    pick3: '267', pick4: '1267',
    date: '2026-01-15',
  },
  {
    lotteryId: 'new-york-am',
    lotteryName: 'NEW YORK AM',
    primera: '29', segunda: '94', tercera: '56',
    pick3: '294', pick4: '2945',
    date: '2026-01-15',
  },
  {
    lotteryId: 'anguila-6pm',
    lotteryName: 'Anguila 6PM',
    primera: '61', segunda: '16', tercera: '72',
    date: '2026-01-15',
  },
  {
    lotteryId: 'la-suerte-6pm',
    lotteryName: 'LA SUERTE 6PM',
    primera: '38', segunda: '85', tercera: '47',
    date: '2026-01-15',
  },
  {
    lotteryId: 'king-lottery-pm',
    lotteryName: 'King Lottery PM',
    primera: '52', segunda: '19', tercera: '73',
    pick3: '519', pick4: '5197', pick5: '51973',
    date: '2026-01-15',
  },
  {
    lotteryId: 'loteca',
    lotteryName: 'LOTECA',
    primera: '44', segunda: '88', tercera: '13',
    date: '2026-01-15',
  },
  {
    lotteryId: 'la-primera-7pm',
    lotteryName: 'LA PRIMERA 7PM',
    primera: '06', segunda: '60', tercera: '31',
    date: '2026-01-15',
  },
  {
    lotteryId: 'nacional',
    lotteryName: 'NACIONAL',
    primera: '89', segunda: '98', tercera: '45',
    date: '2026-01-15',
  },
  {
    lotteryId: 'quiniela-pale',
    lotteryName: 'QUINIELA PALE',
    primera: '23', segunda: '32', tercera: '78',
    date: '2026-01-15',
  },
  {
    lotteryId: 'anguila-9pm',
    lotteryName: 'Anguila 9PM',
    primera: '57', segunda: '75', tercera: '14',
    date: '2026-01-15',
  },
  {
    lotteryId: 'florida-pm',
    lotteryName: 'FLORIDA PM',
    primera: '03', segunda: '30', tercera: '68',
    pick3: '330', pick4: '0330',
    date: '2026-01-15',
  },
  {
    lotteryId: 'new-york-pm',
    lotteryName: 'NEW YORK PM',
    primera: '90', segunda: '09', tercera: '21',
    pick3: '009', pick4: '0092',
    date: '2026-01-15',
  },
];

export function getResultByLotteryId(lotteryId: string): LotteryResult | undefined {
  return mockResults.find(r => r.lotteryId === lotteryId);
}
