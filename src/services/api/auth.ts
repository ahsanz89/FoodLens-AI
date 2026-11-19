import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../ai/remoteProvider';

const KEY = 'foodlens.session.v1';
const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

interface Session { access_token: string; refresh_token: string; expires_at: number }

async function call(path: string, body: unknown): Promise<Session | null> {
  if (!URL || !ANON) return null;
  try {
    const res = await fetch(`${URL}/auth/v1/${path}`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) return null;
    const j = await res.json();
    return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in ?? 3600) };
  } catch { return null; }
}

/** Anonymous (guest) sign-in; requires "Allow anonymous sign-ins" enabled in Supabase Auth settings. */
export async function ensureSession(): Promise<boolean> {
  let s: Session | null = null;
  try { s = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null'); } catch { s = null; }
  const now = Math.floor(Date.now() / 1000);
  if (s && s.expires_at - 60 > now) { setAuthToken(s.access_token); return true; }
  if (s) s = await call('token?grant_type=refresh_token', { refresh_token: s.refresh_token });
  if (!s) s = await call('signup', { data: {} }); // empty signup = anonymous user
  if (!s) { setAuthToken(null); return false; }
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
  setAuthToken(s.access_token);
  return true;
}

export async function clearSession() { await AsyncStorage.removeItem(KEY); setAuthToken(null); }

/** Server-side deletion of the user and all their rows/photos. Resolves true when nothing remains on the server. */
export async function deleteRemoteAccount(): Promise<boolean> {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!base) return true; // no backend configured => nothing stored remotely
  try {
    if (!(await ensureSession())) return true;
    const s = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null');
    const res = await fetch(`${base}/delete-account`, { method: 'POST', headers: { Authorization: `Bearer ${s?.access_token}` } });
    return res.ok;
  } catch { return false; }
}
