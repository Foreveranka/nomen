// Read-only eth_call: no keys, signatures, or transactions. Uses a publicly funded
// token recipient to verify that Circle USDC accepts the full payment calldata.
import {createPublicClient,http,erc20Abi} from 'viem';
import {complaintDraft,complaintTransaction,COMPLAINT_NETWORKS} from '../lib/complaints.ts';
for(const [chain,url] of [['sepolia','https://ethereum-sepolia-rpc.publicnode.com'],['arbitrum','https://sepolia-rollup.arbitrum.io/rpc']]){
 const p=COMPLAINT_NETWORKS[chain];const c=createPublicClient({transport:http(url,{timeout:15000,retryCount:0})});
 const block=await c.getBlockNumber();const events=await c.getContractEvents({address:p.token,abi:erc20Abi,eventName:'Transfer',fromBlock:block-(chain==='arbitrum'?99999n:999n),toBlock:block});
 const addresses=[...new Set(events.filter(e=>e.args.value>=5000000n).map(e=>e.args.to))].reverse();let found=false;
 for(const author of addresses.slice(0,20)){
  const balance=await c.readContract({address:p.token,abi:erc20Abi,functionName:'balanceOf',args:[author],blockNumber:block});if(balance<5000000n)continue;
  const d=complaintDraft.parse({id:'12345678-1234-4234-8234-123456789abc',author,chain,paymentVersion:2,agentId:1,demo:true,requested:'TEST read-only RPC payment simulation.',happened:'TEST no transaction is broadcast by this script.',problem:'TEST verifies full USDC calldata compatibility.',evidence:''});
  const tx=complaintTransaction(d);const result=await c.call({account:author,to:tx.to,value:tx.value,data:tx.data,blockNumber:block});
  if(BigInt(result.data)!==1n)throw Error('USDC transfer did not return true');
  console.log(JSON.stringify({chain,block:String(block),test:'5 USDC transfer with draft commitment',mode:'eth_call only — no payment sent',success:true}));found=true;break;
 }
 if(!found)throw Error(`No funded public recipient found for ${chain}; simulation not run.`);
}
