// Read-only verification of the deployed Sepolia index against a known chain receipt.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
const config = { ...parseEnv(readFileSync('.env.local', 'utf8')), ...process.env };
assert(config.NOMEN_SUBGRAPH_URL, 'NOMEN_SUBGRAPH_URL is not configured');
assert.equal(new URL(config.NOMEN_SUBGRAPH_URL).protocol, 'https:');
const response = await fetch(config.NOMEN_SUBGRAPH_URL, {
  method: 'POST', headers: { 'content-type': 'application/json', ...(config.NOMEN_SUBGRAPH_KEY ? { authorization: `Bearer ${config.NOMEN_SUBGRAPH_KEY}` } : {}) },
  body: JSON.stringify({ query: '{ _meta { block { number timestamp } hasIndexingErrors } agent(id: "11155111-10226") { agentId owner registeredIn feedbackCount distinctClients name { label owner live expiry } } }' }),
  signal: AbortSignal.timeout(15000),
});
assert.equal(response.status, 200);
const body = await response.json();
assert(!body.errors?.length, 'GraphQL errors returned');
assert.equal(body.data._meta.hasIndexingErrors, false);
if (body.data._meta.block.number < 11679023) {
  console.log(JSON.stringify({ status: 'indexing', indexedBlock: body.data._meta.block.number, requiredBlock: 11679023 }));
  process.exit(2);
}
const agent = body.data.agent;
assert(agent, 'A known registered agent is missing after its block was indexed');
assert.equal(agent.agentId, '10226');
assert.equal(agent.registeredIn, '11679005');
assert.equal(agent.owner.toLowerCase(), '0xd7256e7a20368bac505a738cc1c2cbc8d0648849');
assert.equal(agent.name?.label, 'reader');
assert.equal(agent.name?.live, true);
const evidence = { checkedAt: new Date().toISOString(), ...body.data, verifiedAgainst: '0x29904930ef63e6c79cf99aa6b9da4fe007e0d2261d5f54a691cbcb8c65570139' };
writeFileSync('../inceleme/graph-live-evidence.json', JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
