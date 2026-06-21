/**
 * useTicket — Creates and manages tickets.
 *
 * SCHEMA (Supabase tickets table):
 *   id UUID, ticket_number TEXT, business_id UUID, vendor_id UUID,
 *   lottery_name TEXT, play_type TEXT, numbers TEXT, amount NUMERIC,
 *   status TEXT, print_count INT, verification_code TEXT,
 *   metadata JSONB { plays[], total_amount, vendor_name },
 *   created_at TIMESTAMPTZ
 *
 * App stores plays array in metadata.plays.
 * Total amount goes in both `amount` (DB) and `metadata.total_amount`.
 */
import { useState, useCallback, useEffect } from 'react';
import type { Ticket, Play } from '@/types';
import { supabase } from '@/lib/supabase';

/** Generate unique barcode — {VendorPrefix}YYYYMMDDxxxxxxx (7 random alphanumeric) */
function generateBarcode(vendorCode?: string): string {
  const now = new Date();
  const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const rand = Math.random().toString(36).substr(2,7).toUpperCase();
  // Use vendor_code prefix (e.g. "RDV-R01" → "RDVR01") instead of hardcoded "NMV"
  const code = vendorCode ?? localStorage.getItem('nmv_vendor_code') ?? '';
  const prefix = code ? code.replace(/-/g, '').toUpperCase().slice(0, 6) : 'NMV';
  return `${prefix}${d}${rand}`;
}

/** Generate unique 12-digit verification code */
function generateVerificationCode(): string {
  const p1 = Math.floor(Math.random() * 900000) + 100000;
  const p2 = Math.floor(Math.random() * 1000000);
  return `${p1}${String(p2).padStart(6, '0')}`;
}

/** Safe UUID — uses browser crypto.randomUUID if available */
function makeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Pad a number to N digits */
function padSeq(n: number, len = 9): string {
  return String(n).padStart(len, '0');
}

/**
 * Get next sequential ticket number.
 * Format: {vendorCode}-{padded_seq}  e.g. "RDV-R01-000000001"
 * Falls back to "NMV-001-000000001" when no vendorCode is available.
 */
async function getNextTicketNumber(businessId: string, vendorCode?: string): Promise<string> {
  const vc = vendorCode || localStorage.getItem('nmv_vendor_code') || '';
  const prefix = vc || 'NMV-001';
  if (!businessId) return `${prefix}-${padSeq(1)}`;
  try {
    // Try atomic RPC first
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      'increment_ticket_sequence',
      { p_business_id: businessId }
    );
    if (!rpcErr && rpcData) {
      const { seq } = rpcData as { seq: number; banca_number: string };
      return `${prefix}-${padSeq(seq)}`;
    }

    // Fallback: read/update ticket_sequences directly
    const { data: seqRow } = await supabase
      .from('ticket_sequences')
      .select('id, last_seq, banca_number')
      .eq('business_id', businessId)
      .maybeSingle();

    if (!seqRow) {
      await supabase.from('ticket_sequences').upsert(
        { business_id: businessId, banca_number: vc.split('-')[1] || '001', last_seq: 1, updated_at: new Date().toISOString() },
        { onConflict: 'business_id' }
      );
      return `${prefix}-${padSeq(1)}`;
    }

    const nextSeq = (seqRow.last_seq || 0) + 1;
    await supabase
      .from('ticket_sequences')
      .update({ last_seq: nextSeq, updated_at: new Date().toISOString() })
      .eq('id', seqRow.id);

    return `${prefix}-${padSeq(nextSeq)}`;
  } catch (err) {
    console.warn('getNextTicketNumber error:', err);
    return `${prefix}-${padSeq(Math.floor(Math.random() * 9000) + 1000)}`;
  }
}

/** Convert a Supabase DB row to our Ticket interface */
function rowToTicket(row: Record<string, unknown>): Ticket {
  const meta = (row.metadata as Record<string, unknown>) || {};
  const plays = (meta.plays as Play[]) || [];
  const totalAmount = Number(meta.total_amount ?? row.amount ?? 0);
  const vendorName = String(meta.vendor_name ?? '');

  return {
    id: row.id as string,
    ticketNumber: String(row.ticket_number ?? ''),
    plays,
    totalAmount,
    status: (row.status as Ticket['status']) || 'pending',
    createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
    vendorId: String(row.vendor_id ?? ''),
    vendorName,
    verificationCode: String(row.verification_code ?? ''),
    prize: Number(row.prize_amount ?? 0),
  };
}

export interface UseTicketReturn {
  tickets: Ticket[];
  loading: boolean;
  createTicket: (plays: Play[], vendorName?: string) => Promise<Ticket | null>;
  cancelTicket: (id: string) => Promise<void>;
  recentTickets: Ticket[];
  refreshTickets: () => Promise<void>;
}

