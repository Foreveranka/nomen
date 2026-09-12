import { createPublicClient, http, decodeEventLog } from "viem";
import { sepolia, arbitrumSepolia } from "viem/chains";
import { AGLAR, arcTestnet } from "@/lib/aglar";
import { EVALUATION_REGISTRY_ABI } from "@/lib/evaluation-registry";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const chain = params.get("chain");
  const hash = params.get("tx");
  if ((chain !== "sepolia" && chain !== "arbitrum" && chain !== "arc") || !hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) return Response.json({ error: "Invalid chain or transaction." }, { status: 400 });
  const network = AGLAR[chain];
  try {
    const client = createPublicClient({ chain: chain === "arc" ? arcTestnet : chain === "sepolia" ? sepolia : arbitrumSepolia, transport: http(undefined, { timeout: 8000, retryCount: 0 }) });
    const receipt = await client.getTransactionReceipt({ hash: hash as `0x${string}` });
    if (receipt.status !== "success") return Response.json({ error: "Transaction reverted." }, { status: 422 });
    const receipts = receipt.logs.flatMap(log => {
      if (log.address.toLowerCase() !== network.evaluationRegistry?.toLowerCase()) return [];
      try {
        const { args } = decodeEventLog({ abi: EVALUATION_REGISTRY_ABI, eventName: "EvaluationRecorded", data: log.data, topics: log.topics });
        return [{ ...args, agentId: Number(args.agentId), observedBlock: args.observedBlock.toString(), recordedAt: args.recordedAt.toString(), outcome: ["inconclusive", "passed", "failed"][args.outcome] }];
      } catch { return []; }
    });
    return Response.json({ receipts, registry: network.evaluationRegistry, checkedAt: new Date().toISOString() });
  } catch { return Response.json({ error: "Could not read the transaction. Retry once it is confirmed." }, { status: 503 }); }
}
