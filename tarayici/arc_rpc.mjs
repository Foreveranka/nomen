// Read-only Arc RPC transport. Input is supplied over stdin, not command arguments.
let input='';for await(const part of process.stdin)input+=part;
const payload=JSON.parse(input);
const allowed=new Set(['eth_blockNumber','eth_chainId','eth_call']);
if(!(Array.isArray(payload)?payload:[payload]).every(p=>allowed.has(p.method)))throw Error('Unsupported RPC method');
const response=await fetch('https://rpc.testnet.arc.network',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
if(!response.ok)throw Error(`Arc HTTP ${response.status}`);
process.stdout.write(await response.text());
