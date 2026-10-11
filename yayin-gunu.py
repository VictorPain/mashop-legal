#!/usr/bin/env python3
"""Yayın günü yardımcısı: yer tutucu tarihlerini doldurur ve front-matter `guncelleme:` alanını çeker.

Kullanım (mashop-legal klasöründen):
    python3 yayin-gunu.py YYYY-MM-DD        # örn. 2026-10-20
    node build.mjs                          # kilit artık açılmalı; 22 sayfa üretir

Yalnız YAYINLANAN kaynaklara dokunur (privacy-policy, kvkk-aydinlatma-metni, hesap-silme,
kullanici-sozlesmesi, eea-ek); iç notlara (madde7-yama, kvkk-v7-taslak) dokunmaz.
Kaynak: ../sanalFatih/wiki/projeler/mashop/monetizasyon/yasal/ (sibling repo, göreli yol).
"""
import glob
import os
import re
import sys

if len(sys.argv) < 2 or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', sys.argv[1]):
    sys.exit('Kullanım: python3 yayin-gunu.py YYYY-MM-DD')
iso = sys.argv[1]
y, m, d = iso.split('-')
metin_tarih = f'{d}/{m}/{y}'  # sitedeki gösterimle aynı (DD/MM/YYYY)

klasor = os.path.normpath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', 'sanalFatih', 'wiki', 'projeler', 'mashop', 'monetizasyon', 'yasal'))
desenler = ['privacy-policy-*.md', 'kvkk-aydinlatma-metni*.md', 'hesap-silme-*.md',
            'kullanici-sozlesmesi*.md', 'eea-ek-*.md']
dosyalar = sorted({f for p in desenler for f in glob.glob(os.path.join(klasor, p))})
if not dosyalar:
    sys.exit(f'Kaynak bulunamadı: {klasor}')

for f in dosyalar:
    t = open(f, encoding='utf-8').read()
    n = t.count('[SÜRÜM GÜNÜ TARİHİ]') + t.count('[RELEASE DAY DATE]')
    t = t.replace('[SÜRÜM GÜNÜ TARİHİ]', metin_tarih).replace('[RELEASE DAY DATE]', metin_tarih)
    t, k = re.subn(r'(?m)^guncelleme: \d{4}-\d{2}-\d{2}$', f'guncelleme: {iso}', t, count=1)
    open(f, 'w', encoding='utf-8').write(t)
    print(f'{os.path.basename(f)}: yer tutucu {n}, front-matter {k}')
print(f'{len(dosyalar)} dosya güncellendi, tarih {metin_tarih}. Şimdi: node build.mjs')
