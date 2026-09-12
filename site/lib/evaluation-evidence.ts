import { z } from "zod";
import { keccak256, toBytes } from "viem";
import { canonicalJson } from "./evaluation-registry.ts";

export const evidenceBundleSchema = z.object({
  chain: z.enum(["sepolia", "arbitrum", "arc"]),
  transactionHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  report: z.object({ chain: z.string(), agentId: z.number().int().positive().safe(), block: z.string().regex(/^\d+$/), fingerprint: z.string(), name: z.string(), job: z.string(), request: z.string().optional() }).passthrough(),
  evidence: z.object({ version: z.literal(1), reportFingerprint: z.string(), outcome: z.enum(["inconclusive", "passed", "failed"]), checklist: z.array(z.string()).max(100), note: z.string().max(20000), rating: z.number().int().min(1).max(10).optional() }).strict(),
});
export type EvidenceBundle = z.infer<typeof evidenceBundleSchema>;
export function parseEvidenceBundle(text: string) {
  if (new TextEncoder().encode(text).length > 64000) throw new Error("Evidence file exceeds 64 KB.");
  return evidenceBundleSchema.parse(JSON.parse(text));
}
export function verifyEvidence(bundle: EvidenceBundle, receipt: { agentId: number; observedBlock: string; outcome: string; reportHash: string; evidenceHash: string }) {
  return bundle.chain === bundle.report.chain && bundle.report.agentId === receipt.agentId &&
    BigInt(bundle.report.block) === BigInt(receipt.observedBlock) && bundle.evidence.outcome === receipt.outcome &&
    bundle.evidence.reportFingerprint === bundle.report.fingerprint &&
    keccak256(toBytes(canonicalJson(bundle.report))) === receipt.reportHash &&
    keccak256(toBytes(canonicalJson(bundle.evidence))) === receipt.evidenceHash;
}
