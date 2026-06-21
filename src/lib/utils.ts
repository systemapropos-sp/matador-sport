import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PlayType } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get today's date as YYYY-MM-DD in LOCAL time (not UTC).
 * Fixes the UTC+0 date bug where after 8 PM EST the date shows as tomorrow.
 */
export function localDateStr(date?: Date): string {
  const d = date ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Detect play type from digit count and number format
 */
export function detectPlayType(digits: string): PlayType {
  const clean = digits.replace(/\D/g, '');
  const len = clean.length;

  if (len === 2) return 'directo';
  if (len === 3) return 'cash3';
  if (len === 4) return 'pale';
  if (len === 5) return 'pick5';
  if (len === 6) return 'tripleta';
  return 'directo';
}

/**
 * Generate a ticket number in the format MWR-001-000058XXX
 */
let ticketCounter = 58000;

export function generateTicketNumber(branchId: string = '001'): string {
  const seq = ticketCounter++;
  const seqStr = seq.toString().padStart(9, '0');
  return `MWR-${branchId}-${seqStr}`;
}

/**
 * Reset ticket counter (for testing)
 */
export function resetTicketCounter(start: number = 58000): void {
  ticketCounter = start;
}

/**
 * Format a date to display format: DD/MM/YYYY
 */
export function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Format time to display format: HH:MM:SS AM/PM
 */
export function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours.toString().padStart(2, '0');
  return `${hoursStr}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Format date and time combined: HH:MM:SS AM/PM | DD/MM/YYYY
 */
export function formatDateTime(date: Date): string {
  return `${formatTime(date)} | ${formatDate(date)}`;
}

/**
 * Format currency as $X.XX
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format currency as $X,XXX.XX
 */
export function formatCurrencyLong(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Get current time as string HH:MM
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}
