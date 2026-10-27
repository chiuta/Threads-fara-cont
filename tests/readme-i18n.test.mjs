// Verifică că secțiunea despre proxy există în toate cele 8 README-uri și că ghidul trimite la fișierul real.
import fs from "fs"; import path from "path"; import {fileURLToPath} from "url";
const d = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let fails = 0; const ok = (n, c, x) => { console.log((c ? "  ok  " : "FAIL  ") + n + (!c && x !== undefined ? "  -> " + JSON.stringify(x) : "")); if (!c) fails++; };
const ver = JSON.parse(fs.readFileSync(path.join(d, "app.json"), "utf8")).version;
ok("fișierul proxy/cloudflare-worker.js există", fs.existsSync(path.join(d, "proxy", "cloudflare-worker.js")));
for (const l of ["", ".ro", ".fr", ".it", ".es", ".pt", ".de", ".hu"]) {
  const t = fs.readFileSync(path.join(d, `README${l}.md`), "utf8");
  ok(`README${l}.md: trimite la proxy/cloudflare-worker.js, ALLOWED_ORIGIN și testul`, t.includes("proxy/cloudflare-worker.js") && t.includes("ALLOWED_ORIGIN") && t.includes("tests/export-proxy.test.mjs"));
  ok(`README${l}.md: versiunea ${ver} apare în antet`, t.includes(ver));
  if (!["", ".ro"].includes(l)) ok(`README${l}.md: marcat ca traducere automată`, /(automatique|automatica|automática|automática|Automatische|Gépi fordítás)/i.test(t));
}
console.log(fails ? `\n${fails} eșuate` : "\ntoate reușite"); process.exit(fails ? 1 : 0);
