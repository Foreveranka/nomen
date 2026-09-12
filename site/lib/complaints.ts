import { z } from "zod";
import { keccak256, toBytes } from "viem";
import { canonicalJson } from "./evaluation-registry.ts";

export const COMPLAINT_FEE = "5000000000000000000";
export const COMPLAINT_PAYMENT_CHAIN = 5042002;
export const COMPLAINT_TREASURY = "0xD7256e7a20368bAc505A738CC1C2cbc8d0648849" as const;
const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/).transform(v => v.toLowerCase());
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
export const complaintFields = z.object({
  requested: text(20, 1500), happened: text(20, 2000), problem: text(20, 1500),
  evidence: z.string().trim().max(1000).default(""),
}).strict();
export const complaintDraft = complaintFields.extend({
  id: z.string().uuid(), author: address, chain: z.enum(["sepolia", "arbitrum", "arc"]),
  agentId: z.number().int().positive().safe(), demo: z.boolean(),
}).strict();
const common = { id: z.string().uuid(), author: address, timestamp: z.number().int().positive().safe() };
export const complaintAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("prepare"), timestamp: common.timestamp, draft: complaintDraft }).strict(),
  z.object({ ...common, type: z.literal("publish"), transaction: z.string().regex(/^0x[0-9a-fA-F]{64}$/).transform(v => v.toLowerCase()) }).strict(),
  z.object({ ...common, type: z.literal("edit"), version: z.number().int().positive().max(2147483646), fields: complaintFields }).strict(),
  z.object({ ...common, type: z.literal("reply"), version: z.number().int().positive().max(2147483646), message: text(20, 2000) }).strict(),
  z.object({ ...common, type: z.literal("status"), version: z.number().int().positive().max(2147483646), status: z.enum(["open", "resolved"]), message: text(10, 1000) }).strict(),
]);
export type ComplaintDraft = z.infer<typeof complaintDraft>;
export type ComplaintAction = z.infer<typeof complaintAction>;
export type ComplaintFields = z.infer<typeof complaintFields>;
export function complaintMessage(action: ComplaintAction) {
  return ["NOMEN complaint record · v1", "Site: https://nomen-beta.vercel.app", "I authorize this action. Published statements and evidence references are public. The fee verifies publication payment, not purchase or truth.", canonicalJson(action)].join("\n");
}
export function complaintCommitment(draft: ComplaintDraft) {
  return keccak256(toBytes(canonicalJson({ domain: "NOMEN complaint fee v1", chainId: COMPLAINT_PAYMENT_CHAIN, treasury: COMPLAINT_TREASURY.toLowerCase(), fee: COMPLAINT_FEE, draft })));
}
export function complaintTextHash(fields: ComplaintFields) {
  return keccak256(toBytes([fields.requested, fields.happened, fields.problem].map(x => x.toLowerCase().replace(/\s+/g, " ").trim()).join("\n")));
}
export function actionSigner(action: ComplaintAction) { return action.type === "prepare" ? action.draft.author : action.author; }
export function assertFreshAction(action: ComplaintAction, now = Date.now()) {
  if (Math.abs(now - action.timestamp) > 15 * 60_000) throw new Error("Signature expired. Sign again; no additional payment is needed.");
}
export function assertPayment(draft: ComplaintDraft, tx: { from: string; to: string | null; value: bigint; input: string }, receipt: { status: string; blockHash: string }, canonicalHash: string | null) {
  if (receipt.status !== "success" || receipt.blockHash !== canonicalHash) throw new Error("Payment is not confirmed on the canonical chain.");
  if (tx.from.toLowerCase() !== draft.author || tx.to?.toLowerCase() !== COMPLAINT_TREASURY.toLowerCase() || tx.value !== BigInt(COMPLAINT_FEE) || tx.input.toLowerCase() !== complaintCommitment(draft)) throw new Error("Payment must match this wallet, draft, recipient and exact 5 test USDC fee on Arc Testnet.");
}
export type ComplaintRecord = {
  id: string; chain: ComplaintDraft["chain"]; agentId: number; author: string; demo: boolean;
  fields: ComplaintFields; initialDraft: ComplaintDraft; commitment: string;
  status: "pending" | "open" | "resolved"; version: number; paymentTx: string | null;
  createdAt: string; publishedAt: string | null; updatedAt: string; flags: string[];
  events?: { actor: string; kind: string; payload: ComplaintAction; signature: string; created_at: string; owner_block: string | null; version: number }[];
};
