// build.mjs — wiki markdown'larından mashop-legal HTML üretir
// Çalıştırma: cd mashop-legal && node build.mjs
// Bağımlılık: npx ile marked@13 (otomatik indirilir, kalıcı kurulum yok)
//
// GÜVENLİK: execFileSync kullanılır (shell yok, command injection riski yok).

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WIKI = resolve(__dirname, '../sanalFatih/wiki/projeler/mashop/monetizasyon/yasal');

const PAGES = [
  { tip: 'privacy', dil: 'tr', src: 'privacy-policy-tr.md',         title: 'maShop — Gizlilik Politikası',   out: 'privacy.html' },
  { tip: 'kvkk',    dil: 'tr', src: 'kvkk-aydinlatma-metni.md',     title: 'maShop — KVKK Aydınlatma Metni', out: 'kvkk.html' },
  { tip: 'terms',   dil: 'tr', src: 'kullanici-sozlesmesi.md',      title: 'maShop — Kullanıcı Sözleşmesi',  out: 'terms.html' },
  { tip: 'privacy', dil: 'en', src: 'privacy-policy-en.md',         title: 'maShop — Privacy Policy',        out: 'en/privacy.html' },
  { tip: 'kvkk',    dil: 'en', src: 'kvkk-aydinlatma-metni-en.md',  title: 'maShop — Personal Data Notice',  out: 'en/kvkk.html' },
  { tip: 'terms',   dil: 'en', src: 'kullanici-sozlesmesi-en.md',   title: 'maShop — Terms of Service',      out: 'en/terms.html' },
  { tip: 'delete',  dil: 'tr', src: 'hesap-silme-tr.md',           title: 'maShop — Hesap ve Veri Silme',   out: 'delete.html' },
  { tip: 'delete',  dil: 'en', src: 'hesap-silme-en.md',           title: 'maShop — Account Deletion',      out: 'en/delete.html' },
];

const STYLE = `
:root { color-scheme: light dark; --bg:#fff; --fg:#222; --muted:#666; --border:#e0e0e0; --accent:#2d5fb8; --warn:rgba(255,180,0,.12); --warn-b:#ffb400; }
@media (prefers-color-scheme: dark) { :root { --bg:#1a1a1a; --fg:#e6e6e6; --muted:#999; --border:#333; --accent:#6ba3ff; } }
*{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:720px;margin:0 auto;padding:24px 16px;line-height:1.6;background:var(--bg);color:var(--fg)}
h1,h2,h3{line-height:1.3}
h1{border-bottom:2px solid var(--accent);padding-bottom:8px}
h2{margin-top:32px;border-top:1px solid var(--border);padding-top:24px}
h3{margin-top:24px}
.meta{color:var(--muted);font-size:.9em;margin-bottom:24px}
nav{margin:24px 0}
nav a{display:inline-block;color:var(--accent);text-decoration:none;margin:8px 16px 8px 0;padding:8px 14px;border:1px solid var(--accent);border-radius:6px;font-size:.9em}
nav a:hover{background:var(--accent);color:var(--bg)}
nav a.lang{border-style:dashed}
table{border-collapse:collapse;margin:16px 0;width:100%;font-size:.9em}
th,td{border:1px solid var(--border);padding:8px 10px;text-align:left;vertical-align:top}
th{background:var(--warn);font-weight:600}
blockquote{margin:16px 0;padding:12px 16px;background:var(--warn);border-left:4px solid var(--warn-b);border-radius:4px}
code{background:var(--border);padding:1px 6px;border-radius:3px;font-size:.9em}
hr{border:none;border-top:1px solid var(--border);margin:24px 0}
footer{margin-top:48px;padding-top:16px;border-top:1px solid var(--border);color:var(--muted);font-size:.85em}
ul,ol{padding-left:20px}
li{margin:4px 0}
a{color:var(--accent)}
`.trim();

