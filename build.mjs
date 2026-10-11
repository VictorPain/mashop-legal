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
  // --- AB/AEA (2026-10-11): EEA Eki (EN + 4 dil) + gizlilik ve hesap silme çevirileri.
  // KVKK ve Kullanıcı Sözleşmesi bilerek ÇEVRİLMEZ: DE/FR/IT/ES sayfaları bunlara İngilizce sürümü gösterir
  // (bkz. ab-acilis-plani.md). Yer tutuculu kaynaklar yayın kilidine takılır (fail-closed).
  { tip: 'eea',     dil: 'en', src: 'eea-ek-en.md',                 title: 'maShop — Legal Notice and EEA Addendum',            out: 'en/eea.html' },
  { tip: 'privacy', dil: 'de', src: 'privacy-policy-de.md',         title: 'maShop — Datenschutzerklärung',                     out: 'de/privacy.html' },
  { tip: 'delete',  dil: 'de', src: 'hesap-silme-de.md',            title: 'maShop — Konto- und Datenlöschung',                 out: 'de/delete.html' },
  { tip: 'eea',     dil: 'de', src: 'eea-ek-de.md',                 title: 'maShop — Rechtliche Hinweise und EWR-Ergänzung',    out: 'de/eea.html' },
  { tip: 'privacy', dil: 'fr', src: 'privacy-policy-fr.md',         title: 'maShop — Politique de confidentialité',             out: 'fr/privacy.html' },
  { tip: 'delete',  dil: 'fr', src: 'hesap-silme-fr.md',            title: 'maShop — Suppression du compte et des données',     out: 'fr/delete.html' },
  { tip: 'eea',     dil: 'fr', src: 'eea-ek-fr.md',                 title: 'maShop — Mentions légales et addendum EEE',         out: 'fr/eea.html' },
  { tip: 'privacy', dil: 'it', src: 'privacy-policy-it.md',         title: 'maShop — Informativa sulla privacy',                out: 'it/privacy.html' },
  { tip: 'delete',  dil: 'it', src: 'hesap-silme-it.md',            title: 'maShop — Eliminazione di account e dati',           out: 'it/delete.html' },
  { tip: 'eea',     dil: 'it', src: 'eea-ek-it.md',                 title: 'maShop — Note legali e addendum SEE',               out: 'it/eea.html' },
  { tip: 'privacy', dil: 'es', src: 'privacy-policy-es.md',         title: 'maShop — Política de privacidad',                   out: 'es/privacy.html' },
  { tip: 'delete',  dil: 'es', src: 'hesap-silme-es.md',            title: 'maShop — Eliminación de cuenta y datos',            out: 'es/delete.html' },
  { tip: 'eea',     dil: 'es', src: 'eea-ek-es.md',                 title: 'maShop — Aviso legal y adenda EEE',                 out: 'es/eea.html' },
];

/** Hangi dilde hangi sayfa var → dil değiştirici ve nav yalnız GERÇEKTEN var olan sayfalara bağlanır. */
const SAYFA_VAR = new Set(PAGES.map((p) => `${p.dil}/${p.tip}`));
const DILLER = {
  tr: { ad: '🇹🇷 Türkçe',  ana: '⬅ Ana sayfa',  guncelleme: 'Son güncelleme' },
  en: { ad: '🇬🇧 English', ana: '⬅ Home',        guncelleme: 'Last updated' },
  de: { ad: '🇩🇪 Deutsch', ana: '⬅ Startseite',  guncelleme: 'Letzte Aktualisierung' },
  fr: { ad: '🇫🇷 Français', ana: '⬅ Accueil',    guncelleme: 'Dernière mise à jour' },
  it: { ad: '🇮🇹 Italiano', ana: '⬅ Home',       guncelleme: 'Ultimo aggiornamento' },
  es: { ad: '🇪🇸 Español', ana: '⬅ Inicio',      guncelleme: 'Última actualización' },
};
/** KVKK aydınlatması ve Kullanıcı Sözleşmesi yalnız TR + EN'dedir; diğer diller İngilizce sürüme gider. */
const CEVRILMEYEN = new Set(['kvkk', 'terms']);

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

