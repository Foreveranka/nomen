"use client";
import { useQuery } from "@tanstack/react-query";

type Activity = {
  indexedBlock: number;
  scope: string;
  freshness: { indexedAt: string | null; stale: boolean };
  agent: null | { owner: string; lastUpdatedAt: string; feedbackCount: string; distinctClients: string;
    feedback: { tag1: string; tag2: string; revoked: boolean; createdAt: string }[] };
};

export default function AgentActivity({ chain, agentId }: { chain: string; agentId: number }) {
  const query = useQuery<Activity>({
    queryKey: ["graph-activity", chain, agentId],
    enabled: (chain === "sepolia" || chain === "arc") && agentId > 0,
    staleTime: 60_000, retry: false, refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/activity?chain=${chain}&agentId=${agentId}`, { signal });
      if (!response.ok) throw new Error("Indexed activity is unavailable. Your direct checks above remain separate.");
      return response.json();
    },
  });
  if (chain !== "sepolia" && chain !== "arc") return null;
  const data = query.data;
  return <section className="mt-5 rounded-xl border border-[var(--cizgi)] p-5" aria-label="Indexed registry activity">
    <div className="flex items-center justify-between gap-3"><h3>Registry activity</h3><span className="rozet">The Graph · {chain === "arc" ? "Arc Testnet" : "Sepolia"}</span></div>
    {query.isPending && <p className="mt-3 text-sm text-[var(--soluk)]">Reading indexed events…</p>}
    {query.isError && <div className="mt-3 text-sm"><p>{query.error.message}</p><button className="dugme mt-3" onClick={() => query.refetch()}>Retry</button></div>}
    {data && <>
      <p className="mt-2 text-xs text-[var(--soluk)]">{data.scope}</p>
      <p className="mt-3 text-xs text-[var(--soluk)]">Indexed through block {data.indexedBlock.toLocaleString()}{data.freshness.indexedAt ? ` · ${new Date(data.freshness.indexedAt).toLocaleString()}` : " · timestamp unavailable"}</p>
      {data.freshness.stale && <p className="mt-2 text-sm text-amber-800">The index is catching up. Recent events may be missing.</p>}
      {data.agent ? <>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-[var(--soluk)]">Feedback records</dt><dd className="mt-1 text-xl">{data.agent.feedbackCount}</dd></div><div><dt className="text-[var(--soluk)]">Distinct feedback wallets</dt><dd className="mt-1 text-xl">{data.agent.distinctClients}</dd></div></dl>
        <p className="mt-3 break-all text-xs text-[var(--soluk)]">Indexed owner: {data.agent.owner}</p>
        {data.agent.feedback.length > 0 ? <ul className="mt-3 divide-y divide-[var(--cizgi)] text-sm">{data.agent.feedback.map((item, i) => <li key={`${item.createdAt}-${i}`} className="py-2">{[item.tag1, item.tag2].filter(Boolean).join(" · ") || "Untagged feedback"}{item.revoked ? " · withdrawn" : ""}</li>)}</ul> : <p className="mt-3 text-sm text-[var(--soluk)]">No feedback has been indexed for this agent.</p>}
        <p className="mt-3 text-xs text-[var(--soluk)]">Wallets and feedback are registry facts, not verified customers or proof of task quality.</p>
      </> : <p className="mt-3 text-sm text-[var(--soluk)]">This agent has not appeared in the index yet. That does not establish that it is unregistered.</p>}
    </>}
  </section>;
}
