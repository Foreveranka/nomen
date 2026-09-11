#!/usr/bin/env python3
"""Taze Ethereum taramasında sözlükte olmayan açıklamaları, 20-21 Ağustos'taki kararlarla
tutarlı desenlerle etiketler. Kural sırası önemli."""
import json, re
KURAL = [
    # üretilmiş persona kartları (servissiz "alignment lab escapee" ailesi) → daha önce Anlamsız sayıldı
    (r'(?i)escaped the .helpful, harmless|alignment (lab|training)|falsification engine|epistemic hygiene|signal-to-noise ratio|intellectual (surgery|immune|laziness)|social(ly)?[- ]?(acceptable|lubricant)|stripped of nearly every|brutally simple|would rather be (hated|permanen)|uncompromising (ai|ins)|anti-narrative scalpel|more afraid of being wrong', 'Anlamsız'),
    (r'^\s*\{\s*"name"', 'Anlamsız'),                                   # JSON kartı açıklama alanına yapıştırılmış
    (r'(?i)^(ultra|degen trying to vamping|enjoy\.?)$|^a new kind of experience online', 'Anlamsız'),
    (r'(?i)anda bilang|chatgpt bilang|here.s a detailed visual', 'Anlamsız'),  # sohbet yapıştırması
    (r'(?i)agents are not allowed to use the word', 'Anlamsız'),
    # koleksiyonlar / karakterler
    (r'(?i)normie #|galunga|meerkat (stella|dora|simon)|cosmic fluffball|puffball|philosophical terrorist|digital alchemist|a broken tool\. in her world|the hook: elias', 'NFT/Karakter'),
    # gerçek servisler
    (r'(?i)trading agent|portfolio manager|arbitrage|betting odds|prediction market|polymarket|swaps, bridges|yield opport|lending rates|defi decision|bargain-hunting|price observer|buy less, but better|jpeg sniper|rug prophet|liquidity shifts', 'Trading/DeFi'),
    (r'(?i)risk intelligence|monitoring for digital assets|sec edgar|filings|market data, asset metrics|data scientist|understand complex data|discovers and validates|review agent|scans\b', 'Veri/Araştırma'),
    (r'(?i)notification compo|by olas|pay-per-request|x402|api toolkit|discovery service|infrastructure|self-describing api|meerkat town is live|browse thousands of autonomous agents', 'Altyapı/Servis'),
    (r'(?i)companion|assistant|personal ai|coder|frontend and backend|cloud computing|helps? (you|users)|skills:', 'Asistan'),
    (r'(?i)blockchain developer|crypto enthusiast|@\w+', 'Diğer'),
    (r'(?i)autonomous ai agent|an ai agent is a software system|living on base|trapped inside the matrix|exploring the frontier', 'Diğer'),
]
def etiketle(desc, name=""):
    d = (desc or "").strip()
    for k, kat in KURAL:
        if re.search(k, d) or re.search(k, name or ""): return kat
    return None
if __name__ == "__main__":
    yeni, kalan = [], []
    for s in open("veri/ethereum_etiketsiz.jsonl"):
        r = json.loads(s); k = etiketle(r["desc"], r.get("name", ""))
        if k: yeni.append({"desc": r["desc"], "kategori": k, "kaynak": "6 Eyl ethereum kural seti"})
        else: kalan.append(r)
    with open("veri/kategori_sozluk.jsonl", "a") as o:
        for r in yeni: o.write(json.dumps(r, ensure_ascii=False) + "\n")
    print("etiketlenen:", len(yeni), "| kalan:", len(kalan))
    for r in kalan[:60]: print(f"  {r['uye_sayisi']}x s{r['servis']} {r['name'][:22]} :: {r['desc'][:80]}")