/**
 * Yayınlanmasına izin verilen alıntı bloğu (blockquote) desenleri — VARSAYILAN RED.
 *
 * Kaynak .md dosyaları iki tür alıntı bloğu taşıyor: yayınlanacak kamusal metin ve
 * yalnız bize yönelik iç notlar (sürüm geçmişi, "şunu atlama" hatırlatmaları, şablon
 * doldurma talimatları). Eskiden iç notlar anahtar kelime KARA LİSTESİYLE atılıyordu;
 * listede olmayan her YENİ iç not sessizce yayına çıkıyordu. 2026-09'da üç iç not tam
 * bu yüzden canlıya sızdı: `kvkk.html` "v6 — kapsam genişletmesi" sürüm notu,
 * `terms.html` "Bu madde sizi korur. Kısaltma, atlama." ve `en/terms.html`
 * "This clause protects you. Do not skip or shorten it."
 *
 * Kural bu yüzden tersine çevrildi: bir alıntı bloğu YALNIZCA aşağıdaki desenlerden
 * biriyle BAŞLIYORSA yayınlanır; tanınmayan her blok atılır. Yeni bir kamusal alıntı
 * eklenecekse deseni buraya yazılmalı — unutulursa blok yayına çıkmaz, yani hata
 * güvenli yöne düşer. Hangi blokların atıldığı/tutulduğu her build'de yazdırılır.
 *
 * Emoji karakter sınıfı KULLANILMAZ (surrogate çiftleri regex'te kırılgandır);
 * eşleşme bloğun ilk satırının düz metni üzerinden yapılır.
 */
const KAMUSAL_ALINTI_DESENLERI = [
  /^Short English version for international users/i,
];

/**
 * Yayın kilidi — kaynak metinlerde doldurulmayı bekleyen tarih yer tutucuları.
 *
 * Yasal metinler, mobil sürüm mağazada görünür olmadan ÖNCE hazırlanıp wiki'ye
 * yazılıyor; ama `mashop-legal` push'u anında canlı olduğu için erken bir rebuild,
 * uygulamada henüz bulunmayan bir özelliği anlatan metni yayına çıkarır (yanıltıcı
 * aydınlatma). Bu yüzden metindeki tarih, gerçek sürüm gününe kadar yer tutucu
 * olarak bırakılır ve build yer tutucu gördüğü an HİÇBİR dosya yazmadan durur
 * (fail-closed): yanlışlıkla koşan bir build canlıyı bozamaz.
 *
 * Sürüm günü: yer tutucular gerçek tarihle değiştirilir, front-matter `guncelleme:`
 * alanı da aynı tarihe çekilir (altbilgideki tarih O alandan basılır), sonra build.
 */
const YAYIN_KILIDI_DESENLERI = ['[SÜRÜM GÜNÜ TARİHİ]', '[RELEASE DAY DATE]'];

/**
 * Genel yer tutucu kilidi (2026-10-11): EEA Eki gibi gerçek bilgi bekleyen sayfalar köşeli parantezli
 * BÜYÜK HARFLİ yer tutucular taşır: `[STREET ADDRESS, POSTCODE, CITY, COUNTRY]`, `[TELEPHONE]`,
 * `[TAX NUMBER, if any]`, `[EU REPRESENTATIVE: NAME, ADDRESS, EMAIL]`, `[APPLE SAFEGUARD: confirm]` …
 * Biri doldurulmadan kalırsa build durur. Markdown bağlantı etiketleri (`[Privacy Policy]`,
 * `[KVKK-Informationstext]`) küçük harf içerdiği için eşleşmez; `[DOLDUR]` gibi unutulmuş yer
 * tutucular ise yakalanır.
 */
const YER_TUTUCU_DESENI = /\[(?=[A-Z]{2,})[A-Z][A-Z \-]+(?:[,:][^\]]*)?\]/g;

/** Konsol raporu için: `>` işaretleri atılmış, tek satıra indirgenmiş ilk ~80 karakter. */
function alintiOzeti(block) {
  const duz = block.replace(/^>\s?/gm, '').replace(/\s+/g, ' ').trim();
  return duz.length > 80 ? `${duz.slice(0, 80)}…` : duz;
}

/**
 * Markdown kaynağını temizle: front-matter, wiki cross-link, şablon başlığı ve
 * kamusal olmayan alıntı blokları.
 * @returns {{ md: string, tutulan: string[], atilan: string[] }}
 */
