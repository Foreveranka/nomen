#!/usr/bin/env python3
"""Publish a complete staged refresh of the previously listed Arc catalog only.
Usage: python3 publish_arc_catalog.py <staging-directory> [--apply]
The default prints the proposed change. Sepolia/ENS and Ethereum files are preserved.
"""
import json, hashlib, sys, collections, shutil
from pathlib import Path
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parent.parent
CODES={"bos_metadata":2,"erisilemez":3,"kopya":4,"eksik_alan":5,"gecersiz_json":6,"anlamsiz":7,"rpc_error":9}
def read(path): return json.loads(path.read_text())
def encode(value): return json.dumps(value,ensure_ascii=False,separators=(",",":")).encode()

def prepare(folder):
    data=ROOT/"site/veri"; public=ROOT/"site/public/veri"
    manifest=read(folder/"arc_snapshot.json")
    records=[json.loads(line) for line in (folder/"arc_final.jsonl").read_text().splitlines()]
    ids=set(manifest["requested_ids"])
    old=read(data/"arc_gorunur.json")
    assert manifest["coverage"]=="listed_catalog_refresh" and int(manifest["block"],16)>0
    assert ids==set(map(int,old))==set(r["id"] for r in records)
    assert len(records)==len(ids), "Incomplete/duplicate staged records"
    assert ids.issubset(set(read(ROOT/"subgraph/arc-scope.json")["agentIds"]))
    assert manifest["unresolved_ids"]==0, "Resolve registry errors before publishing"
    passed=[r for r in records if not r["gizli"]]
    assert passed, "No eligible records: inspect the scan before publishing"
    merkle=read(folder/"arc_merkle.json")
    assert set(map(int,merkle["kanitlar"]))==set(r["id"] for r in passed)
    binary=bytearray((data/"arc_durum.bin").read_bytes())
    hidden=read(data/"arc_gizli_ad.json")
    owners=read(data/"arc_sahip.json")
    owners={owner:[aid for aid in owned if aid not in ids] for owner,owned in owners.items()}
    owners={owner:owned for owner,owned in owners.items() if owned}
    visible={}; directory=[]; reasons=collections.Counter()
    for row in records:
        aid=row["id"]; owner=row["sahip"].lower()
        owners.setdefault(owner,[]).append(aid)
        binary[aid-1]=CODES[row["sebep"]] if row["gizli"] else 1
        if row["gizli"]:
            reasons[row["sebep"]]+=1
            hidden[str(aid)]=[(row.get("name") or "")[:40],(row.get("desc") or "")[:80]]
            continue
        hidden.pop(str(aid),None)
        visible[str(aid)]={"name":row["name"],"type":row["type"],"desc":row["desc"],"owner":owner,
            "services":row.get("servis_adres") or [],"category":row.get("kategori"),"flags":row.get("etiketler") or [],
            "metadata_source":row.get("kaynak"),"hash":row["hash"]}
        directory.append({"z":"arc","id":aid,"n":row["name"],"t":row["type"],"d":row["desc"][:300],
            "s":row.get("servis",0),"sa":row.get("servis_adres") or [],"o":owner,"k":row.get("kategori"),
            "e":row.get("etiketler") or [],"kay":row.get("kaynak")})
    manifest={**manifest,"final_sha256":hashlib.sha256((folder/"arc_final.jsonl").read_bytes()).hexdigest(),
        "rules_version":"2026-09-09","duplicate_scope":"Refreshed catalog only; legacy excluded IDs were not re-fetched","passed_ids":[r["id"] for r in passed]}
    index=read(data/"indeks.json")
    index["arc"]={**index["arc"],"gorunur":len(passed),"snapshot":manifest}
    summary=read(public/"ozet.json"); arc=summary["zincirler"]["arc"]
    arc["gorunur"]=len(passed);arc["servisli"]=sum(bool(r.get("servis")) for r in passed)
    arc["kategori"]=dict(collections.Counter(r.get("kategori") or "Etiketsiz" for r in passed))
    for reason,count in reasons.items():arc["elenen"][reason]=arc["elenen"].get(reason,0)+count
    summary["snapshots"]["arc"]=manifest;summary["exported_at"]=datetime.now(timezone.utc).isoformat()
    writes={data/"arc_durum.bin":bytes(binary),data/"arc_gorunur.json":encode(visible),data/"arc_gizli_ad.json":encode(hidden),
        data/"arc_sahip.json":encode(owners),data/"indeks.json":encode(index),public/"ozet.json":encode(summary),
        public/"arc/dizin.json":encode(directory),public/"arc/merkle.json":encode(merkle),public/"arc/catalog-refresh.json":encode(manifest)}
    return writes,{"requested":len(ids),"passing":len(passed),"withheld":dict(reasons),"block":int(manifest["block"],16)}

if __name__=="__main__":
    folder=Path(sys.argv[1]).resolve();writes,report=prepare(folder);print(json.dumps(report))
    if "--apply" not in sys.argv:sys.exit(0)
    # Archive exact prior bytes before replacing anything. Never regenerate other chains.
    backup=folder/"published-before";backup.mkdir(exist_ok=True)
    for path in writes:
        if path.exists():
            saved=backup/path.relative_to(ROOT);saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,saved)
    for path,content in writes.items():
        path.parent.mkdir(parents=True,exist_ok=True);temp=path.with_suffix(path.suffix+".tmp");temp.write_bytes(content);temp.replace(path)
    (ROOT/"inceleme/arc-catalog-refresh.json").write_text(json.dumps({"checkedAt":datetime.now(timezone.utc).isoformat(),**report},indent=2))
    print("Arc catalog refresh published locally; other chains preserved.")
