// @ts-nocheck
// ============================================================
// NMV Lottery — Biometric Authentication (WebAuthn)
// Supports Face ID (iOS), Touch ID (iOS), Fingerprint (Android)
// ============================================================

const STORAGE_KEY = 'nmv_bio_credentials'; // { userId, credId (base64) }[]
const RP_NAME = 'NMV Lottery';

/** Check if platform biometrics are available */
export async function biometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Encode ArrayBuffer → base64url string for storage */
function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** Decode base64url → Uint8Array */
function fromBase64(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

/** Random 32-byte challenge */
function randomChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

interface StoredCred {
  userId: string;      // e.g. 'vendor_1234' or 'admin_0587'
  credId: string;      // base64url of rawId
  username: string;    // display name
  pin?: string;        // stored PIN (encrypted via device keystore)
}

function loadCredentials(): StoredCred[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveCredentials(creds: StoredCred[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

/**
 * Register biometric for a user (after successful PIN/password login)
 * Returns true if registration succeeded
 */
export async function registerBiometric(
  userId: string,
  username: string,
  displayName: string,
  pin?: string
): Promise<boolean> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: {
          name: RP_NAME,
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: username,
          displayName: displayName,
        },
        pubKeyCredParams: [
          { alg: -7,   type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // device biometrics only
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) return false;

    const creds = loadCredentials().filter(c => c.userId !== userId);
    creds.push({
      userId,
      credId: toBase64(credential.rawId),
      username,
      pin,
    });
    saveCredentials(creds);
    return true;
  } catch (e) {
    console.warn('[Biometric] Registration failed:', e);
    return false;
  }
}

/**
 * Authenticate with biometric
 * Returns the stored credential data if successful, null otherwise
 */
export async function authenticateWithBiometric(
  userId?: string
): Promise<StoredCred | null> {
  try {
    const allCreds = loadCredentials();
    const filtered = userId
      ? allCreds.filter(c => c.userId === userId)
      : allCreds;

    if (filtered.length === 0) return null;

    const allowCredentials = filtered.map(c => ({
      id: fromBase64(c.credId),
      type: 'public-key' as const,
      transports: ['internal'] as AuthenticatorTransport[],
    }));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials,
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) return null;

    // Find which credential matched
    const matchedId = toBase64(assertion.rawId);
    const matched = allCreds.find(c => c.credId === matchedId) || allCreds[0];
    return matched || null;
  } catch (e) {
    console.warn('[Biometric] Auth failed:', e);
    return null;
  }
}

/** Check if user has registered biometrics */
export function hasBiometric(userId?: string): boolean {
  const creds = loadCredentials();
  if (!userId) return creds.length > 0;
  return creds.some(c => c.userId === userId);
}

/** Remove biometric for user */
export function removeBiometric(userId: string) {
  const creds = loadCredentials().filter(c => c.userId !== userId);
  saveCredentials(creds);
}

// ─── Device & Network Info ────────────────────────────────────────────────────

export interface DeviceInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  isp: string;
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenSize: string;
  connectionType: string;
}

/** Collect device + network info for session logging */
export async function collectDeviceInfo(): Promise<DeviceInfo> {
  const ua = navigator.userAgent;
  const conn = (navigator as any).connection;
  
  const base: Omit<DeviceInfo, 'ip' | 'city' | 'region' | 'country' | 'isp'> = {
    userAgent: ua,
    platform: navigator.platform || 'unknown',
    language: navigator.language || 'es',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenSize: `${screen.width}x${screen.height}`,
    connectionType: conn?.effectiveType || conn?.type || 'unknown',
  };

  try {
    const geo = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(4000),
    }).then(r => r.json());

    return {
      ...base,
      ip: geo.ip || 'desconocida',
      city: geo.city || 'desconocida',
      region: geo.region || '',
      country: geo.country_name || '',
      isp: geo.org || 'desconocido',
    };
  } catch {
    return {
      ...base,
      ip: 'no disponible',
      city: 'no disponible',
      region: '',
      country: '',
      isp: 'no disponible',
    };
  }
}
