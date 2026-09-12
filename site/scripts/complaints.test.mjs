import test from 'node:test';
import assert from 'node:assert/strict';
import {privateKeyToAccount} from 'viem/accounts';
import {verifyMessage} from 'viem';
import {complaintDraft,complaintAction,complaintCommitment,complaintMessage,assertPayment,assertFreshAction,COMPLAINT_FEE,COMPLAINT_TREASURY,complaintTextHash} from '../lib/complaints.ts';
const author=privateKeyToAccount('0x'+'11'.repeat(32));
const draft=complaintDraft.parse({id:'12345678-1234-4234-8234-123456789abc',chain:'arc',agentId:39,author:author.address,demo:true,requested:'TEST requested a clearly specified report.',happened:'TEST placeholder outcome for this simulated service.',problem:'TEST missing output details; a synthetic claim.',evidence:''});
test('fee is exactly 5 native Arc test USDC and bound to the original complaint',()=>{
 const tx={from:draft.author,to:COMPLAINT_TREASURY,value:BigInt(COMPLAINT_FEE),input:complaintCommitment(draft)};
 const receipt={status:'success',blockHash:'0xabc'};
 assert.doesNotThrow(()=>assertPayment(draft,tx,receipt,'0xabc'));
 for(const change of [{value:5n*10n**6n},{value:BigInt(COMPLAINT_FEE)-1n},{value:BigInt(COMPLAINT_FEE)+1n},{to:'0x'+'22'.repeat(20)},{from:'0x'+'22'.repeat(20)},{input:complaintCommitment({...draft,agentId:40})},{input:complaintCommitment({...draft,demo:false})},{input:complaintCommitment({...draft,problem:'Another invented complaint about the agent.'})}]) assert.throws(()=>assertPayment(draft,{...tx,...change},receipt,'0xabc'));
 assert.throws(()=>assertPayment(draft,tx,{...receipt,status:'reverted'},'0xabc'));
 assert.throws(()=>assertPayment(draft,tx,receipt,'0xdef'));
});
test('wallet authorization binds action, ID, version, content and actor',async()=>{
 const action={type:'status',id:draft.id,author:draft.author,version:1,status:'resolved',message:'TEST issue was resolved.',timestamp:Date.now()};
 const signature=await author.signMessage({message:complaintMessage(action)});
 assert.ok(await verifyMessage({address:author.address,signature,message:complaintMessage(action)}));
 for(const change of [{version:2},{status:'open'},{message:'A different resolution statement.'},{id:'12345678-1234-4234-8234-123456789abd'},{author:'0x'+'22'.repeat(20)},{type:'reply'}]) assert.equal(await verifyMessage({address:author.address,signature,message:complaintMessage({...action,...change})}),false);
 assert.doesNotThrow(()=>assertFreshAction(action));assert.throws(()=>assertFreshAction(action,action.timestamp+16*60_000));assert.throws(()=>assertFreshAction(action,action.timestamp-16*60_000));
});
test('schemas reject mainnet, malformed agent IDs, unknown fields and empty complaints',()=>{
 for(const change of [{chain:'ethereum'},{agentId:0},{agentId:1.2},{requested:'bad'},{happened:'short'},{problem:'x'},{admin:true}])assert.equal(complaintDraft.safeParse({...draft,...change}).success,false);
 assert.equal(complaintAction.safeParse({type:'status',id:draft.id,author:draft.author,version:0,timestamp:Date.now(),status:'resolved',message:'Resolved in test.'}).success,false);
 assert.equal(complaintTextHash(draft),complaintTextHash({...draft,problem:draft.problem.toUpperCase().replaceAll(' ','  ')}));
});

test('v2 payments require the configured network and exact transfer evidence; v1 stays Arc', async()=>{
 const {complaintPayment,complaintTransaction}=await import('../lib/complaints.ts');
 const {encodeEventTopics,encodeAbiParameters,erc20Abi}=await import('viem');
 for(const chain of ['sepolia','arbitrum','arc']) {
  const d=complaintDraft.parse({...draft,chain,paymentVersion:2});const p=complaintPayment(d);const built=complaintTransaction(d);
  assert.equal(complaintPayment({...draft,chain}).chain,'arc');
  assert.notEqual(complaintCommitment(d),complaintCommitment({...draft,chain}));
  const tx={from:d.author,to:built.to,value:built.value,input:built.data};
  const log={address:p.token,topics:encodeEventTopics({abi:erc20Abi,eventName:'Transfer',args:{from:d.author,to:COMPLAINT_TREASURY}}),data:encodeAbiParameters([{type:'uint256'}],[BigInt(p.amount)])};
  const receipt={status:'success',blockHash:'0xabc',logs:p.token?[log]:[]};
  const check=(t=tx,r=receipt,c=p.chainId)=>assertPayment(d,t,r,'0xabc',c);
  assert.doesNotThrow(()=>check());assert.throws(()=>check(tx,receipt,1));
  for(const change of [{from:'0x'+'22'.repeat(20)},{to:'0x'+'22'.repeat(20)},{value:built.value+1n},{input:built.data.slice(0,-2)+'ff'}])assert.throws(()=>check({...tx,...change}));
  assert.throws(()=>check(tx,{...receipt,status:'reverted'}));
  assert.throws(()=>assertPayment(d,tx,receipt,'0xdef',p.chainId));
  if(p.token){
   assert.equal(built.data.length,202);assert.equal(built.value,0n);
   assert.throws(()=>check(tx,{...receipt,logs:[]}));
   for(const change of [{address:COMPLAINT_TREASURY},{data:encodeAbiParameters([{type:'uint256'}],[4999999n])},{topics:encodeEventTopics({abi:erc20Abi,eventName:'Transfer',args:{from:COMPLAINT_TREASURY,to:d.author}})},{data:'0x'}])assert.throws(()=>check(tx,{...receipt,logs:[{...log,...change}]}));
  }
 }
 assert.equal(complaintDraft.safeParse({...draft,paymentVersion:3}).success,false);
});
