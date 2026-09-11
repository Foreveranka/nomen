"use client";
import { useQuery } from "@tanstack/react-query";
import type { AgAnahtar } from "./aglar";

export type Ajan = {
  z: AgAnahtar; id: number; n: string; t: string; d: string; s: number;
  sa?: string[]; o?: string | null; k?: string | null; e: string[]; kay?: string;
};

export type Ozet = {
  guncelleme: string;
  snapshots?: Record<string, { started_at: string | null; coverage: string; block?: string }>;
  zincirler: Record<string, { toplam: number; gorunur: number; servisli: number;
    elenen: Record<string, number>; kategori: Record<string, number> }>;
};

async function getir<T>(yol: string): Promise<T> {
  const r = await fetch(yol);
  if (!r.ok) throw new Error(`${yol}: ${r.status}`);
  return (await r.json()) as T;
}

/* Statik JSON'lar tek seferlik veridir; react-query ağ başına önbelleğe alır, yeniden istemez. */
const SONSUZ = { staleTime: 60_000, gcTime: 300_000, retry: 1 } as const;

export function useDizin(ag: AgAnahtar) {
  const q = useQuery({ queryKey: ["dizin", ag], queryFn: () => getir<Ajan[]>(`/veri/${ag}/dizin.json`), ...SONSUZ });
  return { veri: q.data ?? null, hata: q.error ? String(q.error) : null };
}

export function useOzet() {
  return useQuery({ queryKey: ["ozet"], queryFn: () => getir<Ozet>("/veri/ozet.json"), ...SONSUZ }).data ?? null;
}

export type GizliOrnek = Record<string, { id: number; name: string; desc: string; etiketler: string[] }[]>;
export function useGizliOrnek(ag: AgAnahtar) {
  return useQuery({ queryKey: ["gizli", ag], queryFn: () => getir<GizliOrnek>(`/veri/${ag}/gizli_ornek.json`), ...SONSUZ }).data ?? null;
}

export type Merkle = { zincir: string; kok: string; sayi: number; kanitlar: Record<string, string[]> };
export function useMerkle(ag: AgAnahtar, etkin: boolean) {
  return useQuery({ queryKey: ["merkle", ag], queryFn: () => getir<Merkle>(`/veri/${ag}/merkle.json`), enabled: etkin, ...SONSUZ }).data ?? null;
}

export const KATEGORILER = ["Trading/DeFi", "Veri/Araştırma", "Altyapı/Servis", "Asistan", "NFT/Karakter", "Sosyal/İçerik", "DAO/Yönetişim", "Diğer"];
export const KAT_EN: Record<string, string> = {
  "Trading/DeFi": "Trading & DeFi", "Veri/Araştırma": "Data & research", "Altyapı/Servis": "Infrastructure",
  "Asistan": "Assistant", "NFT/Karakter": "NFT & character", "Sosyal/İçerik": "Social & content",
  "DAO/Yönetişim": "DAO & governance", "Diğer": "Other",
};
/* Hem tarama anahtarları (Türkçe) hem API durum kodları (İngilizce) aynı metne gider. */
export const ELEME_EN: Record<string, string> = {
  bos_metadata: "no metadata URI", no_metadata_uri: "no metadata URI",
  erisilemez: "metadata fetch failed at scan time", metadata_unreachable: "metadata fetch failed at scan time",
  kopya: "byte-identical copy of an earlier record", duplicate_of_earlier_record: "byte-identical copy of an earlier record",
  eksik_alan: "required field missing", required_field_missing: "required field missing",
  gecersiz_json: "metadata is not valid JSON", metadata_not_json: "metadata is not valid JSON",
  anlamsiz: "no describable purpose", no_describable_purpose: "no describable purpose",
  not_scanned: "not conclusively scanned", rpc_error: "registry read failed",
  not_registered: "no agent with this id on this chain",
};

/** Olgusal etiketleri okunur İngilizceye çevirir. */
export function etiketMetni(e: string): { metin: string; ton: "notr" | "uyari" | "bilgi" } {
  if (e.startsWith("sablon_ailesi:")) return { metin: `template family · ${e.split(":")[1]} agents share this description`, ton: "uyari" };
  if (e === "ulasim_adresi_yok") return { metin: "no public endpoint", ton: "notr" };
  if (e === "kendi_beyani_test") return { metin: "self-described as test or demo", ton: "uyari" };
  if (e.startsWith("alan_yazimi:")) return { metin: `field spelled ${e.slice(12).replace("→", " instead of ")}`, ton: "bilgi" };
  if (e.startsWith("kopyasi:")) return { metin: `copy of agent #${e.split(":")[1]}`, ton: "uyari" };
  if (e.startsWith("eksik:")) return { metin: `missing ${e.slice(6).replace(/,/g, ", ")}`, ton: "uyari" };
  return { metin: e, ton: "notr" };
}
