import fs from 'node:fs';
import assert from 'node:assert/strict';
import {keccak256, encodeAbiParameters, concatHex} from 'viem';
const summary=JSON.parse(fs.readFileSync('public/veri/ozet.json'));
let total=0;
for (const chain of ['ethereum','sepolia','arbitrum','arc']) {
 const list=JSON.parse(fs.readFileSync(`public/veri/${chain}/dizin.json`));
 const proof=JSON.parse(fs.readFileSync(`public/veri/${chain}/merkle.json`));
 const api=JSON.parse(fs.readFileSync(`veri/${chain}_gorunur.json`));
 const status=fs.readFileSync(`veri/${chain}_durum.bin`);
 const ids=list.map(r=>r.id).sort((a,b)=>a-b);
 assert.deepEqual(ids,Object.keys(api).map(Number).sort((a,b)=>a-b));
 assert.deepEqual(ids,Object.keys(proof.kanitlar).map(Number).sort((a,b)=>a-b));
 assert.equal(ids.length,summary.zincirler[chain].gorunur);
 assert.equal(ids.length,proof.sayi);
 assert.equal([...status].filter(v=>v===1).length,ids.length);
 for(const id of ids) {
  assert.equal(status[id-1],1);
  let hash=keccak256(keccak256(encodeAbiParameters([{type:'uint256'}],[BigInt(id)])));
  for(const sibling of proof.kanitlar[id]) hash=keccak256(concatHex(hash.toLowerCase()<sibling.toLowerCase()?[hash,sibling]:[sibling,hash]));
  assert.equal(hash,proof.kok);
 }
 total+=ids.length; console.log(`${chain}: ${ids.length} API, directory and independently verified proofs agree`);
}
console.log(`${total} proofs verified`);
