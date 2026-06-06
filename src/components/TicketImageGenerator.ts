export interface TicketImageData {
  ticketNumber: string;
  postName: string;
  date: string;
  time: string;
  hash: string;
  plays: Array<{
    lotteryName: string;
    numbers: string;
    amount: number;
    type: string;
  }>;
  total: number;
  vendorName?: string;
}

export function generateTicketImage(data: TicketImageData): string {
  const width = 420;
  const lineHeight = 22;
  const padX = 20;

  let estimatedHeight = 500;
  estimatedHeight += data.plays.length * 20;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = estimatedHeight;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, estimatedHeight);

  // Paper texture
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * estimatedHeight;
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.03})`;
    ctx.fillRect(x, y, 1, 1);
  }

  let y = 30;
  const centerX = width / 2;

  const drawCenter = (text: string, font: string, color: string = '#000000', maxW?: number) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    if (maxW) {
      ctx.fillText(text, centerX, y, maxW);
    } else {
      ctx.fillText(text, centerX, y);
    }
    y += lineHeight;
  };

  const drawLeft = (text: string, font: string, xPos: number = padX) => {
    ctx.font = font;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText(text, xPos, y);
  };

  const drawSeparator = (char: string = '=') => {
    ctx.font = 'bold 15px Courier New, monospace';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(char.repeat(40), centerX, y);
    y += lineHeight;
  };

  // POST name - BIGGER
  drawCenter(data.postName || 'POST MMW 25', 'bold 30px Courier New, monospace');
  y += 6;

  // ** ORIGINAL ** - BIGGER
  drawCenter('** ORIGINAL **', 'bold 24px Courier New, monospace');
  y += 6;

  // Date & time - BIGGER
  drawCenter(`${data.date} ${data.time}`, 'bold 15px Courier New, monospace');
  y += 8;

  // Ticket number - BIGGER and prominent
  drawLeft(`Ticket:`, 'bold 14px Courier New, monospace');
  y += 4;
  drawCenter(data.ticketNumber, 'bold 28px Courier New, monospace');
  y += lineHeight;

  // Vendor name if exists
  if (data.vendorName) {
    drawCenter(`Vendedor: ${data.vendorName}`, 'bold 14px Courier New, monospace');
    y += 4;
  }

  // Hash code
  ctx.font = 'bold 12px Courier New, monospace';
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'center';
  ctx.fillText(data.hash || generateRandomHash(), centerX, y);
  y += lineHeight + 10;

  // Separator
  drawSeparator();
  y += 6;

  // Lottery summary - BIGGER font
  const playsByLottery = new Map<string, typeof data.plays>();
  for (const play of data.plays) {
    const key = play.lotteryName;
    if (!playsByLottery.has(key)) playsByLottery.set(key, []);
    playsByLottery.get(key)!.push(play);
  }

  for (const [lotteryName, plays] of playsByLottery) {
    const totalLottery = plays.reduce((s, p) => s + p.amount, 0);
    const line = `${lotteryName}: $${totalLottery.toFixed(2)}`;
    drawCenter(line, 'bold 15px Courier New, monospace', '#000000', width - padX * 2);
    y += 6;
  }

  drawSeparator();
  y += 6;

  // Column headers - BIGGER
  ctx.font = 'bold 15px Courier New, monospace';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.fillText('PLAY', padX, y);
  ctx.fillText('AMOUNT', padX + 100, y);
  ctx.fillText('PLAY', padX + 200, y);
  ctx.fillText('AMOUNT', padX + 300, y);
  y += lineHeight + 6;

  // Plays in 2-column format - BIGGER
  const allPlays = data.plays;
  for (let i = 0; i < allPlays.length; i += 2) {
    const p1 = allPlays[i];
    const p2 = allPlays[i + 1];
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px Courier New, monospace';
    ctx.fillText(p1.numbers, padX, y);
    ctx.textAlign = 'right';
    ctx.font = '15px Courier New, monospace';
    ctx.fillText('$' + p1.amount.toFixed(2), padX + 160, y);
    if (p2) {
      ctx.textAlign = 'left';
      ctx.font = 'bold 15px Courier New, monospace';
      ctx.fillText(p2.numbers, padX + 200, y);
      ctx.textAlign = 'right';
      ctx.font = '15px Courier New, monospace';
      ctx.fillText('$' + p2.amount.toFixed(2), padX + 360, y);
    }
    y += 22;
  }

  y += 10;
  drawSeparator();
  y += 6;

  // TOTAL - BIGGER
  drawCenter(`--- TOTAL: $${data.total.toFixed(2)} ---`, 'bold 26px Courier New, monospace');
  y += lineHeight + 4;
  drawSeparator();
  y += 10;

  // Prize info - BIGGER
  ctx.font = 'bold italic 14px Courier New, monospace';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.fillText('DIRECTO $56   PALE $1,300   TRIP. $10,000', centerX, y);
  y += lineHeight;
  ctx.fillText('2DO $100   3ER $50', centerX, y);
  y += lineHeight + 10;

  // Disclaimers - BIGGER
  const disclaimers = [
    'PALE DOBLE SE PAGA UNA SOLA VEZ.',
    'SIN TICKET NO SE PAGA.',
    'REVISE SU JUGADA.',
    'BUENA SUERTE !!',
  ];

  ctx.font = 'bold italic 14px Courier New, monospace';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  for (const line of disclaimers) {
    ctx.fillText(line, centerX, y);
    y += lineHeight;
  }

  // Crop to actual height
  const finalHeight = y + 30;
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = finalHeight;
  const finalCtx = finalCanvas.getContext('2d')!;
  finalCtx.drawImage(canvas, 0, 0, width, finalHeight, 0, 0, width, finalHeight);

  return finalCanvas.toDataURL('image/png');
}

function generateRandomHash(): string {
  return Array.from({ length: 32 }, () =>
    '0123456789ABCDEF'[Math.floor(Math.random() * 16)]
  ).join('');
}
