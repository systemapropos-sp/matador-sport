import type { Lottery } from '@/types';

export const lotteries: Lottery[] = [
  // Regular lotteries
  { id: 'anguila-10am', name: 'Anguila 10AM', schedule: '10:00 AM', type: 'regular' },
  { id: 'la-primera', name: 'LA PRIMERA', schedule: '12:00 PM', type: 'regular' },
  { id: 'lotedom', name: 'LOTEDOM', schedule: '1:30 PM', type: 'regular' },
  { id: 'la-suerte', name: 'LA SUERTE', schedule: '12:30 PM', type: 'regular' },
  { id: 'king-lottery-am', name: 'King Lottery AM', schedule: '12:30 PM', type: 'regular' },
  { id: 'quiniela-real', name: 'QUINIELA REAL', schedule: '2:00 PM', type: 'regular' },
  { id: 'anguila-1pm', name: 'Anguila 1PM', schedule: '1:00 PM', type: 'regular' },
  { id: 'gana-mas', name: 'GANA MAS', schedule: '6:00 PM', type: 'regular' },
  { id: 'florida-am', name: 'FLORIDA AM', schedule: '1:30 PM', type: 'regular', icon: '/florida-icon.png' },
  { id: 'newyork-am', name: 'NEW YORK AM', schedule: '2:30 PM', type: 'regular', icon: '/newyork-icon.png' },
  { id: 'anguila-6pm', name: 'Anguila 6PM', schedule: '6:00 PM', type: 'regular' },
  { id: 'la-suerte-6pm', name: 'LA SUERTE 6PM', schedule: '6:00 PM', type: 'regular' },
  { id: 'king-lottery-pm', name: 'King Lottery PM', schedule: '7:30 PM', type: 'regular' },
  { id: 'loteca', name: 'LOTECA', schedule: '7:00 PM', type: 'regular' },
  { id: 'la-primera-7pm', name: 'LA PRIMERA 7PM', schedule: '7:00 PM', type: 'regular' },
  { id: 'nacional', name: 'NACIONAL', schedule: '2:00 PM', type: 'regular' },
  { id: 'quiniela-pale', name: 'QUINIELA PALE', schedule: '2:30 PM', type: 'regular' },
  { id: 'anguila-9pm', name: 'Anguila 9PM', schedule: '9:00 PM', type: 'regular' },
  { id: 'florida-pm', name: 'FLORIDA PM', schedule: '9:30 PM', type: 'regular', icon: '/florida-icon.png' },
  { id: 'newyork-pm', name: 'NEW YORK PM', schedule: '10:30 PM', type: 'regular', icon: '/newyork-icon.png' },
  // Super Pale lotteries
  { id: 'super-pale-real-ganamas', name: 'SUPER PALE REAL-GANA MAS', schedule: '6:00 PM', type: 'super-pale' },
  { id: 'super-pale-ny-ganamas', name: 'SUPER PALE NY-GANA MAS', schedule: '10:30 PM', type: 'super-pale' },
  { id: 'super-pale-nacional-qp', name: 'SUPER PALE NACIONAL-QP', schedule: '2:30 PM', type: 'super-pale' },
  { id: 'super-pale-ny-nacional', name: 'SUPER PALE NY-NACIONAL', schedule: '10:30 PM', type: 'super-pale' },
];

export const regularLotteries = lotteries.filter((l) => l.type === 'regular');
export const superPaleLotteries = lotteries.filter((l) => l.type === 'super-pale');

export const getLotteryById = (id: string): Lottery | undefined =>
  lotteries.find((l) => l.id === id);
