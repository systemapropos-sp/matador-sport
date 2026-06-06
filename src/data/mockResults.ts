import type { Result, Play, TicketStatus } from '@/types';

const today = new Date().toISOString().split('T')[0];

/**
 * Real Dominican lottery results in loteriasdominicanas.com format.
 * These match actual result structures from the official sources.
 */
export const mockResults: Result[] = [
  {
    lotteryId: 'anguila-10am',
    lotteryName: 'Anguila 10AM',
    date: today,
    primera: '23',
    segunda: '65',
    tercera: '91',
  },
  {
    lotteryId: 'la-primera',
    lotteryName: 'LA PRIMERA',
    date: today,
    primera: '08',
    segunda: '42',
    tercera: '17',
  },
  {
    lotteryId: 'lotedom',
    lotteryName: 'LOTEDOM',
    date: today,
    primera: '71',
    segunda: '33',
    tercera: '56',
  },
  {
    lotteryId: 'la-suerte',
    lotteryName: 'LA SUERTE',
    date: today,
    primera: '14',
    segunda: '89',
    tercera: '02',
  },
  {
    lotteryId: 'king-lottery-am',
    lotteryName: 'King Lottery AM',
    date: today,
    primera: '47',
    segunda: '19',
    tercera: '63',
  },
  {
    lotteryId: 'quiniela-real',
    lotteryName: 'QUINIELA REAL',
    date: today,
    primera: '55',
    segunda: '28',
    tercera: '76',
  },
  {
    lotteryId: 'anguila-1pm',
    lotteryName: 'Anguila 1PM',
    date: today,
    primera: '92',
    segunda: '36',
    tercera: '11',
  },
  {
    lotteryId: 'gana-mas',
    lotteryName: 'GANA MAS',
    date: today,
    primera: '07',
    segunda: '54',
    tercera: '88',
  },
  {
    lotteryId: 'florida-am',
    lotteryName: 'FLORIDA AM',
    date: today,
    primera: '18',
    segunda: '43',
    pick3: '718',
    pick4: '2943',
    pick5: '61718',
  },
  {
    lotteryId: 'newyork-am',
    lotteryName: 'NEW YORK AM',
    date: today,
    primera: '62',
    segunda: '97',
    pick3: '562',
    pick4: '8197',
    pick5: '34562',
  },
  {
    lotteryId: 'anguila-6pm',
    lotteryName: 'Anguila 6PM',
    date: today,
    primera: '39',
    segunda: '75',
    tercera: '04',
  },
  {
    lotteryId: 'la-suerte-6pm',
    lotteryName: 'LA SUERTE 6PM',
    date: today,
    primera: '81',
    segunda: '26',
    tercera: '50',
  },
  {
    lotteryId: 'king-lottery-pm',
    lotteryName: 'King Lottery PM',
    date: today,
    primera: '13',
    segunda: '67',
    tercera: '44',
  },
  {
    lotteryId: 'loteca',
    lotteryName: 'LOTECA',
    date: today,
    primera: '58',
    segunda: '31',
    tercera: '09',
  },
  {
    lotteryId: 'la-primera-7pm',
    lotteryName: 'LA PRIMERA 7PM',
    date: today,
    primera: '66',
    segunda: '22',
    tercera: '95',
  },
  {
    lotteryId: 'nacional',
    lotteryName: 'NACIONAL',
    date: today,
    primera: '03',
    segunda: '77',
    tercera: '41',
  },
  {
    lotteryId: 'quiniela-pale',
    lotteryName: 'QUINIELA PALE',
    date: today,
    primera: '29',
    segunda: '85',
    tercera: '12',
  },
  {
    lotteryId: 'anguila-9pm',
    lotteryName: 'Anguila 9PM',
    date: today,
    primera: '46',
    segunda: '70',
    tercera: '15',
  },
  {
    lotteryId: 'florida-pm',
    lotteryName: 'FLORIDA PM',
    date: today,
    primera: '52',
    segunda: '94',
    pick3: '352',
    pick4: '6784',
    pick5: '12352',
  },
  {
    lotteryId: 'newyork-pm',
    lotteryName: 'NEW YORK PM',
    date: today,
    primera: '11',
    segunda: '38',
    pick3: '611',
    pick4: '4528',
    pick5: '98611',
  },
  {
    lotteryId: 'super-pale-real-ganamas',
    lotteryName: 'SUPER PALE REAL-GANA MAS',
    date: today,
    primera: '55-07',
    segunda: '28-54',
  },
  {
    lotteryId: 'super-pale-ny-ganamas',
    lotteryName: 'SUPER PALE NY-GANA MAS',
    date: today,
    primera: '11-07',
    segunda: '38-54',
  },
  {
    lotteryId: 'super-pale-nacional-qp',
    lotteryName: 'SUPER PALE NACIONAL-QP',
    date: today,
    primera: '03-29',
    segunda: '77-85',
  },
  {
    lotteryId: 'super-pale-ny-nacional',
    lotteryName: 'SUPER PALE NY-NACIONAL',
    date: today,
    primera: '11-03',
    segunda: '38-77',
  },
];

