import { keccak256, toBytes } from "viem";
import type { Evaluation } from "./evaluation";

export type TrialOutcome = "inconclusive" | "passed" | "failed";

export const OUTCOME_CODE: Record<TrialOutcome, number> = {
  inconclusive: 0,
  passed: 1,
  failed: 2,
};

export const EVALUATION_REGISTRY_ABI = [
  {
    type: "event",
    name: "EvaluationRecorded",
    anonymous: false,
    inputs: [
      { name: "evaluationId", type: "bytes32", indexed: true },
      { name: "reviewer", type: "address", indexed: true },
      { name: "agentId", type: "uint256", indexed: true },
      { name: "reportHash", type: "bytes32", indexed: false },
      { name: "evidenceHash", type: "bytes32", indexed: false },
      { name: "observedBlock", type: "uint64", indexed: false },
      { name: "recordedAt", type: "uint64", indexed: false },
      { name: "outcome", type: "uint8", indexed: false },
    ],
  },
  {
    type: "function",
    name: "recordEvaluation",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "reportHash", type: "bytes32" },
      { name: "evidenceHash", type: "bytes32" },
      { name: "observedBlock", type: "uint64" },
      { name: "outcome", type: "uint8" },
    ],
    outputs: [{ name: "evaluationId", type: "bytes32" }],
  },
] as const;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(",")}}`;
}

export function evaluationReceipt(
  report: Evaluation,
  outcome: TrialOutcome,
  notes: string,
  checked: string[],
) {
  const evidence = {
    version: 1,
    reportFingerprint: report.fingerprint,
    outcome,
    checklist: [...checked].sort(),
    note: notes.trim(),
  };
  return {
    reportHash: keccak256(toBytes(canonicalJson(report))),
    evidenceHash: keccak256(toBytes(canonicalJson(evidence))),
    evidence,
  };
}
