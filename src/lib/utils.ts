import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PlayType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function detectPlayType(numbers: string): PlayType {
  const digits = numbers.replace(/\D/g, "");
  const len = digits.length;
  if (len <= 2) return "directo";
  if (len === 3) return "cash3";
  if (len === 4) return "pale";
  if (len === 5) return "pick5";
  return "tripleta";
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

let ticketCounter = 58000;
export function generateTicketNumber(): string {
  ticketCounter++;
  return `MWR-001-0000${ticketCounter}`;
}

export function formatDateTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const s = date.getSeconds().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = (h % 12 || 12).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const mo = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${hh}:${m}:${s} ${ampm} | ${d}/${mo}/${y}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function lighten(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  r = Math.min(255, Math.round(r + (255 - r) * amt));
  g = Math.min(255, Math.round(g + (255 - g) * amt));
  b = Math.min(255, Math.round(b + (255 - b) * amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function darken(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  r = Math.max(0, Math.round(r * (1 - amt)));
  g = Math.max(0, Math.round(g * (1 - amt)));
  b = Math.max(0, Math.round(b * (1 - amt)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function isTimePassed(closingTime: string): boolean {
  const now = new Date();
  const [h, m] = closingTime.split(":").map(Number);
  const closing = new Date();
  closing.setHours(h, m, 0, 0);
  return now > closing;
}
