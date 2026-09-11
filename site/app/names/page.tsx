"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { readNames } from "@/lib/names";
import { AGLAR } from "@/lib/aglar";
import { Rozet } from "@/components/AjanKart";

/** Verilen tüm isimler, registrar olaylarından. Geri alınanlar da listelenir, sebepleriyle. */
export default function Isimler() {
  const z = AGLAR.sepolia;
  const client = usePublicClient({ chainId: z.chainId });
  const q = useQuery({
    queryKey: ["isimler", z.registrar],
    enabled: !!client && !!z.registrar,
    queryFn: () => readNames(client!),
  });
  const liste = q.data ?? [];

  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-12">
      <p className="text-[13px] uppercase tracking-[0.18em] text-[var(--cok-soluk)]">Sepolia · nomen-demo.eth</p>
      <h1 className="baslik mt-2 text-[40px] leading-tight sm:text-[52px]">Names issued so far</h1>
      <p className="ince mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--soluk)]">
        Every subname the registrar has ever issued, read from its events. Revoked names stay in the list with the reason, because a revocation is a fact worth keeping.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[14px] text-[var(--soluk)]">
        <span>{q.isLoading ? "reading the chain…" : `${liste.length} names · ${liste.filter((i) => i.canli).length} live`}</span>
        <Link href="/claim" className="dugme dugme-birincil">claim yours</Link>
      </div>

      {q.isError && <p role="alert" className="mt-6">Could not read the chain. <button onClick={() => q.refetch()}>Retry</button></p>}
      {!q.isLoading && !q.isError && liste.length === 0 && (
        <div className="kart mt-6 p-8 text-center">
          <p className="text-[16px]">No names yet.</p>
          <p className="ince mt-1 text-[14px] text-[var(--soluk)]">Eligible agents can claim on Sepolia. Confirmed names will appear here.</p>
        </div>
      )}

      {liste.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--cizgi)]">
          <table className="w-full text-[13.5px]">
            <thead className="bg-[var(--yuzey)] text-left text-[11px] uppercase tracking-[0.1em] text-[var(--cok-soluk)]">
              <tr><th className="px-4 py-2.5">name</th><th className="px-4 py-2.5">agent</th><th className="px-4 py-2.5">owner</th><th className="px-4 py-2.5">status</th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--cizgi)]">
              {liste.map((i) => (
                <tr key={i.label} className="hover:bg-[var(--yuzey)]">
                  <td className="mono px-4 py-2.5"><Link className="underline decoration-[var(--cizgi)] underline-offset-4" href={`/name/${i.label}`}>{i.label}.nomen-demo.eth</Link></td>
                  <td className="mono px-4 py-2.5"><Link className="underline decoration-[var(--cizgi)] underline-offset-4" href={`/agent/sepolia/${i.agentId}`}>#{i.agentId}</Link></td>
                  <td className="mono px-4 py-2.5 text-[12px] text-[var(--soluk)]"><Link className="underline decoration-[var(--cizgi)] underline-offset-4" href={`/owner/sepolia/${i.owner}`}>{i.owner.slice(0, 10)}…</Link></td>
                  <td className="px-4 py-2.5">{i.canli ? <Rozet ton="iyi">live</Rozet> : <Rozet ton="kotu">revoked · {i.sebep}</Rozet>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
