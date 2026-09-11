import fs from "node:fs";
import path from "node:path";

/** Durum kodları adim6_api_veri.py ile aynı. */
export const DURUM: Record<number, string> = {
  0: "not_scanned",
  1: "passes",
  2: "no_metadata_uri",
  3: "metadata_unreachable",
  4: "duplicate_of_earlier_record",
  5: "required_field_missing",
  6: "metadata_not_json",
  7: "no_describable_purpose",
  8: "not_registered",
  9: "rpc_error",
};
export const KOD_OF: Record<string, number> = Object.fromEntries(Object.entries(DURUM).map(([k, v]) => [v, Number(k)]));

export const ACIKLAMA: Record<string, string> = {
  not_scanned: "No conclusive scan result is available. This does not establish whether the record exists.",
  rpc_error: "Registry read failed. Checks were not evaluated.",
  not_registered: "No agent with this id exists in the registry on this chain.",
  passes: "Passes every check in the published rule set.",
  no_metadata_uri: "The record was minted with an empty metadata URI, so there is nothing to describe or call.",
  metadata_unreachable: "The metadata URI is set but the document could not be fetched at scan time.",
  duplicate_of_earlier_record: "The metadata is byte-identical to an earlier record. The lowest id in the snapshot is kept; mint order is not established.",
  required_field_missing: "ERC-8004 marks type, name and description as MUST. At least one is empty.",
  metadata_not_json: "The document behind the URI is not a JSON object.",
  no_describable_purpose: "The description carries no statable purpose, so the record cannot be classified or searched.",
};

/** Hangi kontrolde kaldığı: kontrol sırası 1..6, geçenler için 0. */
export const KALAN_KONTROL: Record<string, number> = {
  passes: 0, no_metadata_uri: 1, metadata_unreachable: 2, metadata_not_json: 3,
  required_field_missing: 4, duplicate_of_earlier_record: 5, no_describable_purpose: 6, not_registered: 0,
};

export type Gorunur = {
  name: string; type: string; desc: string; owner: string | null;
  services: string[]; category: string | null; flags: string[];
  metadata_source: string; hash: string;
};

const KOK = path.join(process.cwd(), "veri");
const bellek = new Map<string, unknown>();
function oku<T>(ad: string, parse: (b: Buffer) => T): T {
  if (!bellek.has(ad)) bellek.set(ad, parse(fs.readFileSync(path.join(KOK, ad))));
  return bellek.get(ad) as T;
}

export function indeks() { return oku("indeks.json", (b) => JSON.parse(b.toString("utf8"))); }
export function zincirler(): string[] { return Object.keys(indeks()).filter((k) => !k.startsWith("_")); }
const durumTablosu = (z: string) => oku<Buffer>(`${z}_durum.bin`, (b) => b);
const gorunurTablosu = (z: string) => oku<Record<string, Gorunur>>(`${z}_gorunur.json`, (b) => JSON.parse(b.toString("utf8")));
const sahipTablosu = (z: string) => oku<Record<string, number[]>>(`${z}_sahip.json`, (b) => JSON.parse(b.toString("utf8")));
const gizliAdTablosu = (z: string) => oku<Record<string, [string, string]>>(`${z}_gizli_ad.json`, (b) => JSON.parse(b.toString("utf8")));

/** Published, rule-passing records only. Never model-invented registry ids. */
export function discoveryCandidates(chain?: string) {
  const snapshots = indeks();
  return (chain ? [chain] : zincirler()).flatMap(z => Object.entries(gorunurTablosu(z)).filter(([id]) => durumTablosu(z)[Number(id)-1] === 1).map(([id, r]) => ({
    key: `${z}:${id}`, chain:z, agentId:Number(id), name:r.name.slice(0,160), description:r.desc.slice(0,800), category:r.category, serviceCount:r.services.length,
    snapshotOwner: r.owner,
    snapshotBlock: Number(snapshots[z]?.snapshot?.additions?.find((a: { agent_id: number }) => a.agent_id === Number(id))?.owner_read_block ?? snapshots[z]?.snapshot?.block) || undefined,
  })));
}

export function bak(zincir: string, id: number) {
  const tablo = durumTablosu(zincir);
  const kod = id >= 1 && id <= tablo.length ? tablo[id - 1] : 0;
  const durum = DURUM[kod] ?? "not_scanned";
  const detay = durum === "passes" ? gorunurTablosu(zincir)[String(id)] : undefined;
  const ad = durum !== "passes" && durum !== "not_registered" ? gizliAdTablosu(zincir)[String(id)] : undefined;
  return { durum, detay, gizliAd: ad };
}

export function sahibinAjanlari(zincir: string, adres: string): number[] {
  return sahipTablosu(zincir)[adres.toLowerCase()] ?? [];
}

/** Bir sebebe göre elenen kayıtları sayfalar: durum.bin'i tarar, ucuz. */
export function elenenler(zincir: string, sebep: string, sayfa: number, boy = 100) {
  const kod = KOD_OF[sebep];
  const tablo = durumTablosu(zincir);
  const adlar = gizliAdTablosu(zincir);
  const atla = sayfa * boy;
  const cikti: { id: number; name: string; desc: string }[] = [];
  let toplam = 0;
  for (let i = 0; i < tablo.length; i++) {
    if (tablo[i] !== kod) continue;
    toplam++;
    if (toplam > atla && cikti.length < boy) {
      const a = adlar[String(i + 1)];
      cikti.push({ id: i + 1, name: a?.[0] ?? "", desc: a?.[1] ?? "" });
    }
  }
  return { toplam, sayfa, boy, kayitlar: cikti };
}
