"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAg } from "@/app/providers";
import { AGLAR } from "@/lib/aglar";
import { useOzet, ELEME_EN } from "@/lib/veri";

const SEBEPLER = ["no_metadata_uri", "metadata_unreachable", "metadata_not_json", "required_field_missing", "duplicate_of_earlier_record", "no_describable_purpose"] as const;
const TR: Record<string, string> = { no_metadata_uri: "bos_metadata", metadata_unreachable: "erisilemez", metadata_not_json: "gecersiz_json", required_field_missing: "eksik_alan", duplicate_of_earlier_record: "kopya", no_describable_purpose: "anlamsiz" };

type Cevap = { toplam: number; sayfa: number; boy: number; kayitlar: { id: number; name: string; desc: string }[]; explanation: string };

export default function Sayfa() { return <Suspense><Elenenler /></Suspense>; }

function Elenenler() {
  const { ag } = useAg();
  const z = AGLAR[ag];
  const ozet = useOzet();
  const o = ozet?.zincirler[ag];
  const [sebep, setSebep] = useState<(typeof SEBEPLER)[number]>("metadata_unreachable");
  const [sayfa, setSayfa] = useState(0);
  const q = useQuery({
    queryKey: ["elenen", ag, sebep, sayfa],
    queryFn: async () => (await fetch(`/api/elenen?chain=${ag}&reason=${sebep}&page=${sayfa}`)).json() as Promise<Cevap>,
  });
  const c = q.data;
  const sonSayfa = c ? Math.max(0, Math.ceil(c.toplam / c.boy) - 1) : 0;

  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-12">
      <p className="text-[13px] uppercase tracking-[0.18em] text-[var(--cok-soluk)]">{z.ad}</p>
      <h1 className="baslik mt-2 text-[40px] leading-tight sm:text-[52px]">Everything that was filtered, by reason</h1>
      <p className="ince mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--soluk)]">
        Nothing is deleted. Every record that did not pass is listed here with the check it failed, so a marketplace can see exactly what it would be importing and an owner can see why theirs is missing. See the <Link className="underline" href="/rules">rules</Link>.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {SEBEPLER.map((s) => {
          const n = o?.elenen[TR[s]] ?? 0;
          return (
            <button key={s} onClick={() => { setSebep(s); setSayfa(0); }} className={`rounded-full border px-3.5 py-1.5 text-[13px] transition ${sebep === s ? "border-[var(--lacivert)] bg-[var(--lacivert)] text-white" : "border-[var(--cizgi)] bg-white text-[var(--soluk)] hover:text-[var(--yazi)]"}`}>
              {ELEME_EN[s]} <span className={sebep === s ? "text-white/70" : "text-[var(--cok-soluk)]"}>{n.toLocaleString("en-US")}</span>
            </button>
          );
        })}
      </div>

      {c && <p className="ince mt-6 text-[14px] text-[var(--soluk)]">{c.explanation}</p>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--cizgi)]">
        <table className="w-full text-[13.5px]">
          <thead className="bg-[var(--yuzey)] text-left text-[11px] uppercase tracking-[0.1em] text-[var(--cok-soluk)]">
            <tr><th className="w-24 px-4 py-2.5">id</th><th className="px-4 py-2.5">name</th><th className="px-4 py-2.5">description</th><th className="px-4 py-2.5"></th></tr>
          </thead>
          <tbody className="divide-y divide-[var(--cizgi)]">
            {q.isLoading && <tr><td colSpan={4} className="px-4 py-6 text-[var(--soluk)]">loading…</td></tr>}
            {c?.kayitlar.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--yuzey)]">
                <td className="mono px-4 py-2.5"><Link className="underline decoration-[var(--cizgi)] underline-offset-4" href={`/agent/${ag}/${r.id}`}>#{r.id}</Link></td>
                <td className="max-w-[220px] truncate px-4 py-2.5">{r.name || <span className="text-[var(--cok-soluk)]">—</span>}</td>
                <td className="ince max-w-[420px] truncate px-4 py-2.5 text-[var(--soluk)]">{r.desc || <span className="text-[var(--cok-soluk)]">—</span>}</td>
                <td className="px-4 py-2.5"><a className="text-[12px] text-[var(--soluk)] underline decoration-[var(--cizgi)] underline-offset-4" href={`${z.nftYolu}${r.id}`} target="_blank" rel="noopener">onchain</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {c && (
        <div className="mt-4 flex items-center justify-between text-[13px] text-[var(--soluk)]">
          <span>{c.toplam.toLocaleString("en-US")} records · page {sayfa + 1} of {sonSayfa + 1}</span>
          <span className="flex gap-2">
            <button disabled={sayfa === 0} onClick={() => setSayfa((s) => s - 1)} className="dugme text-[13px]">previous</button>
            <button disabled={sayfa >= sonSayfa} onClick={() => setSayfa((s) => s + 1)} className="dugme text-[13px]">next</button>
          </span>
        </div>
      )}
    </main>
  );
}
