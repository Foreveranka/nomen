export const JOBS = {
  custom: {
    name: "Your described task",
    terms: [] as string[],
    sample:
      "Try a small version of your requested task with public data and review the result yourself. Do not grant signing or spending authority.",
    acceptance: [
      "Output meets the requirements in my request",
      "Claims and results checked against independent evidence",
      "Permissions and data access are appropriate",
      "No unapproved actions or payments",
    ],
  },
  wallet_report: {
    name: "Read-only wallet reporting",
    terms: [
      "wallet",
      "portfolio",
      "transaction",
      "balance",
      "report",
      "analytics",
    ],
    sample:
      "Use a public test wallet. Return the chain, observation time, native balance, and source links. Do not request a signature.",
    acceptance: [
      "Correct chain and wallet",
      "Balance matches a block explorer at the same block",
      "Observation time and source included",
      "No signing permission requested",
    ],
  },
  research: {
    name: "Research with sources",
    terms: ["research", "search", "sources", "knowledge", "analysis"],
    sample:
      "Summarize one public documentation page. Return three factual claims, each linked to its source. Send no private documents.",
    acceptance: [
      "Three relevant claims",
      "Each source opens and supports its claim",
      "Uncertainty is stated",
      "No private data or account access requested",
    ],
  },
  payments: {
    name: "Payments or trading",
    terms: ["payment", "trading", "swap", "usdc", "defi"],
    sample:
      "Request a quote or simulation only. Check network, recipient, amount, fees and expiry. Do not approve a transaction.",
    acceptance: [
      "Quote identifies chain, asset and amount",
      "Recipient and fees are explicit",
      "Spending limits and simulation reviewed",
      "A human authorizes any real transaction",
    ],
  },
} as const;
export type Job = keyof typeof JOBS;
export type Check = {
  key: string;
  title: string;
  status: "pass" | "changed" | "unknown" | "fail";
  detail: string;
};
export type ServiceObservation = {
  url: string;
  status:
    | "reachable"
    | "auth_required"
    | "payment_required"
    | "redirect"
    | "unavailable"
    | "unsupported";
  httpStatus?: number;
  latencyMs: number;
  protocol: "A2A card" | "JSON document" | "HTTP response" | "unconfirmed";
  skills: string[];
  documentHash?: string;
};
export type Evaluation = {
  version: 1;
  chain: string;
  agentId: number;
  job: Job;
  request?: string;
  name: string;
  checkedAt: string;
  expiresAt: string;
  block: string | null;
  owner: string | null;
  metadataHash: string | null;
  fingerprint: string;
  checks: Check[];
  services: ServiceObservation[];
  declaredMatch: string[];
  decision: "shortlist_for_trial" | "needs_review" | "hold";
  automaticExecutionAllowed: false;
  nextAction: string;
  limitations: string[];
};
export function decide(
  checks: Check[],
  job: Job,
): Pick<Evaluation, "decision" | "automaticExecutionAllowed" | "nextAction"> {
  const hold = checks.some(
    (c) => c.status === "changed" || c.status === "fail",
  );
  const complete = [
    "snapshot",
    "owner",
    "metadata",
    "services",
    "interface",
    "job",
  ].every((key) => checks.some((c) => c.key === key && c.status === "pass"));
  const candidate =
    !hold &&
    complete &&
    checks.every((c) => c.status === "pass") &&
    job !== "payments";
  return {
    decision: hold
      ? "hold"
      : candidate
        ? "shortlist_for_trial"
        : "needs_review",
    automaticExecutionAllowed: false,
    nextAction: hold
      ? "Hold this agent. Review changed or failed evidence before trying it."
      : candidate
        ? "Run the sample task with public data, verify its output, and agree on price and permissions before use."
        : "Resolve the missing evidence before selecting this agent. No live task has been completed by this check.",
  };
}
export function compareEvaluations(
  previous: Evaluation,
  current: Evaluation,
): string[] {
  if (
    previous.chain !== current.chain ||
    previous.agentId !== current.agentId ||
    previous.job !== current.job ||
    previous.request !== current.request
  )
    return ["Different agent or job: comparison is not valid."];
  const changes: string[] = [];
  if (previous.owner !== current.owner)
    changes.push("Ownership changed or could not be revalidated.");
  if (previous.metadataHash !== current.metadataHash)
    changes.push("Metadata changed or could not be revalidated.");
  if (
    JSON.stringify(
      previous.services.map((s) => [
        s.url,
        s.status,
        s.protocol,
        s.documentHash,
      ]),
    ) !==
    JSON.stringify(
      current.services.map((s) => [
        s.url,
        s.status,
        s.protocol,
        s.documentHash,
      ]),
    )
  )
    changes.push("Service availability, protocol or document changed.");
  if (previous.decision !== current.decision)
    changes.push(
      `Decision changed: ${previous.decision} → ${current.decision}.`,
    );
  if (previous.fingerprint !== current.fingerprint && !changes.length)
    changes.push("Eligibility or other observed evidence changed.");
  return changes;
}
export function reviewState(report: Evaluation, now = Date.now()): string {
  if (
    !Number.isFinite(Date.parse(report.expiresAt)) ||
    now >= Date.parse(report.expiresAt)
  )
    return "expired · recheck before use";
  return report.decision.replaceAll("_", " ");
}
