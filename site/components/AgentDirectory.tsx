"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useAg } from "@/app/providers";
import { AGLAR } from "@/lib/aglar";
import { useDizin, useOzet, KATEGORILER, KAT_EN, etiketMetni, type Ajan } from "@/lib/veri";
import { Rozet } from "@/components/AjanKart";
import AjanKart from "@/components/AjanKart";

export default function AgentDirectory() {
  const { ag } = useAg();
  const z = AGLAR[ag];
  const { veri, hata } = useDizin(ag);
  const ozet = useOzet();
  const o = ozet?.zincirler[ag];

  const [q, setQ] = useState("");
  const [kat, setKat] = useState<string>("hepsi");
  const [sadeceServisli, setSadeceServisli] = useState(false);
  const [gorunum, setGorunum] = useState<"kart" | "tablo">("kart");
  const [sira, setSira] = useState<"yeni" | "eski" | "ucnokta" | "ad">("yeni");
  const [limit, setLimitHam] = useState<{ anahtar: string; n: number }>({ anahtar: "", n: 48 });
  const filtreAnahtar = `${ag}|${q}|${kat}|${sadeceServisli}|${sira}`;
  const gosterim = limit.anahtar === filtreAnahtar ? limit.n : 48;
  const setLimit = (f: (n: number) => number) => setLimitHam({ anahtar: filtreAnahtar, n: f(gosterim) });

  const sonuc = useMemo(() => {
    if (!veri) return [];
    const t = q.trim().toLowerCase();
    const liste = veri.filter((a) => {
      if (kat !== "hepsi" && a.k !== kat) return false;
      if (sadeceServisli && !a.s) return false;
      if (!t) return true;
      return `${a.n} ${a.d} ${a.o ?? ""} ${a.id}`.toLowerCase().includes(t);
    });
    const c = { yeni: (x: Ajan, y: Ajan) => y.id - x.id, eski: (x: Ajan, y: Ajan) => x.id - y.id,
      ucnokta: (x: Ajan, y: Ajan) => (y.sa?.length ?? y.s) - (x.sa?.length ?? x.s) || y.id - x.id,
      ad: (x: Ajan, y: Ajan) => (x.n || "~").localeCompare(y.n || "~") }[sira];
    return [...liste].sort(c);
  }, [veri, q, kat, sadeceServisli, sira]);

  return (
    <section id="directory" aria-label="Browse agents" className="mb-12 scroll-mt-24 border-t border-[var(--cizgi)] pt-10">
      <div className="mb-6">
        <h2 className="text-2xl">Browse agents</h2>
        <p className="mt-2 text-sm text-[var(--soluk)]">Prefer to explore? Search and filter published agents on {z.ad}. Change the network using the switcher above.</p>
        <p className="mt-2 text-xs text-[var(--soluk)]">{o?.gorunur.toLocaleString("en-US") ?? "—"} listed records · {o?.servisli.toLocaleString("en-US") ?? "—"} declare an endpoint · availability is not verified</p>
        {ag === "arc" && ozet?.snapshots?.arc?.coverage === "listed_catalog_refresh" && <p className="mt-2 text-xs text-[var(--soluk)]">Listed Arc agents refreshed {ozet.snapshots.arc.started_at ? new Date(ozet.snapshots.arc.started_at).toLocaleString("en-US") : "at the published snapshot block"}. Other registry IDs retain legacy observations. <Link href="/docs/subgraph" className="underline">Index coverage</Link></p>}
      </div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search directory" placeholder={`Search ${z.ad} agents by name, description, owner, or id`} className="girdi min-w-0 basis-64 flex-1" />
          <button onClick={() => setSadeceServisli((v) => !v)} className={`dugme ${sadeceServisli ? "dugme-birincil" : ""}`}>with endpoints</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Cip aktif={kat === "hepsi"} onClick={() => setKat("hepsi")}>All</Cip>
          {KATEGORILER.map((k) => {
            const n = o?.kategori[k] ?? 0;
            if (!n) return null;
            return <Cip key={k} aktif={kat === k} onClick={() => setKat(k)}>{KAT_EN[k]} <span className="text-[var(--cok-soluk)]">{n}</span></Cip>;
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[14px] text-[var(--soluk)]">
          <span>{veri === null ? (hata ? "could not load the directory" : "loading…") : `${sonuc.length.toLocaleString("en-US")} agents`} · <Link href="/filtered" className="underline decoration-[var(--cizgi)] underline-offset-4 hover:text-[var(--yazi)]">see what was filtered</Link></span>
          <span className="flex items-center gap-2">
            <select value={sira} onChange={(e) => setSira(e.target.value as typeof sira)} className="dugme text-[13px]">
              <option value="yeni">highest id first</option>
              <option value="eski">lowest id first</option>
              <option value="ucnokta">most endpoints</option>
              <option value="ad">name A to Z</option>
            </select>
            <span className="flex overflow-hidden rounded-lg border border-[var(--cizgi)]">
              <button onClick={() => setGorunum("kart")} className={`px-3 py-2 text-[13px] ${gorunum === "kart" ? "bg-[var(--lacivert)] text-white" : "bg-white"}`}>cards</button>
              <button onClick={() => setGorunum("tablo")} className={`px-3 py-2 text-[13px] ${gorunum === "tablo" ? "bg-[var(--lacivert)] text-white" : "bg-white"}`}>table</button>
            </span>
          </span>
        </div>

        {gorunum === "kart" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sonuc.slice(0, gosterim).map((a) => <AjanKart key={a.id} a={a} />)}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--cizgi)]">
            <table className="w-full text-[13.5px]">
              <thead className="bg-[var(--yuzey)] text-left text-[11px] uppercase tracking-[0.1em] text-[var(--cok-soluk)]">
                <tr><th className="px-4 py-2.5">id</th><th className="px-4 py-2.5">name</th><th className="px-4 py-2.5">category</th><th className="px-4 py-2.5">endpoints</th><th className="px-4 py-2.5">owner</th><th className="px-4 py-2.5">labels</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--cizgi)]">
                {sonuc.slice(0, gosterim).map((a) => (
                  <tr key={a.id} className="hover:bg-[var(--yuzey)]">
                    <td className="mono px-4 py-2.5"><Link className="underline decoration-[var(--cizgi)] underline-offset-4" href={`/agent/${ag}/${a.id}`}>#{a.id}</Link></td>
                    <td className="max-w-[260px] truncate px-4 py-2.5"><Link href={`/agent/${ag}/${a.id}`}>{a.n || <span className="text-[var(--cok-soluk)]">unnamed</span>}</Link></td>
                    <td className="px-4 py-2.5 text-[var(--soluk)]">{a.k ? KAT_EN[a.k] ?? a.k : "—"}</td>
                    <td className="mono px-4 py-2.5 text-[var(--soluk)]">{a.sa?.length ?? a.s}</td>
                    <td className="mono px-4 py-2.5 text-[12px] text-[var(--soluk)]">{a.o ? <Link className="underline decoration-[var(--cizgi)] underline-offset-4" href={`/owner/${ag}/${a.o}`}>{a.o.slice(0, 10)}…</Link> : "—"}</td>
                    <td className="px-4 py-2.5"><span className="flex flex-wrap gap-1">{a.e.filter((e) => !e.startsWith("alan_yazimi:")).slice(0, 2).map((e) => { const m = etiketMetni(e); return <Rozet key={e} ton={m.ton === "uyari" ? "uyari" : "notr"}>{m.metin}</Rozet>; })}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {sonuc.length > gosterim && (
          <button onClick={() => setLimit((l) => l + 96)} className="dugme mx-auto mt-8 block">show more · {(sonuc.length - gosterim).toLocaleString("en-US")} left</button>
        )}
        {veri && sonuc.length === 0 && (
          <p className="ince mt-8 text-[15px] text-[var(--soluk)]">Nothing on {z.ad} matches. Try another network from the switcher at the top right.</p>
        )}
    </section>
  );
}

function Cip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-3.5 py-1.5 text-[13px] transition ${aktif ? "border-[var(--lacivert)] bg-[var(--lacivert)] text-white" : "border-[var(--cizgi)] bg-white text-[var(--soluk)] hover:border-[var(--yazi)] hover:text-[var(--yazi)]"}`}>
      {children}
    </button>
  );
}
