#!/usr/bin/env python3
"""Adım 1: bir zincirdeki tüm ajanların tokenURI + sahip adresini batch JSON-RPC ile çeker.
Kullanım: python3 adim1_uri.py <zincir> [son_id]
Kaldığı yerden devam eder, dosyaya ekleyerek yazar."""
import re
import json, urllib.request, time, sys, os, itertools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zincirler import ZINCIRLER

KOK = os.environ.get("NOMEN_SCAN_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "veri"))
BATCH = 100

def rpc_cagir(rpclar, payload, deneme=6):
    son = None
    for i in range(deneme):
        rpc = rpclar[0] if i == 0 else rpclar[i % len(rpclar)]
        try:
            req = urllib.request.Request(rpc, data=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"})
            return json.load(urllib.request.urlopen(req, timeout=60))
        except Exception as e:
            son = e
            time.sleep(min(2 ** i, 30))
    raise IOError(f"rpc başarısız: {son}")

def coz_string(hexres):
    try:
        raw = bytes.fromhex(hexres[2:])
        if len(raw) < 64 or int.from_bytes(raw[:32], "big") != 32: return None
        n = int.from_bytes(raw[32:64], "big")
        if len(raw) < 64 + ((n + 31) // 32) * 32: return None
        return raw[64:64 + n].decode("utf-8")
    except Exception:
        return None

def coz_adres(hexres):
    if not isinstance(hexres, str) or not re.fullmatch(r"0x0{24}[0-9a-fA-F]{40}", hexres): return None
    address = "0x" + hexres[-40:].lower()
    return address if address != "0x" + "0" * 40 else None

def en_yuksek_id(z, tahmin=1000):
    def var_mi(aid):
        r = rpc_cagir(z["rpc"], [{"jsonrpc": "2.0", "id": 1, "method": "eth_call",
            "params": [{"to": z["identity"], "data": "0x6352211e" + hex(aid)[2:].zfill(64)}, "latest"]}])
        return "result" in r[0] and r[0]["result"] not in ("0x", "0x" + "0" * 64)
    lo, hi = 1, tahmin
    while var_mi(hi): lo, hi = hi, hi * 2
    while lo + 1 < hi:
        m = (lo + hi) // 2
        if var_mi(m): lo = m
        else: hi = m
    return lo

def main():
    ad = sys.argv[1]
    z = ZINCIRLER[ad]
    if len(sys.argv) < 3: raise SystemExit("Explicit highest id required; ownerOf binary search is unsafe for sparse registries")
    son_id = int(sys.argv[2])
    if son_id < 1: raise SystemExit("highest id must be positive")
    block_reply = rpc_cagir(z["rpc"], {"jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": []})
    block = block_reply.get("result")
    if not isinstance(block, str) or not re.fullmatch(r"0x[0-9a-fA-F]+", block): raise IOError("Could not pin block")
    os.makedirs(KOK, exist_ok=True)
    manifest_path = os.path.join(KOK, f"{ad}_snapshot.json")
    if os.path.exists(manifest_path):
        previous = json.load(open(manifest_path))
        block = previous["block"]
    else:
        from datetime import datetime, timezone
        json.dump({"chain": ad, "block": block, "started_at": datetime.now(timezone.utc).isoformat(), "highest_requested_id": son_id, "coverage": "explicit_id_range"}, open(manifest_path, "w"), indent=2)
    cikti = os.path.join(KOK, f"{ad}_uri.jsonl")
    bitti = set()
    if os.path.exists(cikti):
        for satir in open(cikti):
            try:
                row = json.loads(satir)
                if row.get("uri") is not None and coz_adres("0x" + "0" * 24 + (row.get("sahip") or "")[2:]): bitti.add(row["id"])
            except Exception: pass
    print(f"[{ad}] son id {son_id}, elde {len(bitti)} kayıt", flush=True)
    kalan = [i for i in range(1, son_id + 1) if i not in bitti]
    if not kalan:
        print(f"[{ad}] ADIM 1 zaten tam", flush=True); return
    f = open(cikti, "a")
    for bas in range(0, len(kalan), BATCH):
        parca = kalan[bas:bas + BATCH]
        istek = []
        for aid in parca:
            istek.append({"jsonrpc": "2.0", "id": aid, "method": "eth_call",
                "params": [{"to": z["identity"], "data": "0xc87b56dd" + hex(aid)[2:].zfill(64)}, block]})
            istek.append({"jsonrpc": "2.0", "id": 10 ** 9 + aid, "method": "eth_call",
                "params": [{"to": z["identity"], "data": "0x6352211e" + hex(aid)[2:].zfill(64)}, block]})
        try:
            cevap = rpc_cagir(z["rpc"], istek)
        except Exception as e:
            print(f"[{ad}] BATCH ATLANDI {parca[0]}-{parca[-1]}: {e}", flush=True)
            continue
        # Bazı RPC'ler hata durumunda dizi yerine tek bir nesne ya da metin döndürüyor.
        if not isinstance(cevap, list):
            print(f"[{ad}] BEKLENMEYEN YANIT {parca[0]}-{parca[-1]}: {str(cevap)[:120]}", flush=True)
            time.sleep(2)
            continue
        uri, sahip = {}, {}
        for r in cevap:
            if not isinstance(r, dict):
                continue
            rid = r.get("id")
            if rid is None: continue
            if rid >= 10 ** 9: sahip[rid - 10 ** 9] = coz_adres(r.get("result", "0x"))
            else: uri[rid] = coz_string(r.get("result", "0x")) if "result" in r else None
        for aid in parca:
            if uri.get(aid) is None or sahip.get(aid) is None: continue
            f.write(json.dumps({"id": aid, "uri": uri.get(aid), "sahip": sahip.get(aid)}) + "\n")
        f.flush()
        if (bas // BATCH) % 20 == 0:
            print(f"[{ad}] {bas + len(parca)}/{len(kalan)}", flush=True)
        time.sleep(0.15)
    f.close()
    scanned = set()
    for line in open(cikti):
        record = json.loads(line)
        if record.get("uri") is not None and record.get("sahip"): scanned.add(record["id"])
    manifest = json.load(open(manifest_path))
    manifest.update(successful_ids=len(scanned), unresolved_ids=son_id - len(scanned))
    json.dump(manifest, open(manifest_path, "w"), indent=2)
    print(f"[{ad}] successful={len(scanned)} unresolved={son_id-len(scanned)}", flush=True)

if __name__ == "__main__":
    main()