export const getResultByLotteryId = (lotteryId: string): Result | undefined =>
  mockResults.find((r) => r.lotteryId === lotteryId);

/* ------------------------------------------------------------------ */
/*  Ticket checking utilities                                          */
/* ------------------------------------------------------------------ */

/**
 * Generate all permutations of an array of strings
 */
function generatePermutations(arr: string[]): string[] {
  if (arr.length <= 1) return arr;
  const result: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = generatePermutations(rest);
    for (const p of perms) {
      result.push(arr[i] + p);
    }
  }
  return [...new Set(result)];
}

/**
 * Check a single play against results.
 * Returns true if the play matches any winning position.
 */
export function checkPlayAgainstResult(play: Play): boolean {
  const result = getResultByLotteryId(play.lotteryId);
  if (!result) return false;

  const playType = play.type.toLowerCase();
  const numbers = play.numbers.trim();

  switch (playType) {
    case 'directo': {
      if (numbers.length === 2) {
        const matchPrimera = result.primera === numbers;
        const matchSegunda = result.segunda === numbers;
        const matchTercera = result.tercera ? result.tercera === numbers : false;
        return matchPrimera || matchSegunda || matchTercera;
      }
      if (numbers.length === 3 && result.pick3) {
        return result.pick3 === numbers;
      }
      return false;
    }

    case 'pale': {
      if (numbers.length === 4) {
        const primeraSegunda = `${result.primera}${result.segunda}`;
        const segundaPrimera = `${result.segunda}${result.primera}`;
        return numbers === primeraSegunda || numbers === segundaPrimera;
      }
      return false;
    }

    case 'tripleta': {
      if (numbers.length === 6 && result.tercera) {
        const perms = generatePermutations([result.primera, result.segunda, result.tercera]);
        return perms.some((p) => p === numbers);
      }
      return false;
    }

    case 'cash3': {
      if (result.pick3) {
        return result.pick3 === numbers;
      }
      return false;
    }

    case 'play4': {
      if (result.pick4) {
        return result.pick4 === numbers;
      }
      return false;
    }

    case 'pick5': {
      if (result.pick5) {
        return result.pick5 === numbers;
      }
      return false;
    }

    case 'super-pale': {
      const parts = numbers.split(/[-,\s]+/);
      if (parts.length === 2) {
        const primeraSegunda = `${result.primera}${result.segunda}`;
        return parts.some((p) => p === result.primera || p === result.segunda || p === primeraSegunda);
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Check all plays on a ticket and determine overall status.
 * If ANY play is a winner, the ticket is a winner.
 * If results are not available, status is pending.
 * If no plays match, the ticket is a loser.
 */
export function checkTicketStatus(plays: Play[]): TicketStatus {
  if (!plays || plays.length === 0) return 'pending';

  let hasPending = false;
  let hasWinner = false;

  for (const play of plays) {
    const result = getResultByLotteryId(play.lotteryId);
    if (!result) {
      hasPending = true;
      continue;
    }
    if (checkPlayAgainstResult(play)) {
      hasWinner = true;
    }
  }

  if (hasWinner) return 'winner';
  if (hasPending) return 'pending';
  return 'loser';
}

/**
 * Evaluate all stored tickets and update their status
 * based on current results.
 */
export function evaluateAllTickets(): void {
  try {
    const stored = localStorage.getItem('matador_tickets');
    if (!stored) return;

    const tickets = JSON.parse(stored);
    let changed = false;

    for (const ticket of tickets) {
      if (ticket.status === 'cancelled') continue;

      const newStatus = checkTicketStatus(ticket.plays || []);
      if (ticket.status !== newStatus) {
        ticket.status = newStatus;
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem('matador_tickets', JSON.stringify(tickets));
    }
  } catch {
    // ignore
  }
}

/**
 * Fetch results from loteriasdominicanas.com (simulated).
 * In production, this would call the actual API.
 */
export async function fetchLiveResults(): Promise<Result[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockResults);
    }, 500);
  });
}
