"use client";

import PublishReview from "./PublishReview";
import { evidenceBundleSchema } from "@/lib/evaluation-evidence";
import { useMemo } from "react";
import { useAccount, useConnect, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { AGLAR, type AgAnahtar } from "@/lib/aglar";
import type { Evaluation } from "@/lib/evaluation";
import { EVALUATION_REGISTRY_ABI, OUTCOME_CODE, evaluationReceipt, type TrialOutcome } from "@/lib/evaluation-registry";

const outcomeLabels = { passed: "It worked", failed: "It didn’t work", inconclusive: "Not sure yet" };

export default function OnchainEvaluation({ report, outcome, rating, notes, checked, recorded }: {
  report: Evaluation;
  outcome: TrialOutcome;
  rating?: number | null;
  notes: string;
  checked: string[];
  recorded: boolean;
}) {
  const network = AGLAR[report.chain as AgAnahtar];
  const { isConnected, chainId } = useAccount();
  const connection = useConnect();
  const switching = useSwitchChain();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data, chainId: network?.chainId });
  const hashes = useMemo(() => evaluationReceipt(report, outcome, notes, checked, rating), [report, outcome, notes, checked, rating]);
  const confirmed = receipt.isSuccess && receipt.data?.status === "success";
  const pending = write.isPending || receipt.isLoading;
  if (!network) return null;
  const observedBlock = report.block && /^\d+$/.test(report.block) && BigInt(report.block) > 0 ? BigInt(report.block) : null;
  const explorer = write.data ? `${network.tarayici}/tx/${write.data}` : null;

  function downloadEvidence() {
    const file = new Blob([JSON.stringify({ chain: report.chain, transactionHash: write.data, report, evidence: hashes.evidence }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nomen-evidence-${report.chain}-${report.agentId}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <details className="mt-5 rounded-xl border border-[var(--cizgi)] p-5 sm:p-6">
      <summary className="cursor-pointer text-lg">{confirmed ? "Result published" : "Step 2 · Share your result"}<span className="ml-2 text-xs font-normal text-[var(--soluk)]">Optional</span></summary>
      <p className="mt-3 text-sm text-[var(--soluk)]">Keep your review on this device, or publish a permanent record using your wallet.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[var(--yuzey)] p-4"><h3 className="text-sm font-medium">Public on the network</h3><p className="mt-2 text-sm text-[var(--soluk)]">Your wallet address, agent, result, observation block, time and proof fingerprints. The record cannot be deleted.</p></div>
        <div className="rounded-xl bg-[var(--yuzey)] p-4"><h3 className="text-sm font-medium">Not published as text</h3><p className="mt-2 text-sm text-[var(--soluk)]">Your rating, notes and checklist stay in your evidence file until you choose “Sign & publish review” below.</p></div>
      </div>
      <div className="mt-5 rounded-xl border border-[var(--cizgi)] p-4 text-sm">
        <p><strong>{report.name}</strong> · {outcomeLabels[outcome]}{rating != null ? ` · Your rating: ${rating}/10` : ""}</p>
        <p className="mt-2 text-xs text-[var(--soluk)]">{network.ad}{network.testnet ? " · Test network" : ""} · Wallet confirmation required · Network fee may apply</p>
      </div>
      {!network.evaluationRegistry ? <p className="mt-4 text-sm">Public sharing is not available on this network yet. You can still keep your result on this device.</p> : <>
        {!recorded && <p className="mt-4 text-sm">Save your result in Step 1 before publishing it.</p>}
        {recorded && !isConnected && <div className="mt-4">
          <p className="text-sm">Connect a wallet to publish. Connecting alone does not publish anything.</p>
          {connection.connectors.length ? connection.connectors.map(connector => <button key={connector.uid} className="dugme mt-3 mr-2" disabled={connection.isPending} onClick={() => connection.connect({ connector })}>{connection.isPending ? "Connecting…" : `Connect ${connector.name}`}</button>) : <p className="mt-2 text-sm text-[var(--soluk)]">Open this page in a browser with an Ethereum-compatible wallet.</p>}
        </div>}
        {recorded && isConnected && chainId !== network.chainId && <button className="dugme mt-4" disabled={switching.isPending} onClick={() => switching.switchChain({ chainId: network.chainId })}>{switching.isPending ? "Switching network…" : `Switch to ${network.ad}`}</button>}
        {recorded && isConnected && chainId === network.chainId && observedBlock !== null && <button className="dugme dugme-koyu mt-4" disabled={pending || confirmed} onClick={() => write.writeContract({
          address: network.evaluationRegistry!, abi: EVALUATION_REGISTRY_ABI, functionName: "recordEvaluation", chainId: network.chainId,
          args: [BigInt(report.agentId), hashes.reportHash, hashes.evidenceHash, observedBlock, OUTCOME_CODE[outcome]],
        })}>{write.isPending ? "Confirm in your wallet…" : receipt.isLoading ? "Publishing your result…" : confirmed ? "Result published" : "Publish result with wallet"}</button>}
        {observedBlock === null && <p className="mt-4 text-sm">Recheck this agent to get a confirmed observation before publishing.</p>}
      </>}
      {connection.error && <p role="alert" className="mt-3 text-sm text-red-700">Wallet connection was not completed. Open your wallet and try again.</p>}
      {switching.error && <p role="alert" className="mt-3 text-sm text-red-700">The network switch was not completed. Choose {network.ad} in your wallet and try again.</p>}
      {write.error && <p role="alert" className="mt-3 text-sm text-red-700">Your wallet did not complete publication. Check the network and fee balance, then try again. Your saved review is unchanged.</p>}
      {receipt.error && <p role="alert" className="mt-3 text-sm text-red-700">We could not confirm the transaction yet. Check its status using the link below before trying again.</p>}
      {receipt.data?.status === "reverted" && <p role="alert" className="mt-3 text-sm text-red-700">The network rejected this transaction. Your result was not published; your saved review is unchanged.</p>}
      {confirmed && <div className="mt-5 rounded-xl bg-[var(--yuzey)] p-4" role="status"><h3 className="font-medium">Your result is now public</h3><p className="mt-2 text-sm text-[var(--soluk)]">Download your evidence file to keep the rating, note and checklist linked to this record. The file includes your task and notes; only share it with intended recipients.</p><button className="dugme mt-3" onClick={downloadEvidence}>Download my evidence</button><a className="ml-3 text-sm underline" href="/evaluations/evidence">Check an evidence file →</a></div>}
      {confirmed && write.data && <PublishReview bundle={evidenceBundleSchema.parse({ chain: report.chain, transactionHash: write.data, report, evidence: hashes.evidence })} />}
      {explorer && <a className="mt-3 block text-sm underline" href={explorer} target="_blank" rel="noopener">View network record →</a>}
      {confirmed && report.chain === "arbitrum" && <a className="mt-3 block text-sm underline" href={`/agent/arbitrum/${report.agentId}/trust`}>See this agent’s review history →</a>}
      <details className="mt-5 text-xs text-[var(--soluk)]"><summary className="cursor-pointer">How the evidence is verified</summary><p className="mt-2">Two fingerprints (hashes) link your report and review to the network record. Your score is included in the review fingerprint. Matching fingerprints show the file is unchanged, not that the trial was independently verified.</p><dl className="mt-3 space-y-3"><div><dt>Report fingerprint</dt><dd className="mt-1 break-all mono">{hashes.reportHash}</dd></div><div><dt>Review fingerprint</dt><dd className="mt-1 break-all mono">{hashes.evidenceHash}</dd></div></dl></details>
    </details>
  );
}
