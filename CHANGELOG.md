# Jurnal de modificări

Format SemVer (MAJOR.MINOR.PATCH).

## 2.2.1 — 2026-11-02 (reîmprospătare kit)

- Nou (kit): **Sincronizare între dispozitive** (`FFF.sync`) — în dialogul «Transparență» (clic pe versiune → Copie de siguranță): conectezi două dispozitive direct (WebRTC, cod/QR, fără server și fără cont) și își schimbă datele aplicației; cea mai recentă valoare câștigă, secretele (chei API, parole) nu se trimit, ștergerile nu se propagă. Aplicarea trece prin importul kitului (confirmare, chei permise, rollback).
- Nou (kit): **Istoric local — «mașina timpului»** (`FFF.history`) — instantanee automate ale datelor (IndexedDB, fără secrete), diferență față de starea curentă și restaurare reversibilă; «Șterge datele aplicației» șterge și istoricul.
- Module adăugate: `qr`, `p2p`, `sync`, `history` (+~140 KB). Versiunea aplicației nu se schimbă.

## 2.2.1 — 2026-11-02

### Surse actualizate (runda 2, verificat la 2026-11-02)
- Scriptul de încorporare se încarcă acum de la `https://www.threads.com/embed.js` (documentația Meta „Embed a Threads Post”); CSP-ul permitea deja `www.threads.com`.
- `graph.threads.net` rămâne neschimbat: jurnalul de modificări Meta (6 iunie 2025) spune că API-ul Threads poate fi accesat atât prin `graph.threads.com`, cât și prin `graph.threads.net`.

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
