#!/usr/bin/env python3
"""Adım 7: kurallardan geçen ajanların merkle ağacını kurar.
Kontrattaki _leaf/_verify ile birebir aynı: yaprak keccak(keccak(abi.encode(uint256))),
düğüm keccak(abi.encode(sirali_ikili)). Çıktı kanıtlarla birlikte, herkes yeniden üretebilsin diye.
Kullanım: python3 adim7_merkle.py <zincir>"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ens_kontrol import keccak

KOK = os.environ.get("NOMEN_SCAN_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "veri"))

def u256(n): return n.to_bytes(32, "big")

def yaprak(agent_id): return keccak(keccak(u256(agent_id)))

def ikili(a, b): return keccak(a + b) if a <= b else keccak(b + a)

def agac_kur(yapraklar):
    katmanlar = [list(yapraklar)]
    while len(katmanlar[-1]) > 1:
        onceki = katmanlar[-1]
        yeni = []
        for i in range(0, len(onceki), 2):
            yeni.append(ikili(onceki[i], onceki[i + 1]) if i + 1 < len(onceki) else onceki[i])
        katmanlar.append(yeni)
    return katmanlar

def kanit(katmanlar, indeks):
    p = []
    for k in katmanlar[:-1]:
        es = indeks ^ 1
        if es < len(k): p.append(k[es])
        indeks //= 2
    return p

def main():
    ad = sys.argv[1]
    idler = sorted(json.loads(s)["id"] for s in open(os.path.join(KOK, f"{ad}_final.jsonl")) if not json.loads(s)["gizli"] and json.loads(s).get("sahip") != "0x0x")
    if not idler:
        json.dump({"zincir": ad, "kok": "0x" + "0" * 64, "sayi": 0, "kanitlar": {}}, open(os.path.join(KOK, f"{ad}_merkle.json"), "w"))
        print(f"[{ad}] uygun ajan yok"); return
    yapraklar = [yaprak(i) for i in idler]
    katmanlar = agac_kur(yapraklar)
    kok = katmanlar[-1][0]
    cikti = {"zincir": ad, "kok": "0x" + kok.hex(), "sayi": len(idler),
             "kanitlar": {str(i): ["0x" + p.hex() for p in kanit(katmanlar, n)] for n, i in enumerate(idler)}}
    yol = os.path.join(KOK, f"{ad}_merkle.json")
    json.dump(cikti, open(yol, "w"), separators=(",", ":"))
    print(f"[{ad}] kök {cikti['kok']} | {len(idler):,} uygun ajan | derinlik {len(katmanlar)-1} → {yol}")

if __name__ == "__main__":
    main()
