#!/usr/bin/env python3
"""Adım 6: API'nin sorgulayacağı kompakt veriyi üretir.
  <zincir>_durum.bin : her ajan kimliği için 1 bayt durum kodu (indeks = id-1)
  <zincir>_gorunur.json : görünür ajanların tam kaydı (id -> detay)
Kullanım: python3 adim6_api_veri.py <zincir> ..."""
import json, os, sys, re
KOK = os.environ.get("NOMEN_SCAN_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "veri"))
CIKTI = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site", "veri"))
os.makedirs(CIKTI, exist_ok=True)

KOD = {"gorunur": 1, "bos_metadata": 2, "erisilemez": 3, "kopya": 4,
       "eksik_alan": 5, "gecersiz_json": 6, "anlamsiz": 7, "rpc_error": 9}

def main():
    kodlar = {"_kodlar": {v: k for k, v in KOD.items()}}
    for z in sys.argv[1:]:
        yol = os.path.join(KOK, f"{z}_final.jsonl")
        if not os.path.exists(yol):
            raise FileNotFoundError(yol)
        kayitlar = [json.loads(s) for s in open(yol)]
        en_yuksek = max(r["id"] for r in kayitlar)
        buf = bytearray(en_yuksek)          # 0 = unknown / not conclusively scanned
        gorunur = {}
        for r in kayitlar:
            sebep = r["sebep"] if r["gizli"] else "gorunur"
            buf[r["id"] - 1] = 9 if r.get("sahip") == "0x0x" else KOD.get(sebep, 0)
            if not r["gizli"] and r.get("sahip") != "0x0x":
                gorunur[str(r["id"])] = {
                    "name": r.get("name"), "type": r.get("type"), "desc": r.get("desc"),
                    "owner": r.get("sahip"), "services": r.get("servis_adres") or [],
                    "category": r.get("kategori"), "flags": r.get("etiketler") or [],
                    "metadata_source": r.get("kaynak"), "hash": r.get("hash"),
                }
        open(os.path.join(CIKTI, f"{z}_durum.bin"), "wb").write(bytes(buf))
        # Sahip indeksi: adres → [id...] (toplu sorgu ve "bu cüzdanın ajanları" için)
        sahip = {}
        for r in kayitlar:
            a = (r.get("sahip") or "").lower()
            if re.fullmatch(r"0x[0-9a-f]{40}", a) and a != "0x" + "0" * 40: sahip.setdefault(a, []).append(r["id"])
        json.dump(sahip, open(os.path.join(CIKTI, f"{z}_sahip.json"), "w"), separators=(",", ":"))
        # Elenenlerin adı/açıklaması (metadata'sı olanlar için), sebep filtreli liste sayfası için
        gizli_ad = {}
        cok = sum(1 for r in kayitlar if r["gizli"]) > 100_000   # Arc gibi devasa zincirlerde açıklama taşınmaz
        for r in kayitlar:
            if r["gizli"] and (r.get("name") or r.get("desc")):
                gizli_ad[str(r["id"])] = [(r.get("name") or "")[:40], "" if cok else (r.get("desc") or "")[:80]]
        json.dump(gizli_ad, open(os.path.join(CIKTI, f"{z}_gizli_ad.json"), "w"), ensure_ascii=False, separators=(",", ":"))
        print(f"[{z}] sahip indeksi {len(sahip):,} adres | elenen adlı {len(gizli_ad):,}")
        json.dump(gorunur, open(os.path.join(CIKTI, f"{z}_gorunur.json"), "w"),
                  ensure_ascii=False, separators=(",", ":"))
        manifest = os.path.join(KOK, f"{z}_snapshot.json")
        kodlar[z] = {"en_yuksek_id": en_yuksek, "gorunur": len(gorunur), "snapshot": json.load(open(manifest)) if os.path.exists(manifest) else {"coverage": "legacy_unverified", "started_at": None}}
        print(f"[{z}] durum.bin {en_yuksek:,} bayt | görünür {len(gorunur):,}")
    json.dump(kodlar, open(os.path.join(CIKTI, "indeks.json"), "w"), ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()
