import type { Schedule } from '@/types';

export const schedules: Schedule[] = [
  { lotteryId: 'anguila-10am', lotteryName: 'Anguila 10AM', closingTime: '09:45 AM', isOpen: true },
  { lotteryId: 'la-primera', lotteryName: 'LA PRIMERA', closingTime: '11:30 AM', isOpen: true },
  { lotteryId: 'lotedom', lotteryName: 'LOTEDOM', closingTime: '01:00 PM', isOpen: true },
  { lotteryId: 'la-suerte', lotteryName: 'LA SUERTE', closingTime: '12:00 PM', isOpen: true },
  { lotteryId: 'king-lottery-am', lotteryName: 'King Lottery AM', closingTime: '12:00 PM', isOpen: true },
  { lotteryId: 'quiniela-real', lotteryName: 'QUINIELA REAL', closingTime: '01:30 PM', isOpen: true },
  { lotteryId: 'anguila-1pm', lotteryName: 'Anguila 1PM', closingTime: '12:30 PM', isOpen: true },
  { lotteryId: 'gana-mas', lotteryName: 'GANA MAS', closingTime: '05:30 PM', isOpen: true },
  { lotteryId: 'florida-am', lotteryName: 'FLORIDA AM', closingTime: '01:00 PM', isOpen: true },
  { lotteryId: 'newyork-am', lotteryName: 'NEW YORK AM', closingTime: '02:00 PM', isOpen: true },
  { lotteryId: 'anguila-6pm', lotteryName: 'Anguila 6PM', closingTime: '05:30 PM', isOpen: true },
  { lotteryId: 'la-suerte-6pm', lotteryName: 'LA SUERTE 6PM', closingTime: '05:30 PM', isOpen: true },
  { lotteryId: 'king-lottery-pm', lotteryName: 'King Lottery PM', closingTime: '07:00 PM', isOpen: true },
  { lotteryId: 'loteca', lotteryName: 'LOTECA', closingTime: '06:30 PM', isOpen: true },
  { lotteryId: 'la-primera-7pm', lotteryName: 'LA PRIMERA 7PM', closingTime: '06:30 PM', isOpen: true },
  { lotteryId: 'nacional', lotteryName: 'NACIONAL', closingTime: '01:30 PM', isOpen: true },
  { lotteryId: 'quiniela-pale', lotteryName: 'QUINIELA PALE', closingTime: '02:00 PM', isOpen: true },
  { lotteryId: 'anguila-9pm', lotteryName: 'Anguila 9PM', closingTime: '08:30 PM', isOpen: true },
  { lotteryId: 'florida-pm', lotteryName: 'FLORIDA PM', closingTime: '09:00 PM', isOpen: true },
  { lotteryId: 'newyork-pm', lotteryName: 'NEW YORK PM', closingTime: '10:00 PM', isOpen: true },
  { lotteryId: 'super-pale-real-ganamas', lotteryName: 'SUPER PALE REAL-GANA MAS', closingTime: '05:30 PM', isOpen: true },
  { lotteryId: 'super-pale-ny-ganamas', lotteryName: 'SUPER PALE NY-GANA MAS', closingTime: '10:00 PM', isOpen: true },
  { lotteryId: 'super-pale-nacional-qp', lotteryName: 'SUPER PALE NACIONAL-QP', closingTime: '02:00 PM', isOpen: true },
  { lotteryId: 'super-pale-ny-nacional', lotteryName: 'SUPER PALE NY-NACIONAL', closingTime: '10:00 PM', isOpen: true },
];

export const getScheduleByLotteryId = (lotteryId: string): Schedule | undefined =>
  schedules.find((s) => s.lotteryId === lotteryId);
