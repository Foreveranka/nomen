import assert from "node:assert/strict";
import test from "node:test";
import { summarizeEvaluationReceipts } from "../lib/evaluation-history-summary.ts";

const base = {
  evaluationId: `0x${"1".repeat(64)}`,
  reviewer: "0x1111111111111111111111111111111111111111",
  agentId: 205,
  reportHash: `0x${"2".repeat(64)}`,
  evidenceHash: `0x${"3".repeat(64)}`,
  observedBlock: "307944700",
  recordedAt: "1789200000",
  outcome: "passed",
  blockNumber: "307944701",
  transactionHash: `0x${"4".repeat(64)}`,
  logIndex: 0,
};

test("summarizes outcomes while counting a wallet once", () => {
  const summary = summarizeEvaluationReceipts([
    base,
    { ...base, evaluationId: `0x${"5".repeat(64)}`, outcome: "failed", recordedAt: "1789190000" },
    { ...base, evaluationId: `0x${"6".repeat(64)}`, reviewer: "0x2222222222222222222222222222222222222222", outcome: "inconclusive", recordedAt: "1789180000" },
  ]);
  assert.deepEqual(summary, {
    total: 3,
    distinctReviewers: 2,
    passed: 1,
    failed: 1,
    inconclusive: 1,
    latestRecordedAt: "1789200000",
  });
});

test("empty live result stays distinct from an RPC failure", () => {
  assert.deepEqual(summarizeEvaluationReceipts([]), {
    total: 0,
    distinctReviewers: 0,
    passed: 0,
    failed: 0,
    inconclusive: 0,
    latestRecordedAt: null,
  });
});
