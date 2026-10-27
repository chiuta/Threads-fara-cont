// Proxy CORS opțional pentru „Threads fără cont” — Cloudflare Worker (JavaScript, fără dependențe, ~60 de linii).
// Îl găzduiești TU, în contul tău Cloudflare (sau îl rulezi pe orice runtime cu fetch/Request/Response, de ex. Deno, Node 18+).
// Ce face: primește ?url=<adresa oEmbed codificată> și o retransmite DOAR dacă este exact
// https://graph.threads.net/v1.0/oembed?url=…&maxwidth=…; altceva este refuzat (nu e proxy deschis).
// Ce NU face: nu păstrează nimic, nu scrie jurnale, nu trimite cookie-uri sau antete ale vizitatorului către Meta.
// Ca orice proxy, VEDE adresa IP a vizitatorului și linkurile cerute: folosește-l doar dacă îl controlezi.
// Configurare: variabila ALLOWED_ORIGIN (ex. https://chiuta.github.io sau originea unde ții index.html). Implicit: doar https://chiuta.github.io.
// În aplicație (Setări avansate → Proxy CORS): https://numele-tau.workers.dev/?url=
// STARE: experimental. Logica este testată cu un fetch simulat (tests/proxy.test.mjs); NU a fost implementat pe un Cloudflare real.
const TARGET = 'https://graph.threads.net/v1.0/oembed';
const MAX_BYTES = 262144;

function cors(origin) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-max-age': '600',
    'vary': 'Origin'
  };
}

export async function handle(request, env, fetchImpl) {
  const allowed = (env && env.ALLOWED_ORIGIN) || 'https://chiuta.github.io';
  const h = cors(allowed);
  const reply = (status, body, extra) => new Response(body, {status, headers: {...h, 'cache-control': 'no-store', ...(extra || {})}});
  if (request.method === 'OPTIONS') return reply(204, null);
  if (request.method !== 'GET') return reply(405, 'Method not allowed');
  const origin = request.headers.get('origin');
  if (origin && origin !== allowed) return reply(403, 'Origin not allowed');
  let inner;
  try { inner = new URL(new URL(request.url).searchParams.get('url') || ''); } catch { return reply(400, 'Missing or invalid url'); }
  if (inner.origin + inner.pathname !== TARGET || inner.username || inner.password) return reply(400, 'Only the Threads oEmbed endpoint is allowed');
  const out = new URL(TARGET);
  const post = inner.searchParams.get('url');
  if (!post || !/^https:\/\/(www\.)?threads\.(net|com)\//.test(post)) return reply(400, 'Invalid post url');
  out.searchParams.set('url', post);
  out.searchParams.set('maxwidth', String(Math.min(Math.max(parseInt(inner.searchParams.get('maxwidth'), 10) || 550, 200), 1000)));
  let res;
  try { res = await (fetchImpl || fetch)(out.href, {method: 'GET', headers: {accept: 'application/json'}, redirect: 'error', signal: AbortSignal.timeout(12000)}); }
  catch { return reply(502, 'Upstream unreachable'); }
  const body = await res.text();
  if (body.length > MAX_BYTES) return reply(502, 'Upstream response too large');
  return reply(res.status, body, {'content-type': 'application/json; charset=utf-8'});
}

export default { fetch: (request, env) => handle(request, env) };
