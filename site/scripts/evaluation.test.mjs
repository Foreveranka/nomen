import test from "node:test";
import assert from "node:assert/strict";
import { decide, compareEvaluations, reviewState } from "../lib/evaluation.ts";
import { publicIPv4, checkedURL, publicGet } from "../lib/public-http.ts";
const checks = [
  "snapshot",
  "owner",
  "metadata",
  "services",
  "interface",
  "job",
].map((key) => ({ key, status: "pass", title: key, detail: "" }));
test("observed gates only allow a trial, never execution", () => {
  assert.equal(decide(checks, "wallet_report").decision, "shortlist_for_trial");
  assert.equal(
    decide(checks, "wallet_report").automaticExecutionAllowed,
    false,
  );
});
test("missing observations cannot pass", () => {
  assert.equal(decide([], "research").decision, "needs_review");
  assert.equal(decide(checks.slice(0, 3), "research").decision, "needs_review");
});
test("changed owner and metadata suspend selection", () => {
  for (const key of ["owner", "metadata"])
    assert.equal(
      decide(
        checks.map((c) => (c.key === key ? { ...c, status: "changed" } : c)),
        "research",
      ).decision,
      "hold",
    );
});
test("RPC failures require review", () => {
  assert.equal(
    decide(
      checks.map((c) => (c.key === "owner" ? { ...c, status: "unknown" } : c)),
      "research",
    ).decision,
    "needs_review",
  );
});
test("payments never get approved from metadata and HTTP alone", () => {
  assert.equal(decide(checks, "payments").decision, "needs_review");
});
test("a working website without a discovered agent interface needs review", () => {
  assert.equal(
    decide(
      checks.map((c) =>
        c.key === "interface" ? { ...c, status: "unknown" } : c,
      ),
      "research",
    ).decision,
    "needs_review",
  );
});
const baseline = {
  chain: "sepolia",
  agentId: 2364,
  job: "research",
  owner: "0xa",
  metadataHash: "a",
  fingerprint: "x",
  decision: "shortlist_for_trial",
  expiresAt: "2026-09-11T10:15:00Z",
  services: [
    {
      url: "https://example.com",
      status: "reachable",
      protocol: "HTTP response",
    },
  ],
};
test("ownership, content and endpoint changes invalidate saved evidence", () => {
  const changes = compareEvaluations(baseline, {
    ...baseline,
    owner: "0xb",
    metadataHash: "b",
    services: [],
    fingerprint: "y",
  });
  assert.equal(changes.length, 3);
});
test("latency alone does not invalidate evidence", () =>
  assert.deepEqual(
    compareEvaluations(baseline, {
      ...baseline,
      services: [{ ...baseline.services[0], latencyMs: 100 }],
    }),
    [],
  ));
test("different free-text requests cannot share a trial comparison", () => {
  assert.match(
    compareEvaluations(
      { ...baseline, job: "custom", request: "Audit Solidity" },
      { ...baseline, job: "custom", request: "Help with customer support" },
    )[0],
    /not valid/,
  );
});
test("reports expire at the deadline", () =>
  assert.equal(
    reviewState(baseline, Date.parse(baseline.expiresAt)),
    "expired · recheck before use",
  ));
test("SSRF address and URL variants fail closed", () => {
  for (const ip of [
    "127.0.0.1",
    "10.1.2.3",
    "169.254.169.254",
    "100.100.100.200",
    "192.168.1.1",
    "198.18.0.1",
    "224.0.0.1",
    "::1",
    "::ffff:127.0.0.1",
  ])
    assert.equal(publicIPv4(ip), false);
  for (const url of [
    "https://2130706433/",
    "https://0x7f000001/",
    "https://user:pass@example.com",
    "http://example.com",
    "https://example.com:8080",
    "https://[::1]/",
  ])
    assert.throws(() => checkedURL(url));
  assert.equal(publicIPv4("1.1.1.1"), true);
});
test("private targets rejected before HTTP", async () => {
  await assert.rejects(publicGet("https://127.0.0.1/"));
});
