/**
 * Brand colors for each lottery - used in ResultsPanel and other components
 */
export const lotteryColors: Record<string, { bg: string; border: string; text: string; logoBg: string }> = {
  'anguila-10am': { bg: '#fff8e1', border: '#ffc107', text: '#333333', logoBg: '#ffc107' },
  'la-primera': { bg: '#e3f2fd', border: '#2196f3', text: '#333333', logoBg: '#2196f3' },
  'lotedom': { bg: '#e8f5e9', border: '#4caf50', text: '#333333', logoBg: '#4caf50' },
  'la-suerte': { bg: '#fce4ec', border: '#e91e63', text: '#333333', logoBg: '#e91e63' },
  'king-lottery-am': { bg: '#f3e5f5', border: '#9c27b0', text: '#333333', logoBg: '#9c27b0' },
  'quiniela-real': { bg: '#e0f2f1', border: '#009688', text: '#333333', logoBg: '#009688' },
  'anguila-1pm': { bg: '#fff8e1', border: '#ff9800', text: '#333333', logoBg: '#ff9800' },
  'gana-mas': { bg: '#e8eaf6', border: '#3f51b5', text: '#333333', logoBg: '#3f51b5' },
  'florida-am': { bg: '#e1f5fe', border: '#03a9f4', text: '#333333', logoBg: '#03a9f4' },
  'newyork-am': { bg: '#f1f8e9', border: '#8bc34a', text: '#333333', logoBg: '#8bc34a' },
  'anguila-6pm': { bg: '#fff3e0', border: '#ff5722', text: '#333333', logoBg: '#ff5722' },
  'la-suerte-6pm': { bg: '#fce4ec', border: '#ad1457', text: '#333333', logoBg: '#ad1457' },
  'king-lottery-pm': { bg: '#f3e5f5', border: '#7b1fa2', text: '#333333', logoBg: '#7b1fa2' },
  'loteca': { bg: '#e0f7fa', border: '#00bcd4', text: '#333333', logoBg: '#00bcd4' },
  'la-primera-7pm': { bg: '#e3f2fd', border: '#1565c0', text: '#333333', logoBg: '#1565c0' },
  'nacional': { bg: '#e8f5e9', border: '#2e7d32', text: '#333333', logoBg: '#2e7d32' },
  'quiniela-pale': { bg: '#e0f2f1', border: '#00796b', text: '#333333', logoBg: '#00796b' },
  'anguila-9pm': { bg: '#fff8e1', border: '#e65100', text: '#333333', logoBg: '#e65100' },
  'florida-pm': { bg: '#e1f5fe', border: '#0288d1', text: '#333333', logoBg: '#0288d1' },
  'newyork-pm': { bg: '#f1f8e9', border: '#558b2f', text: '#333333', logoBg: '#558b2f' },
  'super-pale-real-ganamas': { bg: '#f5f5f5', border: '#607d8b', text: '#333333', logoBg: '#607d8b' },
  'super-pale-ny-ganamas': { bg: '#f5f5f5', border: '#455a64', text: '#333333', logoBg: '#455a64' },
  'super-pale-nacional-qp': { bg: '#f5f5f5', border: '#37474f', text: '#333333', logoBg: '#37474f' },
  'super-pale-ny-nacional': { bg: '#f5f5f5', border: '#263238', text: '#333333', logoBg: '#263238' },
};

export function getLotteryColor(lotteryId: string) {
  return lotteryColors[lotteryId] || { bg: '#fafafa', border: '#cccccc', text: '#333333', logoBg: '#757575' };
}