function temizle(md) {
  const tutulan = [];
  const atilan = [];
  md = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  md = md.replace(/\n##\s*İlgili[\s\S]*$/, '\n');
  // Bir blok = ardışık `>` ile başlayan satır dizisi. Varsayılan RED — bkz.
  // KAMUSAL_ALINTI_DESENLERI yorumu.
  md = md.replace(/(?:^>.*\n)+/gm, (block) => {
    const ilkSatir = block.split('\n')[0].replace(/^>\s*/, '').replace(/\*\*/g, '').trim();
    const kamusal = KAMUSAL_ALINTI_DESENLERI.some((desen) => desen.test(ilkSatir));
    (kamusal ? tutulan : atilan).push(alintiOzeti(block));
    return kamusal ? block : '';
  });
  // Şablon kelimesi geçen H1 başlıklarını çıkar (asıl başlık ## ile başlıyor)
  md = md.replace(/^#\s+.*(?:Şablonu|Template|Şablon).*$/gm, '');
  md = md.replace(/\n{3,}/g, '\n\n').trim();
  return { md, tutulan, atilan };
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
  const etiket = {
    tr: { privacy: 'Gizlilik', kvkk: 'KVKK Aydınlatma', terms: 'Kullanıcı Sözleşmesi', delete: 'Hesap Silme' },
    en: { privacy: 'Privacy', kvkk: 'KVKK Notice', terms: 'Terms of Service', delete: 'Account Deletion', eea: 'EEA Addendum' },
    de: { privacy: 'Datenschutz', delete: 'Konto löschen', eea: 'Rechtliche Hinweise (EWR)', kvkk: 'KVKK (EN)', terms: 'Nutzungsbedingungen (EN)' },
    fr: { privacy: 'Confidentialité', delete: 'Suppression du compte', eea: 'Mentions légales (EEE)', kvkk: 'KVKK (EN)', terms: "Conditions d'utilisation (EN)" },
    it: { privacy: 'Privacy', delete: 'Eliminazione account', eea: 'Note legali (SEE)', kvkk: 'KVKK (EN)', terms: 'Termini di utilizzo (EN)' },
    es: { privacy: 'Privacidad', delete: 'Eliminar cuenta', eea: 'Aviso legal (EEE)', kvkk: 'KVKK (EN)', terms: 'Condiciones de uso (EN)' },
  };
  const kok = currentDil === 'tr' ? '' : '../';
  const sira = ['privacy', 'kvkk', 'terms', 'delete', 'eea'];
  const items = [];
  for (const t of sira) {
    if (!etiket[currentDil][t]) continue;
    if (t === currentTip) {
      items.push(`<a aria-current="page" style="background:var(--accent);color:var(--bg)">${etiket[currentDil][t]}</a>`);
    } else if (SAYFA_VAR.has(`${currentDil}/${t}`)) {
      items.push(`<a href="${t}.html">${etiket[currentDil][t]}</a>`);
    } else if (CEVRILMEYEN.has(t)) {
      items.push(`<a href="${kok}en/${t}.html">${etiket[currentDil][t]}</a>`);
    }
  }
  // Dil değiştirici: aynı sayfanın diğer dillerde GERÇEKTEN var olan sürümleri.
  const langLinks = Object.keys(DILLER)
    .filter((d) => d !== currentDil && SAYFA_VAR.has(`${d}/${currentTip}`))
    .map((d) => {
      const hedef = d === 'tr' ? `${kok}${currentTip}.html` : `${kok}${d}/${currentTip}.html`;
      return `<a class="lang" href="${hedef}">${DILLER[d].ad}</a>`;
    });
  const homeLink = `<a href="${kok}index.html">${DILLER[currentDil].ana}</a>`;
  return `<nav>${homeLink}${items.join('')}${langLinks.join('')}</nav>`;
}

/** `<link rel="alternate" hreflang>` — aynı sayfanın var olan dil sürümleri (arama motoru + otomatik dil seçimi). */
function hreflangEtiketleri(currentTip) {
  const taban = 'https://victorpain.github.io/mashop-legal';
  return Object.keys(DILLER)
    .filter((d) => SAYFA_VAR.has(`${d}/${currentTip}`))
    .map((d) => `<link rel="alternate" hreflang="${d}" href="${taban}/${d === 'tr' ? '' : d + '/'}${currentTip}.html">`)
    .join('\n');
}

/**
 * Kaynak markdown'ın front-matter'ındaki `guncelleme: YYYY-MM-DD` → `DD/MM/YYYY`.
 * `temizle()` front-matter'ı siliyor, bu yüzden AYRIŞTIRMA ONDAN ÖNCE yapılmalı.
 * Bulunamazsa null döner ve altbilgi tarih satırını hiç basmaz — yanlış tarih basmaktansa hiç basma.
 */
function guncellemeTarihi(ham) {
  const fm = ham.match(/^---\n([\s\S]*?)\n---/);
  const m = fm && fm[1].match(/^guncelleme:\s*(\d{4})-(\d{2})-(\d{2})\s*$/m);
  return m ? { iso: `${m[1]}-${m[2]}-${m[3]}`, gosterim: `${m[3]}/${m[2]}/${m[1]}` } : null;
}

/**
 * ⚠️ Tarih PARAMETRE — eskiden `'Yayın: 05/06/2026'` düz literaldi ve rebuild'de asla
 * değişmiyordu. Sonuç: aynı sayfada 7 hafta arayla iki tarih; metin içi "Son güncelleme:
 * 27/07/2026" doğruyken altbilgi 05/06/2026 diyordu. `privacy.html` kendi içinde
 * *"'Son güncelleme' tarihi değiştirilecektir"* diye söz verdiği için altbilgi o sözü
 * yalanlıyordu; KVKK aydınlatmasında tarih, kullanıcının neyi ne zaman öğrendiğinin kanıtı.
 */
function footer(dil, commitHash, tarihGosterim) {
  const etiket = DILLER[dil].guncelleme;
  const tarih = tarihGosterim ? `${etiket}: ${tarihGosterim}` : '';
  const repo  = 'github.com/VictorPain/mashop-legal';
  const notlar = {
    tr: `Bu sayfa <a href="https://${repo}">${repo}</a> üzerinden yayınlanır. Kaynak: <code>${commitHash}</code>.`,
    en: `This page is published from <a href="https://${repo}">${repo}</a>. Source: <code>${commitHash}</code>.`,
    de: `Diese Seite wird über <a href="https://${repo}">${repo}</a> veröffentlicht. Quelle: <code>${commitHash}</code>.`,
    fr: `Cette page est publiée depuis <a href="https://${repo}">${repo}</a>. Source : <code>${commitHash}</code>.`,
    it: `Questa pagina è pubblicata da <a href="https://${repo}">${repo}</a>. Fonte: <code>${commitHash}</code>.`,
    es: `Esta página se publica desde <a href="https://${repo}">${repo}</a>. Fuente: <code>${commitHash}</code>.`,
  };
  return `<footer>${tarih ? `${tarih} · ` : ''}${notlar[dil]}</footer>`;
}

function sayfa({ tip, dil, title, bodyHtml, tarihGosterim }, commitHash) {
  return `<!DOCTYPE html>
<html lang="${dil}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${hreflangEtiketleri(tip)}
<style>
${STYLE}
</style>
</head>
<body>
${nav(tip, dil)}
${bodyHtml}
${footer(dil, commitHash, tarihGosterim)}
</body>
</html>
`;
}

/** Hub sayfasının tek bir kaynağı yok → sayfaların EN YENİ `guncelleme` tarihini gösterir. */
function indexHtml(commitHash, tarihGosterim) {
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

<h2>🇩🇪 Deutsch · 🇫🇷 Français · 🇮🇹 Italiano · 🇪🇸 Español</h2>
<p class="meta">EWR / EEA / EEE / SEE. KVKK / Terms: <a href="en/kvkk.html">English</a>.</p>
<nav>
  <a href="en/eea.html">🇬🇧 Legal Notice and EEA Addendum</a>
  <a href="de/privacy.html">🇩🇪 Datenschutzerklärung</a>
  <a href="de/eea.html">🇩🇪 Rechtliche Hinweise (EWR)</a>
  <a href="de/delete.html">🇩🇪 Konto löschen</a>
  <a href="fr/privacy.html">🇫🇷 Politique de confidentialité</a>
  <a href="fr/eea.html">🇫🇷 Mentions légales (EEE)</a>
  <a href="fr/delete.html">🇫🇷 Suppression du compte</a>
  <a href="it/privacy.html">🇮🇹 Informativa sulla privacy</a>
  <a href="it/eea.html">🇮🇹 Note legali (SEE)</a>
  <a href="it/delete.html">🇮🇹 Eliminazione account</a>
  <a href="es/privacy.html">🇪🇸 Política de privacidad</a>
  <a href="es/eea.html">🇪🇸 Aviso legal (EEE)</a>
  <a href="es/delete.html">🇪🇸 Eliminar cuenta</a>
</nav>

<h2>İletişim / Contact</h2>
<p>Gizlilik, veri talepleri ve hukuki sorularınız için / For privacy, data requests and legal questions:<br>
<strong>fatihaci79@gmail.com</strong></p>

<footer>
${tarihGosterim ? `Son güncelleme / Last updated: ${tarihGosterim} · ` : ''}Source: <code>${commitHash}</code><br>
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

// --- Yayın kilidi: HİÇBİR dosya yazılmadan önce tüm kaynakları tara (fail-closed).
{
  const bulgular = [];
  for (const p of PAGES) {
    const srcPath = resolve(WIKI, p.src);
    if (!existsSync(srcPath)) continue;
    const satirlar = readFileSync(srcPath, 'utf8').split('\n');
    satirlar.forEach((satir, i) => {
      // Alıntı (`>`) satırları iç nottur ve yayına girmez; kilidi anlatan notun kendisi de
      // yer tutucu metnini taşır — taranırsa gerçek yer tutucular dolsa bile kilit açılmaz.
      if (satir.startsWith('>')) return;
      for (const desen of YAYIN_KILIDI_DESENLERI) {
        if (satir.includes(desen)) bulgular.push({ src: p.src, satir: i + 1, desen, metin: satir.trim() });
      }
      for (const eslesme of satir.matchAll(YER_TUTUCU_DESENI)) {
        if (YAYIN_KILIDI_DESENLERI.includes(eslesme[0])) continue; // zaten yukarıda raporlandı
        bulgular.push({ src: p.src, satir: i + 1, desen: eslesme[0], metin: satir.trim() });
      }
    });
  }
  if (bulgular.length > 0) {
    console.error('\n⛔ YAYIN KİLİDİ: kaynak metinlerde doldurulmamış yer tutucu (tarih / adres / temsilci …) var.');
    console.error('   Hiçbir dosya yazılmadı. Yer tutucular yalnızca mobil sürüm mağazada');
    console.error('   GÖRÜNÜR olduğu gün gerçek tarihle değiştirilir (bkz. YAYIN_KILIDI_DESENLERI).\n');
    for (const b of bulgular) {
      const kisa = b.metin.length > 100 ? `${b.metin.slice(0, 100)}…` : b.metin;
      console.error(`   ${b.src}:${b.satir}  ${b.desen}\n     ${kisa}`);
    }
    console.error('');
    process.exit(1);
  }
}

for (const d of Object.keys(DILLER)) {
  if (d === 'tr') continue;
  const dizin = resolve(__dirname, d);
  if (!existsSync(dizin)) mkdirSync(dizin, { recursive: true });
}

let enYeniIso = null;
let enYeniGosterim = null;

for (const p of PAGES) {
  const srcPath = resolve(WIKI, p.src);
  if (!existsSync(srcPath)) { console.error(`HATA: ${srcPath} bulunamadı`); continue; }
  const ham = readFileSync(srcPath, 'utf8');
  // Front-matter `temizle()` içinde siliniyor → tarihi ONDAN ÖNCE oku.
  const tarih = guncellemeTarihi(ham);
  if (!tarih) console.warn(`UYARI: ${p.src} içinde 'guncelleme:' yok — altbilgide tarih basılmayacak`);
  if (tarih && (enYeniIso === null || tarih.iso > enYeniIso)) {
    enYeniIso = tarih.iso;
    enYeniGosterim = tarih.gosterim;
  }
  const { md, tutulan, atilan } = temizle(ham);
  let bodyHtml = mdToHtml(md);
  // DE/FR/IT/ES'te KVKK ve Kullanıcı Sözleşmesi çevrilmez → bu klasörlerdeki göreli bağlantılar İngilizce sürüme gider.
  if (!['tr', 'en'].includes(p.dil)) {
    bodyHtml = bodyHtml.replace(/href="(kvkk|terms)\.html"/g, 'href="../en/$1.html"');
  }
  const html = sayfa({ ...p, bodyHtml, tarihGosterim: tarih?.gosterim ?? null }, commitHash);
  writeFileSync(resolve(__dirname, p.out), html);
  console.log(`✓ ${p.out} (${html.length} char, guncelleme ${tarih?.gosterim ?? 'YOK'})`);
  // Alıntı blokları sessizce düşmesin — hangisi yayına girdi, hangisi atıldı görünsün.
  for (const ozet of tutulan) console.log(`    alıntı TUTULDU : ${ozet}`);
  for (const ozet of atilan) console.log(`    alıntı ATILDI  : ${ozet}`);
}

writeFileSync(resolve(__dirname, 'index.html'), indexHtml(commitHash, enYeniGosterim));
console.log(`✓ index.html`);
console.log('\nTamam. Yayın için: git add -A && git commit -m "rebuild" && git push');
