// Teste v2.0.0: arhivă de fire (salvare locală cu atribuire, formate de citare, căutare, export Markdown, verificare existență).
import {createRequire as __fffCR} from 'node:module';
import {readFileSync as __fffRF} from 'node:fs';
import {createRequire} from 'module';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
const __fffAxe = () => process.env.FFF_AXE || process.env.AXE_PATH || (() => { try { return __fffCR(import.meta.url).resolve('axe-core/axe.min.js'); } catch { return undefined; } })();
const APP = JSON.parse(__fffRF(new URL('../app.json', import.meta.url), 'utf8'));
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const FILE = 'file://' + path.resolve(here, '..', 'index.html');
const AXE = __fffAxe();
let ok = 0, bad = 0;
function t(name, cond, extra) { if (cond) { ok++; console.log('  ok  ' + name); } else { bad++; console.log('  FAIL ' + name + (extra ? ' :: ' + extra : '')); } }
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
const URL1 = 'https://www.threads.com/@maria/post/ABC123';
const WORDS = Array.from({length: 25}, (_, i) => 'cuv' + (i + 1)).join(' ');

async function open(w, h, bypass) {
  const ctx = await b.newContext({viewport: {width: w, height: h}, locale: 'ro-RO', acceptDownloads: true, ...(bypass ? {bypassCSP: true} : {})});
  const state = {mode: 'ok', hosts: new Set()};
  await ctx.route(/^https?:/, (r) => {
    const u = new URL(r.request().url()); state.hosts.add(u.hostname);
    if (u.hostname === 'graph.threads.net') {
      if (state.mode === 'net') return r.abort();
      if (state.mode === 'gone') return r.fulfill({status: 400, contentType: 'application/json', headers: {'access-control-allow-origin': '*'}, body: '{"error":"x"}'});
      return r.fulfill({status: 200, contentType: 'application/json', headers: {'access-control-allow-origin': '*'}, body: JSON.stringify({html: '<blockquote class="text-post-media">salut</blockquote>', author_name: 'maria'})});
    }
    return r.abort();
  });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('dialog', (d) => d.accept());
  await p.addInitScript(() => { window.__clip = []; Object.defineProperty(navigator, 'clipboard', {value: {writeText: (x) => { window.__clip.push(x); return Promise.resolve(); }}, configurable: true}); });
  await p.goto(FILE); await p.waitForTimeout(500);
  return {ctx, p, errs, state};
}
const save = async (p, o) => {
  await p.fill('#arcTitle', o.title || ''); await p.fill('#arcAuthor', o.author || ''); await p.fill('#arcUrl', o.url || '');
  await p.fill('#arcDate', o.date || ''); await p.fill('#arcText', o.text || '');
  await p.click('#arcSaveBtn'); await p.waitForTimeout(150);
};
const clip = (p) => p.evaluate(() => window.__clip[window.__clip.length - 1]);

