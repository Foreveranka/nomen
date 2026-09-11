#!/usr/bin/env python3
"""Stage a pinned refresh of NOMEN's listed Arc IDs, never a claim of a full registry rescan.
Run from any directory. Publication is separate; existing published data is untouched.
"""
import json, os, sys, time, subprocess
from pathlib import Path
from datetime import datetime, timezone
from adim1_uri import coz_string, coz_adres

ROOT = Path(__file__).resolve().parent.parent
RPC = "https://rpc.testnet.arc.network"
REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e"

def rpc(payload):
    for attempt in range(6):
        try:
            transport = subprocess.run(["node", str(ROOT / "tarayici/arc_rpc.mjs")],
                input=json.dumps(payload), text=True, capture_output=True, timeout=30, check=True)
            result = json.loads(transport.stdout)
            rows = result if isinstance(result, list) else [result]
            if any(r.get("error", {}).get("code") == -32005 for r in rows):
                raise IOError("rate limited")
            return result
        except Exception:
            if attempt == 5: raise
            time.sleep(2 * (attempt + 1))

def main():
    ids = sorted(map(int, json.loads((ROOT / "site/veri/arc_gorunur.json").read_text())))
    block = rpc({"jsonrpc":"2.0", "id":1, "method":"eth_blockNumber", "params":[]})["result"]
    chain = rpc({"jsonrpc":"2.0", "id":2, "method":"eth_chainId", "params":[]})["result"]
    assert int(chain,16) == 5042002
    checked = datetime.now(timezone.utc).isoformat()
    folder = ROOT / "tarayici/snapshots" / (datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-arc-catalog")
    folder.mkdir(parents=True)
    manifest = {"chain":"arc", "chain_id":5042002, "block":block, "started_at":checked,
        "coverage":"listed_catalog_refresh", "requested_ids":ids, "requested_count":len(ids),
        "metadata_observation":"HTTP documents fetched after pinned ownership/URI block; offchain contents are not block-pinned",
        "unrefreshed_records":"All IDs outside requested_ids retain their legacy observations; this is not a full registry rescan."}
    (folder / "arc_snapshot.json").write_text(json.dumps(manifest,indent=2))
    (ROOT / "inceleme/arc-refresh-location.json").write_text(json.dumps({"directory":str(folder)},indent=2))
    successful = 0
    with (folder / "arc_uri.jsonl").open("w") as output:
        for start in range(0,len(ids),2):
            batch=ids[start:start+2]; payload=[]
            for aid in batch:
                for offset,selector in [(0,"0xc87b56dd"),(10**9,"0x6352211e")]:
                    payload.append({"jsonrpc":"2.0","id":offset+aid,"method":"eth_call", "params":[{"to":REGISTRY,"data":selector+format(aid,"064x")},block]})
            replies=rpc(payload)
            if not isinstance(replies,list): raise IOError("Unexpected batch reply")
            by_id={r["id"]:r for r in replies}
            for aid in batch:
                uri=coz_string(by_id.get(aid,{}).get("result","0x"))
                owner=coz_adres(by_id.get(10**9+aid,{}).get("result","0x"))
                ok=uri is not None and owner is not None
                successful += int(ok)
                output.write(json.dumps({"id":aid,"uri":uri,"sahip":owner,"rpc_status":"ok" if ok else "rpc_error"})+"\n")
            output.flush(); print(f"Arc registry: {start+len(batch)}/{len(ids)}",flush=True);time.sleep(1)
    manifest.update(successful_ids=successful, unresolved_ids=len(ids)-successful)
    (folder / "arc_snapshot.json").write_text(json.dumps(manifest,indent=2))
    if successful < len(ids)*0.9: raise IOError("Too many unresolved registry reads; staging stopped")
    env={**os.environ,"NOMEN_SCAN_DIR":str(folder)}
    for step in ["adim2_metadata.py","adim3_kurallar.py","adim4_kategori.py","adim7_merkle.py"]:
        subprocess.run([sys.executable,str(ROOT/"tarayici"/step),"arc"],env=env,check=True)
    print(f"Staged Arc refresh: {folder}",flush=True)

if __name__ == "__main__": main()
