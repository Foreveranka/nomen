"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AGLAR, type AgAnahtar } from "@/lib/aglar";
import { useDizin } from "@/lib/veri";
import { complaintPayment, type ComplaintRecord } from "@/lib/complaints";
export type ComplaintList = { records: ComplaintRecord[]; open: number; resolved: number; flagged: number; total: number; page: number; pages: number };
export function AgentRecordName({chain,agentId}:{chain:AgAnahtar;agentId:number}) {
  const {veri}=useDizin(chain);return <>{veri?.find(a=>a.id===agentId)?.n||`Agent #${agentId}`}</>;
}
export function ComplaintCard({ record }: { record: ComplaintRecord }) {
  return <article className="rounded-xl border border-[var(--cizgi)] p-5">
    <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-[var(--yuzey)] px-3 py-1">{record.status === "resolved" ? "Resolved by author" : "Open"}</span>{record.demo && <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">TEST · Demo record</span>}<span className="text-[var(--soluk)]">Publication fee paid · {complaintPayment(record.initialDraft).name}</span></div>
    <Link href={`/orders?id=${record.id}`} className="mt-3 block font-medium"><AgentRecordName chain={record.chain} agentId={record.agentId}/> →</Link>
    <p className="mt-1 text-xs text-[var(--soluk)]">{AGLAR[record.chain].ad} · #{record.agentId}</p>
    <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6">{record.fields.problem}</p>
    {record.flags.length > 0 && <p className="mt-3 text-xs text-amber-800">Automatic pattern flag · needs review, not a finding of abuse</p>}
    <p className="mt-4 text-xs text-[var(--soluk)]">{record.author.slice(0,6)}…{record.author.slice(-4)} · {new Date(record.publishedAt || record.createdAt).toLocaleDateString("en-US",{dateStyle:"medium",timeZone:"UTC"})}</p>
  </article>;
}
export default function ComplaintRecords({ chain, agentId }: { chain: AgAnahtar; agentId: number }) {
  const query = useQuery<ComplaintList>({ queryKey:["complaints",chain,agentId],queryFn:async()=>{const r=await fetch(`/api/complaints?chain=${chain}&agentId=${agentId}`);if(!r.ok)throw new Error();return r.json();},retry:false });
  return <section className="mt-8 rounded-2xl border border-[var(--cizgi)] p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-medium">Complaint records</h2>{query.data && <p className="mt-2 text-sm">{query.data.open} open · {query.data.resolved} resolved{query.data.flagged>0 ? ` · ${query.data.flagged} flagged for review` : ""}</p>}</div><Link className="dugme" href={`/orders?chain=${chain}&agentId=${agentId}`}>File or manage a complaint →</Link></div>
    <p className="mt-3 text-sm leading-6 text-[var(--soluk)]">The publication fee helps discourage casual spam. It does not verify a purchase or prove a claim. No complaints does not mean an agent performs well. Demo records are excluded from these counts.</p>
    {query.isPending && <p className="mt-4" role="status">Loading records…</p>}{query.isError && <p className="mt-4" role="alert">Records unavailable. <button className="underline" onClick={()=>query.refetch()}>Retry</button></p>}
    {query.data?.total===0 && <p className="mt-5 text-sm">No complaint records found.</p>}
    <div className="mt-5 grid gap-4">{query.data?.records.slice(0,3).map(r=><ComplaintCard record={r} key={r.id}/>)}</div>
    {(query.data?.total || 0)>3 && <Link className="mt-4 block text-sm underline" href={`/orders?chain=${chain}&agentId=${agentId}`}>View all records →</Link>}
  </section>;
}
