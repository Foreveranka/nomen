import { z } from "zod";
import type { Candidate } from "./discovery";

export const GRAPH_NETWORKS = {
  sepolia: { chainId: 11155111, name: "Sepolia", endpointEnv: "NOMEN_SUBGRAPH_URL", keyEnv: "NOMEN_SUBGRAPH_KEY", scope: "Registry events since configured deployment blocks." },
  arc: { chainId: 5042002, name: "Arc Testnet", endpointEnv: "NOMEN_ARC_SUBGRAPH_URL", keyEnv: "NOMEN_ARC_SUBGRAPH_KEY", scope: "NOMEN's explicitly listed Arc catalog; other IDs are outside this index scope." },
} as const;
export type GraphChain = keyof typeof GRAPH_NETWORKS;
export const GRAPH_SIGNAL_IDS = ["identity", "uri", "feedback", "clients", "changes"] as const;
export type GraphSignalId = typeof GRAPH_SIGNAL_IDS[number];
export type GraphEvidence = {
  source: "the-graph";
  chain: GraphChain;
  chainId: number;
  indexedBlock: number;
  indexedAt: string;
  baselineBlock: number;
  owner: string;
  feedbackCount: string;
  distinctClients: string;
  uriUpdates: string;
  transfers: string;
  signals: { id: GraphSignalId; text: string }[];
};
export type GraphCoverage = {
  status: "live" | "stale" | "unavailable" | "not_applicable" | "partial";
  indexedBlock?: number;
  indexedAt?: string;
  checked: number;
  eligible: number;
  withheld: { key: string; reason: string }[];
  message: string;
  networks?: GraphNetworkCoverage[];
};
export type GraphNetworkCoverage = Omit<GraphCoverage, "networks"> & { chain: GraphChain; chainId: number; scope: string };
const uint = z.string().regex(/^\d+$/).max(78);
const identity = z.object({
  id: z.string().regex(/^(11155111|5042002)-\d+$/),
  owner: z.string().regex(/^0x[\da-fA-F]{40}$/),
  agentURI: z.string().max(300_000),
});
const record = identity.extend({
  feedbackCount: uint, distinctClients: uint, uriUpdates: uint, transfers: uint,
});
const metaSchema = z.object({ block: z.object({
  number: z.number().int().nonnegative(), timestamp: z.number().int().positive(),
}), hasIndexingErrors: z.literal(false) });
type GraphRecord = z.infer<typeof record>;
type Identity = z.infer<typeof identity>;

/** Identity continuity is a gate; feedback counts are facts, never a reputation score. */
export function assessRegistry(candidate: Candidate, current: GraphRecord | undefined, baseline: Identity | undefined,
  block: number, timestamp: number): { evidence?: GraphEvidence; reason?: string } {
  if (!current) return { reason: "Agent missing from the current index; registration is not established here." };
  if (!candidate.snapshotOwner || !candidate.snapshotBlock || !baseline)
    return { reason: "No comparable registry evidence exists at the published snapshot block." };
  if (!/^0x[\da-fA-F]{40}$/.test(candidate.snapshotOwner) || /^0x0{40}$/i.test(current.owner)
    || current.owner.toLowerCase() !== candidate.snapshotOwner.toLowerCase()
    || baseline.owner.toLowerCase() !== candidate.snapshotOwner.toLowerCase())
    return { reason: "Indexed ownership no longer agrees with the published snapshot." };
  if (!current.agentURI || current.agentURI !== baseline.agentURI)
    return { reason: "The metadata URI changed after the snapshot; refresh the description before recommending it." };
  const indexedAt = new Date(timestamp * 1000).toISOString();
  return { evidence: {
    source: "the-graph", chain: candidate.chain as GraphChain, chainId: GRAPH_NETWORKS[candidate.chain as GraphChain].chainId, indexedBlock: block, indexedAt, baselineBlock: candidate.snapshotBlock,
    owner: current.owner, feedbackCount: current.feedbackCount, distinctClients: current.distinctClients,
    uriUpdates: current.uriUpdates, transfers: current.transfers,
    signals: [
      { id: "identity", text: "Indexed owner agrees with the published snapshot." },
      { id: "uri", text: "Metadata URI agrees with the snapshot block. Contents at that URI can still change." },
      { id: "feedback", text: `${current.feedbackCount} feedback records indexed, including withdrawn records; not verified task completions.` },
      { id: "clients", text: `${current.distinctClients} distinct feedback wallets across all indexed feedback, not necessarily independent users.` },
      { id: "changes", text: `${current.uriUpdates} URI updates and ${current.transfers} transfers over the indexed history; not a quality score.` },
    ],
  } };
}

