// Read-only consumer: routes candidates, never invokes an agent or pays it.
const [base, chain, job, ...ids] = process.argv.slice(2);
if (
  !base ||
  !["ethereum", "sepolia", "arc"].includes(chain) ||
  !["wallet_report", "research", "payments"].includes(job) ||
  !ids.length ||
  ids.length > 5 ||
  !ids.every(
    (id) =>
      /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0,
  )
)
  throw new Error(
    "Usage: node scripts/choose-agent.mjs https://nomen-beta.vercel.app sepolia wallet_report 2364 [up to 5 ids]",
  );
const url = new URL("/api/evaluate", base);
if (
  url.protocol !== "https:" &&
  !["localhost", "127.0.0.1"].includes(url.hostname)
)
  throw new Error("HTTPS required");
const decisions = [];
for (const id of ids) {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chain, job, agentId: Number(id) }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) {
      decisions.push({
        agentId: Number(id),
        route: "manual_review",
        automaticExecutionAllowed: false,
        reason: `HTTP ${r.status}`,
      });
      continue;
    }
    const report = await r.json();
    if (
      report.chain !== chain ||
      report.agentId !== Number(id) ||
      report.job !== job ||
      report.automaticExecutionAllowed !== false ||
      !(Date.parse(report.expiresAt) > Date.now()) ||
      !Array.isArray(report.checks)
    ) {
      throw new Error("Invalid or expired evidence");
    }
    decisions.push({
      agentId: report.agentId,
      route:
        report.decision === "shortlist_for_trial"
          ? "controlled_trial"
          : report.decision === "hold"
            ? "hold"
            : "manual_review",
      automaticExecutionAllowed: false,
      expiresAt: report.expiresAt,
      evidence: report.checks,
      reportUrl: new URL(`/workbench?chain=${chain}&agentId=${id}`, base).href,
    });
  } catch {
    decisions.push({
      agentId: Number(id),
      route: "manual_review",
      automaticExecutionAllowed: false,
      reason: "Live evaluation could not be retrieved",
    });
  }
}
console.log(JSON.stringify(decisions, null, 2));
