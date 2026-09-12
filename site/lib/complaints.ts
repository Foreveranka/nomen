import { z } from "zod";
import { keccak256, toBytes, encodeFunctionData, decodeEventLog, erc20Abi, type Hex } from "viem";
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
  paymentVersion: z.literal(2).optional(),
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
export const COMPLAINT_NETWORKS = {
  sepolia: { chain: "sepolia", chainId: 11155111, name: "Sepolia", token: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", amount: "5000000", decimals: 6, explorer: "https://sepolia.etherscan.io", gas: "test ETH" },
  arbitrum: { chain: "arbitrum", chainId: 421614, name: "Arbitrum Sepolia", token: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", amount: "5000000", decimals: 6, explorer: "https://sepolia.arbiscan.io", gas: "test ETH" },
  arc: { chain: "arc", chainId: 5042002, name: "Arc Testnet", token: null, amount: COMPLAINT_FEE, decimals: 18, explorer: "https://testnet.arcscan.app", gas: "test USDC" },
} as const;
export function complaintPayment(draft: Pick<ComplaintDraft, "chain" | "paymentVersion">) {
  // v1 records, including unpaid reservations, retain their original Arc payment contract.
  return COMPLAINT_NETWORKS[draft.paymentVersion === 2 ? draft.chain : "arc"];
}
export function complaintCommitment(draft: ComplaintDraft) {
  if (draft.paymentVersion === 2) {
    const p = complaintPayment(draft);
    return keccak256(toBytes(canonicalJson({ domain: "NOMEN complaint fee v2", chainId: p.chainId, token: p.token?.toLowerCase() ?? "native", treasury: COMPLAINT_TREASURY.toLowerCase(), fee: p.amount, draft })));
  }
  return keccak256(toBytes(canonicalJson({ domain: "NOMEN complaint fee v1", chainId: COMPLAINT_PAYMENT_CHAIN, treasury: COMPLAINT_TREASURY.toLowerCase(), fee: COMPLAINT_FEE, draft })));
}
export function complaintTextHash(fields: ComplaintFields) {
  return keccak256(toBytes([fields.requested, fields.happened, fields.problem].map(x => x.toLowerCase().replace(/\s+/g, " ").trim()).join("\n")));
}
export function actionSigner(action: ComplaintAction) { return action.type === "prepare" ? action.draft.author : action.author; }
export function assertFreshAction(action: ComplaintAction, now = Date.now()) {
  if (Math.abs(now - action.timestamp) > 15 * 60_000) throw new Error("Signature expired. Sign again; no additional payment is needed.");
}
/** USDC transfer calldata plus a trailing bytes32 original-draft commitment.
 * Solidity ABI decoding permits trailing bytes. We require exact calldata AND a
 * matching token Transfer event, so a successful call alone is never payment proof.
 */
export function complaintTransaction(draft: ComplaintDraft) {
  const p = complaintPayment(draft);
  const data = p.token ? `${encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [COMPLAINT_TREASURY, BigInt(p.amount)] })}${complaintCommitment(draft).slice(2)}` as Hex : complaintCommitment(draft);
  return { chainId: p.chainId, to: (p.token ?? COMPLAINT_TREASURY) as Hex, value: p.token ? BigInt(0) : BigInt(p.amount), data };
}
export function assertPayment(draft: ComplaintDraft, tx: { from: string; to: string | null; value: bigint; input: string }, receipt: { status: string; blockHash: string; logs?: readonly { address: string; data: Hex; topics: readonly Hex[] }[] }, canonicalHash: string | null, observedChainId = 5042002) {
  const p = complaintPayment(draft); const expected = complaintTransaction(draft);
  if (observedChainId !== p.chainId) throw new Error("Payment was checked on the wrong network.");
  if (receipt.status !== "success" || receipt.blockHash !== canonicalHash) throw new Error("Payment is not confirmed on the canonical chain.");
  if (tx.from.toLowerCase() !== draft.author.toLowerCase() || tx.to?.toLowerCase() !== expected.to.toLowerCase() || tx.value !== expected.value || tx.input.toLowerCase() !== expected.data.toLowerCase()) throw new Error(`Payment must match this wallet, original draft, recipient and exact 5 test USDC fee on ${p.name}.`);
  if (p.token) {
    const matching = receipt.logs?.some(log => {
      if (log.address.toLowerCase() !== p.token.toLowerCase()) return false;
      try {
        const event = decodeEventLog({ abi: erc20Abi, eventName: "Transfer", data: log.data, topics: log.topics as [Hex, ...Hex[]] });
        return event.args.from.toLowerCase() === draft.author.toLowerCase() && event.args.to.toLowerCase() === COMPLAINT_TREASURY.toLowerCase() && event.args.value === BigInt(p.amount);
      } catch { return false; }
    });
    if (!matching) throw new Error("The expected USDC transfer is missing from the payment receipt.");
  }
}
export type ComplaintRecord = {
  id: string; chain: ComplaintDraft["chain"]; agentId: number; author: string; demo: boolean;
  fields: ComplaintFields; initialDraft: ComplaintDraft; commitment: string;
  status: "pending" | "open" | "resolved"; version: number; paymentTx: string | null;
  createdAt: string; publishedAt: string | null; updatedAt: string; flags: string[];
  events?: { actor: string; kind: string; payload: ComplaintAction; signature: string; created_at: string; owner_block: string | null; version: number }[];
};
