export type PlayType = 'directo' | 'pale' | 'tripleta' | 'cash3' | 'play4' | 'pick5' | 'super-pale';
export type TicketStatus = 'pending' | 'winner' | 'loser' | 'cancelled';
export type LotteryType = 'regular' | 'super-pale';

export interface Lottery {
  id: string;
  name: string;
  schedule: string;
  type: LotteryType;
  color: string;
}

export interface Play {
  id: string;
  numbers: string;
  amount: number;
  type: PlayType;
  lotteryId: string;
  lotteryName: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  plays: Play[];
  totalAmount: number;
  status: TicketStatus;
  createdAt: string;
  vendorId: string;
  vendorName: string;
}

export interface Schedule {
  lotteryId: string;
  lotteryName: string;
  closingTime: string;
}
