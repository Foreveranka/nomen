import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichFromGraph, assessRegistry } from '../lib/graph-discovery.ts';
import { groundMatches } from '../lib/discovery.ts';

const owner = '0x1111111111111111111111111111111111111111';
const otherOwner = '0x2222222222222222222222222222222222222222';
const candidate = { key: 'sepolia:1', chain: 'sepolia', agentId: 1, name: 'Research',
  description: 'Research public documents and cite original sources.', category: null,
  serviceCount: 1, snapshotOwner: owner, snapshotBlock: 1000 };
const current = { id: '11155111-1', owner, agentURI: 'https://example.com/agent.json',
  feedbackCount: '7', distinctClients: '1', uriUpdates: '2', transfers: '0' };
const meta = { block: { number: 2000, timestamp: 1789095500 }, hasIndexingErrors: false };
const options = { endpoint: 'https://graph.example/query', now: meta.block.timestamp * 1000 + 5000 };
function mockGraph(overrides = {}) {
  const calls = [];
  return { calls, fetcher: async (_url, init) => {
    const body = JSON.parse(init.body); calls.push(body);
    return Response.json({ data: body.query.includes('RegistryEvidence')
      ? { _meta: { ...meta, block: { number: meta.block.number, timestamp: null } }, current: [current], baseline0: [current], ...overrides }
      : { _meta: overrides._meta ?? meta } });
  } };
}
test('fresh Graph evidence gates the exact candidates sent onward to AI', async () => {
  const changed = { ...candidate, key: 'sepolia:2', agentId: 2 };
  const snapshotOnly = { ...candidate, key: 'ethereum:1', chain: 'ethereum' };
  const mock = mockGraph({ current: [current, { ...current, id: '11155111-2', owner: otherOwner }],
    baseline0: [current], baseline1: [{ ...current, id: '11155111-2' }] });
  const result = await enrichFromGraph([candidate, changed, snapshotOnly], { ...options, fetcher: mock.fetcher });
  assert.equal(result.coverage.status, 'live');
  assert.deepEqual(result.candidates.map(c => c.key), ['sepolia:1', 'ethereum:1']);
  assert.match(result.coverage.withheld[0].reason, /ownership/);
  assert.equal(result.candidates[0].registryEvidence.distinctClients, '1');
  assert.equal(result.candidates[1].registryEvidence, undefined);
  assert.match(mock.calls[1].query, /block: \{number: 2000\}/);
  assert.match(mock.calls[1].query, /block_lte: "1000"/);
  assert.deepEqual(mock.calls[1].variables.ids, ['11155111-1', '11155111-2']);
});
test('a changed URI, burned owner, unknown baseline or missing agent cannot pass', () => {
  assert.match(assessRegistry(candidate, { ...current, agentURI: 'https://other.example/new.json' }, current, 2000, meta.block.timestamp).reason, /URI changed/);
  assert.match(assessRegistry(candidate, { ...current, owner: '0x' + '0'.repeat(40) }, current, 2000, meta.block.timestamp).reason, /ownership/);
  assert.match(assessRegistry(candidate, current, undefined, 2000, meta.block.timestamp).reason, /No comparable/);
  assert.match(assessRegistry(candidate, undefined, current, 2000, meta.block.timestamp).reason, /missing/);
});
test('stale, future-dated and indexing-error responses never silently become Sepolia snapshot matches', async () => {
  for (const bad of [
    { ...meta, block: { ...meta.block, timestamp: meta.block.timestamp - 1000 } },
    { ...meta, block: { ...meta.block, timestamp: meta.block.timestamp + 1000 } },
    { ...meta, hasIndexingErrors: true },
  ]) {
    const result = await enrichFromGraph([candidate], { ...options, fetcher: mockGraph({ _meta: bad }).fetcher });
    assert.equal(result.candidates.length, 0);
    assert.notEqual(result.coverage.status, 'live');
  }
});
test('pruned history, HTTP failure and malformed upstream data fail closed', async () => {
  for (const fetcher of [
    async () => Response.json({ errors: [{ message: 'history pruned' }] }),
    async () => new Response('Unavailable', { status: 503 }),
    mockGraph({ current: [{ ...current, feedbackCount: '-5' }] }).fetcher,
  ]) {
    const result = await enrichFromGraph([candidate], { ...options, fetcher });
    assert.equal(result.coverage.status, 'unavailable');
    assert.equal(result.candidates.length, 0);
  }
});
test('immutable checkpoint reads use the separate cutoff for a later snapshot addition', async () => {
  const later = { ...candidate, key: 'sepolia:2', agentId: 2, snapshotBlock: 1500 };
  const mock = mockGraph({ current: [current, { ...current, id: '11155111-2' }], baseline1: [{ ...current, id: '11155111-2' }] });
  const result = await enrichFromGraph([candidate, later], { ...options, fetcher: mock.fetcher });
  assert.equal(result.candidates.length, 2);
  assert.match(mock.calls[1].query, /block_lte: "1500"/);
  assert.equal(mock.calls[1].variables.key1, '11155111-2');
  assert.match(mock.calls[1].query, /orderBy: position, orderDirection: desc/);
});
test('AI cannot invent Graph citations or attach live evidence to a snapshot-only match', () => {
  const evidence = assessRegistry(candidate, current, current, 2000, meta.block.timestamp).evidence;
  const match = { key: candidate.key, reason: 'Source-based research.', evidenceQuote: 'Research public documents', gaps: [], registrySignals: ['clients', 'uri'] };
  assert.equal(groundMatches([match], [{ ...candidate, registryEvidence: evidence }]).length, 1);
  assert.equal(groundMatches([{ ...match, registrySignals: ['verified_customers'] }], [{ ...candidate, registryEvidence: evidence }]).length, 0);
  assert.equal(groundMatches([{ ...match, registrySignals: [] }], [{ ...candidate, registryEvidence: evidence }]).length, 0);
  assert.equal(groundMatches([match], [candidate]).length, 0);
});
test('Graph outage leaves explicitly unsupported networks as snapshot-only candidates', async () => {
  const arc = { ...candidate, chain: 'ethereum', key: 'ethereum:1' };
  const result = await enrichFromGraph([candidate, arc], { ...options, fetcher: async () => { throw new Error('offline'); } });
  assert.deepEqual(result.candidates, [arc]);
  assert.equal(result.coverage.withheld[0].key, 'sepolia:1');
});
test('abort, oversized responses and missing block time cannot produce recommendations', async () => {
  const aborted = AbortSignal.abort(new Error('request cancelled'));
  await assert.rejects(enrichFromGraph([candidate], { ...options, signal: aborted, fetcher: async () => { throw aborted.reason; } }), /cancelled/);
  for (const fetcher of [async () => new Response('x'.repeat(2_000_001)), mockGraph({ _meta: { ...meta, block: { number: 2000, timestamp: null } } }).fetcher]) {
    const result = await enrichFromGraph([candidate], { ...options, fetcher });
    assert.equal(result.coverage.status, 'unavailable');
    assert.equal(result.candidates.length, 0);
  }
});

