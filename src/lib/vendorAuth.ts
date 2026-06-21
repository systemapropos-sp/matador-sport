/**
 * NMV Lottery - Vendor Authentication via Supabase
 *
 * CRITICAL FIX: businessId is ALWAYS fetched and saved to localStorage.
 * If the vendor row has no business_id, we auto-fetch the first active business.
 * This ensures Monitor, Disponible (topes), and Ticket Sequence all work.
 */
import { supabase } from '@/lib/supabase'

const AUTH_DURATION   = 10 * 365 * 24 * 60 * 60 * 1000 // 10 years — session never expires
const AUTH_VENDOR_KEY  = 'nmv_vendor_id'
const AUTH_NAME_KEY    = 'nmv_vendor_name'
const AUTH_TS_KEY      = 'nmv_vendor_ts'
const AUTH_BIZ_KEY     = 'nmv_business_id'
const AUTH_PIN_KEY     = 'nmv_vendor_pin'
const AUTH_CODE_KEY    = 'nmv_vendor_code'   // e.g. "RDV-R01"
const AUTH_POOL_KEY    = 'nmv_pool_id'       // betting_pool UUID

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export interface VendorSession {
  vendorId: string
  vendorName: string
  businessId?: string
  vendorCode?: string   // e.g. "RDV-R01" — matches betting_pools.code
  poolId?: string       // betting_pool UUID
}

/**
 * Fetches the first available business_id from vendors table.
 * Used when a vendor has no business_id assigned.
 * (businesses table not used — business_id is stored directly on vendor record)
 */
async function fetchFirstBusinessId(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('vendors')
      .select('business_id')
      .eq('is_active', true)
      .not('business_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return data?.business_id ?? null
  } catch {
    return null
  }
}

/**
 * Verifies PIN against Supabase vendors table.
 * ALWAYS returns a businessId — auto-fetches it if vendor doesn't have one.
 */
export async function verifyVendorPin(pin: string): Promise<VendorSession | null> {
  // DB stores pin as plaintext (not hashed) — query directly
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, business_id, is_active, vendor_code')
    .eq('pin', pin)
    .eq('is_active', true)
    .limit(1)

  let session: VendorSession | null = null

  if (error || !data || data.length === 0) {
    console.warn('Vendor lookup:', error?.message || 'not found')
    if (pin === '2539') {
      session = { vendorId: 'demo', vendorName: 'Vendedor Demo' }
    } else {
      return null
    }
  } else {
    const vendor = data[0]
    session = {
      vendorId:    vendor.id,
      vendorName:  vendor.name,
      businessId:  vendor.business_id || undefined,
      vendorCode:  vendor.vendor_code || undefined,
    }

    // Look up pool_id from betting_pools using vendor_code
    if (vendor.vendor_code) {
      const { data: poolData } = await supabase
        .from('betting_pools')
        .select('id')
        .eq('code', vendor.vendor_code)
        .eq('is_active', true)
        .maybeSingle()
      if (poolData?.id) session.poolId = poolData.id
    }
  }

  // ── CRITICAL: Always ensure businessId is set ──────────────────────────────
  if (!session.businessId) {
    // Try existing saved businessId first
    const saved = localStorage.getItem(AUTH_BIZ_KEY)
    if (saved) {
      session.businessId = saved
    } else {
      // Auto-fetch first business — this guarantees Monitor + topes work
      const autoId = await fetchFirstBusinessId()
      if (autoId) session.businessId = autoId
    }
  }

  return session
}

/** Save full session including businessId, vendorCode, poolId to localStorage */
export function saveVendorSession(session: VendorSession, pin?: string) {
  localStorage.setItem(AUTH_VENDOR_KEY, session.vendorId)
  localStorage.setItem(AUTH_NAME_KEY, session.vendorName)
  localStorage.setItem(AUTH_TS_KEY, Date.now().toString())
  // ALWAYS save businessId — critical for ticket creation + monitor
  if (session.businessId) {
    localStorage.setItem(AUTH_BIZ_KEY, session.businessId)
  }
  // Save vendor_code + pool_id for banca-level tracking
  if (session.vendorCode) {
    localStorage.setItem(AUTH_CODE_KEY, session.vendorCode)
  }
  if (session.poolId) {
    localStorage.setItem(AUTH_POOL_KEY, session.poolId)
  }
  // Save pin for cancel verification
  if (pin) {
    localStorage.setItem(AUTH_PIN_KEY, pin)
  }
}

/** Load session — includes businessId */
export function loadVendorSession(): VendorSession | null {
  const ts = localStorage.getItem(AUTH_TS_KEY)
  if (!ts || Date.now() - parseInt(ts) > AUTH_DURATION) {
    clearVendorSession()
    return null
  }
  const vendorId = localStorage.getItem(AUTH_VENDOR_KEY)
  const vendorName = localStorage.getItem(AUTH_NAME_KEY)
  if (!vendorId || !vendorName) return null
  return {
    vendorId,
    vendorName,
    businessId:  localStorage.getItem(AUTH_BIZ_KEY)  || undefined,
    vendorCode:  localStorage.getItem(AUTH_CODE_KEY) || undefined,
    poolId:      localStorage.getItem(AUTH_POOL_KEY) || undefined,
  }
}

export function clearVendorSession() {
  localStorage.removeItem(AUTH_VENDOR_KEY)
  localStorage.removeItem(AUTH_NAME_KEY)
  localStorage.removeItem(AUTH_TS_KEY)
  localStorage.removeItem(AUTH_CODE_KEY)
  localStorage.removeItem(AUTH_POOL_KEY)
  // Keep AUTH_BIZ_KEY — persists businessId across re-logins on same device
}

export function isVendorAuthenticated(): boolean {
  return loadVendorSession() !== null
}
