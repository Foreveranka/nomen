"""Append the separately checked test record without presenting older records as rescanned.

Run from the repository root after recording its onchain registration and scan evidence.
The existing public snapshot, rather than a possibly older scanner workspace, is the base.
"""
import json
from pathlib import Path
from adim7_merkle import agac_kur, yaprak, kanit

ROOT = Path(__file__).resolve().parent.parent

def read(path):
    return json.loads((ROOT / path).read_text())

def write(path, value):
    (ROOT / path).write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n")

def main():
    registration = read("inceleme/test-agent-registration.json")
    evidence = read("inceleme/test-agent-scan.json")
    aid = registration["agentId"]
    assert aid == evidence["agent_id"] and all(evidence["checks"].values())
    meta = registration["metadata"]
    owner = registration["owner"].lower()
    record = {"name": meta["name"], "type": meta["type"], "desc": meta["description"],
              "owner": owner, "services": [s["endpoint"] for s in meta["services"]],
              "category": "Altyapı/Servis", "flags": ["kendi_beyani_test"],
              "metadata_source": "veri_gomulu", "hash": evidence["metadata_hash"]}
    records = read("site/veri/sepolia_gorunur.json")
    if str(aid) in records:
        assert records[str(aid)] == record, "Existing record differs; review before replacing"
        print("Demo record already included")
        return
    assert all(r["hash"] != record["hash"] for r in records.values()), "Duplicate metadata"
    records[str(aid)] = record
    catalog = read("site/public/veri/sepolia/dizin.json")
    catalog.append({"z": "sepolia", "id": aid, "n": record["name"], "t": record["type"],
                    "d": record["desc"][:300], "s": len(record["services"]), "sa": record["services"],
                    "o": owner, "k": record["category"], "e": record["flags"], "kay": record["metadata_source"]})
    owners = read("site/veri/sepolia_sahip.json")
    owners.setdefault(owner, []).append(aid)
    status_path = ROOT / "site/veri/sepolia_durum.bin"
    statuses = bytearray(status_path.read_bytes())
    if len(statuses) < aid:
        statuses.extend(bytes(aid - len(statuses)))
    assert statuses[aid - 1] == 0
    statuses[aid - 1] = 1
    previous = read("site/public/veri/sepolia/merkle.json")
    assert set(previous["kanitlar"]) == set(records) - {str(aid)}
    ids = sorted(map(int, records))
    tree = agac_kur([yaprak(i) for i in ids])
    merkle = {"zincir": "sepolia", "kok": "0x" + tree[-1][0].hex(), "sayi": len(ids),
              "kanitlar": {str(i): ["0x" + p.hex() for p in kanit(tree, n)] for n, i in enumerate(ids)}}
    index = read("site/veri/indeks.json")
    summary = read("site/public/veri/ozet.json")
    index["sepolia"]["en_yuksek_id"] = max(aid, index["sepolia"]["en_yuksek_id"])
    index["sepolia"]["gorunur"] += 1
    for snapshot in (index["sepolia"]["snapshot"], summary["snapshots"]["sepolia"]):
        snapshot.setdefault("additions", []).append(evidence)
    counts = summary["zincirler"]["sepolia"]
    counts["toplam"] += 1
    counts["gorunur"] += 1
    counts["servisli"] += 1
    counts["kategori"][record["category"]] += 1
    write("site/veri/sepolia_gorunur.json", records)
    write("site/veri/sepolia_sahip.json", owners)
    status_path.write_bytes(statuses)
    write("site/veri/indeks.json", index)
    write("site/public/veri/sepolia/dizin.json", catalog)
    write("site/public/veri/sepolia/merkle.json", merkle)
    write("site/public/veri/ozet.json", summary)
    write("site/public/veri/sepolia/demo-evidence.json", {**evidence, "registration": registration,
                                                         "previous_root": previous["kok"], "root": merkle["kok"]})
    print(f"Added agent {aid}; retained all {len(ids)-1} existing records; root {merkle['kok']}")

if __name__ == "__main__":
    main()
