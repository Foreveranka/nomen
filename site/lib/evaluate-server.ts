import { createHash } from "node:crypto";
import { createPublicClient, http, parseAbi } from "viem";
import { AGLAR, type AgAnahtar } from "./aglar";
import { bak } from "./dizin";
import {
  JOBS,
  decide,
  type Job,
  type Evaluation,
  type Check,
  type ServiceObservation,
} from "./evaluation";
import { publicGet } from "./public-http";

const RPC = {
  ethereum: "https://ethereum-rpc.publicnode.com",
  sepolia: "https://ethereum-sepolia-rpc.publicnode.com",
  arc: "https://rpc.testnet.arc.network",
};
const ABI = parseAbi([
  "function ownerOf(uint256) view returns (address)",
  "function tokenURI(uint256) view returns (string)",
]);
const sha = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown) {
  return typeof value === "string" ? value.slice(0, 4000) : "";
}
async function document(uri: string) {
  let bytes: Buffer;
  if (uri.startsWith("data:application/json")) {
    if (uri.length > 280_000) throw new Error("Metadata too large");
    const split = uri.indexOf(",");
    if (split < 0) throw new Error("Invalid metadata");
    const header = uri.slice(0, split);
    if (
      !/^data:application\/json(?:;charset=utf-8)?(?:;base64)?$/i.test(header)
    )
      throw new Error("Unsupported data URI");
    bytes = header.endsWith(";base64")
      ? Buffer.from(uri.slice(split + 1), "base64")
      : Buffer.from(decodeURIComponent(uri.slice(split + 1)));
  } else {
    const path = uri.slice(7).replace(/^ipfs\//, "");
    const urls = uri.startsWith("ipfs://")
      ? [
          `https://gateway.pinata.cloud/ipfs/${path}`,
          `https://ipfs.io/ipfs/${path}`,
        ]
      : [uri];
    let body: Buffer | undefined;
    for (const url of urls) {
      try {
        const response = await publicGet(url, urls.length > 1 ? 4000 : 6000);
        if (response.status === 200) {
          body = response.body;
          break;
        }
      } catch {
        /* Try the next fixed public gateway within the time budget. */
      }
    }
    if (!body) throw new Error("Metadata unavailable");
    bytes = body;
  }
  if (bytes.length > 200_000) throw new Error("Metadata too large");
  const parsed: unknown = JSON.parse(bytes.toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Metadata is not an object");
  return { data: object(parsed), hash: sha(bytes) };
}
async function observe(url: string): Promise<ServiceObservation> {
  const start = Date.now();
  try {
    const r = await publicGet(url);
    let data: Record<string, unknown> = {};
    try {
      data = object(JSON.parse(r.body.toString("utf8")));
    } catch {}
    const skills = Array.isArray(data.skills)
      ? data.skills
          .slice(0, 10)
          .map((s) => object(s))
          .map((s) =>
            [text(s.name), text(s.description)].join(" ").trim().slice(0, 500),
          )
          .filter(Boolean)
      : [];
    const card =
      !!text(data.name) &&
      skills.length > 0 &&
      Array.isArray(data.defaultInputModes) &&
      data.defaultInputModes.length > 0 &&
      Array.isArray(data.defaultOutputModes) &&
      data.defaultOutputModes.length > 0 &&
      ((Array.isArray(data.supportedInterfaces) &&
        data.supportedInterfaces.some((i) =>
          /^https:\/\//.test(text(object(i).url)),
        )) ||
        /^https:\/\//.test(text(data.url)));
    return {
      url,
      status:
        r.status >= 200 && r.status < 300
          ? "reachable"
          : [401, 403].includes(r.status)
            ? "auth_required"
            : r.status === 402
              ? "payment_required"
              : r.status >= 300 && r.status < 400
                ? "redirect"
                : "unavailable",
      httpStatus: r.status,
      latencyMs: r.latencyMs,
      protocol: card
        ? "A2A card"
        : Object.keys(data).length
          ? "JSON document"
          : "HTTP response",
      skills,
      documentHash: card ? sha(r.body) : undefined,
    };
  } catch {
    return {
      url,
      status: url.startsWith("https:") ? "unavailable" : "unsupported",
      latencyMs: Date.now() - start,
      protocol: "unconfirmed",
      skills: [],
    };
  }
}
export async function evaluate(
  chain: AgAnahtar,
  agentId: number,
  job: Job,
  request?: string,
): Promise<Evaluation> {
  const snapshot = bak(chain, agentId);
  const checks: Check[] = [];
  let owner: string | null = null,
    metadataHash: string | null = null,
    block: string | null = null;
  let data: Record<string, unknown> = {},
    services: ServiceObservation[] = [],
    liveURI = "";
  checks.push({
    key: "snapshot",
    title: "Published metadata rules",
    status:
      snapshot.durum === "passes"
        ? "pass"
        : ["not_scanned", "rpc_error"].includes(snapshot.durum)
          ? "unknown"
          : "fail",
    detail: `Snapshot result: ${snapshot.durum}. This is not a live service certification.`,
  });
  const client = createPublicClient({
    transport: http(RPC[chain], { timeout: 5000, retryCount: 0 }),
  });
  try {
    const blockNumber = await client.getBlockNumber();
    block = blockNumber.toString();
    const args = [BigInt(agentId)] as const;
    const current = await Promise.all([
      client.readContract({
        address: AGLAR[chain].identity,
        abi: ABI,
        functionName: "ownerOf",
        args,
        blockNumber,
      }),
      client.readContract({
        address: AGLAR[chain].identity,
        abi: ABI,
        functionName: "tokenURI",
        args,
        blockNumber,
      }),
    ]);
    owner = current[0];
    liveURI = current[1];
    const same = snapshot.detay?.owner?.toLowerCase() === owner.toLowerCase();
    checks.push({
      key: "owner",
      title: "Current ownership",
      status: snapshot.detay?.owner ? (same ? "pass" : "changed") : "unknown",
      detail: `Read at block ${block}. ${same ? "Matches the published owner." : "Published ownership is missing or has changed."}`,
    });
  } catch {
    checks.push({
      key: "owner",
      title: "Current ownership",
      status: "unknown",
      detail:
        "Could not read ownership and URI at a common block. This is not evidence of nonexistence.",
    });
  }
  if (liveURI) {
    try {
      const doc = await document(liveURI);
      data = doc.data;
      metadataHash = doc.hash;
      const original = snapshot.detay?.hash;
      const same = original?.length === 64 && original === metadataHash;
      checks.push({
        key: "metadata",
        title: "Current metadata",
        status:
          original?.length === 64 ? (same ? "pass" : "changed") : "unknown",
        detail: same
          ? "Full document hash matches the published scan."
          : original?.length === 64
            ? "Document changed. The old scan cannot endorse its new contents."
            : "Fetched now; the legacy snapshot has no comparable full document hash.",
      });
      const endpoints = Array.isArray(data.services)
        ? data.services
        : Array.isArray(data.endpoints)
          ? data.endpoints
          : [];
      const urls = [
        ...new Set(
          endpoints
            .map((s) =>
              typeof s === "string"
                ? s
                : text(object(s).endpoint) || text(object(s).url),
            )
            .filter((s) => !!s && s.length <= 4096),
        ),
      ];
      services = await Promise.all(urls.slice(0, 3).map(observe));
      checks.push({
        key: "services",
        title: "Live service response",
        status: services.some((s) => s.status === "reachable")
          ? "pass"
          : !services.length
            ? "fail"
            : "unknown",
        detail: `${services.filter((s) => s.status === "reachable").length} of ${services.length} probed URLs responded successfully. At most 3 of ${urls.length} declared URLs checked. A web response is not a completed task.`,
      });
    } catch {
      checks.push({
        key: "metadata",
        title: "Current metadata",
        status: "unknown",
        detail:
          "Could not read a bounded JSON document from the current URI. Only public HTTPS and JSON data URIs are checked.",
      });
    }
  } else
    checks.push({
      key: "metadata",
      title: "Current metadata",
      status: owner ? "fail" : "unknown",
      detail: owner
        ? "Current metadata URI is empty."
        : "No current URI could be verified.",
    });
  const description =
    // A reachable website alone must not make an agent a trial candidate.
    `${text(data.description)} ${services.flatMap((s) => s.skills).join(" ")}`.toLowerCase();
  const interfaceFound = services.some(
    (s) => s.status === "reachable" && s.protocol === "A2A card",
  );
  checks.push({
    key: "interface",
    title: "Discoverable agent interface",
    status: interfaceFound ? "pass" : "unknown",
    detail: interfaceFound
      ? "An A2A-shaped card declares skills and a service interface. Signature, protocol conformance and task execution remain unverified."
      : "No A2A-shaped card was confirmed. A website or schema reference is not an agent interface; MCP execution/discovery is not tested by this check.",
  });
  const declaredMatch = JOBS[job].terms.filter((term) =>
    description.includes(term),
  );
  checks.push({
    key: "job",
    title: "Declared fit for this job",
    status: declaredMatch.length ? "pass" : "unknown",
    detail:
      job === "custom"
        ? "AI matching uses published descriptions. Completing your specific task still requires a controlled trial; live checks alone cannot confirm task fit."
        : declaredMatch.length
          ? `Self-declared signals: ${declaredMatch.join(", ")}. Keyword matching is not a performance test.`
          : "No matching declared capabilities found. Suitability is unconfirmed, not disproven.",
  });
  const name = text(data.name) || snapshot.detay?.name || `Agent #${agentId}`;
  const checkedAt = new Date().toISOString();
  return {
    version: 1,
    chain,
    agentId,
    job,
    ...(request ? { request } : {}),
    name,
    checkedAt,
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    block,
    owner,
    metadataHash,
    fingerprint: sha(
      JSON.stringify({
        chain,
        agentId,
        job,
        request,
        owner,
        uri: sha(liveURI),
        metadataHash,
        checks: checks.map((c) => [c.key, c.status]),
        services: services.map((s) => [
          s.url,
          s.status,
          s.protocol,
          s.documentHash,
        ]),
      }),
    ),
    checks,
    services,
    declaredMatch,
    ...decide(checks, job),
    limitations: [
      "No task execution or output-quality test was performed.",
      "Price, data retention and execution permissions must be confirmed with the provider.",
      "This is a 15-minute observation window, not guaranteed availability or an onchain ENS endorsement.",
      "Saved reports and trial notes stay in this browser; they are not signed attestations.",
    ],
  };
}
