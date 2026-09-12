"use client";
import { use, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useReadContract } from "wagmi";
import { AGLAR, type AgAnahtar } from "@/lib/aglar";
import { useDizin, useOzet, KAT_EN, ELEME_EN, etiketMetni, type Ajan } from "@/lib/veri";
import { Rozet } from "@/components/AjanKart";
import { REGISTRAR_ABI } from "@/lib/registrar";
import { useAg } from "@/app/providers";
import ComplaintRecords from "@/components/ComplaintRecords";
import AgentReviews from "@/components/AgentReviews";
import AgentTrustHistory from "@/components/AgentTrustHistory";

type ApiCevap = { status: string; passes: boolean; reason: string; agent: null | { name?: string } };

/* Kontrol sırası API'nin durum kodlarıyla aynı; kalan kayıtta hangi adımda kaldığı buradan türetilir. */
const KONTROLLER: [string, string][] = [
  ["no_metadata_uri", "metadata URI is set"], ["metadata_unreachable", "the document loads"], ["metadata_not_json", "the document is JSON"],
  ["required_field_missing", "required fields present"], ["duplicate_of_earlier_record", "not a byte-identical copy"], ["no_describable_purpose", "description states a purpose"],
];
function KontrolSatirlari({ durum }: { durum: string }) {
  const kalan = KONTROLLER.findIndex(([k]) => k === durum);
  return (
    <ol className="mt-4 space-y-1.5 text-[13.5px]">
      {KONTROLLER.map(([k, ad], i) => {
        const hal = kalan === -1 ? (durum === "passes" ? "gecti" : "bakilmadi") : i < kalan ? "gecti" : i === kalan ? "kaldi" : "bakilmadi";
        return (
          <li key={k} className="flex items-center gap-2.5">
            <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${hal === "gecti" ? "bg-[var(--yesil-acik)] text-[var(--yesil)]" : hal === "kaldi" ? "bg-[#fbe4e4] text-[var(--kirmizi)]" : "bg-[var(--yuzey-2)] text-[var(--cok-soluk)]"}`}>{hal === "gecti" ? "✓" : hal === "kaldi" ? "✕" : "·"}</span>
            <span className={hal === "bakilmadi" ? "text-[var(--cok-soluk)]" : ""}>{ad}</span>
            {hal === "kaldi" && <span className="text-[12px] text-[var(--kirmizi)]">failed here</span>}
            {hal === "bakilmadi" && <span className="text-[12px] text-[var(--cok-soluk)]">not evaluated</span>}
          </li>
        );
      })}
    </ol>
  );
}
function protokol(u: string): string {
  const s = u.toLowerCase();
  if (s.includes("mcp")) return "MCP";
  if (s.includes("a2a") || s.includes("agent-card") || s.includes(".well-known/agent")) return "A2A";
  if (s.includes("x402")) return "x402";
  if (s.startsWith("http")) return "web";
  return "other";
}
function Kopyala({ metin }: { metin: string }) {
  return <button onClick={() => navigator.clipboard?.writeText(metin)} title="copy" className="rounded px-1.5 text-[11px] text-[var(--cok-soluk)] hover:bg-[var(--yuzey)] hover:text-[var(--yazi)]">copy</button>;
}

export default function AjanSayfasi({ params }: { params: Promise<{ chain: string; id: string }> }) {
  const { chain, id } = use(params);
  const ag = (AGLAR[chain as AgAnahtar] ? chain : "ethereum") as AgAnahtar;
  const z = AGLAR[ag];
  const agentId = Number(id);
  const valid = !!AGLAR[chain as AgAnahtar] && /^\d+$/.test(id) && Number.isSafeInteger(agentId) && agentId > 0;
  const { sec } = useAg();
  /* Sayfa hangi ağdaysa başlıktaki seçici de o ağı göstersin. */
  useEffect(() => { queueMicrotask(() => sec(ag)); }, [ag, sec]);

  const { veri } = useDizin(ag);
  const ozet = useOzet();
  const tarih = ozet?.snapshots?.[ag]?.started_at?.slice(0, 10);
  const a: Ajan | undefined = veri?.find((x) => x.id === agentId);
  const apiQuery = useQuery({
    enabled: valid,
    queryKey: ["dogrula", ag, agentId],
    queryFn: async () => { const r = await fetch(`/api/snapshot?chain=${ag}&agentId=${agentId}`); if (!r.ok) throw new Error("Could not load scan result"); return r.json() as Promise<ApiCevap>; },
  });
  const api = apiQuery.data ?? null;

  const activity = useQuery({
    queryKey: ["activity", ag, agentId], enabled: valid && ag === "sepolia",
    queryFn: async () => { const r = await fetch(`/api/activity?agentId=${agentId}`); if (!r.ok) throw new Error("Live activity is unavailable"); return r.json() as Promise<{ indexedBlock: number; agent: null | { feedbackCount: string; lastUpdatedAt: string } }>; }, retry: false,
  });
  const isim = useReadContract({
    abi: REGISTRAR_ABI, address: z.registrar ?? undefined, functionName: "isNamed", args: [BigInt(valid ? agentId : 0)],
    chainId: z.chainId, query: { enabled: !!z.registrar && valid },
  });

  if (!valid) notFound();
  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-10">
      <Link href="/workbench" className="text-[13px] text-[var(--soluk)] hover:text-[var(--yazi)]">← Find an agent</Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="baslik text-[36px] leading-tight sm:text-[44px]">{a?.n || api?.agent?.name || `Agent #${agentId}`}</h1>
          <div className="mono mt-1 text-[13px] text-[var(--cok-soluk)]">{z.ad} · agent #{agentId}{tarih ? ` · last scan ${tarih}` : ""}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {api?.passes ? <Rozet ton="iyi">passes all six checks</Rozet> : api ? <Rozet ton="kotu">{ELEME_EN[api.status] ?? api.status}</Rozet> : null}
          {isim.data && isim.data[0] && <Rozet ton="bilgi">{isim.data[1]}.nomen-demo.eth</Rozet>}
        </div>
      </div>

      {ag === "sepolia" && <p className="mt-4 text-[13px] text-[var(--soluk)]">{activity.data ? `Live index · block ${activity.data.indexedBlock} · ${activity.data.agent?.feedbackCount ?? "0"} feedback records` : activity.isError ? "Live activity unavailable. The checks below use the published snapshot." : "Loading live activity…"}</p>}
      {apiQuery.isError && <p role="alert">Could not load the scan result. Please retry.</p>}
      <div className="mt-6 rounded-xl border border-[var(--cizgi)] bg-[var(--yuzey)] p-5"><h2 className="text-lg">Can you use this agent for your job?</h2><p className="mt-2 text-sm text-[var(--soluk)]">Check current ownership, metadata and service responses, then review a small trial.</p><Link className="dugme dugme-koyu mt-4 inline-block" href={`/workbench?chain=${ag}&agentId=${agentId}`}>Evaluate for a job →</Link></div>
      {ag !== "ethereum" && <><ComplaintRecords chain={ag} agentId={agentId}/><details className="mt-6"><summary className="cursor-pointer text-sm text-[var(--soluk)]">Archived ratings · previous model, read-only</summary><AgentReviews chain={ag} agentId={agentId} /></details></>}
      {ag === "arbitrum" && <details className="mt-6"><summary className="cursor-pointer text-sm text-[var(--soluk)]">Historical onchain trial receipts</summary><AgentTrustHistory agentId={agentId} /></details>}
      {a ? <Gecerli a={a} ag={ag} durum={api?.status ?? "passes"} /> : api && !api.passes ? <Gizli api={api} ag={ag} agentId={agentId} /> : <p className="mt-8 text-[var(--soluk)]">loading…</p>}
    </main>
  );
}

function Gecerli({ a, ag, durum }: { a: Ajan; ag: AgAnahtar; durum: string }) {
  const z = AGLAR[ag];
  return (
    <>
      <p className="ince mt-6 max-w-3xl text-[17px] leading-relaxed text-[var(--soluk)]">{a.d}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="kart-cizgili p-6">
          <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Record</h2>
          <dl className="mt-4 divide-y divide-[var(--cizgi)] text-[14px]">
            <Satir ad="type"><span className="mono break-all">{a.t || "—"}</span></Satir>
            <Satir ad="owner">
              {a.o ? (
                <span className="flex flex-wrap items-center gap-2">
                  <Link className="mono break-all underline decoration-[var(--cizgi)] underline-offset-4 hover:text-[var(--mavi)]" href={`/owner/${ag}/${a.o}`}>{a.o}</Link>
                  <span className="text-[12px] text-[var(--cok-soluk)]">other agents of this wallet →</span>
                  <a className="text-[12px] text-[var(--cok-soluk)] underline decoration-[var(--cizgi)] underline-offset-4" href={`${z.tarayici}/address/${a.o}`} target="_blank" rel="noopener">explorer</a>
                </span>
              ) : (
                <span className="text-[var(--cok-soluk)]">not captured in this scan</span>
              )}
            </Satir>
            <Satir ad="metadata">{a.kay === "veri_gomulu" ? "stored onchain (data: URI)" : a.kay === "uzak" ? "fetched from a remote URL" : a.kay === "json_yapistirilmis" ? "JSON pasted into the URI field" : "—"}</Satir>
            <Satir ad="category">{a.k ? KAT_EN[a.k] || a.k : "—"}</Satir>
            <Satir ad="endpoints">
              {a.sa?.length ? (
                <ul className="space-y-1.5">{a.sa.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <Rozet ton="bilgi">{protokol(s)}</Rozet>
                    <span className="mono break-all text-[13px]">{s}</span>
                    <Kopyala metin={s} />
                  </li>
                ))}</ul>
              ) : a.s > 0 ? (
                <span>{a.s} declared, addresses not captured</span>
              ) : (
                <span className="text-[var(--cok-soluk)]">none published</span>
              )}
            </Satir>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="kart-cizgili p-6">
            <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">The six checks</h2>
            <KontrolSatirlari durum={durum} />
            {a.e.length > 0 && (
              <>
                <h2 className="mt-5 text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Labels</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.e.map((e) => { const m = etiketMetni(e); return <Rozet key={e} ton={m.ton === "bilgi" ? "bilgi" : m.ton === "uyari" ? "uyari" : "notr"}>{m.metin}</Rozet>; })}
                </div>
              </>
            )}
          </div>
          <div className="kart-cizgili p-6">
            <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Onchain</h2>
            <div className="mt-4 flex flex-col gap-2 text-[14px]">
              <a className="dugme text-center" href={`${z.nftYolu}${a.id}`} target="_blank" rel="noopener">view the registry record</a>
              <a className="dugme text-center" href={`/api/dogrula?chain=${ag}&agentId=${a.id}`} target="_blank">what the API returns</a>
              <div className="flex items-center justify-between rounded-lg bg-[var(--yuzey)] px-3 py-2"><span className="mono truncate text-[11px] text-[var(--soluk)]">/api/dogrula?chain={ag}&agentId={a.id}</span><Kopyala metin={`${typeof location !== "undefined" ? location.origin : ""}/api/dogrula?chain=${ag}&agentId=${a.id}`} /></div>
              {z.isimTalebi && <Link className="dugme dugme-birincil text-center" href={`/claim?agent=${a.id}`}>claim a name for this agent</Link>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Gizli({ api, ag, agentId }: { api: ApiCevap; ag: AgAnahtar; agentId: number }) {
  const z = AGLAR[ag];
  return (
    <div className="kart-cizgili mt-8 p-6">
      <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Why this record is not in the directory</h2>
      <p className="mt-3 text-[16px]">{ELEME_EN[api.status] ?? api.status}</p>
      <p className="ince mt-1 text-[14px] text-[var(--soluk)]">{api.reason}</p>
      <KontrolSatirlari durum={api.status} />
      <p className="ince mt-4 text-[13px] text-[var(--cok-soluk)]">Registry records are not deleted. A later published scan can change this result; no automatic rescan schedule is promised.</p>
      <a className="dugme mt-5 inline-block" href={`${z.nftYolu}${agentId}`} target="_blank" rel="noopener">view the registry record</a>
    </div>
  );
}

function Satir({ ad, children }: { ad: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-3 first:pt-0 last:pb-0">
      <dt className="text-[var(--cok-soluk)]">{ad}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
