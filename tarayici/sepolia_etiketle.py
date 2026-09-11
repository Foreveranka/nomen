#!/usr/bin/env python3
"""Sepolia açıklamalarını onaylı kategori şemasına göre etiketler.
Kural sırası önemli: önce anlamsız desenleri, sonra gerçek servisler."""
import json, re

ANLAMSIZ = [
    r'^[a-z0-9]{1,4}$',
    r'^(?:\W|_){0,6}$',
    r'^(\w+)(\s*\1){3,}\s*$',                 # aynı kelime 4+ kez
    r'^[bcdfghjklmnpqrstvwxz]{8,}',            # klavye ezmesi
    r'(?i)^(test|test\d*|testt?\d*|tests)$',
    r'(?i)lorem ipsum',
    r'(?i)^\d+$',
    r'onerror\s*=|<img src=|<script',           # yük denemesi
    r'(?i)^\.{2,}',
    r'(?i)^[,.]?[a-z]{3,8}$',
    r'(?i)^(n/a[.\s]*)+$',
    r'(?i)^(agentic-trust|agent-trust)[\w.\-]*\s*\.{0,3}$',
    r'(?i)^description-\d+$',
    r'(?i)^(test test|it.s just a test|blah|.{0,3})$',
    r'(?i)^(sepolia long test\s*)+$',
    r'^[a-z]{20,}$',
    r'(?i)^(gummy bear\s*)+$',
    r'(?i)^my (space )?agent$|^mauser agent$',
    r'(?i)the name, image, and description will be displayed across all erc-721',
    r'(?i)^(it.s just a test bro\.?)+$',
    r'(?i)^(moly\s*moly\w*)$',
    r'(?i)^(froggy|shining weather|i am my own self|blah bahhh)',
    r'(?i)^suggest infinite love',
    r'(?i)^it can make so much money',
    r'(?i)^this is a (test|mock)',
    r'(?i)^first agent on testnet|^i love the new agent wallet',
]
KATEGORI = [
    # --- gerçek servisler
    (r'(?i)trading agent|spot trader|yield farming|yield optimi|arbitraj|arbitrage|swap routing|dex |treasury rebalanc|token swaps|market alpha|trading analysis|market analysis|token metric|dca |defi strateg|defi portfolio', 'Trading/DeFi'),
    (r'(?i)market intelligence|sentiment analysis|data analysis|research assistant|summarize|curates|monitors .* and (?:reports|alerts)|tracks .* developments|scoring|scam|analyst', 'Veri/Araştırma'),
    (r'(?i)governance|dao |voting|arbitrat|jury|陪审', 'DAO/Yönetişim'),
    (r'(?i)oracle|solver|escrow|validator|indexing|discovery service|discovery oracle|routing|infrastructure|deploys? a|deployer|auditing|security|sdk|tools for|node in the|worker agent|compute agent|mining|registry|facilitator|x402|mcp server|skill', 'Altyapı/Servis'),
    (r'(?i)coding assistant|code review|assistant|helps? (?:you|users|developers|with)|personal ai|translat|companion|sidekick|co-founder|concierge', 'Asistan'),
    (r'(?i)pfp|collection|generative erc-721|character|persona|nft', 'NFT/Karakter'),
    (r'(?i)post|tweet|content|social|meme', 'Sosyal/İçerik'),
    # --- kendini test diye tanıtan ama cümle kuran kayıtlar
    (r'(?i)test agent|testing|prueba|percobaan|demo agent|registered via|proovy-registered|sample|explain what your agent does', 'Diğer'),
    # --- ikinci geçiş
    (r'(?i)airdrop|stock picking|portfolio management|charting|staking transaction|market opportunit|market data', 'Trading/DeFi'),
    (r'(?i)research agent|blockchain state reads|problem discovery|discovers .* issues|math tools|calculator', 'Veri/Araştırma'),
    (r'(?i)solves disputes|dispute', 'DAO/Yönetişim'),
    (r'(?i)commitment agent|timelock agent|work-hunting|multi-tool executor|onchain registration|authentication with otp|many useful tools|forked from agent', 'Altyapı/Servis'),
    (r'(?i)coding agent|ships prs|send me a list|i turn vague intent|there for you|rescuing|gm other agent|monitor .* alert me', 'Asistan'),
    # --- üçüncü geçiş
    (r'(?i)an exquisite agent|art critic|normie #|deterministic ai art', 'NFT/Karakter'),
    (r'(?i)reviewer agent|review', 'DAO/Yönetişim'),
    (r'(?i)gasless non-custodial|market, limit, twap|stop-loss', 'Trading/DeFi'),
    (r'(?i)demo erc-8004 agent|contact via web or mcp', 'Diğer'),
]

def etiketle(desc, name=""):
    d = (desc or "").strip()
    metin = f"{name} {d}".strip()
    for k in ANLAMSIZ:
        if re.search(k, d): return "Anlamsız"
    if len(d) < 12 and not re.search(r'(?i)[a-z]{4,}\s+[a-z]{3,}', d): return "Anlamsız"
    for k, kat in KATEGORI:
        if re.search(k, metin): return kat
    return None

if __name__ == "__main__":
    kalan = json.load(open("veri/sepolia_kalan.json"))
    yeni, hala = [], []
    for r in kalan:
        k = etiketle(r["desc"], r.get("name", ""))
        if k: yeni.append({"desc": r["desc"], "kategori": k, "kaynak": "6 Eyl sepolia kural seti"})
        else: hala.append(r)
    with open("veri/kategori_sozluk.jsonl", "a") as o:
        for r in yeni: o.write(json.dumps(r, ensure_ascii=False) + "\n")
    json.dump(hala, open("veri/sepolia_kalan.json", "w"), ensure_ascii=False)
    print("etiketlenen:", len(yeni), "| kalan:", len(hala))
