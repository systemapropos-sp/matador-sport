export type PlayType = 'directo' | 'pale' | 'tripleta' | 'cash3' | 'play4' | 'pick5' | 'super-pale';

export type TicketStatus = 'pending' | 'winner' | 'loser' | 'cancelled';

export type LotteryType = 'regular' | 'super-pale' | 'pick345';

export interface Lottery {
  id: string;
  name: string;
  schedule: string;
  type: LotteryType;
  icon?: string;
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
  createdAt: Date;
  vendorId: string;
  vendorName: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'vendor' | 'admin' | 'supervisor';
  branchId: string;
}

export interface Result {
  lotteryId: string;
  lotteryName: string;
  date: string;
  primera: string;
  segunda: string;
  tercera?: string;
  pick3?: string;
  pick4?: string;
  pick5?: string;
}

export interface Schedule {
  lotteryId: string;
  lotteryName: string;
  closingTime: string;
  isOpen: boolean;
}