{
  const {ctx, p, errs, state} = await open(1280, 900);
  console.log('Pornire');
  t('versiune ' + APP.version, await p.evaluate((v) => document.querySelector('meta[name=application-version]').content === v, APP.version));
  t('arhiva goală inițial', /Nicio intrare/.test(await p.textContent('#arcCountEl')));

  console.log('Validare');
  await save(p, {});
  t('fără text → eroare', /Lipește textul/.test(await p.textContent('#arcMsg')) && await p.locator('#arcMsg.error').count() === 1);
  await save(p, {text: 'x', url: 'https://example.com/a'});
  t('link invalid → eroare', /nu este o postare Threads/.test(await p.textContent('#arcMsg')));
  await p.evaluate(() => { const d = document.getElementById('arcDate'); d.type = 'text'; });
  await save(p, {text: 'x', date: '2026-02-31'});
  t('dată inexistentă → eroare', /AAAA-LL-ZZ/.test(await p.textContent('#arcMsg')));
  await p.evaluate(() => { document.getElementById('arcDate').type = 'date'; });
  await save(p, {text: 'x'.repeat(100)});

  console.log('Salvare și atribuire');
  await p.evaluate(() => { localStorage.removeItem('tfc_archive'); location.reload(); }); await p.waitForTimeout(500);
  await save(p, {title: 'Despre ferigi', url: URL1, date: '2026-03-05', text: WORDS + '\n\ndoua <img src=x onerror=alert(1)> rând'});
  t('mesaj de salvare', /salvat în arhivă/.test(await p.textContent('#arcMsg')));
  t('o intrare în listă, autor derivat din link', await p.locator('#arcList li').count() === 1 && (await p.textContent('#arcList li .arcMeta')).includes('@maria'));
  t('formularul s-a golit', (await p.inputValue('#arcText')) === '');
  t('textul e inert (fără element img injectat)', await p.locator('#arcList img').count() === 0 && (await p.textContent('#arcList .arcText')).includes('<img src=x'));
  t('stocat în localStorage (tfc_archive)', await p.evaluate(() => JSON.parse(localStorage.getItem('tfc_archive')).length === 1));
  await p.reload(); await p.waitForTimeout(500);
  t('persistă după reîncărcare', await p.locator('#arcList li').count() === 1);
  await save(p, {author: '@ion_p', text: 'Un al doilea fir despre vulpi.'});
  t('autor manual fără link', (await p.textContent('#arcList li:first-child .arcMeta')).includes('@ion_p'));
  t('numărul de fire', /2 din 2 fire/.test(await p.textContent('#arcCountEl')));

  console.log('Formate de citare (EN)');
  await p.selectOption('#langSelect', 'en'); await p.waitForTimeout(200);
  const li = p.locator('#arcList li', {hasText: 'Despre ferigi'});
  const cite = async (fmt) => { await p.selectOption('#arcFmt', fmt); await li.locator('button[data-act=cite]').click(); await p.waitForTimeout(80); return clip(p); };
  const ex = Array.from({length: 20}, (_, i) => 'cuv' + (i + 1)).join(' ') + '…';
  t('APA 7', (await cite('apa')) === '@maria. (2026, March 5). ' + ex + ' [post]. Threads. ' + URL1, await cite('apa'));
  t('MLA 9', (await cite('mla')) === '@maria. “' + ex.replace('…', '') + '.” Threads, 5 Mar 2026, ' + URL1 + '.', await cite('mla'));
  t('Chicago', (await cite('chicago')) === '@maria, “' + ex.replace('…', '') + ',” Threads, March 5, 2026, ' + URL1 + '.', await cite('chicago'));
  const simple = await cite('simple');
  t('Simplă: excerpt de 20 de cuvinte, dată, link, data arhivării', simple.startsWith('@maria — “' + ex + '”, Threads, 2026-03-05 · ' + URL1 + ' (archived locally on 20'), simple);
  const noDate = p.locator('#arcList li', {hasText: '@ion_p'});
  await p.selectOption('#arcFmt', 'apa'); await noDate.locator('button[data-act=cite]').click(); await p.waitForTimeout(80);
  t('fără dată → n.d., fără link', (await clip(p)) === '@ion_p. (n.d.). Un al doilea fir despre vulpi. [post]. Threads.', await clip(p));
  t('fără link: fără buton de verificare și fără linkuri de arhivare', await noDate.locator('button[data-act=check]').count() === 0 && await noDate.locator('.arcLinks a').count() === 0);

  console.log('Căutare');
  await p.fill('#arcSearch', 'vulpi'); await p.waitForTimeout(100);
  t('filtrare după text', await p.locator('#arcList li').count() === 1 && /1 of 2 threads/.test(await p.textContent('#arcCountEl')));
  await p.fill('#arcSearch', 'FERIGI'); await p.waitForTimeout(100);
  t('filtrare după titlu, fără diferență de majuscule', await p.locator('#arcList li').count() === 1);
  await p.fill('#arcSearch', 'nimic-de-gasit'); await p.waitForTimeout(100);
  t('zero rezultate', await p.locator('#arcList li').count() === 0 && await p.isDisabled('#arcExpBtn'));
  await p.fill('#arcSearch', ''); await p.waitForTimeout(100);

  console.log('Markdown');
  await p.selectOption('#arcFmt', 'chicago');
  await li.locator('button[data-act=md]').click(); await p.waitForTimeout(80);
  const md1 = await clip(p);
  t('Markdown: titlu, citat cu >, citare', md1.startsWith('## Despre ferigi\n') && md1.includes('> ' + WORDS) && md1.includes('> ') && md1.includes('Threads, March 5, 2026'));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#arcExpBtn')]);
  t('descărcare .md cu nume cu dată', /^threads-arhiva-\d{4}-\d\d-\d\d\.md$/.test(dl.suggestedFilename()));
  const mdAll = fs.readFileSync(await dl.path(), 'utf8');
  t('frontmatter YAML cu număr de intrări', /^---\ntitle: "Thread archive"\nexported: \d{4}-.*\nentries: 2\nformat: chicago\n---\n/.test(mdAll), mdAll.slice(0, 120));
  await p.click('#arcCopyAllBtn'); await p.waitForTimeout(80);
  t('copiere tot', (await clip(p)).includes('entries: 2'));

  console.log('Linkuri de arhivare și verificare');
  const hrefs = await li.locator('.arcLinks a').evaluateAll((as) => as.map((a) => a.href));
  t('linkuri Wayback save/capturi și archive.today', hrefs[0] === 'https://web.archive.org/save/' + URL1 && hrefs[1] === 'https://web.archive.org/web/*/' + URL1 && hrefs[2] === 'https://archive.ph/newest/' + URL1, hrefs.join(' '));
  t('nicio cerere de rețea până acum', state.hosts.size === 0, [...state.hosts].join(','));
  await li.locator('button[data-act=check]').click(); await p.waitForTimeout(500);
  t('postare existentă', /still returns the post/.test(await li.locator('.arcStatus').textContent()));
  state.mode = 'gone'; await li.locator('button[data-act=check]').click(); await p.waitForTimeout(500);
  t('postare dispărută (HTTP 400)', /no longer returns the post/.test(await li.locator('.arcStatus').textContent()));
  state.mode = 'net'; await li.locator('button[data-act=check]').click(); await p.waitForTimeout(500);
  t('eroare de rețea → mesaj corect, nu „dispărută"', /failed \(network\/CORS\)/.test(await li.locator('.arcStatus').textContent()));
  t('rezultatul verificării salvat', await p.evaluate(() => JSON.parse(localStorage.getItem('tfc_archive')).some((e) => e.check && e.check.kind === 'net')));
  t('singura gazdă contactată: graph.threads.net', [...state.hosts].every((h) => h === 'graph.threads.net'), [...state.hosts].join(','));

  console.log('Ștergere');
  await li.locator('button[data-act=del]').click(); await p.waitForTimeout(100);
  t('intrarea ștearsă', await p.locator('#arcList li').count() === 1 && await p.evaluate(() => JSON.parse(localStorage.getItem('tfc_archive')).length === 1));
  t('fără pageerror', errs.length === 0, errs.join('|'));
  await ctx.close();
}
console.log('Accesibilitate și mobil');
if (AXE) {
  const {ctx, p} = await open(1280, 900, true);
  await save(p, {title: 'T', url: URL1, date: '2026-03-05', text: 'Text de probă'});
  await p.addScriptTag({content: fs.readFileSync(AXE, 'utf8')});
  const v = await p.evaluate(async () => (await axe.run(document)).violations.map((x) => x.id + ':' + x.nodes.length));
  t('axe 0 violări cu arhiva completată', v.length === 0, v.join(','));
  await ctx.close();
}
{
  const {ctx, p} = await open(390, 800);
  await save(p, {title: 'T', url: URL1, text: 'Text foarte lung '.repeat(40)});
  t('fără defilare orizontală la 390px', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await ctx.close();
}
await b.close();
console.log(`\n${ok} ok, ${bad} eșuate`);
process.exit(bad ? 1 : 0);
