import type { Schedule } from '@/types';

export const schedules: Schedule[] = [
  { lotteryId: 'anguila-10am', lotteryName: 'Anguila 10AM', closingTime: '09:45' },
  { lotteryId: 'la-primera', lotteryName: 'LA PRIMERA', closingTime: '11:15' },
  { lotteryId: 'lotedom', lotteryName: 'LOTEDOM', closingTime: '11:40' },
  { lotteryId: 'la-suerte', lotteryName: 'LA SUERTE', closingTime: '11:40' },
  { lotteryId: 'king-lottery-am', lotteryName: 'King Lottery AM', closingTime: '10:45' },
  { lotteryId: 'quiniela-real', lotteryName: 'QUINIELA REAL', closingTime: '11:40' },
  { lotteryId: 'anguila-1pm', lotteryName: 'Anguila 1PM', closingTime: '12:45' },
  { lotteryId: 'super-pale-real-gana', lotteryName: 'SUPER PALE REAL-GANA MAS', closingTime: '13:45' },
  { lotteryId: 'gana-mas', lotteryName: 'GANA MAS', closingTime: '14:15' },
  { lotteryId: 'super-pale-ny-gana', lotteryName: 'SUPER PALE NY-GANA MAS', closingTime: '14:15' },
  { lotteryId: 'florida-am', lotteryName: 'FLORIDA AM', closingTime: '13:15' },
  { lotteryId: 'new-york-am', lotteryName: 'NEW YORK AM', closingTime: '14:15' },
  { lotteryId: 'anguila-6pm', lotteryName: 'Anguila 6PM', closingTime: '17:45' },
  { lotteryId: 'la-suerte-6pm', lotteryName: 'LA SUERTE 6PM', closingTime: '17:45' },
  { lotteryId: 'king-lottery-pm', lotteryName: 'King Lottery PM', closingTime: '17:45' },
  { lotteryId: 'loteca', lotteryName: 'LOTECA', closingTime: '17:45' },
  { lotteryId: 'la-primera-7pm', lotteryName: 'LA PRIMERA 7PM', closingTime: '18:45' },
  { lotteryId: 'nacional', lotteryName: 'NACIONAL', closingTime: '18:45' },
  { lotteryId: 'quiniela-pale', lotteryName: 'QUINIELA PALE', closingTime: '18:45' },
  { lotteryId: 'super-pale-nacional-qp', lotteryName: 'SUPER PALE NACIONAL-QP', closingTime: '19:15' },
  { lotteryId: 'super-pale-ny-nacional', lotteryName: 'SUPER PALE NY-NACIONAL', closingTime: '20:15' },
  { lotteryId: 'anguila-9pm', lotteryName: 'Anguila 9PM', closingTime: '20:45' },
  { lotteryId: 'florida-pm', lotteryName: 'FLORIDA PM', closingTime: '21:30' },
  { lotteryId: 'new-york-pm', lotteryName: 'NEW YORK PM', closingTime: '22:15' },
];

export function getScheduleByLotteryId(lotteryId: string): Schedule | undefined {
  return schedules.find(s => s.lotteryId === lotteryId);
}
