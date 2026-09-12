import { createPublicClient, http, parseAbiItem } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { AGLAR } from "./aglar";
import { summarizeEvaluationReceipts, type EvaluationHistoryReceipt } from "./evaluation-history-summary";

const ARBITRUM_EVALUATION_DEPLOYMENT_BLOCK = BigInt(307_944_655);
const OUTCOMES = ["inconclusive", "passed", "failed"] as const;

const evaluationRecorded = parseAbiItem(
  "event EvaluationRecorded(bytes32 indexed evaluationId, address indexed reviewer, uint256 indexed agentId, bytes32 reportHash, bytes32 evidenceHash, uint64 observedBlock, uint64 recordedAt, uint8 outcome)",
);

export async function readArbitrumEvaluationHistory(agentId: number) {
  const address = AGLAR.arbitrum.evaluationRegistry;
  if (!address) throw new Error("Arbitrum evaluation registry is not configured");
  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(
      process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      { timeout: 8_000, retryCount: 1 },
    ),
  });
  const logs = await client.getLogs({
    address,
    event: evaluationRecorded,
    args: { agentId: BigInt(agentId) },
    fromBlock: ARBITRUM_EVALUATION_DEPLOYMENT_BLOCK,
    toBlock: "latest",
  });
  const receipts: EvaluationHistoryReceipt[] = logs
    .map((log) => ({
      evaluationId: log.args.evaluationId!,
      reviewer: log.args.reviewer!,
      agentId: Number(log.args.agentId!),
      reportHash: log.args.reportHash!,
      evidenceHash: log.args.evidenceHash!,
      observedBlock: log.args.observedBlock!.toString(),
      recordedAt: log.args.recordedAt!.toString(),
      outcome: OUTCOMES[Number(log.args.outcome)] ?? "inconclusive",
      blockNumber: log.blockNumber.toString(),
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
    }))
    .sort((a, b) => Number(BigInt(b.recordedAt) - BigInt(a.recordedAt)));
  return {
    chain: "arbitrum" as const,
    chainId: arbitrumSepolia.id,
    agentId,
    registry: address,
    deploymentBlock: ARBITRUM_EVALUATION_DEPLOYMENT_BLOCK.toString(),
    checkedAt: new Date().toISOString(),
    summary: summarizeEvaluationReceipts(receipts),
    receipts,
  };
}
