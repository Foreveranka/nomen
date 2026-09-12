import { createPublicClient, http, fallback, verifyMessage, type Hex } from "viem";
import { sepolia, arbitrumSepolia } from "viem/chains";
import { AGLAR, arcTestnet } from "./aglar";
import { complaintPayment, actionSigner, complaintMessage, assertFreshAction, assertPayment, type ComplaintAction, type ComplaintDraft, type ComplaintRecord } from "./complaints";
export class ComplaintError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function complaintClient(chain: "sepolia" | "arbitrum" | "arc") {
  const urls = chain === "arc" ? ["https://rpc.testnet.arc.network"] : chain === "arbitrum" ? ["https://sepolia-rollup.arbitrum.io/rpc"] : ["https://ethereum-sepolia-rpc.publicnode.com", "https://sepolia.drpc.org"];
  return createPublicClient({ chain: chain === "arc" ? arcTestnet : chain === "sepolia" ? sepolia : arbitrumSepolia, transport: fallback(urls.map(url => http(url, { timeout: 8000, retryCount: 0 })), { retryCount: 0 }) });
}
export async function authenticateComplaint(action: ComplaintAction, signature: Hex, signatureChain: ComplaintDraft["chain"]) {
  try { assertFreshAction(action); } catch (e) { throw new ComplaintError((e as Error).message, 401); }
  const proof = { address: actionSigner(action) as Hex, message: complaintMessage(action), signature };
  // Contract-wallet signatures are checked on the persisted payment network (provider replies on the agent network).
  if (!await verifyMessage(proof) && !await complaintClient(signatureChain).verifyMessage(proof)) throw new ComplaintError("The wallet signature is invalid.", 401);
}
const ownerAbi = [{ type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ type: "uint256", name: "tokenId" }], outputs: [{ type: "address" }] }] as const;
export async function currentAgentOwner(chain: ComplaintDraft["chain"], agentId: number) {
  const client = complaintClient(chain); const block = await client.getBlockNumber();
  try {
    const owner = await client.readContract({ address: AGLAR[chain].identity, abi: ownerAbi, functionName: "ownerOf", args: [BigInt(agentId)], blockNumber: block });
    if (/^0x0{40}$/i.test(owner)) throw new Error();
    return { owner: owner.toLowerCase(), block: block.toString() };
  } catch { throw new ComplaintError("Could not confirm this agent's current registry owner. Retry before paying or replying.", 503); }
}
export async function validateComplaintPayment(draft: ComplaintDraft, hash: Hex) {
  const policy = complaintPayment(draft);
  const client = complaintClient(policy.chain);
  if (await client.getChainId() !== policy.chainId) throw new ComplaintError("Payment network is unavailable.", 503);
  const [tx, receipt] = await Promise.all([client.getTransaction({ hash }), client.getTransactionReceipt({ hash })]);
  const canonical = await client.getBlock({ blockNumber: receipt.blockNumber });
  try { assertPayment(draft, tx, receipt, canonical.hash, policy.chainId); } catch (e) { throw new ComplaintError((e as Error).message, 422); }
  return { block: receipt.blockNumber.toString() };
}
export function publicComplaint(row: Record<string, unknown>): ComplaintRecord {
  return { id: String(row.id), chain: row.chain as ComplaintRecord["chain"], agentId: Number(row.agent_id), author: String(row.author), demo: Boolean(row.demo), fields: row.fields as ComplaintRecord["fields"], initialDraft: row.initial_draft as ComplaintDraft, commitment: String(row.commitment), status: row.status as ComplaintRecord["status"], version: Number(row.version), paymentTx: row.payment_tx as string | null, flags: row.flags as string[], createdAt: String(row.created_at), publishedAt: row.published_at ? String(row.published_at) : null, updatedAt: String(row.updated_at) };
}
