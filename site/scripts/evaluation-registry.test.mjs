import test from "node:test";
import assert from "node:assert/strict";
import { evaluationReceipt, OUTCOME_CODE } from "../lib/evaluation-registry.ts";

const report = {
  version: 1,
  chain: "arbitrum",
  agentId: 205,
  job: "custom",
  request: "Check one public observation",
  name: "Orbital Oracle",
  checkedAt: "2026-09-12T00:25:33.463Z",
  expiresAt: "2026-09-12T00:40:33.463Z",
  block: "307935349",
  owner: "0x04274c7be78c3a0e7493122e12a97edc11c2ea9e",
  metadataHash: "b45f86e7d39494a6c047175b9c7752ef1a2e7f1130777046a94254401861903b",
  fingerprint: "a889afe5f4714adb270f030676318467fbe4ed18c227aae4a3807cb75c024a67",
  checks: [],
  services: [],
  declaredMatch: [],
  decision: "needs_review",
  automaticExecutionAllowed: false,
  nextAction: "Review",
  limitations: [],
};

test("receipt hashes are deterministic across object key and checklist order", () => {
  const first = evaluationReceipt(report, "passed", "  Public trial passed.  ", ["B", "A"]);
  const reordered = Object.fromEntries(Object.entries(report).reverse());
  const second = evaluationReceipt(reordered, "passed", "Public trial passed.", ["A", "B"]);
  assert.equal(first.reportHash, second.reportHash);
  assert.equal(first.evidenceHash, second.evidenceHash);
});

test("outcome and note changes produce different evidence hashes", () => {
  const passed = evaluationReceipt(report, "passed", "Public trial passed.", []);
  const failed = evaluationReceipt(report, "failed", "Public trial failed.", []);
  assert.notEqual(passed.evidenceHash, failed.evidenceHash);
  assert.equal(OUTCOME_CODE.passed, 1);
  assert.equal(OUTCOME_CODE.failed, 2);
});
