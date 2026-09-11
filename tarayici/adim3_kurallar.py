#!/usr/bin/env python3
"""Adım 3: onaylı eleme kurallarını uygular ve her kayda OLGUSAL etiket verir.
Kullanım: python3 adim3_kurallar.py <zincir>

Kurallar (hepsi olgusal, yorum yok):
 1 bos_metadata   : metadata URI yok
 2 erisilemez     : URI var, link ölü
 3 kopya          : birebir aynı metadata (aynı URI veya aynı içerik hash'i); ilk basılan normal kalır
 4 eksik_alan     : type/name/description'dan biri eksik (image eksikliği sorun değil)
 - sablon_ailesi  : aynı açıklama 5'ten fazla kayıtta (etiket, eleme değil)
 - servissiz      : çağrılabilir adres yok (ibare, eleme değil)
Gizlenenler: 1,2,3,4. Görünür kalanlar dizinde çıkar.
"""
import json, os, re, sys, collections
KOK = os.environ.get("NOMEN_SCAN_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "veri"))
SABLON_ESIK = 5

# Kaydın KENDİSİNİN test/demo olduğunu söylediği durumlar. Bu bir ELEME değil, olgusal
# bir ibare: sahibi böyle yazmış. Testnetlerde kayıtların çoğu bu, dizinde işaretli görünsün.
TEST_DESENI = re.compile(
    r"\b(test|testing|demo|e2e|dummy|placeholder|lorem ipsum|sample agent|my first agent)\b", re.I)

def main():
    ad = sys.argv[1]
    kayitlar = []
    for s in open(os.path.join(KOK, f"{ad}_sonuc.jsonl")):
        try: kayitlar.append(json.loads(s))
        except Exception: pass
    kayitlar = list({r["id"]: r for r in kayitlar}.values())
    kayitlar.sort(key=lambda r: r["id"])          # deterministic lowest-id retention, not a claim about mint order

    hash_ilk = {}
    # Şablon ailesi sayımı yalnızca BENZERSİZ içerikli kayıtlar arasında yapılır; aynı hash'li
    # kopyalar zaten kural 3 ile eleniyor, aileyi şişirmemeli (2.043 kopyalı "test" kaydı
    # tek başına "aile" değildir).
    desc_sayac = collections.Counter()
    gorulen_hash = set()
    for r in kayitlar:
        if r.get("durum") != "gecerli": continue
        h = r.get("hash")
        if h and h in gorulen_hash: continue
        if h: gorulen_hash.add(h)
        d = (r.get("desc") or "").strip()
        if d: desc_sayac[d] += 1

    cikti = open(os.path.join(KOK, f"{ad}_etiketli.jsonl"), "w")
    sayac = collections.Counter()
    for r in kayitlar:
        etiketler, gizli, sebep = [], False, None
        durum = r.get("durum")
        if durum == "bos":
            gizli, sebep = True, "bos_metadata"
        elif durum == "olu":
            gizli, sebep = True, "erisilemez"
        elif durum == "json_degil":
            gizli, sebep = True, "gecersiz_json"
        elif durum == "eksik_alan":
            gizli, sebep = True, "eksik_alan"
            etiketler.append("eksik:" + ",".join(r.get("eksik") or []))
        elif durum != "gecerli":
            gizli, sebep = True, "rpc_error"
        else:
            # Kopya tespiti YALNIZCA içerik hash'i ile yapılır. URI alanı kayıtlarda
            # kısaltılmış tutulduğu için (zincire gömülü data: URI'lerin ilk 120 karakteri
            # aynı) URI karşılaştırması 5.987 farklı ajanı yanlışlıkla kopya sayıyordu.
            # Aynı URI zaten aynı içeriği verdiği için hash tek başına yeterli.
            h = r.get("hash")
            ilk = hash_ilk.get(h) if h else None
            if ilk is not None:
                gizli, sebep = True, "kopya"
                etiketler.append(f"kopyasi:{ilk}")
            else:
                if h: hash_ilk[h] = r["id"]
                d = (r.get("desc") or "").strip()
                if d and desc_sayac[d] > SABLON_ESIK:
                    etiketler.append(f"sablon_ailesi:{desc_sayac[d]}")
                if not r.get("servis"):
                    etiketler.append("ulasim_adresi_yok")
                if TEST_DESENI.search((r.get("name") or "") + " " + d):
                    etiketler.append("kendi_beyani_test")
                for e in (r.get("es_ad") or []):
                    etiketler.append("alan_yazimi:" + e)
        sayac[sebep or "gorunur"] += 1
        cikti.write(json.dumps({
            "zincir": ad, "id": r["id"], "sahip": r.get("sahip"),
            "name": r.get("name"), "type": r.get("type") or r.get("typ"), "desc": r.get("desc"),
            "servis": r.get("servis", 0), "servis_adres": r.get("servis_adres"),
            "kaynak": r.get("kaynak"), "uri": r.get("uri"), "hash": r.get("hash"),
            "gizli": gizli, "sebep": sebep, "etiketler": etiketler,
        }, ensure_ascii=False) + "\n")
    cikti.close()

    gorunur = sayac["gorunur"]
    print(f"[{ad}] toplam {len(kayitlar)}")
    for k, v in sayac.most_common():
        print(f"   {k:16s} {v:>7,} ({v*100/len(kayitlar):.1f}%)")
    print(f"[{ad}] GÖRÜNÜR: {gorunur:,}")

if __name__ == "__main__":
    main()
