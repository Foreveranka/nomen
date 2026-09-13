"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { readNames } from "@/lib/names";
import { notFound } from "next/navigation";
import { AGLAR, type AgAnahtar } from "@/lib/aglar";
import { ELEME_EN, KAT_EN } from "@/lib/veri";
import { Rozet } from "@/components/AjanKart";
import { useAg } from "@/app/providers";

type Ajan = { agentId: number; status: string; passes: boolean; reason: string; name: string | null; description: string | null; category: string | null; endpoints: string[] };
type Cevap = { page: number; hasMore: boolean; address: string; total: number; passing: number; agents: Ajan[]; error?: string };

export default function SahipSayfasi({ params }: { params: Promise<{ chain: string; address: string }> }) {
  const [page, setPage] = useState(0);
  const { chain, address } = use(params);
  const valid = !!AGLAR[chain as AgAnahtar] && /^0x[0-9a-fA-F]{40}$/.test(address);
  const ag = (AGLAR[chain as AgAnahtar] ? chain : "ethereum") as AgAnahtar;
  const z = AGLAR[ag];
  const { sec } = useAg();
  useEffect(() => { queueMicrotask(() => sec(ag)); }, [ag, sec]);

  const { address: benim } = useAccount();
  const bensin = !!benim && benim.toLowerCase() === address.toLowerCase();
  const client = usePublicClient({ chainId: AGLAR.sepolia.chainId });
  const isimler = useQuery({
    queryKey: ["isimler-sahip", address.toLowerCase()],
    enabled: valid && !!client && !!AGLAR.sepolia.registrar && ag === "sepolia",
    queryFn: async () => (await readNames(client!)).filter((n) => n.owner.toLowerCase() === address.toLowerCase()),
  });
  const q = useQuery({
    enabled: valid,
    queryKey: ["sahip", ag, address.toLowerCase(), page],
    queryFn: async () => (await fetch(`/api/sahip?chain=${ag}&address=${address}&page=${page}`)).json() as Promise<Cevap>,
  });
  const c = q.data;

  if (!valid) notFound();
  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-10">
      <Link href="/workbench#directory" className="text-[13px] text-[var(--soluk)] hover:text-[var(--yazi)]">← {z.ad} directory</Link>
      <p className="mt-6 text-[13px] uppercase tracking-[0.18em] text-[var(--cok-soluk)]">{bensin ? "Your profile" : "Owner"} on {z.ad}</p>
      <h1 className="mono mt-2 break-all text-[22px] sm:text-[28px]">{address}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[14px] text-[var(--soluk)]">
        {c && !c.error && <span><span className="text-[var(--yazi)]">{c.total}</span> agents · <span className="text-[var(--yesil)]">{c.passing} pass</span> · {c.total - c.passing} filtered</span>}
        <a className="underline decoration-[var(--cizgi)] underline-offset-4" href={`${z.tarayici}/address/${address}`} target="_blank" rel="noopener">explorer</a>
      </div>
      {c && c.total > 20 && c.passing / c.total < 0.2 && (
        <div className="mt-4 rounded-xl border border-[var(--sari)]/40 bg-[var(--sari-acik)] px-4 py-3 text-[14px] text-[var(--sari)]">
          This wallet held {c.total} records in the snapshot; fewer than one in five passed the published checks. The snapshot does not establish who minted them.
        </div>
      )}

      {ag === "sepolia" && (
        <section className="mt-8">
          <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Names on nomen-demo.eth</h2>
          {isimler.isError && <p role="alert">Could not load names from the chain.</p>}
          {isimler.data && isimler.data.length === 0 && (
            <p className="mt-2 text-[14px] text-[var(--soluk)]">No names yet. {bensin && <Link className="underline" href="/claim">Claim one for an agent that passed.</Link>}</p>
          )}
          {isimler.data && isimler.data.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {isimler.data.map((n) => (
                <Link key={n.label} href={`/name/${n.label}`}><Rozet ton={n.canli ? "bilgi" : "kotu"}>{n.label}.nomen-demo.eth · #{n.agentId}{n.canli ? "" : " · revoked"}</Rozet></Link>
              ))}
            </ul>
          )}
        </section>
      )}
      {z.isimTalebi && bensin && c && c.total > 0 && c.passing > 0 && (
        <p className="mt-4 text-[14px] text-[var(--soluk)]">{c.passing} of your agents can claim a name. <Link className="underline" href="/claim">Go to claim</Link>.</p>
      )}

      {q.isLoading && <p className="mt-8 text-[var(--soluk)]">loading…</p>}
      {c?.error && <p className="mt-8 text-[var(--kirmizi)]">{c.error}</p>}
      {c && !c.error && c.total === 0 && <p className="mt-8 text-[var(--soluk)]">No ERC-8004 records owned by this address on {z.ad} as of the last scan.</p>}

      {c && c.total > 0 && <div className="mt-4 flex gap-3"><button className="dugme" disabled={page === 0} onClick={() => setPage(page - 1)}>previous</button><span>Page {page + 1}</span><button className="dugme" disabled={!c.hasMore} onClick={() => setPage(page + 1)}>next</button></div>}
      {c && c.total > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--cizgi)]">
          <table className="w-full text-[13.5px]">
            <thead className="bg-[var(--yuzey)] text-left text-[11px] uppercase tracking-[0.1em] text-[var(--cok-soluk)]">
              <tr><th className="px-4 py-2.5">id</th><th className="px-4 py-2.5">status</th><th className="px-4 py-2.5">name</th><th className="px-4 py-2.5">category</th><th className="px-4 py-2.5">endpoints</th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--cizgi)]">
              {c.agents.map((a) => (
                <tr key={a.agentId} className="hover:bg-[var(--yuzey)]">
                  <td className="mono px-4 py-2.5"><Link className="underline decoration-[var(--cizgi)] underline-offset-4" href={`/agent/${ag}/${a.agentId}`}>#{a.agentId}</Link></td>
                  <td className="px-4 py-2.5">{a.passes ? <Rozet ton="iyi">passes</Rozet> : <Rozet ton="kotu">{ELEME_EN[a.status] ?? a.status}</Rozet>}</td>
                  <td className="max-w-[280px] truncate px-4 py-2.5">{a.name || <span className="text-[var(--cok-soluk)]">—</span>}</td>
                  <td className="px-4 py-2.5 text-[var(--soluk)]">{a.category ? KAT_EN[a.category] ?? a.category : "—"}</td>
                  <td className="mono px-4 py-2.5 text-[var(--soluk)]">{a.endpoints.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
