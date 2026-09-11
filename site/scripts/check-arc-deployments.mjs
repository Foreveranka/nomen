// Read-only, paced discovery of registry deployment blocks; no credentials used.
import {writeFileSync} from 'node:fs';
let sequence = 0;
async function rpc(method, params) {
  for(let attempt=0; attempt<6; attempt++) {
    await new Promise(r=>setTimeout(r, attempt ? 1500*(attempt+1) : 400));
    const response = await fetch('https://rpc.testnet.arc.network', {method:'POST',
      headers:{'content-type':'application/json'}, body:JSON.stringify({jsonrpc:'2.0',id:++sequence,method,params}),signal:AbortSignal.timeout(20000)});
    const body = await response.json();
    if(body.error?.code===-32005 || response.status===429) continue;
    if(body.error || !response.ok) throw Error('Arc RPC query failed');
    return body.result;
  }
  throw Error('Arc RPC remains rate limited');
}
const head=Number(await rpc('eth_blockNumber',[]));
const addresses=['0x8004A818BFB912233c491871b3d84c89A494BD9e','0x8004B663056A597Dffe9eCcC1965A193B7388713','0x8004Cb1BF31DAf7788923b405b754f57acEB4272'];
const deployments=[];
for(const address of addresses) {
  let lo=0,hi=head;
  while(lo+1<hi) {
    const mid=Math.floor((lo+hi)/2);
    const code=await rpc('eth_getCode',[address,'0x'+mid.toString(16)]);
    if(code==='0x')lo=mid; else hi=mid;
  }
  deployments.push({address,startBlock:hi}); console.log({address,startBlock:hi});
}
writeFileSync('../inceleme/arc-registry-deployments.json',JSON.stringify({checkedAt:new Date().toISOString(),chainId:5042002,head,deployments},null,2));
