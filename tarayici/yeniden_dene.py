#!/usr/bin/env python3
"""Önceki taramada geçerliyken bu taramada 'olu' çıkan kayıtları düşük hızla yeniden dener.
Amaç link çürümesini ağ geçidi yorulmasından ayırmak. Sonuçları yerinde günceller."""
import json, sys, os, socket
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import adim2_metadata as m2
from concurrent.futures import ThreadPoolExecutor, as_completed
socket.setdefaulttimeout(25)
ad = sys.argv[1]; eski_yol = sys.argv[2]
eski = {json.loads(s)["id"]: json.loads(s)["durum"] for s in open(eski_yol)}
yeni = {}
sira = []
for s in open(f"veri/{ad}_sonuc.jsonl"):
    d = json.loads(s); yeni[d["id"]] = d; sira.append(d["id"])
uri = {json.loads(s)["id"]: json.loads(s) for s in open(f"veri/{ad}_uri.jsonl")}
hedef = [uri[i] for i, d in yeni.items() if d["durum"] == "olu" and eski.get(i) == "gecerli" and i in uri]
print(f"[{ad}] yeniden denenecek: {len(hedef)}", flush=True)
kurtulan = 0
with ThreadPoolExecutor(max_workers=4) as ex:
    for fut in as_completed([ex.submit(m2.isle, k) for k in hedef]):
        try: r = fut.result()
        except Exception: continue
        if r["durum"] != "olu":
            yeni[r["id"]] = r; kurtulan += 1
print(f"[{ad}] kurtarılan: {kurtulan} / {len(hedef)}", flush=True)
with open(f"veri/{ad}_sonuc.jsonl", "w") as f:
    for i in sira: f.write(json.dumps(yeni[i], ensure_ascii=False) + "\n")
