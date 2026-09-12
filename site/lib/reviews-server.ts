import { neon } from "@neondatabase/serverless";
import { createPublicClient, decodeEventLog, http, fallback, verifyMessage } from "viem";
import { sepolia, arbitrumSepolia } from "viem/chains";
import { AGLAR, arcTestnet } from "./aglar";
import { EVALUATION_REGISTRY_ABI } from "./evaluation-registry";
import { verifyEvidence, type EvidenceBundle } from "./evaluation-evidence";
import { publicationMessage } from "./reviews";
export class ReviewValidationError extends Error {}
export function reviewDb() {
  if (!process.env.DATABASE_URL) throw new Error("Review storage unavailable");
  return neon(process.env.DATABASE_URL);
}
export async function authenticateReview(bundle: EvidenceBundle, demo: boolean, signature: `0x${string}`) {
  const chain = bundle.chain === "arc" ? arcTestnet : bundle.chain === "sepolia" ? sepolia : arbitrumSepolia;
  const urls = bundle.chain === "sepolia" ? ["https://ethereum-sepolia-rpc.publicnode.com", "https://sepolia.drpc.org"] : bundle.chain === "arbitrum" ? ["https://sepolia-rollup.arbitrum.io/rpc"] : ["https://rpc.testnet.arc.network"];
  const client = createPublicClient({ chain, transport: fallback(urls.map(url => http(url, { timeout: 8000, retryCount: 0 })), { retryCount: 0 }) });
  const tx = await client.getTransactionReceipt({ hash: bundle.transactionHash as `0x${string}` });
  if (tx.status !== "success") throw new ReviewValidationError("Review transaction reverted");
  const canonical = await client.getBlock({ blockNumber: tx.blockNumber });
  if (canonical.hash !== tx.blockHash) throw new ReviewValidationError("Transaction is not canonical");
  for (const log of tx.logs) {
    if (log.address.toLowerCase() !== AGLAR[bundle.chain].evaluationRegistry?.toLowerCase()) continue;
    let args;
    try { args = decodeEventLog({ abi: EVALUATION_REGISTRY_ABI, eventName: "EvaluationRecorded", data: log.data, topics: log.topics }).args; } catch { continue; }
    const outcome = ["inconclusive", "passed", "failed"][args.outcome];
    if (!verifyEvidence(bundle, { ...args, agentId: Number(args.agentId), observedBlock: String(args.observedBlock), outcome })) continue;
    const proof = { address: args.reviewer, message: publicationMessage(bundle, demo), signature };
    // EOAs need no contract call. Contract wallets use EIP-1271 verification on the receipt network.
    const valid = await verifyMessage(proof) || await client.verifyMessage(proof);
    if (!valid) throw new ReviewValidationError("Publication must be signed by the original reviewer");
    return { id: args.evaluationId, reviewer: args.reviewer.toLowerCase(), recordedAt: Number(args.recordedAt), blockNumber: String(tx.blockNumber), logIndex: log.logIndex };
  }
  throw new ReviewValidationError("Evidence does not match a confirmed NOMEN receipt");
}
