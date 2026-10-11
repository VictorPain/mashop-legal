# mashop-legal

maShop mobil uygulamasının gizlilik politikası, KVKK aydınlatma metni ve kullanıcı sözleşmesinin yayınlandığı statik GitHub Pages reposu.

**Canlı yayın:** https://victorpain.github.io/mashop-legal/

## Yapı

```
mashop-legal/
├── index.html          → ana sayfa (6 dil bölümü)
├── privacy.html · kvkk.html · terms.html · delete.html   → TR
├── en/   privacy · kvkk · terms · delete · eea           → EN (+ AB/AEA Eki)
├── de/ fr/ it/ es/   privacy · delete · eea              → DE/FR/IT/ES
│                       (KVKK ve sözleşme çevrilmez → ../en/ sürümüne bağlanır)
├── build.mjs           → Wiki markdown → HTML (22 sayfa); yer tutucu kilidi
├── yayin-gunu.py       → Yayın günü: tarih yer tutucularını doldurur
└── README.md
```

## Kaynak

Tüm yasal metinlerin **tek doğruluk kaynağı (single source of truth)** sibling sanalFatih wiki'sidir:

```
../sanalFatih/wiki/projeler/mashop/monetizasyon/yasal/
├── privacy-policy-tr.md
├── privacy-policy-en.md
├── kvkk-aydinlatma-metni.md
├── kvkk-aydinlatma-metni-en.md
├── kullanici-sozlesmesi.md
└── kullanici-sozlesmesi-en.md
```

HTML'ler bu markdown'lardan **otomatik üretilir**; HTML'i elle düzenleme.

## Yeniden Yayın

Wiki metinlerinde değişiklik yapıldıktan sonra:

```bash
cd mashop-legal
node build.mjs               # 22 HTML üret
git add -A
git commit -m "rebuild: <kısa açıklama>"
git push                     # GitHub Pages otomatik build (~1 dk)
```

⛔ **Yayın kilidi:** kaynaklarda doldurulmamış yer tutucu (`[SÜRÜM GÜNÜ TARİHİ]`, `[RELEASE DAY DATE]` ya da genel `[BÜYÜK HARFLİ]` yer tutucu) varsa build **hiçbir dosya yazmadan** durur.

**Yayın günü (mobil sürüm mağazada görünür olduğu gün):**

```bash
python3 yayin-gunu.py 2026-10-20   # tarihi yer tutuculara + front-matter'a işler
node build.mjs
```

## Bağımlılık

- Node.js 20+
- `marked@13` — `npx --yes` ile otomatik indirilir, kalıcı kurulum gerekmez

## İçerik Sahibi

**Fatih Acı** — `fatihaci79@gmail.com`

Bu repo herkese açık (public) olmakla birlikte içerik telif korumalıdır.
