// Grants one extra scan after the client reports a completed rewarded ad.
// LIMITATION: this trusts the client's report, so it is capped (MAX_BONUS_PER_DAY) to bound abuse.
// HARDENING: switch to AdMob Server-Side Verification (SSV) callbacks, which sign the reward event.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const MAX_BONUS_PER_DAY = 3;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'auth' }, 401);
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await admin.from('scan_credits').select('bonus').eq('user_id', user.id).eq('day', today).maybeSingle();
  if ((data?.bonus ?? 0) >= MAX_BONUS_PER_DAY) return json({ error: 'cap' }, 429);
  await admin.rpc('grant_bonus_scan', { p_user: user.id });
  return json({ ok: true });
});
