#!/usr/bin/env python3
"""Adım 4: kategori etiketlerini uygular. Kategoriler onaylı şema:
Trading/DeFi, Veri/Araştırma, DAO/Yönetişim, Altyapı/Servis, Asistan,
NFT/Karakter, Sosyal/İçerik, Diğer, Anlamsız (GİZLENİR).
Etiket kaynağı: kategori_sozluk.jsonl (açıklama -> kategori).
Etiketlenmemiş açıklamaları <zincir>_etiketsiz.jsonl dosyasına yazar.
Kullanım: python3 adim4_kategori.py <zincir>"""
import json, os, sys, collections
KOK = os.environ.get("NOMEN_SCAN_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "veri"))
SOZLUK = os.path.join(os.path.dirname(os.path.abspath(__file__)), "veri", "kategori_sozluk.jsonl")

# Sözlük anahtarı: açıklamanın ilk 160 karakteri. Eski tarama (20 Ağu) açıklamayı 160'ta,
# yeni tarama 400'de kesiyor; anahtarı normalize etmezsek aynı açıklama eşleşmiyor.
def anahtar(d): return (d or "").strip()

import re
def klavye_ezmesi(d):
    """Bounded whole-description repetition; never backtrack on attacker input."""
    text = "".join(c for c in d.lower() if not c.isspace() and c not in ",.-")
    if not text: return bool(d.strip())
    for size in range(1, min(16, len(text) // 4) + 1):
        if len(text) % size == 0 and text == text[:size] * (len(text) // size):
            return True
    return False

def sozluk_yukle():
    d = {}
    if os.path.exists(SOZLUK):
        for s in open(SOZLUK):
            try:
                r = json.loads(s)
                if r.get("desc") is not None: d[anahtar(r["desc"])] = r["kategori"]
            except Exception: pass
    return d

def main():
    ad = sys.argv[1]
    soz = sozluk_yukle()
    kayitlar = [json.loads(s) for s in open(os.path.join(KOK, f"{ad}_etiketli.jsonl"))]
    etiketsiz = collections.Counter()
    ornek = {}
    sayac = collections.Counter()
    cikti = open(os.path.join(KOK, f"{ad}_final.jsonl"), "w")
    for r in kayitlar:
        d = (r.get("desc") or "").strip()
        kat = soz.get(anahtar(d))
        if not r["gizli"] and kat != "Anlamsız" and klavye_ezmesi(d):
            kat = "Anlamsız"
        if not r["gizli"]:
            if kat is None:
                if d:
                    etiketsiz[d] += 1
                    ornek.setdefault(d, r)
            elif kat == "Anlamsız":
                r["gizli"], r["sebep"] = True, "anlamsiz"
        r["kategori"] = kat
        sayac[r["sebep"] or ("gorunur/" + (kat or "etiketsiz"))] += 1
        cikti.write(json.dumps(r, ensure_ascii=False) + "\n")
    cikti.close()
    with open(os.path.join(KOK, f"{ad}_etiketsiz.jsonl"), "w") as f:
        for d, n in etiketsiz.most_common():
            o = ornek[d]
            f.write(json.dumps({"desc": d, "uye_sayisi": n, "ornek_id": o["id"],
                                "name": o.get("name"), "servis": o.get("servis", 0)}, ensure_ascii=False) + "\n")
    gorunur = sum(v for k, v in sayac.items() if k.startswith("gorunur"))
    print(f"[{ad}] görünür {gorunur:,} | etiketsiz benzersiz açıklama {len(etiketsiz):,} ({sum(etiketsiz.values()):,} kayıt)")
    for k, v in sorted(sayac.items(), key=lambda x: -x[1]): print(f"   {k:26s} {v:>7,}")

if __name__ == "__main__":
    main()
