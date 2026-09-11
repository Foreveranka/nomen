#!/usr/bin/env python3
"""Adım 2: URI'leri indirip ERC-8004 zorunlu alanlarına göre sınıflandırır.
Kullanım: python3 adim2_metadata.py <zincir>
Durumlar: bos / gecerli / eksik_alan / olu / json_degil
Kaynaklar: veri_gomulu (data:) / json_yapistirilmis / uzak"""
import urllib.parse
from guvenli_http import fetch
import json, base64, hashlib, urllib.request, socket, os, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed

socket.setdefaulttimeout(8)
KOK = os.environ.get("NOMEN_SCAN_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "veri"))
IPFS = ["https://ipfs.io/ipfs/", "https://cloudflare-ipfs.com/ipfs/", "https://gateway.pinata.cloud/ipfs/"]
ZORUNLU = ["type", "name", "description", "image"]

# Aynı alanın ekosistemde kullanılan diğer yazımları. Bunlar YORUM değil, belgelenmiş
# eş adlar: Arc'ın resmi "Register your first AI Agent" eğitimi metadata'yı `agent_type`
# ile yazdırıyor, ERC-8004 metni ise `type` diyor. Alan mevcutsa mevcut sayılır; hangi
# yazımın kullanıldığı kayda ayrıca işlenir, okuyucudan gizlenmez.
ES_ADLAR = {
    "type": ["type", "agent_type", "agentType"],
    "description": ["description", "bio"],
    "name": ["name"],
    "image": ["image"],
}

def alan_oku(m, alan):
    """Alanın değerini ve hangi yazımdan geldiğini döndürür."""
    for ad in ES_ADLAR.get(alan, [alan]):
        v = m.get(ad)
        if isinstance(v, str) and v.strip():
            return str(v), ad
    return "", None

def indir(url):
    if url.startswith("ipfs://"):
        cid = url[7:]
        for gw in IPFS:
            try:
                return fetch(gw + cid)
            except Exception:
                continue
        raise IOError("ipfs erişilemedi")
    return fetch(url)

def isle(kayit):
    aid, uri, sahip = kayit["id"], (kayit.get("uri") or "").strip(), kayit.get("sahip")
    temel = {"id": aid, "sahip": sahip}
    if kayit.get("rpc_status") == "rpc_error" or kayit.get("uri") is None:
        return dict(temel, durum="rpc_error")
    if not uri:
        return dict(temel, durum="bos")
    if uri.startswith("data:"):
        try:
            govde = uri.split(",", 1)[1]
            ham = base64.b64decode(govde + "===") if ";base64" in uri.split(",", 1)[0] else urllib.parse.unquote(govde).encode()
            kaynak = "veri_gomulu"
        except Exception:
            return dict(temel, durum="json_degil", uri=uri[:80])
    elif uri.lstrip().startswith("{"):
        ham, kaynak = uri.encode(), "json_yapistirilmis"
    elif uri.startswith(("http://", "https://", "ipfs://")):
        try:
            ham, kaynak = indir(uri), "uzak"
        except Exception:
            return dict(temel, durum="olu", uri=uri[:120])
    else:
        return dict(temel, durum="json_degil", uri=uri[:80])
    if len(ham) > 200_000: return dict(temel, durum="olu", error="metadata_too_large")
    try:
        m = json.loads(ham.decode("utf-8", errors="replace"))
        if not isinstance(m, dict): raise ValueError
    except Exception:
        return dict(temel, durum="json_degil", kaynak=kaynak, uri=uri[:120])
    degerler, kullanilan = {}, {}
    for a in ZORUNLU:
        degerler[a], kullanilan[a] = alan_oku(m, a)
    eksik = [a for a in ZORUNLU if not degerler[a]]
    es_ad_kullanimi = [f"{kullanilan[a]}→{a}" for a in ZORUNLU if kullanilan[a] and kullanilan[a] != a]
    servisler = m.get("services") or m.get("endpoints") or []
    if isinstance(servisler, dict): servisler = list(servisler.values())
    adresler = []
    for service in servisler if isinstance(servisler, list) else []:
        endpoint = service if isinstance(service, str) else (service.get("endpoint") or service.get("url")) if isinstance(service, dict) else None
        if isinstance(endpoint, str):
            try:
                parsed = urllib.parse.urlsplit(endpoint)
                if parsed.scheme in ("https", "http") and parsed.hostname and not parsed.username and not parsed.password:
                    adresler.append(endpoint)
            except ValueError: pass
    adresler = list(dict.fromkeys(adresler))
    servis_sayi = len(adresler)
    # DİKKAT: hash TÜM metadata içeriği üzerinden alınır, sadece zorunlu alanlar değil.
    # Aksi halde kullanıcı başına üretilen meşru ajanlar (aynı ad/açıklama, farklı servis adresi)
    # yanlışlıkla "kopya" sayılıyor. Kural 3 birebir aynı metadata'yı hedefliyor.
    icerik = hashlib.sha256(ham).hexdigest()
    archive = os.path.join(KOK, "raw")
    os.makedirs(archive, exist_ok=True)
    archive_path = os.path.join(archive, icerik + ".json")
    try:
        with open(archive_path, "xb") as evidence: evidence.write(ham)
    except FileExistsError: pass
    sonuc = dict(temel, durum=("eksik_alan" if [a for a in eksik if a != "image"] else "gecerli"),
                 kaynak=kaynak, uri=uri[:200], hash=icerik, servis=servis_sayi,
                 name=degerler["name"][:120], type=degerler["type"][:60],
                 desc=degerler["description"][:400], eksik=eksik, es_ad=es_ad_kullanimi)
    sonuc["servis_adres"] = adresler
    return sonuc

def main():
    ad = sys.argv[1]
    girdi, cikti = os.path.join(KOK, f"{ad}_uri.jsonl"), os.path.join(KOK, f"{ad}_sonuc.jsonl")
    bitti = set()
    if os.path.exists(cikti):
        for s in open(cikti):
            try: bitti.add(json.loads(s)["id"])
            except Exception: pass
    kayitlar = []
    for s in open(girdi):
        try:
            d = json.loads(s)
            if d["id"] not in bitti: kayitlar.append(d)
        except Exception: pass
    # Aynı URI birçok kayıtta tekrarlanıyor (Arc'ta 256.539 dolu URI ama 55.271 benzersiz).
    # Her benzersiz URI bir kez indirilir, sonuç aynı URI'ye sahip tüm kayıtlara uygulanır.
    temsilci, kume = {}, {}
    for k in kayitlar:
        u = (k.get("uri") or "").strip()
        if not u:
            temsilci[k["id"]] = k                      # boş URI, ağ gerekmez
            continue
        kume.setdefault(u, []).append(k)
    benzersiz = [v[0] for v in kume.values()]
    # Sonuç, temsilcinin id'si üzerinden gruba geri eşlenir. Sonuçtaki uri alanı kısaltılmış
    # olduğu için URI ile eşlemek hem belirsiz hem de yanlış gruba yazabilir.
    grup_of = {v[0]["id"]: v for v in kume.values()}
    print(f"[{ad}] işlenecek {len(kayitlar)} kayıt, {len(benzersiz)} benzersiz URI + {len(temsilci)} boş", flush=True)
    if not kayitlar: return
    f = open(cikti, "a"); n = 0
    for k in temsilci.values():
        f.write(json.dumps(isle(k), ensure_ascii=False) + "\n")
    f.flush()
    with ThreadPoolExecutor(max_workers=24) as ex:
        for fut in as_completed([ex.submit(isle, k) for k in benzersiz]):
            try: sonuc = fut.result()
            except Exception: continue
            grup = grup_of.get(sonuc["id"], [])
            for k in grup:
                kopya = dict(sonuc); kopya["id"] = k["id"]; kopya["sahip"] = k.get("sahip")
                f.write(json.dumps(kopya, ensure_ascii=False) + "\n")
                n += 1
            if n % 5000 < len(grup): f.flush(); print(f"[{ad}] {n}/{len(kayitlar)}", flush=True)
    f.close()
    print(f"[{ad}] ADIM 2 TAMAM", flush=True)

if __name__ == "__main__":
    import urllib.parse
    main()
