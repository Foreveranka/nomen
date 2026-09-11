#!/usr/bin/env python3
"""Arc açıklamalarını onaylı kategori şemasına göre etiketler."""
import json, re

KURAL = [
    (r'(?i)^listed$|^auto-generated agent for arc testnet farming$', 'Anlamsız'),
    # klavye ezmesi ve tek kelimelik dolgular
    (r'^.{0,4}$', 'Anlamsız'),
    (r'(?i)^(sare|sad|sdf|opit ?(100%|lah)?|hgjgjgjgj|lfg|das|dawd\w*|sdawe\w*|asdawe\w*|sadawe?\w*|sekolah|pulang sayang|tes|aden|6+|agent|skill|sat|s)$', 'Anlamsız'),
    (r'^<\|"\|', 'Anlamsız'),
    (r'(?i)^(profesor web3|crypto rc 88|trade|liquidity_monitoring)$', 'Anlamsız'),
    (r'(?i)market agent|fx agent|defi agent|trading agent|arbitrage agent|liquidity agent|yield agent|swaps, pools|payment agent|settlement agent', 'Trading/DeFi'),
    (r'(?i)payment assistant|vendor payouts|invoice review', 'Trading/DeFi'),
    (r'(?i)monitoring agent|analytics agent|nghiên cứu|trích xuất dữ liệu|sentiment|scanner|phân tích|whitepaper|research|báo cáo|tổng hợp', 'Veri/Araştırma'),
    (r'(?i)evaluator|escrow|arbitrat|dispute', 'DAO/Yönetişim'),
    (r'(?i)task runner|orchestrator|coordination|registered via|wallet-linked erc-8004 identity|identity for 0x|signing firewall|audit-logged|worker', 'Altyapı/Servis'),
    (r'(?i)assistant|guide|helps? |ai tool that can perform tasks', 'Asistan'),
    # ikinci geçiş
    (r'(?i)security analysis|scam patterns|risk scoring|smart money tracking|prediction market intelligence|probability estimates', 'Veri/Araştırma'),
    (r'(?i)portfolio rebalancer|nft sniper|liquidation protection|collateral routing|perp traders|committing usdc|arbitrage opportunity|dex', 'Trading/DeFi'),
    (r'(?i)demo erc-8004 identity|swarmpay autonomous agent', 'Altyapı/Servis'),
]

def etiketle(desc, name=""):
    d = (desc or "").strip()
    for k, kat in KURAL:
        if re.search(k, d) or re.search(k, name or ""):
            return kat
    return None

if __name__ == "__main__":
    yeni, kalan = [], []
    for s in open("veri/arc_etiketsiz.jsonl"):
        r = json.loads(s)
        k = etiketle(r["desc"], r.get("name", ""))
        if k: yeni.append({"desc": r["desc"], "kategori": k, "kaynak": "6 Eyl arc kural seti"})
        else: kalan.append(r)
    with open("veri/kategori_sozluk.jsonl", "a") as o:
        for r in yeni: o.write(json.dumps(r, ensure_ascii=False) + "\n")
    json.dump(kalan, open("veri/arc_kalan.json", "w"), ensure_ascii=False)
    print("etiketlenen:", len(yeni), "| kalan:", len(kalan))
