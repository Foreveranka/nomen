import { keccak256, toBytes } from "viem";
import { canonicalJson } from "./evaluation-registry.ts";
import type { EvidenceBundle } from "./evaluation-evidence.ts";

export function publicationMessage(bundle: EvidenceBundle, demo: boolean) {
  return ["NOMEN public review · v1", "Site: https://nomen-beta.vercel.app", "I agree to publish this report, task, rating, notes and checklist publicly on NOMEN.", `Network: ${bundle.chain}`, `Transaction: ${bundle.transactionHash.toLowerCase()}`, `Report: ${keccak256(toBytes(canonicalJson(bundle.report)))}`, `Review: ${keccak256(toBytes(canonicalJson(bundle.evidence)))}`, `Demo: ${demo}`].join("\n");
}
export const DEMO_TRANSACTIONS = new Set([
  "0xa8fb5057059c50b9a12fa838274432a95c86b8fa1d8d52a42055ed52d6471992",
  "0x06bf1136eeaeb4580d954224c0bd712d1ff783e0b93a495bb307070ba791e1dd",
]);
export type PublicReview = { id: string; reviewer: string; rating: number | null; note: string; outcome: string; recordedAt: number; transactionHash: string; demo: boolean };
export type ReviewResponse = { average: number | null; count: number; total: number; reviews: PublicReview[]; demos: PublicReview[]; page: number; pages: number };
