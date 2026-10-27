# Jurnal de modificări

Format SemVer (MAJOR.MINOR.PATCH).

## 2.2.0 — 2026-10-27

Anterior: v2.1.0. Codul aplicației nu s-a schimbat (doar versiunea); se completează documentația.

- Secțiunea „Proxy CORS opțional” (și exporturile .md) tradusă în README-urile FR/IT/ES/PT/DE/HU; traducere automată, neverificată nativ, marcată ca atare în fiecare fișier.
- Test nou `tests/readme-i18n.test.mjs` (verifică în toate cele 8 README: trimiterea la `proxy/cloudflare-worker.js`, `ALLOWED_ORIGIN`, testul și versiunea; marcajul „traducere automată”). Existente: `export-proxy` 18/18, `thread-archive` 36/36.
- Neimplementat: testarea worker-ului pe un cont Cloudflare real și față de endpoint-ul Meta real (necesită cont/rețea); compatibilitatea cu `embed.js` real; includerea proxy-ului în `index.html` (încalcă CSP și „un singur fișier fără server”).

## 2.1.0 — 2026-10-27

Anterior: v2.0.0.

- Nou: butonul „Descarcă .md” pentru lista de linkuri (8 limbi); textul este neutralizat pentru Markdown.
- Nou: `proxy/cloudflare-worker.js`, proxy CORS opțional, autogăzduit, restrâns la endpoint-ul oEmbed Threads (experimental; testat doar cu fetch simulat, nu pe Cloudflare real).
- Documentație: secțiunea „Proxy CORS opțional”, linii Stare/Offline.
- Exista deja: export .txt/.json al listei și Markdown/JSON al arhivei locale; câmpul de proxy din Setări avansate.
