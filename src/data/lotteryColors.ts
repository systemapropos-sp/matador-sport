/**
 * Lottery brand colors for dynamic theming
 */

export const lotteryColors: Record<string, string> = {
  'anguila-10am': '#FFD54F',
  'anguila-1pm': '#FFD54F',
  'anguila-6pm': '#FFD54F',
  'anguila-9pm': '#FFD54F',
  'la-primera': '#F06292',
  'la-primera-7pm': '#F06292',
  'lotedom': '#4FC3F7',
  'la-suerte': '#AED581',
  'la-suerte-6pm': '#AED581',
  'king-lottery-am': '#FFD700',
  'king-lottery-pm': '#FFD700',
  'quiniela-real': '#CE93D8',
  'quiniela-pale': '#CE93D8',
  'gana-mas': '#FF7043',
  'florida-am': '#4FC3F7',
  'florida-pm': '#4FC3F7',
  'newyork-am': '#42A5F5',
  'newyork-pm': '#42A5F5',
  'nacional': '#4CAF50',
  'loteca': '#AB47BC',
  'super-pale-real-ganamas': '#FF8A65',
  'super-pale-ny-ganamas': '#FF8A65',
  'super-pale-nacional-qp': '#FF8A65',
  'super-pale-ny-nacional': '#FF8A65',
};

export function getLotteryColor(lotteryId: string): string {
  return lotteryColors[lotteryId] || '#5cb85c';
}

export function getLotteryInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}
