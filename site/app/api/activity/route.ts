import { NextRequest, NextResponse } from "next/server";
import { GRAPH_NETWORKS, type GraphChain } from "@/lib/graph-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("agentId") ?? "";
  const chain = req.nextUrl.searchParams.get("chain") ?? "sepolia";
  if (!Object.hasOwn(GRAPH_NETWORKS, chain)) return NextResponse.json({ error: "Indexed activity supports Sepolia and Arc Testnet" }, { status: 400 });
  const config = GRAPH_NETWORKS[chain as GraphChain];
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) return NextResponse.json({ error: "invalid agentId" }, { status: 400 });
  const endpoint = process.env[config.endpointEnv];
  if (!endpoint) return NextResponse.json({ error: "Live indexing is not configured", configured: false }, { status: 503 });
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") throw new Error("HTTPS required");
    const response = await fetch(url, {
      method: "POST", headers: { "content-type": "application/json", ...(process.env[config.keyEnv] ? { authorization: `Bearer ${process.env[config.keyEnv]}` } : {}) },
      body: JSON.stringify({ query: `query AgentActivity($id: ID!) { _meta { block { number timestamp } hasIndexingErrors } agent(id: $id) { agentId owner agentURI lastUpdatedAt feedbackCount distinctClients feedback(first: 10, orderBy: createdAt, orderDirection: desc) { value valueDecimals tag1 tag2 revoked createdAt } name { label live expiry } } }`, variables: { id: `${config.chainId}-${Number(id)}` } }),
      signal: AbortSignal.timeout(8000), cache: "no-store", redirect: "error",
    });
    if (!response.ok) throw new Error("Upstream request failed");
    const body = await response.json();
    if (body.errors?.length || !body.data?._meta || body.data._meta.hasIndexingErrors) throw new Error("Indexing failed");
    const timestamp = Number(body.data._meta.block.timestamp);
    const lagSeconds = Number.isFinite(timestamp) && timestamp > 0 ? Math.max(0, Math.floor(Date.now() / 1000) - timestamp) : null;
    return NextResponse.json({ chain, chainId: config.chainId, scope: config.scope, source: "the-graph", indexedBlock: body.data._meta.block.number,
      freshness: { indexedAt: lagSeconds === null ? null : new Date(timestamp * 1000).toISOString(), lagSeconds, stale: lagSeconds === null || lagSeconds > 900 },
      nameSemantics: "Indexed registration events only. Use registrar.isNamed for current endorsement.", agent: body.data.agent });
  } catch { return NextResponse.json({ error: "Live index is unavailable; snapshot data is separate" }, { status: 502 }); }
}
