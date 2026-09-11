// Real provider integration check. Uses a running app and public, synthetic requests only.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
const config = { ...parseEnv(readFileSync('.env.local', 'utf8')), ...process.env };
const base = config.NOMEN_TEST_BASE_URL ?? 'http://127.0.0.1:3102';
const cases = [
  { request: 'Find an agent for crypto research and risk assessment using onchain data.', chain: 'sepolia', chainId: 11155111, expected: 1194 },
  { request: 'Find an agent that reads published ERC-8004 metadata checks for a supplied agent ID.', chain: 'sepolia', chainId: 11155111, expected: 10226 },
];
if (config.NOMEN_TEST_ARC === '1') cases.push(
  { request: 'Find an agent for vendor payouts, invoice review and scheduled USDC payments on Arc Testnet.', chain: 'arc', chainId: 5042002, expected: 40 },
  { request: 'Find an agent API that provides current Polymarket crypto-market odds over x402 on Arc Testnet.', chain: 'arc', chainId: 5042002, expected: 882138 },
);
const evidence = { checkedAt: new Date().toISOString(), base, subgraph: config.NOMEN_SUBGRAPH_URL,
  checks: 'Real DeepSeek output; Graph facts and immutable snapshot checkpoints independently queried at the returned block.', cases: [] };
for (const item of cases) {
  const endpoint = item.chain === 'arc' ? config.NOMEN_ARC_SUBGRAPH_URL : config.NOMEN_SUBGRAPH_URL;
  const key = item.chain === 'arc' ? config.NOMEN_ARC_SUBGRAPH_KEY : config.NOMEN_SUBGRAPH_KEY;
  const response = await fetch(`${base}/api/discover`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ request: item.request, chain: item.chain }), signal: AbortSignal.timeout(60000) });
  const body = await response.json();
  assert.equal(response.status, 200, 'Discovery request failed');
  assert.equal(body.registry?.status, 'live', 'No fresh Graph evidence; do not count this as a successful integration test');
  assert(body.matches.some(m => m.agentId === item.expected), 'The known relevant agent was not recommended');
  assert(body.registry.eligible > 0);
  for (const match of body.matches) {
    assert.equal(match.chain, item.chain);
    const graph = match.registryEvidence;
    assert.equal(graph?.source, 'the-graph');
    assert.equal(graph.indexedBlock, body.registry.indexedBlock);
    assert(graph.indexedBlock >= graph.baselineBlock);
    assert(Date.now() - Date.parse(graph.indexedAt) < 900000);
    assert(match.registrySignals.length > 0);
    assert(match.registrySignals.every(id => graph.signals.some(signal => signal.id === id)));
    assert(match.description.includes(match.evidenceQuote));
    assert(!body.registry.withheld.some(item => item.key === match.key));
    const directResponse = await fetch(endpoint, { method: 'POST',
      headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify({ query: `query Verify($id: ID!, $key: String!) {
        agent(id: $id, block: {number: ${graph.indexedBlock}}) { owner agentURI feedbackCount distinctClients uriUpdates transfers }
        identityCheckpoints(first: 1, block: {number: ${graph.indexedBlock}}, where: {agentKey: $key, block_lte: "${graph.baselineBlock}"}, orderBy: position, orderDirection: desc) { owner agentURI block }
      }`, variables: { id: `${item.chainId}-${match.agentId}`, key: `${item.chainId}-${match.agentId}` } }),
      signal: AbortSignal.timeout(15000) });
    const direct = await directResponse.json();
    assert.equal(directResponse.status, 200);
    assert(!direct.errors?.length);
    const baseline = direct.data.identityCheckpoints[0];
    assert(baseline, 'No immutable identity checkpoint exists before the snapshot');
    assert(Number(baseline.block) <= graph.baselineBlock);
    assert.equal(baseline.owner, direct.data.agent.owner);
    assert.equal(baseline.agentURI, direct.data.agent.agentURI);
    for (const field of ['owner', 'feedbackCount', 'distinctClients', 'uriUpdates', 'transfers'])
      assert.equal(graph[field], direct.data.agent[field], `Returned ${field} is not the indexed fact`);
  }
  evidence.cases.push({ request: item.request, chain: item.chain, subgraph: endpoint, model: body.model, registry: body.registry,
    matches: body.matches.map(({ key, reason, gaps, registrySignals, registryEvidence }) => ({ key, reason, gaps, registrySignals, registryEvidence })) });
  console.log(JSON.stringify({ request: item.request, status: 'passed', block: body.registry.indexedBlock,
    matches: body.matches.map(m => ({ id: m.agentId, graphSignals: m.registrySignals })) }));
}
writeFileSync(config.NOMEN_TEST_EVIDENCE_FILE ?? '../inceleme/graph-ai-evidence.json', JSON.stringify(evidence, null, 2));
