import test from "node:test";
import assert from "node:assert/strict";
import { trialLink, trialAccess, trialPrompt } from "../lib/trial.ts";
const service = { url: "https://example.com/agent.json", status: "reachable" };
test("trial links reject unsafe and unobserved destinations", () => {
  for (const url of ["javascript:alert(1)", "http://example.com", "https://127.0.0.1", "https://2130706433", "https://[::1]", "https://x.local", "https://user:pass@example.com", "https://example.com:8080"])
    assert.equal(trialLink({ ...service, url }), null);
  assert.equal(trialLink({ ...service, status: "unavailable" }), null);
  assert.equal(trialLink(service), service.url);
  assert.equal(trialLink({ ...service, status: "payment_required" }), service.url);
});
test("trial access requires fresh non-held evidence and a usable link", () => {
  const r = { decision: "needs_review", expiresAt: "2026-09-11T02:00:00Z", services: [service] };
  const now = Date.parse("2026-09-11T01:00:00Z");
  assert.equal(trialAccess(r, now), true);
  assert.equal(trialAccess({ ...r, decision: "hold" }, now), false);
  assert.equal(trialAccess({ ...r, services: [] }, now), false);
  assert.equal(trialAccess(r, Date.parse(r.expiresAt)), false);
});
test("trial copy preserves exact task and sample without executing it", () => {
  const p = trialPrompt("Analyze my CSV sales", "day,sales\nMonday,10");
  assert.ok(p.includes("Analyze my CSV sales"));
  assert.ok(p.includes("day,sales\nMonday,10"));
  assert.ok(p.includes("Ask me before any paid action"));
});
