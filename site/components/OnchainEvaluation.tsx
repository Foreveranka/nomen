"use client";

import { useMemo } from "react";
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AGLAR, type AgAnahtar } from "@/lib/aglar";
import type { Evaluation } from "@/lib/evaluation";
import {
  EVALUATION_REGISTRY_ABI,
  OUTCOME_CODE,
  evaluationReceipt,
  type TrialOutcome,
} from "@/lib/evaluation-registry";

export default function OnchainEvaluation({
  report,
  outcome,
  notes,
  checked,
  recorded,
}: {
  report: Evaluation;
  outcome: TrialOutcome;
  notes: string;
  checked: string[];
  recorded: boolean;
}) {
  const network = AGLAR[report.chain as AgAnahtar];
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
    chainId: network?.chainId,
  });
  const hashes = useMemo(
    () => evaluationReceipt(report, outcome, notes, checked),
    [report, outcome, notes, checked],
  );

  if (!network) return null;
  if (!network.evaluationRegistry) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--cizgi)] p-5">
        <h3>Onchain trial receipt</h3>
        <p className="mt-2 text-sm text-[var(--soluk)]">
          The common receipt contract is ready for this network, but its deployment address has not been enabled yet.
        </p>
      </div>
    );
  }

  const observedBlock = report.block && /^\d+$/.test(report.block) ? BigInt(report.block) : null;
  const explorer = write.data ? `${network.tarayici}/tx/${write.data}` : null;

  return (
    <div className="mt-5 rounded-xl border border-[var(--cizgi)] p-5">
      <h3>Publish your trial receipt</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--soluk)]">
        Your wallet records the agent, result, observed block and two hashes on {network.ad}. Your note stays out of the transaction. This proves what your wallet reported; it is not a NOMEN certification.
      </p>
      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div><dt className="text-[var(--soluk)]">Report hash</dt><dd className="mt-1 break-all mono">{hashes.reportHash}</dd></div>
        <div><dt className="text-[var(--soluk)]">Evidence hash</dt><dd className="mt-1 break-all mono">{hashes.evidenceHash}</dd></div>
      </dl>
      {!recorded && <p className="mt-4 text-sm">Record this trial review in your browser first.</p>}
      {recorded && !isConnected && <p className="mt-4 text-sm">Connect your wallet to publish the receipt.</p>}
      {recorded && isConnected && chainId !== network.chainId && (
        <button className="dugme mt-4" onClick={() => switchChain({ chainId: network.chainId })}>
          Switch wallet to {network.ad}
        </button>
      )}
      {recorded && isConnected && chainId === network.chainId && observedBlock !== null && (
        <button
          className="dugme dugme-koyu mt-4"
          disabled={write.isPending || receipt.isLoading || receipt.isSuccess}
          onClick={() => write.writeContract({
            address: network.evaluationRegistry!,
            abi: EVALUATION_REGISTRY_ABI,
            functionName: "recordEvaluation",
            chainId: network.chainId,
            args: [BigInt(report.agentId), hashes.reportHash, hashes.evidenceHash, observedBlock, OUTCOME_CODE[outcome]],
          })}
        >
          {write.isPending ? "Confirm in wallet…" : receipt.isLoading ? "Recording onchain…" : receipt.isSuccess ? "Receipt recorded" : "Record onchain"}
        </button>
      )}
      {observedBlock === null && <p className="mt-4 text-sm">This report has no confirmed observation block, so it cannot be recorded onchain.</p>}
      {write.error && <p role="alert" className="mt-3 text-sm text-red-700">{write.error.message}</p>}
      {receipt.error && <p role="alert" className="mt-3 text-sm text-red-700">{receipt.error.message}</p>}
      {explorer && <a className="mt-3 block text-sm underline" href={explorer} target="_blank" rel="noopener">View transaction on {network.ad} explorer →</a>}
      {receipt.isSuccess && report.chain === "arbitrum" && <a className="mt-3 block text-sm underline" href={`/agent/arbitrum/${report.agentId}/trust`}>Open this agent&apos;s public trust history →</a>}
    </div>
  );
}
