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

export function summarizeEvaluationReceipts(receipts: EvaluationHistoryReceipt[]) {
  const counts = { passed: 0, failed: 0, inconclusive: 0 };
  const reviewers = new Set<string>();
  for (const receipt of receipts) {
    counts[receipt.outcome]++;
    reviewers.add(receipt.reviewer.toLowerCase());
  }
  return {
    total: receipts.length,
    distinctReviewers: reviewers.size,
    ...counts,
    latestRecordedAt: receipts[0]?.recordedAt ?? null,
  };
}
