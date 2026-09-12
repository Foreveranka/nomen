"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AGLAR } from "@/lib/aglar";
import type { EvaluationHistoryReceipt } from "@/lib/evaluation-history-summary";

type HistoryResponse = {
  status: "live";
  agentId: number;
  registry: string;
  checkedAt: string;
  summary: {
    total: number;
    distinctReviewers: number;
    passed: number;
    failed: number;
    inconclusive: number;
    latestRecordedAt: string | null;
  };
  receipts: EvaluationHistoryReceipt[];
};

function short(value: string) {
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function time(timestamp: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })
    .format(new Date(Number(timestamp) * 1_000));
}

export default function AgentTrustHistory({ agentId, full = false }: { agentId: number; full?: boolean }) {
  const query = useQuery({
    queryKey: ["evaluation-history", "arbitrum", agentId],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/evaluations?chain=arbitrum&agentId=${agentId}`, { signal });
      if (!response.ok) throw new Error("Receipt history is unavailable");
      return response.json() as Promise<HistoryResponse>;
    },
    retry: false,
  });
  const history = query.data;
  const explorer = AGLAR.arbitrum.tarayici;

  if (query.isPending) {
    return <div className="kart-cizgili mt-8 p-6 text-sm text-[var(--soluk)]">Reading Arbitrum receipt history…</div>;
  }
  if (query.isError || !history) {
    return (
      <div className="kart-cizgili mt-8 p-6">
        <h2 className="text-lg">Public trust history</h2>
        <p className="mt-2 text-sm text-[var(--soluk)]">Arbitrum receipt history is unavailable. NOMEN does not display this as zero reviews.</p>
      </div>
    );
  }

  return (
    <section className="kart-cizgili mt-8 p-6" aria-labelledby="trust-history-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Arbitrum Sepolia</p>
          <h2 id="trust-history-title" className="mt-1 text-xl">Public trust history</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--soluk)]">Wallet-submitted trial receipts read directly from the append-only evaluation contract. Counts are not proof of unique people or a NOMEN certification.</p>
        </div>
        {!full && <Link className="dugme" href={`/agent/arbitrum/${agentId}/trust`}>Open full history →</Link>}
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total", history.summary.total],
          ["Review wallets", history.summary.distinctReviewers],
          ["Passed", history.summary.passed],
          ["Failed", history.summary.failed],
          ["Inconclusive", history.summary.inconclusive],
        ].map(([label, value]) => <div key={label} className="rounded-xl bg-[var(--yuzey)] p-4"><dt className="text-xs text-[var(--cok-soluk)]">{label}</dt><dd className="mt-1 text-2xl font-light">{value}</dd></div>)}
      </dl>

      {history.receipts.length === 0 ? (
        <p className="mt-6 rounded-xl bg-[var(--yuzey)] p-4 text-sm text-[var(--soluk)]">No receipts were returned by the live contract read for this agent.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[var(--cizgi)] text-xs text-[var(--cok-soluk)]"><tr><th className="pb-3 font-normal">Outcome</th><th className="pb-3 font-normal">Reviewer</th><th className="pb-3 font-normal">Recorded</th><th className="pb-3 font-normal">Observed block</th><th className="pb-3 font-normal">Evidence</th><th className="pb-3 font-normal">Transaction</th></tr></thead>
            <tbody className="divide-y divide-[var(--cizgi)]">
              {history.receipts.map((receipt) => (
                <tr key={receipt.evaluationId}>
                  <td className="py-3 capitalize">{receipt.outcome}</td>
                  <td className="mono py-3 text-xs"><a className="underline decoration-[var(--cizgi)] underline-offset-4" href={`${explorer}/address/${receipt.reviewer}`} target="_blank" rel="noopener">{short(receipt.reviewer)}</a></td>
                  <td className="py-3 text-[var(--soluk)]">{time(receipt.recordedAt)} UTC</td>
                  <td className="mono py-3 text-xs">{receipt.observedBlock}</td>
                  <td className="mono py-3 text-xs" title={receipt.evidenceHash}>{short(receipt.evidenceHash)}</td>
                  <td className="py-3"><a className="underline decoration-[var(--cizgi)] underline-offset-4" href={`${explorer}/tx/${receipt.transactionHash}`} target="_blank" rel="noopener">Arbiscan →</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-[var(--cok-soluk)]">Live read checked {new Date(history.checkedAt).toLocaleString("en", { timeZone: "UTC" })} UTC · <a className="underline" href={`${explorer}/address/${history.registry}`} target="_blank" rel="noopener">evaluation contract</a></p>
    </section>
  );
}
