import test from "node:test";
import assert from "node:assert/strict";
import { retrieve, groundMatches } from "../lib/discovery.ts";
const agents = [
  {
    key: "sepolia:1",
    chain: "sepolia",
    agentId: 1,
    name: "Support",
    description: "Handles customer support and order tracking.",
    category: null,
    serviceCount: 1,
  },
  {
    key: "arc:1",
    chain: "arc",
    agentId: 1,
    name: "Audit",
    description: "Reviews Solidity contracts for security vulnerabilities.",
    category: null,
    serviceCount: 2,
  },
];
test("retrieval supports needs outside the old presets", () =>
  assert.equal(retrieve(agents, ["customer support"])[0].key, "sepolia:1"));
test("empty or unrelated retrieval never returns arbitrary fallback agents", () => {
  assert.deepEqual(retrieve(agents, []), []);
  assert.deepEqual(retrieve(agents, ["coffee roasting"]), []);
});
test("model cannot invent a registry record or evidence", () => {
  const valid = {
    key: "arc:1",
    reason: "Contract review",
    evidenceQuote: "Solidity contracts for security",
    gaps: ["Quality unverified"],
  };
  assert.equal(groundMatches([valid], agents).length, 1);
  assert.equal(
    groundMatches([{ ...valid, key: "arc:99999" }], agents).length,
    0,
  );
  assert.equal(
    groundMatches(
      [
        {
          ...valid,
          evidenceQuote: "Has successfully audited one million contracts",
        },
      ],
      agents,
    ).length,
    0,
  );
});
test("network identity and duplicate results are preserved correctly", () => {
  const m = {
    key: "arc:1",
    reason: "audit",
    evidenceQuote: "Solidity contracts for security",
    gaps: ["Quality"],
  };
  const output = groundMatches([m, m], agents);
  assert.equal(output.length, 1);
  assert.equal(output[0].chain, "arc");
  assert.equal(output[0].name, "Audit");
});