async function query(endpoint: string, key: string | undefined, queryText: string, variables: Record<string, unknown>,
  signal: AbortSignal, fetcher: typeof fetch): Promise<Record<string, unknown>> {
  const response = await fetcher(endpoint, {
    method: "POST", headers: { "content-type": "application/json", ...(key ? { authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({ query: queryText, variables }), signal, cache: "no-store", redirect: "error",
  });
  if (!response.ok) throw new Error("Graph request failed");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Graph response missing");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 2_000_000) { await reader.cancel(); throw new Error("Graph response exceeds limit"); }
    chunks.push(value);
  }
  const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (body.errors?.length || !body.data || typeof body.data !== "object") throw new Error("Graph query failed");
  return body.data;
}

/** Two bounded live queries: establish freshness, then pin current state and immutable checkpoints. */
type GraphOptions = {
  endpoint?: string; key?: string; signal?: AbortSignal; now?: number; fetcher?: typeof fetch;
  endpoints?: Partial<Record<GraphChain, string>>; keys?: Partial<Record<GraphChain, string>>;
};
async function enrichSingleNetwork(candidates: Candidate[], chain: GraphChain, options: GraphOptions = {}): Promise<{ candidates: Candidate[]; coverage: GraphCoverage }> {
  const config = GRAPH_NETWORKS[chain];
  const supported = candidates.filter(c => c.chain === chain);
  const other = candidates.filter(c => c.chain !== chain);
  const coverage: GraphCoverage = { status: "not_applicable", checked: supported.length, eligible: 0, withheld: [],
    message: "Live Graph evidence is available for Sepolia and the listed Arc catalog. Ethereum uses published descriptions only." };
  if (!supported.length) return { candidates, coverage };
  if (candidates.length > 48) throw new Error("Too many discovery candidates");
  const reject = (status: "stale" | "unavailable", message: string) => ({ candidates: other,
    coverage: { ...coverage, status, message, withheld: supported.map(c => ({ key: c.key, reason: message })) } });
  try {
    const endpoint = options.endpoints?.[chain] ?? (chain === "sepolia" ? options.endpoint : undefined) ?? process.env[config.endpointEnv];
    if (!endpoint || new URL(endpoint).protocol !== "https:") throw new Error("Graph is not configured");
    const signal = AbortSignal.any([AbortSignal.timeout(9_000), ...(options.signal ? [options.signal] : [])]);
    const fetcher = options.fetcher ?? fetch;
    const key = options.keys?.[chain] ?? (chain === "sepolia" ? options.key : undefined) ?? process.env[config.keyEnv];
    const meta = metaSchema.parse((await query(endpoint, key,
      "{ _meta { block { number timestamp } hasIndexingErrors } }", {}, signal, fetcher))._meta);
    const now = options.now ?? Date.now();
    coverage.indexedBlock = meta.block.number;
    coverage.indexedAt = new Date(meta.block.timestamp * 1000).toISOString();
    if (now / 1000 - meta.block.timestamp > 900 || meta.block.timestamp > now / 1000 + 60)
      return reject("stale", `${config.name} recommendations are paused until The Graph has fresh registry data (within 15 minutes).`);
    const baselined = supported.filter(c => Number.isSafeInteger(c.snapshotBlock)
      && c.snapshotBlock! > 0 && c.snapshotBlock! <= meta.block.number);
    const fields = "id owner agentURI";
    const variables: Record<string, unknown> = { ids: supported.map(c => `${config.chainId}-${c.agentId}`) };
    const args = ["$ids: [ID!]!"];
    const historical = baselined.map((c, i) => {
      args.push(`$key${i}: String!`); variables[`key${i}`] = `${config.chainId}-${c.agentId}`;
      return `baseline${i}: identityCheckpoints(first: 1, block: {number: ${meta.block.number}},
        where: {agentKey: $key${i}, block_lte: "${c.snapshotBlock}"}, orderBy: position, orderDirection: desc) {
          id: agentKey owner agentURI
        }`;
    }).join("\n");
    const body = await query(endpoint, key, `query RegistryEvidence(${args.join(", ")}) {
      _meta(block: {number: ${meta.block.number}}) { block { number } hasIndexingErrors }
      current: agents(first: 48, block: {number: ${meta.block.number}}, where: {id_in: $ids}) {
        ${fields} feedbackCount distinctClients uriUpdates transfers
      }
      ${historical}
    }`, variables, signal, fetcher);
    // Graph Node returns no timestamp for _meta at an explicitly requested block.
    // Freshness comes from the first response; all evidence reads pin that block.
    const pinnedMeta = z.object({ block: z.object({ number: z.number().int().nonnegative() }),
      hasIndexingErrors: z.literal(false) }).parse(body._meta);
    if (pinnedMeta.block.number !== meta.block.number)
      throw new Error("Graph observation changed");
    const current = new Map(z.array(record).max(48).parse(body.current).map(r => [r.id, r]));
    const baselines = new Map<string, Identity>();
    baselined.forEach((c, i) => {
      const rows = z.array(identity).max(1).parse(body[`baseline${i}`]);
      if (rows[0]?.id === `${config.chainId}-${c.agentId}`) baselines.set(c.key, rows[0]);
    });
    const enriched = supported.flatMap(c => {
      const id = `${config.chainId}-${c.agentId}`;
      const result = assessRegistry(c, current.get(id), baselines.get(c.key), meta.block.number, meta.block.timestamp);
      if (!result.evidence) { coverage.withheld.push({ key: c.key, reason: result.reason! }); return []; }
      return [{ ...c, registryEvidence: result.evidence }];
    });
    coverage.status = "live"; coverage.eligible = enriched.length;
    coverage.message = `The Graph checked ${config.name} ownership and metadata URI continuity before AI ranking. Feedback history informs the comparison, not a quality guarantee.`;
    const byKey = new Map([...other, ...enriched].map(c => [c.key, c]));
    return { candidates: candidates.flatMap(c => byKey.has(c.key) ? [byKey.get(c.key)!] : []), coverage };
  } catch {
    if (options.signal?.aborted) throw options.signal.reason;
    return reject("unavailable", `${config.name} recommendations are paused because live Graph evidence could not be verified. Retry or browse the directory.`);
  }
}

/** Networks are queried independently and in parallel; failure never downgrades them to snapshot-only. */
export async function enrichFromGraph(candidates: Candidate[], options: GraphOptions = {}): Promise<{ candidates: Candidate[]; coverage: GraphCoverage }> {
  if (candidates.length > 48) throw new Error("Too many discovery candidates");
  const chains = (Object.keys(GRAPH_NETWORKS) as GraphChain[]).filter(chain => candidates.some(c => c.chain === chain));
  const outcomes = await Promise.all(chains.map(chain => enrichSingleNetwork(candidates.filter(c => c.chain === chain), chain, options)));
  const networks: GraphNetworkCoverage[] = outcomes.map((outcome, i) => ({ ...outcome.coverage, chain: chains[i],
    chainId: GRAPH_NETWORKS[chains[i]].chainId, scope: GRAPH_NETWORKS[chains[i]].scope }));
  const retained = new Map([...candidates.filter(c => !Object.hasOwn(GRAPH_NETWORKS, c.chain)), ...outcomes.flatMap(o => o.candidates)].map(c => [c.key, c]));
  const coverage: GraphCoverage = networks.length === 1 ? { ...networks[0], networks } : {
    status: networks.length === 0 ? "not_applicable" : networks.every(n => n.status === "live") ? "live"
      : networks.some(n => n.status === "live") ? "partial" : networks.every(n => n.status === "stale") ? "stale" : "unavailable",
    checked: networks.reduce((n, r) => n + r.checked, 0), eligible: networks.reduce((n, r) => n + r.eligible, 0),
    withheld: networks.flatMap(n => n.withheld), networks,
    message: "Live evidence is checked separately for Sepolia and Arc Testnet. A paused network contributes no recommendations. Ethereum matches use published snapshots.",
  };
  return { candidates: candidates.flatMap(c => retained.has(c.key) ? [retained.get(c.key)!] : []), coverage };
}
