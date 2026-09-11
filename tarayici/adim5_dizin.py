#!/usr/bin/env python3
"""Adım 5: dizin verisini siteye aktarır.
Çıktılar (site/public/veri/):
  ozet.json      : ana sayfa sayaçları ve dağılımlar
  dizin.json     : görünür ajanların arama listesi (kompakt)
  ajan/<zincir>-<id>.json parçalı değil; detay dizin.json içinde taşınır
  gizli_ornek.json: şeffaflık sayfası için her eleme sebebinden örnekler
Kullanım: python3 adim5_dizin.py [zincir ...]"""
import json, os, sys, collections
KOK = os.environ.get("NOMEN_SCAN_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "veri"))
CIKTI = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site", "public", "veri"))
os.makedirs(CIKTI, exist_ok=True)

def main():
    zincirler = sys.argv[1:] or ["ethereum", "arc"]
    dizin, ozet, gizli_ornek = [], {}, collections.defaultdict(list)
    for z in zincirler:
        yol = os.path.join(KOK, f"{z}_final.jsonl")
        if not os.path.exists(yol):
            raise FileNotFoundError(yol)
        sayac, kat, gorunur, servisli = collections.Counter(), collections.Counter(), 0, 0
        toplam = 0
        for s in open(yol):
            r = json.loads(s); toplam += 1
            if r.get("sahip") == "0x0x": r = dict(r, gizli=True, sebep="rpc_error", sahip=None)
            if r["gizli"]:
                sayac[r["sebep"]] += 1
                if sum(o["zincir"] == z for o in gizli_ornek[r["sebep"]]) < 6:
                    gizli_ornek[r["sebep"]].append({"zincir": z, "id": r["id"], "name": r.get("name"),
                        "desc": (r.get("desc") or "")[:160], "etiketler": r.get("etiketler")})
                continue
            gorunur += 1
            kat[r.get("kategori") or "Etiketsiz"] += 1
            if r.get("servis"): servisli += 1
            dizin.append({
                "z": z, "id": r["id"], "n": r.get("name") or "", "t": r.get("type") or "",
                "d": (r.get("desc") or "")[:300], "s": r.get("servis") or 0,
                "sa": (r.get("servis_adres") or []), "o": r.get("sahip"),
                "k": r.get("kategori"), "e": r.get("etiketler") or [], "kay": r.get("kaynak"),
            })
        ozet[z] = {"toplam": toplam, "gorunur": gorunur, "servisli": servisli,
                   "elenen": dict(sayac), "kategori": dict(kat)}
        print(f"[{z}] toplam {toplam:,} | görünür {gorunur:,} | çağrılabilir {servisli:,}")
    from datetime import datetime, timezone
    old_path = os.path.join(CIKTI, "ozet.json")
    old = json.load(open(old_path)) if os.path.exists(old_path) else {}
    snapshots = {}
    for z in zincirler:
        manifest = os.path.join(KOK, f"{z}_snapshot.json")
        snapshots[z] = json.load(open(manifest)) if os.path.exists(manifest) else {"started_at": None, "coverage": "legacy_unverified"}
    dates = [v["started_at"] for v in snapshots.values() if v.get("started_at")]
    json.dump({"zincirler": ozet, "guncelleme": min(dates) if len(dates) == len(zincirler) else old.get("guncelleme", "unknown"), "exported_at": datetime.now(timezone.utc).isoformat(), "snapshots": snapshots}, open(old_path, "w"), ensure_ascii=False, indent=1)
    # Ağ başına ayrı dosya: arayüz yalnızca seçili ağın verisini çeker.
    for z in zincirler:
        kl = os.path.join(CIKTI, z); os.makedirs(kl, exist_ok=True)
        parca = [a for a in dizin if a["z"] == z]
        json.dump(parca, open(os.path.join(kl, "dizin.json"), "w"), ensure_ascii=False, separators=(",", ":"))
        json.dump({k: [o for o in v if o["zincir"] == z] for k, v in gizli_ornek.items()},
                  open(os.path.join(kl, "gizli_ornek.json"), "w"), ensure_ascii=False, indent=1)
        merkle = os.path.join(KOK, f"{z}_merkle.json")
        if os.path.exists(merkle):
            import shutil; shutil.copy(merkle, os.path.join(kl, "merkle.json"))
        mb = os.path.getsize(os.path.join(kl, "dizin.json")) / 1e6
        print(f"[{z}] {len(parca):,} kayıt, {mb:.1f} MB → {kl}/")
    for eski in ("dizin.json", "gizli_ornek.json"):
        yol = os.path.join(CIKTI, eski)
        if os.path.exists(yol): os.remove(yol)

if __name__ == "__main__":
    main()