// Markdown kaynağını temizle: front-matter, wiki cross-link, şablon kullanım uyarıları
function temizle(md) {
  md = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  md = md.replace(/\n##\s*İlgili[\s\S]*$/, '\n');
  // Çok satırlı blockquote bloklarını içeriğine göre at:
  // - "**Usage**" / "**Kullanım**" geçen
  // - [FILL] / [DOLDUR] kelimesi geçen
  // - "English translation" / "The Turkish version" giriş notu
  // Bir blok = ardışık `>` ile başlayan satır dizisi
  md = md.replace(/(?:^>.*\n)+/gm, (block) => {
    if (/\*\*(?:Usage|Kullanım)\*\*|\[FILL\]|\[DOLDUR\]|English translation|The Turkish version|Add as a section|Published as|Replace.*fields/i.test(block)) {
      return '';
    }
    return block;
  });
  // Şablon kelimesi geçen H1 başlıklarını çıkar (asıl başlık ## ile başlıyor)
  md = md.replace(/^#\s+.*(?:Şablonu|Template|Şablon).*$/gm, '');
  md = md.replace(/\n{3,}/g, '\n\n').trim();
  return md;
}

function mdToHtml(md) {
  const tmpIn  = resolve(__dirname, '.tmp-in.md');
  const tmpOut = resolve(__dirname, '.tmp-out.html');
  writeFileSync(tmpIn, md);
  try {
    // execFileSync: shell yok, argümanlar dizi olarak verilir, injection riski yok
    execFileSync('npx', ['--yes', 'marked@13', '--gfm', '-i', tmpIn, '-o', tmpOut], {
      stdio: ['ignore', 'ignore', 'inherit']
    });
    return readFileSync(tmpOut, 'utf8');
  } finally {
    try { rmSync(tmpIn,  { force: true }); } catch {}
    try { rmSync(tmpOut, { force: true }); } catch {}
  }
}

function nav(currentTip, currentDil) {
  const tips = {
    tr: { privacy:'Gizlilik', kvkk:'KVKK Aydınlatma', terms:'Kullanıcı Sözleşmesi', delete:'Hesap Silme' },
    en: { privacy:'Privacy',  kvkk:'KVKK Notice',     terms:'Terms of Service',      delete:'Account Deletion' }
  };
  const items = Object.entries(tips[currentDil]).map(([t, label]) => {
    if (t === currentTip) return `<a aria-current="page" style="background:var(--accent);color:var(--bg)">${label}</a>`;
    return `<a href="${t}.html">${label}</a>`;
  });
  const langLink = currentDil === 'tr'
    ? `<a class="lang" href="en/${currentTip}.html">🇬🇧 English</a>`
    : `<a class="lang" href="../${currentTip}.html">🇹🇷 Türkçe</a>`;
  const homeLink = currentDil === 'en'
    ? `<a href="../index.html">⬅ Home</a>`
    : `<a href="index.html">⬅ Ana sayfa</a>`;
  return `<nav>${homeLink}${items.join('')}${langLink}</nav>`;
}

function footer(dil, commitHash) {
  const tarih = dil === 'tr' ? 'Yayın: 05/06/2026' : 'Published: 06/05/2026';
  const repo  = 'github.com/VictorPain/mashop-legal';
  const note  = dil === 'tr'
    ? `Bu sayfa <a href="https://${repo}">${repo}</a> üzerinden yayınlanır. Kaynak: <code>${commitHash}</code>.`
    : `This page is published from <a href="https://${repo}">${repo}</a>. Source: <code>${commitHash}</code>.`;
  return `<footer>${tarih} · ${note}</footer>`;
}

function sayfa({ tip, dil, title, bodyHtml }, commitHash) {
  return `<!DOCTYPE html>
<html lang="${dil}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
${STYLE}
</style>
</head>
<body>
${nav(tip, dil)}
${bodyHtml}
${footer(dil, commitHash)}
</body>
</html>
`;
}

function indexHtml(commitHash) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>maShop — Yasal Bilgiler / Legal</title>
<style>
${STYLE}
</style>
</head>
<body>
<h1>maShop — Yasal Bilgiler</h1>
<p class="meta">Bu sayfa maShop mobil uygulamasının gizlilik politikası, KVKK aydınlatma metni ve kullanıcı sözleşmesini yayınlar.</p>

<h2>🇹🇷 Türkçe</h2>
<nav>
  <a href="privacy.html">Gizlilik Politikası</a>
  <a href="kvkk.html">KVKK Aydınlatma Metni</a>
  <a href="terms.html">Kullanıcı Sözleşmesi</a>
  <a href="delete.html">Hesap ve Veri Silme</a>
</nav>

<h2>🇬🇧 English</h2>
<nav>
  <a href="en/privacy.html">Privacy Policy</a>
  <a href="en/kvkk.html">Personal Data Notice (KVKK)</a>
  <a href="en/terms.html">Terms of Service</a>
  <a href="en/delete.html">Account and Data Deletion</a>
</nav>

<h2>İletişim / Contact</h2>
<p>Gizlilik, veri talepleri ve hukuki sorularınız için / For privacy, data requests and legal questions:<br>
<strong>fatihaci79@gmail.com</strong></p>

<footer>
Yayın / Published: 05/06/2026 · Source: <code>${commitHash}</code><br>
<a href="https://github.com/VictorPain/mashop-legal">github.com/VictorPain/mashop-legal</a>
</footer>
</body>
</html>
`;
}

// === BUILD ===
console.log('mashop-legal build başlıyor...');
let commitHash = 'pending';
try {
  commitHash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: __dirname }).toString().trim();
} catch {}

const enDir = resolve(__dirname, 'en');
if (!existsSync(enDir)) mkdirSync(enDir, { recursive: true });

for (const p of PAGES) {
  const srcPath = resolve(WIKI, p.src);
  if (!existsSync(srcPath)) { console.error(`HATA: ${srcPath} bulunamadı`); continue; }
  const md = temizle(readFileSync(srcPath, 'utf8'));
  const bodyHtml = mdToHtml(md);
  const html = sayfa({ ...p, bodyHtml }, commitHash);
  writeFileSync(resolve(__dirname, p.out), html);
  console.log(`✓ ${p.out} (${html.length} char)`);
}

writeFileSync(resolve(__dirname, 'index.html'), indexHtml(commitHash));
console.log(`✓ index.html`);
console.log('\nTamam. Yayın için: git add -A && git commit -m "rebuild" && git push');
