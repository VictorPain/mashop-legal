# mashop-legal

maShop mobil uygulamasının gizlilik politikası, KVKK aydınlatma metni ve kullanıcı sözleşmesinin yayınlandığı statik GitHub Pages reposu.

**Canlı yayın:** https://victorpain.github.io/mashop-legal/

## Yapı

```
mashop-legal/
├── index.html          → TR + EN ana sayfa (link listesi)
├── privacy.html        → Gizlilik Politikası (TR)
├── kvkk.html           → KVKK Aydınlatma Metni (TR)
├── terms.html          → Kullanıcı Sözleşmesi (TR)
├── en/
│   ├── privacy.html    → Privacy Policy (EN)
│   ├── kvkk.html       → Personal Data Notice (EN)
│   └── terms.html      → Terms of Service (EN)
├── build.mjs           → Wiki markdown → HTML build script
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
node build.mjs               # 7 HTML üret (index + 3 TR + 3 EN)
git add -A
git commit -m "rebuild: <kısa açıklama>"
git push                     # GitHub Pages otomatik build (~1 dk)
```

## Bağımlılık

- Node.js 20+
- `marked@13` — `npx --yes` ile otomatik indirilir, kalıcı kurulum gerekmez

## İçerik Sahibi

**Fatih Acı** — `fatihaci79@gmail.com`

Bu repo herkese açık (public) olmakla birlikte içerik telif korumalıdır.
