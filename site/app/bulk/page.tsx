"use client";
import { useState } from "react";
import Link from "next/link";
import { useAg } from "@/app/providers";
import { AGLAR } from "@/lib/aglar";
import { ELEME_EN, KAT_EN } from "@/lib/veri";
import { Rozet } from "@/components/AjanKart";

type Satir = { agentId: number; status: string; passes: boolean; reason: string; name: string | null; category: string | null; endpoints: number; owner: string | null };
const unknown = (r: Satir) => ["not_scanned", "rpc_error"].includes(r.status);

type Cevap = { chain: string; requested: number; answered: number; limit: number; results: Satir[] };

export default function Toplu() {
  const { ag } = useAg();
  const z = AGLAR[ag];
  const [metin, setMetin] = useState("");
  const [stored, setCevap] = useState<Cevap | null>(null);
  const cevap = stored?.chain === ag ? stored : null;
  const [hata, setHata] = useState("");
  const [bekliyor, setBekliyor] = useState(false);
  const [suzgec, setSuzgec] = useState<"hepsi" | "gecen" | "kalan" | "bilinmeyen">("hepsi");

  const tokens = metin.trim().split(/[\s,;]+/).filter(Boolean);
  const validInput = tokens.every((t) => /^\d+$/.test(t) && Number.isSafeInteger(Number(t)) && Number(t) > 0);
  const idler = validInput ? [...new Set(tokens.map(Number))] : [];

  async function sor() {
    if (!idler.length) return;
    setBekliyor(true); setCevap(null); setHata("");
    try {
      const r = await fetch("/api/toplu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chain: ag, agentIds: idler }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Request failed");
      setCevap(data);
    } catch (e) { setHata(e instanceof Error ? e.message : "Request failed"); } finally { setBekliyor(false); }
  }

  function dosya(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 65536) { setHata("File exceeds 64 KiB"); return; }
    f.text().then((t) => setMetin(t)).catch(() => setHata("Could not read file"));
  }

  function csv() {
    if (!cevap) return;
    const bas = ["agentId", "status", "passes", "name", "category", "endpoints", "owner", "reason"];
    const satirlar = cevap.results.map((r) => [r.agentId, r.status, r.passes, r.name ?? "", r.category ?? "", r.endpoints, r.owner ?? "", r.reason].map((v) => `"${(typeof v === "string" && /^[=+@\-\t\r]/.test(v) ? "\'" + v : String(v)).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[bas.join(","), ...satirlar].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `nomen-${cevap.chain}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const gorunen = cevap?.results.filter((r) => suzgec === "hepsi" || (suzgec === "gecen" ? r.passes : suzgec === "bilinmeyen" ? unknown(r) : !r.passes && !unknown(r))) ?? [];
  const belirsiz = cevap?.results.filter(unknown).length ?? 0;
  const gecen = cevap?.results.filter((r) => r.passes).length ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 pt-12">
      <p className="text-[13px] uppercase tracking-[0.18em] text-[var(--cok-soluk)]">{z.ad} · for marketplaces and indexers</p>
      <h1 className="baslik mt-2 text-[40px] leading-tight sm:text-[52px]">Check a whole list at once</h1>
      <p className="ince mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--soluk)]">
        Paste agent ids, or upload a text file containing only ids separated by commas or whitespace. Every id comes back with its status and the reason,
        up to 2,000 per request. Export the result and clean your own list with it. This endpoint is free.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_280px]">
        <textarea aria-label="Agent IDs" value={metin} onChange={(e) => setMetin(e.target.value)} placeholder={"2364, 3337, 6815\n7154\n..."} className="girdi mono min-h-[180px] text-[13px]" spellCheck={false} />
        <div className="space-y-3">
          <label className="dugme block cursor-pointer text-center">upload a CSV or text file<input type="file" accept=".csv,.txt" className="hidden" onChange={dosya} /></label>
          <div className="text-[13px] text-[var(--soluk)]">{idler.length.toLocaleString("en-US")} ids found{idler.length > 2000 ? ", maximum is 2,000" : ""}</div>
          <button onClick={sor} disabled={!idler.length || idler.length > 2000 || bekliyor} className="dugme dugme-koyu w-full">{bekliyor ? "checking…" : `check on ${z.ad}`}</button>
          <p className="ince text-[12px] text-[var(--cok-soluk)]">Programmatic: <code className="mono">POST /api/toplu</code> with <code className="mono">{`{ chain, agentIds }`}</code>. See <Link className="underline" href="/docs/api">docs</Link>.</p>
        </div>
      </div>

      {(!validInput || hata) && <p role="alert" className="mt-4">{hata || "Enter only positive integer ids, separated by commas or whitespace."}</p>}
      {cevap && (
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[14px] text-[var(--soluk)]">
              <span className="text-[var(--yazi)]">{cevap.answered.toLocaleString("en-US")}</span> checked · <span className="text-[var(--yesil)]">{gecen} pass</span> · <span className="text-[var(--kirmizi)]">{cevap.answered - gecen - belirsiz} filtered</span> · <span>{belirsiz} unknown</span>
            </div>
            <div className="flex gap-2">
              {(["hepsi", "gecen", "kalan", "bilinmeyen"] as const).map((k) => (
                <button key={k} onClick={() => setSuzgec(k)} className={`dugme text-[13px] ${suzgec === k ? "dugme-birincil" : ""}`}>{k === "hepsi" ? "all" : k === "gecen" ? "passing" : k === "bilinmeyen" ? "unknown" : "filtered"}</button>
              ))}
              <button onClick={csv} className="dugme text-[13px]">export CSV</button>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--cizgi)]">
            <table className="w-full text-[13.5px]">
              <thead className="bg-[var(--yuzey)] text-left text-[11px] uppercase tracking-[0.1em] text-[var(--cok-soluk)]">
                <tr><th className="px-4 py-2.5">id</th><th className="px-4 py-2.5">status</th><th className="px-4 py-2.5">name</th><th className="px-4 py-2.5">category</th><th className="px-4 py-2.5">endpoints</th><th className="px-4 py-2.5">owner</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--cizgi)]">
                {gorunen.map((r) => (
                  <tr key={r.agentId} className="hover:bg-[var(--yuzey)]">
                    <td className="mono px-4 py-2.5"><Link className="underline decoration-[var(--cizgi)] underline-offset-4" href={`/agent/${ag}/${r.agentId}`}>#{r.agentId}</Link></td>
                    <td className="px-4 py-2.5">{r.passes ? <Rozet ton="iyi">passes</Rozet> : <Rozet ton="kotu">{ELEME_EN[r.status] ?? r.status}</Rozet>}</td>
                    <td className="max-w-[260px] truncate px-4 py-2.5">{r.name ?? <span className="text-[var(--cok-soluk)]">—</span>}</td>
                    <td className="px-4 py-2.5 text-[var(--soluk)]">{r.category ? KAT_EN[r.category] ?? r.category : "—"}</td>
                    <td className="mono px-4 py-2.5 text-[var(--soluk)]">{r.endpoints}</td>
                    <td className="mono px-4 py-2.5 text-[12px] text-[var(--soluk)]">{r.owner ? <Link className="underline decoration-[var(--cizgi)] underline-offset-4" href={`/owner/${ag}/${r.owner}`}>{r.owner.slice(0, 10)}…</Link> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
