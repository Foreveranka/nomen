import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluationReceipt } from '../lib/evaluation-registry.ts';
import { parseEvidenceBundle, verifyEvidence } from '../lib/evaluation-evidence.ts';
import { groundMatches } from '../lib/discovery.ts';
const report = {chain:'arbitrum', agentId:205, block:'123', fingerprint:'sample', name:'Agent', job:'custom', request:'Compare data', services:[]};
const hashes = evaluationReceipt(report, 'passed', 'A sample note with ünicode.', ['Sources']);
const bundle = {chain:'arbitrum', transactionHash:'0x'+'1'.repeat(64), report, evidence:hashes.evidence};
const receipt = {agentId:205, observedBlock:'123', outcome:'passed', ...hashes};
test('evidence roundtrip preserves committed data and verifies both hashes', () => {
  assert.equal(verifyEvidence(parseEvidenceBundle(JSON.stringify(bundle)), receipt), true);
});
test('altered notes, report, agent, chain, block and outcome cannot verify', () => {
  const variants = [
    {...bundle, evidence:{...bundle.evidence,note:'Changed'}},
    {...bundle, report:{...report,request:'Changed'}},
    {...bundle, report:{...report,agentId:206}},
    {...bundle, chain:'arc'},
    {...bundle, report:{...report,block:'124'}},
    {...bundle, evidence:{...bundle.evidence,outcome:'failed'}},
  ];
  for (const variant of variants) assert.equal(verifyEvidence(variant, receipt), false);
});
test('malformed and oversized files are rejected', () => {
  assert.throws(() => parseEvidenceBundle('{'));
  assert.throws(() => parseEvidenceBundle(' '.repeat(64001)));
  assert.throws(() => parseEvidenceBundle(JSON.stringify({...bundle,transactionHash:'bad'})));
});
test('ranking must acknowledge supplied history and cannot invent it', () => {
  const candidate = {key:'arbitrum:205', description:'Compare financial datasets with sources.', trialHistory:{status:'unavailable'}};
  const match = {key:candidate.key, evidenceQuote:candidate.description, registrySignals:[], reason:'Compare data', gaps:[]};
  assert.equal(groundMatches([match],[candidate]).length,0);
  assert.equal(groundMatches([{...match,trialHistoryConsidered:true}],[candidate]).length,1);
  assert.equal(groundMatches([{...match,trialHistoryConsidered:true}],[{...candidate,trialHistory:undefined}]).length,0);
});

test('rating roundtrip verifies and changed scores fail verification', () => {
  const ratedHashes = evaluationReceipt(report, 'passed', 'A sample note with ünicode.', ['Sources'], 8);
  const ratedBundle = {...bundle,evidence:ratedHashes.evidence};
  const ratedReceipt = {...receipt,...ratedHashes};
  assert.equal(verifyEvidence(parseEvidenceBundle(JSON.stringify(ratedBundle)), ratedReceipt), true);
  assert.equal(verifyEvidence({...ratedBundle,evidence:{...ratedBundle.evidence,rating:9}}, ratedReceipt), false);
  assert.throws(() => parseEvidenceBundle(JSON.stringify({...ratedBundle,evidence:{...ratedBundle.evidence,rating:11}})));
});