export function useTicket(): UseTicketReturn {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const getBusinessId  = () => localStorage.getItem('nmv_business_id')  || '';
  const getVendorId    = () => localStorage.getItem('nmv_vendor_id')     || '';
  const getVendorCode  = () => localStorage.getItem('nmv_vendor_code')   || '';
  const getPoolId      = () => localStorage.getItem('nmv_pool_id')       || '';

  // ── Self-heal: ensure businessId + vendorCode + poolId are all set ────────
  // Handles the case where vendor was logged in before SQL updated vendor_code
  useEffect(() => {
    const vendorId = getVendorId();
    if (!vendorId) return; // not logged in yet

    const needsBizId  = !getBusinessId();
    const needsPoolId = !getPoolId();
    const vendorCode  = getVendorCode();

    if (!needsBizId && !needsPoolId) return; // everything is already set

    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('vendors')
          .select('business_id, vendor_code')
          .eq('id', vendorId)
          .maybeSingle();

        if (cancelled || !data) return;

        // Heal business_id
        if (needsBizId && data.business_id) {
          localStorage.setItem('nmv_business_id', data.business_id as string);
          console.log('[useTicket] healed businessId:', data.business_id);
          window.dispatchEvent(new CustomEvent('nmv:businessid-ready', { detail: data.business_id }));
        }

        // Heal vendor_code + pool_id (important after SQL updated vendor's vendor_code)
        const vc = (data.vendor_code as string) || vendorCode;
        if (vc) {
          if (!getVendorCode()) {
            localStorage.setItem('nmv_vendor_code', vc);
            console.log('[useTicket] healed vendor_code:', vc);
          }
          if (needsPoolId) {
            const { data: poolData } = await supabase
              .from('betting_pools')
              .select('id')
              .eq('code', vc)
              .eq('is_active', true)
              .maybeSingle();
            if (!cancelled && poolData?.id) {
              localStorage.setItem('nmv_pool_id', poolData.id as string);
              console.log('[useTicket] healed pool_id:', poolData.id, 'for vendor_code:', vc);
            }
          }
        }
      } catch (e) { console.warn('[useTicket] self-heal failed (non-fatal):', e); }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load today's tickets ──────────────────────────────────────────────────
  const refreshTickets = useCallback(async () => {
    const biz = getBusinessId();
    if (!biz) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const vid = getVendorId();
      const query = supabase
        .from('tickets')
        .select('id, ticket_number, vendor_id, lottery_name, play_type, numbers, amount, status, metadata, created_at, verification_code, print_count')
        .eq('business_id', biz)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(500);
      // Filter by vendor_id so each vendor only sees their own tickets
      if (vid) query.eq('vendor_id', vid);
      const { data, error } = await query;
      if (!error && data) {
        setTickets(data.map(rowToTicket));
      } else if (error) {
        console.warn('refreshTickets error:', error.message);
      }
    } catch (err) {
      console.warn('refreshTickets exception:', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { refreshTickets(); }, [refreshTickets]);

  useEffect(() => {
    const onRefresh = () => refreshTickets();
    window.addEventListener('nmv:businessid-ready', onRefresh);
    window.addEventListener('nmv:ticket-created', onRefresh);
    return () => {
      window.removeEventListener('nmv:businessid-ready', onRefresh);
      window.removeEventListener('nmv:ticket-created', onRefresh);
    };
  }, [refreshTickets]);

  // ── Create ticket ─────────────────────────────────────────────────────────
  const createTicket = useCallback(
    async (plays: Play[], vendorName: string = 'Vendedor'): Promise<Ticket | null> => {
      if (plays.length === 0) return null;

      const biz = getBusinessId();
      const vendorId = getVendorId();
      const vendorCode = getVendorCode();
      const totalAmount = plays.reduce((s, p) => s + p.amount, 0);
      const verificationCode = generateVerificationCode();
      const barcode = generateBarcode(vendorCode);
      const ticketNumber = await getNextTicketNumber(biz, vendorCode);

      // Primary lottery info (from first play)
      const firstPlay = plays[0];
      const lotteryName = firstPlay.lotteryName ||
        (plays.length > 1 ? `${plays.length} loterias` : 'GENERAL');
      const primaryNumbers = firstPlay.numbers || '';
      const primaryType = firstPlay.type || 'directo';

      const ticket: Ticket = {
        id: makeUUID(),
        ticketNumber,
        plays: [...plays],
        totalAmount,
        status: 'pending',
        createdAt: new Date(),
        vendorId,
        vendorName,
        verificationCode,
        barcode,
      };

      if (biz && vendorId) {
        const insertRow: Record<string, unknown> = {
          id: ticket.id,
          ticket_number: ticketNumber,
          business_id: biz,
          vendor_id: vendorId,
          lottery_name: lotteryName,
          play_type: primaryType,
          numbers: primaryNumbers,
          amount: totalAmount,
          status: 'pending',
          created_at: ticket.createdAt.toISOString(),
          print_count: 0,
          verification_code: verificationCode,
          barcode,
          pool_id:      getPoolId()     || null,
          vendor_code:  getVendorCode() || null,
          metadata: {
            plays,
            total_amount: totalAmount,
            vendor_name: vendorName,
          },
        };

        const { error } = await supabase.from('tickets').insert(insertRow);
        if (error) {
          console.warn('[useTicket] insert error:', error.message, error.code);
        } else {
          window.dispatchEvent(new CustomEvent('nmv:ticket-created'));
        }
      } else {
        console.warn('[useTicket] createTicket: missing biz or vendorId', { biz, vendorId });
      }

      setTickets((prev) => [ticket, ...prev]);
      return ticket;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Cancel ticket ─────────────────────────────────────────────────────────
  const cancelTicket = useCallback(async (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'cancelled' as const } : t))
    );
    const biz = getBusinessId();
    if (biz) {
      await supabase
        .from('tickets')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('business_id', biz);
      window.dispatchEvent(new CustomEvent('nmv:ticket-created'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    tickets,
    loading,
    createTicket,
    cancelTicket,
    recentTickets: tickets.slice(0, 10),
    refreshTickets,
  };
}

export default useTicket;
