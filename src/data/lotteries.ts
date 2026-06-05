import type { Lottery } from '@/types';

export const lotteries: Lottery[] = [
  { id: 'anguila-10am', name: 'Anguila 10AM', schedule: '10:00 AM', type: 'regular', color: '#FFD54F' },
  { id: 'la-primera', name: 'LA PRIMERA', schedule: '11:30 AM', type: 'regular', color: '#F06292' },
  { id: 'lotedom', name: 'LOTEDOM', schedule: '11:55 AM', type: 'regular', color: '#4FC3F7' },
  { id: 'la-suerte', name: 'LA SUERTE', schedule: '11:55 AM', type: 'regular', color: '#AED581' },
  { id: 'king-lottery-am', name: 'King Lottery AM', schedule: '11:00 AM', type: 'regular', color: '#FFD700' },
  { id: 'quiniela-real', name: 'QUINIELA REAL', schedule: '11:55 AM', type: 'regular', color: '#CE93D8' },
  { id: 'anguila-1pm', name: 'Anguila 1PM', schedule: '1:00 PM', type: 'regular', color: '#FFD54F' },
  { id: 'super-pale-real-gana', name: 'SUPER PALE REAL-GANA MAS', schedule: '2:00 PM', type: 'super-pale', color: '#FF8A65' },
  { id: 'gana-mas', name: 'GANA MAS', schedule: '2:30 PM', type: 'regular', color: '#FF7043' },
  { id: 'super-pale-ny-gana', name: 'SUPER PALE NY-GANA MAS', schedule: '2:30 PM', type: 'super-pale', color: '#FFB74D' },
  { id: 'florida-am', name: 'FLORIDA AM', schedule: '1:30 PM', type: 'regular', color: '#4FC3F7' },
  { id: 'new-york-am', name: 'NEW YORK AM', schedule: '2:30 PM', type: 'regular', color: '#42A5F5' },
  { id: 'anguila-6pm', name: 'Anguila 6PM', schedule: '6:00 PM', type: 'regular', color: '#FFD54F' },
  { id: 'la-suerte-6pm', name: 'LA SUERTE 6PM', schedule: '6:00 PM', type: 'regular', color: '#AED581' },
  { id: 'king-lottery-pm', name: 'King Lottery PM', schedule: '6:00 PM', type: 'regular', color: '#FFD700' },
  { id: 'loteca', name: 'LOTECA', schedule: '6:00 PM', type: 'regular', color: '#81C784' },
  { id: 'la-primera-7pm', name: 'LA PRIMERA 7PM', schedule: '7:00 PM', type: 'regular', color: '#F06292' },
  { id: 'nacional', name: 'NACIONAL', schedule: '7:00 PM', type: 'regular', color: '#4CAF50' },
  { id: 'quiniela-pale', name: 'QUINIELA PALE', schedule: '7:00 PM', type: 'regular', color: '#BA68C8' },
  { id: 'super-pale-nacional-qp', name: 'SUPER PALE NACIONAL-QP', schedule: '7:30 PM', type: 'super-pale', color: '#F0AD4E' },
  { id: 'super-pale-ny-nacional', name: 'SUPER PALE NY-NACIONAL', schedule: '8:30 PM', type: 'super-pale', color: '#FFAB91' },
  { id: 'anguila-9pm', name: 'Anguila 9PM', schedule: '9:00 PM', type: 'regular', color: '#FFD54F' },
  { id: 'florida-pm', name: 'FLORIDA PM', schedule: '9:45 PM', type: 'regular', color: '#4FC3F7' },
  { id: 'new-york-pm', name: 'NEW YORK PM', schedule: '10:30 PM', type: 'regular', color: '#42A5F5' },
];

export const regularLotteries = lotteries.filter(l => l.type === 'regular');
export const superPaleLotteries = lotteries.filter(l => l.type === 'super-pale');

export function getLotteryById(id: string): Lottery | undefined {
  return lotteries.find(l => l.id === id);
}
