import test from 'node:test';
import assert from 'node:assert/strict';
import { privateKeyToAccount } from 'viem/accounts';
import { verifyMessage } from 'viem';
import { publicationMessage } from '../lib/reviews.ts';
const bundle = {chain:'sepolia',transactionHash:'0x'+'12'.repeat(32),report:{chain:'sepolia',agentId:1,block:'100',fingerprint:'abc',name:'Example',job:'Research'},evidence:{version:1,reportFingerprint:'abc',outcome:'inconclusive',checklist:[],note:'My review',rating:8}};
const account = privateKeyToAccount('0x'+'11'.repeat(32));
test('publication signature binds every public field, chain, transaction and demo consent', async()=>{
 const message=publicationMessage(bundle,false); const signature=await account.signMessage({message});
 assert.equal(await verifyMessage({address:account.address,message,signature}),true);
 for(const changed of [{...bundle,chain:'arc'}, {...bundle,transactionHash:'0x'+'34'.repeat(32)}, {...bundle,report:{...bundle.report,job:'Changed task'}}, {...bundle,evidence:{...bundle.evidence,rating:10}}, {...bundle,evidence:{...bundle.evidence,note:'Forged comment'}}]) assert.equal(await verifyMessage({address:account.address,message:publicationMessage(changed,false),signature}),false);
 assert.equal(await verifyMessage({address:account.address,message:publicationMessage(bundle,true),signature}),false);
 assert.equal(await verifyMessage({address:privateKeyToAccount('0x'+'22'.repeat(32)).address,message,signature}),false);
});
