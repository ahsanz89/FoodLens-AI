// Deno edge function. Deploy: supabase functions deploy scan-ingredients
// Secrets: supabase secrets set GEMINI_API_KEY=... (never shipped in the app)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MODEL = Deno.env.get('GEMINI_VISION_MODEL') ?? 'gemini-2.5-flash'; // swap models without an app release
const MAX_BYTES = 1_500_000; // base64 chars ≈ 1.1MB image; app resizes to 1024px first
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };

const SYSTEM = `You are FoodLens AI, a food ingredient recognition assistant.
Analyze the supplied image and identify visible food ingredients.
Rules:
1. Identify only ingredients that are visually supported by the image.
2. Do not invent hidden ingredients.
3. Distinguish similar ingredients when possible.
4. If an ingredient is uncertain, set needs_confirmation to true.
5. Do not assume quantities unless reasonably estimable; otherwise use null.
6. Return structured JSON only.
7. Do not provide recipes.
Categories: Vegetable, Fruit, Dairy, Meat, Seafood, Grains, Spices, Condiments, Bakery, Other.
If the image contains no food, return overall_status "no_food" and an empty list.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    ingredients: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      name: { type: 'STRING' }, category: { type: 'STRING' },
      estimated_quantity: { type: 'NUMBER', nullable: true }, unit: { type: 'STRING', nullable: true },
      confidence: { type: 'NUMBER' }, needs_confirmation: { type: 'BOOLEAN' } },
      required: ['name', 'category', 'confidence', 'needs_confirmation'] } },
    image_quality: { type: 'STRING', enum: ['good', 'poor', 'unusable'] },
    warnings: { type: 'ARRAY', items: { type: 'STRING' } },
    overall_status: { type: 'STRING', enum: ['success', 'partial', 'no_food', 'error'] },
  },
  required: ['ingredients', 'image_quality', 'warnings', 'overall_status'],
};

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'auth' }, 401);

  let body: { image?: string; mime?: string };
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  if (!body.image || typeof body.image !== 'string' || body.image.length > MAX_BYTES) return json({ error: 'bad_image' }, 413);
  const mime = ['image/jpeg', 'image/png', 'image/webp'].includes(body.mime ?? '') ? body.mime! : 'image/jpeg';

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: allowed } = await admin.rpc('consume_scan', { p_user: user.id });
  if (!allowed) return json({ error: 'limit' }, 429); // limit enforced here; client counter is display-only

  const t0 = Date.now();
  let status = 'ok';
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')! },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType: mime, data: body.image } }, { text: 'Identify the ingredients.' }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) { status = `provider_${res.status}`; return json({ error: 'provider' }, 502); }
    const out = await res.json();
    const text = out?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text); // client re-validates with zod
    return json(parsed);
  } catch (_e) {
    status = 'error';
    return json({ error: 'provider' }, 502);
  } finally {
    // Metadata only. The image and model output are never logged or stored.
    await admin.from('ai_usage_logs').insert({ user_id: user.id, request_type: 'scan', model_provider: `gemini:${MODEL}`, status, token_usage: null }).then(() => {}, () => {});
    console.log(JSON.stringify({ fn: 'scan-ingredients', ms: Date.now() - t0, status }));
  }
});
