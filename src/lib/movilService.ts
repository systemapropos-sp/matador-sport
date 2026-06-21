// movilService.ts — MOVIL client management for numeros.nmvapp.com
// Uses the shared Supabase singleton to avoid multiple GoTrueClient instances
import { supabase as sb } from '@/lib/supabase';

export interface MovilClient {
  id?: string;
  code?: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  password?: string;
  pin?: string;
  balance?: number;
  language?: string;
  banca_code?: string;
  business_id?: string;
  created_by?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface MovilTransaction {
  id?: string;
  client_id?: string;
  client_code?: string;
  client_name?: string;
  type: 'recarga' | 'retiro' | 'cancelacion';
  amount: number;
  banca_code?: string;
  created_by?: string;
  status?: 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
}

// Generate a unique code like MMW-1005
async function generateClientCode(): Promise<string> {
  const { count } = await sb.from('nmv_clients').select('*', { count: 'exact', head: true });
  const num = String((count ?? 0) + 1001).padStart(4, '0');
  return `MMW-${num}`;
}

// ── CREATE CLIENT ──────────────────────────────────────────────────────────────
export async function createMovilClient(data: Omit<MovilClient, 'id' | 'code'>) {
  // ── Pre-validate: unique username ────────────────────────────────────────────
  if (data.username) {
    const { data: existing } = await sb
      .from('nmv_clients')
      .select('id')
      .eq('username', data.username.trim().toLowerCase())
      .limit(1)
      .maybeSingle();
    if (existing) throw new Error('Ya existe un cliente con ese nombre de usuario. Elige otro.');
  }

  // ── Pre-validate: unique PIN within business ─────────────────────────────────
  if (data.pin) {
    const biz = data.business_id
      || (typeof window !== 'undefined' ? localStorage.getItem('nmv_business_id') || null : null);
    const pinQuery = sb
      .from('nmv_clients')
      .select('id, username')
      .eq('pin', data.pin)
      .eq('is_active', true);
    if (biz) pinQuery.eq('business_id', biz);
    const { data: pinConflict } = await pinQuery.limit(1).maybeSingle();
    if (pinConflict) {
      throw new Error(`El PIN ${data.pin} ya está en uso por otro cliente. Asigna un PIN diferente.`);
    }
  }

  const code = await generateClientCode();

  // Build base payload WITHOUT business_id (column may not exist yet)
  const payload: Record<string, unknown> = {
    username:   data.username?.trim().toLowerCase(),
    full_name:  data.full_name,
    email:      data.email || null,
    phone:      data.phone || null,
    password:   data.password || null,
    pin:        data.pin || null,
    language:   data.language || 'es',
    banca_code: data.banca_code || null,
    created_by: data.created_by || null,
    is_active:  data.is_active ?? true,
    code,
    balance: 0,
  };

  // Try to include business_id — if column doesn't exist Supabase will error, we catch it
  const business_id = data.business_id
    || (typeof window !== 'undefined' ? localStorage.getItem('nmv_business_id') || null : null);

  const payloadWithBid = business_id ? { ...payload, business_id } : payload;

  let result: MovilClient | null = null;

  // First attempt: with business_id
  const { data: r1, error: e1 } = await sb.from('nmv_clients').insert(payloadWithBid).select().single();
  if (!e1) { result = r1 as MovilClient; }
  else if (e1.message.includes('business_id') || e1.message.includes('schema cache')) {
    // Column doesn't exist yet — retry without it
    const { data: r2, error: e2 } = await sb.from('nmv_clients').insert(payload).select().single();
    if (e2) {
      if (e2.message.includes('unique')) throw new Error('Ya existe un cliente con ese nombre de usuario o PIN duplicado.');
      if (e2.message.includes('does not exist')) throw new Error('Tabla nmv_clients no existe en Supabase. Ejecuta el SQL primero.');
      throw new Error(e2.message);
    }
    result = r2 as MovilClient;
  } else {
    if (e1.message.includes('unique')) throw new Error('Ya existe un cliente con ese nombre de usuario o PIN duplicado.');
    if (e1.message.includes('does not exist')) throw new Error('Tabla nmv_clients no existe en Supabase. Ejecuta el SQL primero.');
    throw new Error(e1.message);
  }

  return result!;
}

// ── SEARCH CLIENT (by code, phone, or email) ──────────────────────────────────
// Pass bancaCode to restrict search to this vendor's clients only
export async function searchMovilClient(query: string, bancaCode?: string): Promise<MovilClient | null> {
  const q = query.trim();
  let dbQuery = sb
    .from('nmv_clients')
    .select('*')
    .or(`code.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,username.ilike.%${q}%`)
    .eq('is_active', true)
    .limit(1);
  if (bancaCode) dbQuery = dbQuery.eq('banca_code', bancaCode);
  const { data, error } = await dbQuery.maybeSingle();
  if (error) throw new Error(error.message);
  return data as MovilClient | null;
}

// ── GET ALL CLIENTS for admin ─────────────────────────────────────────────────
export async function getAllMovilClients(): Promise<MovilClient[]> {
  const { data, error } = await sb
    .from('nmv_clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MovilClient[];
}

// ── RECARGA (add funds) ───────────────────────────────────────────────────────
export async function recargarMovilClient(
  clientId: string,
  amount: number,
  opts: { banca_code?: string; created_by?: string }
): Promise<void> {
  // 1. Add balance
  const { data: client } = await sb
    .from('nmv_clients')
    .select('balance, code, full_name')
    .eq('id', clientId)
    .single();

  const newBalance = (client?.balance ?? 0) + amount;
  await sb.from('nmv_clients').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', clientId);

  // 2. Log transaction in movil_transactions
  const balanceBefore = client?.balance ?? 0;
  await sb.from('movil_transactions').insert({
    client_id: clientId,
    client_code: client?.code,
    client_name: client?.full_name,
    type: 'recarga',
    amount,
    balance_before: balanceBefore,
    balance_after: newBalance,
    banca_code: opts.banca_code,
    created_by: opts.created_by,
    status: 'completed',
  });
}

// ── RETIRO (withdraw funds) ───────────────────────────────────────────────────
export async function retirarMovilClient(
  clientId: string,
  amount: number,
  opts: { banca_code?: string; created_by?: string }
): Promise<void> {
  const { data: client } = await sb
    .from('nmv_clients')
    .select('balance, code, full_name')
    .eq('id', clientId)
    .single();

  const currentBalance = client?.balance ?? 0;
  if (currentBalance < amount) throw new Error('Balance insuficiente');

  const newBalance = currentBalance - amount;
  await sb.from('nmv_clients').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', clientId);

  await sb.from('movil_transactions').insert({
    client_id: clientId,
    client_code: client?.code,
    client_name: client?.full_name,
    type: 'retiro',
    amount,
    balance_before: currentBalance,
    balance_after: newBalance,
    banca_code: opts.banca_code,
    created_by: opts.created_by,
    status: 'completed',
  });
}

// ── CANCELAR RECARGA ──────────────────────────────────────────────────────────
export async function cancelarRecarga(transactionId: string): Promise<void> {
  // Get transaction from movil_transactions
  const { data: txn } = await sb
    .from('movil_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('type', 'recarga')
    .eq('status', 'completed')
    .single();

  if (!txn) throw new Error('Recarga no encontrada o ya cancelada');

  // Reverse the balance
  const { data: client } = await sb
    .from('nmv_clients')
    .select('balance')
    .eq('id', txn.client_id)
    .single();

  const newBalance = Math.max(0, (client?.balance ?? 0) - txn.amount);
  await sb.from('nmv_clients').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', txn.client_id);

  // Mark as cancelled + log reversal
  await sb.from('movil_transactions').update({ status: 'cancelled' }).eq('id', transactionId);
  await sb.from('movil_transactions').insert({
    client_id: txn.client_id,
    client_code: txn.client_code,
    client_name: txn.client_name,
    type: 'cancelacion',
    amount: txn.amount,
    balance_before: client?.balance ?? 0,
    balance_after: newBalance,
    notes: `Cancelación de recarga #${transactionId}`,
    status: 'completed',
  });
}

// ── GET TRANSACTIONS for report ───────────────────────────────────────────────
export async function getMovilTransactions(date?: string, bancaCode?: string) {
  let query = sb
    .from('movil_transactions')
    .select('*, nmv_clients(username, full_name, phone)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (date) {
    const start = date + 'T00:00:00.000Z';
    const end   = date + 'T23:59:59.999Z';
    query = query.gte('created_at', start).lte('created_at', end);
  }
  if (bancaCode) query = query.eq('banca_code', bancaCode);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── GET MOVIL TICKETS ─────────────────────────────────────────────────────────
export async function getMovilTickets(date: string, bancaCode?: string) {
  const start = date + 'T00:00:00.000Z';
  const end   = date + 'T23:59:59.999Z';

  let query = sb
    .from('tickets')
    .select('*, nmv_clients(id, username, full_name, code)')
    .order('created_at', { ascending: false })
    .gte('created_at', start)
    .lte('created_at', end);

  if (bancaCode) query = query.eq('banca_code', bancaCode);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── GET DAY SUMMARY (Jugado + Premios) ────────────────────────────────────────
export async function getMovilDaySummary(date: string) {
  const start = date + 'T00:00:00.000Z';
  const end   = date + 'T23:59:59.999Z';
  const { data, error } = await sb
    .from('tickets')
    .select('amount, prize, status')
    .gte('created_at', start)
    .lte('created_at', end);

  if (error) return { jugado: 0, premios: 0 };
  const rows = (data ?? []) as Array<{ amount?: number; prize?: number; status?: string }>;
  const jugado  = rows.reduce((s, r) => s + (r.amount  ?? 0), 0);
  const premios = rows.filter(r => r.status === 'ganador').reduce((s, r) => s + (r.prize ?? 0), 0);
  return { jugado, premios };
}

// ── TOGGLE CLIENT ACTIVE ──────────────────────────────────────────────────────
export async function toggleMovilClientActive(id: string, isActive: boolean) {
  const { error } = await sb
    .from('nmv_clients')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ── CANCEL/DELETE MOVIL TICKET ────────────────────────────────────────────────
export async function cancelMovilTicket(id: string) {
  const { error } = await sb
    .from('tickets')
    .update({ status: 'cancelado' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