test('same numeric IDs on Arc and Sepolia have separate evidence and pinned blocks', async () => {
  const arc = {...candidate,chain:'arc',key:'arc:1'};
  const calls=[];
  const result=await enrichFromGraph([candidate,arc],{...options,endpoints:{arc:'https://arc.example/query'},fetcher:async(url,init)=>{
    const body=JSON.parse(init.body);const isArc=url.includes('arc.example');calls.push({url,...body});
    const row={...current,id:isArc?'5042002-1':current.id};
    const m={...meta,block:{...meta.block,number:isArc?9000:2000}};
    return Response.json({data:body.query.includes('RegistryEvidence')?{_meta:m,current:[row],baseline0:[row]}:{_meta:m}});
  }});
  assert.equal(result.coverage.status,'live');assert.equal(result.coverage.networks.length,2);
  assert.deepEqual(result.candidates.map(c=>[c.key,c.registryEvidence.chainId,c.registryEvidence.indexedBlock]),[['sepolia:1',11155111,2000],['arc:1',5042002,9000]]);
  const arcQuery=calls.find(c=>c.url.includes('arc.example')&&c.query.includes('RegistryEvidence'));
  assert.deepEqual(arcQuery.variables.ids,['5042002-1']);
  assert.match(arcQuery.query,/block: \{number: 9000\}/);
});
test('one network outage preserves the other live network but never falls back for Arc', async()=>{
  const arc={...candidate,chain:'arc',key:'arc:1'};
  const eth={...candidate,chain:'ethereum',key:'ethereum:1'};
  const mock=mockGraph();
  const result=await enrichFromGraph([candidate,arc,eth],{...options,endpoints:{arc:'https://arc.example/query'},fetcher:async(url,init)=>url.includes('arc.example')?new Response('offline',{status:503}):mock.fetcher(url,init)});
  assert.equal(result.coverage.status,'partial');
  assert.deepEqual(result.candidates.map(c=>c.key),['sepolia:1','ethereum:1']);
  assert.equal(result.coverage.networks.find(n=>n.chain==='arc').status,'unavailable');
  assert.deepEqual(result.coverage.withheld.map(c=>c.key),['arc:1']);
});
test('a misconfigured Arc endpoint cannot substitute Sepolia identities',async()=>{
  const result=await enrichFromGraph([{...candidate,chain:'arc',key:'arc:1'}],{...options,endpoints:{arc:'https://arc.example/query'},fetcher:mockGraph().fetcher});
  assert.equal(result.candidates.length,0);assert.match(result.coverage.withheld[0].reason,/missing/);
});
