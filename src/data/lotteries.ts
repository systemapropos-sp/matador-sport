import type { Lottery } from '@/types';

export const lotteries: Lottery[] = [
  // Regular lotteries
  { id: 'anguila-10am', icon: '/logo-anguila.png', name: 'Anguila 10AM', schedule: '10:00 AM', type: 'regular', color: '#FFD54F' },
  { id: 'la-primera', icon: '/logo-la-primera.png', name: 'LA PRIMERA', schedule: '12:00 PM', type: 'regular', color: '#F48FB1' },
  { id: 'lotedom', icon: '/logo-lotedom.png', name: 'LOTEDOM', schedule: '1:30 PM', type: 'regular', color: '#81D4FA' },
  { id: 'la-suerte', icon: '/logo-la-suerte.png', name: 'LA SUERTE', schedule: '12:30 PM', type: 'regular', color: '#A5D6A7' },
  { id: 'king-lottery-am', icon: '/logo-king.png', name: 'King Lottery AM', schedule: '12:30 PM', type: 'regular', color: '#FFD54F' },
  { id: 'quiniela-real', icon: '/logo-real.png', name: 'QUINIELA REAL', schedule: '2:00 PM', type: 'regular', color: '#CE93D8' },
  { id: 'anguila-1pm', icon: '/logo-anguila.png', name: 'Anguila 1PM', schedule: '1:00 PM', type: 'regular', color: '#FFD54F' },
  { id: 'gana-mas', icon: '/logo-ganamas.png', name: 'GANA MAS', schedule: '6:00 PM', type: 'regular', color: '#FF8A65' },
  { id: 'florida-am', name: 'FLORIDA AM', schedule: '1:30 PM', type: 'regular', icon: '/florida-icon.png', color: '#4FC3F7' },
  { id: 'newyork-am', name: 'NEW YORK AM', schedule: '2:30 PM', type: 'regular', icon: '/newyork-icon.png', color: '#42A5F5' },
  { id: 'anguila-6pm', icon: '/logo-anguila.png', name: 'Anguila 6PM', schedule: '6:00 PM', type: 'regular', color: '#FFD54F' },
  { id: 'la-suerte-6pm', icon: '/logo-la-suerte.png', name: 'LA SUERTE 6PM', schedule: '6:00 PM', type: 'regular', color: '#A5D6A7' },
  { id: 'king-lottery-pm', icon: '/logo-king.png', name: 'King Lottery PM', schedule: '7:30 PM', type: 'regular', color: '#FFD54F' },
  { id: 'loteca', icon: '/logo-loteka.png', name: 'LOTECA', schedule: '7:00 PM', type: 'regular', color: '#81C784' },
  { id: 'la-primera-7pm', icon: '/logo-la-primera.png', name: 'LA PRIMERA 7PM', schedule: '7:00 PM', type: 'regular', color: '#F48FB1' },
  { id: 'nacional', icon: '/logo-nacional.png', name: 'NACIONAL', schedule: '2:00 PM', type: 'regular', color: '#4CAF50' },
  { id: 'quiniela-pale', icon: '/logo-real.png', name: 'QUINIELA PALE', schedule: '2:30 PM', type: 'regular', color: '#CE93D8' },
  { id: 'anguila-9pm', icon: '/logo-anguila.png', name: 'Anguila 9PM', schedule: '9:00 PM', type: 'regular', color: '#FFD54F' },
  { id: 'florida-pm', name: 'FLORIDA PM', schedule: '9:30 PM', type: 'regular', icon: '/florida-icon.png', color: '#4FC3F7' },
  { id: 'newyork-pm', name: 'NEW YORK PM', schedule: '10:30 PM', type: 'regular', icon: '/newyork-icon.png', color: '#42A5F5' },
  // Super Pale lotteries
  { id: 'super-pale-real-ganamas', name: 'SUPER PALE REAL-GANA MAS', schedule: '6:00 PM', type: 'super-pale', color: '#FF8A65' },
  { id: 'super-pale-ny-ganamas', name: 'SUPER PALE NY-GANA MAS', schedule: '10:30 PM', type: 'super-pale', color: '#FFB74D' },
  { id: 'super-pale-nacional-qp', name: 'SUPER PALE NACIONAL-QP', schedule: '2:30 PM', type: 'super-pale', color: '#F0AD4E' },
  { id: 'super-pale-ny-nacional', name: 'SUPER PALE NY-NACIONAL', schedule: '10:30 PM', type: 'super-pale', color: '#FFAB91' },
];

export const regularLotteries = lotteries.filter((l) => l.type === 'regular');
export const superPaleLotteries = lotteries.filter((l) => l.type === 'super-pale');

export const getLotteryById = (id: string): Lottery | undefined =>
  lotteries.find((l) => l.id === id);
