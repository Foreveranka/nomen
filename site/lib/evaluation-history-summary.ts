import type { Address, Hex } from "viem";

export type EvaluationHistoryReceipt = {
  evaluationId: Hex;
  reviewer: Address;
  agentId: number;
  reportHash: Hex;
  evidenceHash: Hex;
  observedBlock: string;
  recordedAt: string;
  outcome: "inconclusive" | "passed" | "failed";
  blockNumber: string;
  transactionHash: Hex;
  logIndex: number;
};

export function latestEvaluationReceipts(receipts: EvaluationHistoryReceipt[]) {
  const latest = new Map<string, EvaluationHistoryReceipt>();
  for (const receipt of receipts) {
    const key = `${receipt.agentId}:${receipt.reviewer.toLowerCase()}`;
    const previous = latest.get(key);
    if (!previous || BigInt(receipt.blockNumber) > BigInt(previous.blockNumber) ||
      (receipt.blockNumber === previous.blockNumber && receipt.logIndex > previous.logIndex)) latest.set(key, receipt);
  }
  return [...latest.values()].sort((a, b) => BigInt(a.blockNumber) === BigInt(b.blockNumber)
    ? b.logIndex - a.logIndex : BigInt(a.blockNumber) > BigInt(b.blockNumber) ? -1 : 1);
}

export function summarizeEvaluationReceipts(receipts: EvaluationHistoryReceipt[]) {
  const latest = latestEvaluationReceipts(receipts);
  const counts = { passed: 0, failed: 0, inconclusive: 0 };
  for (const receipt of latest) counts[receipt.outcome]++;
  return {
    total: receipts.length,
    distinctReviewers: new Set(receipts.map(r => r.reviewer.toLowerCase())).size,
    superseded: receipts.length - latest.length,
    ...counts,
    latestRecordedAt: latest[0]?.recordedAt ?? null,
  };
}
