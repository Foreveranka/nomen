// Explicitly scoped to the published Arc catalog. No changes to the Sepolia manifest.
import {readFileSync,writeFileSync} from 'node:fs';
import YAML from 'yaml';
const manifest=YAML.parse(readFileSync('subgraph.yaml','utf8'));
const evidence=JSON.parse(readFileSync('../inceleme/arc-registry-deployments.json','utf8'));
const ids=Object.keys(JSON.parse(readFileSync('../site/veri/arc_gorunur.json','utf8'))).map(Number).sort((a,b)=>a-b);
const topics=ids.map(id=>'0x'+BigInt(id).toString(16).padStart(64,'0'));
manifest.specVersion='1.2.0';
manifest.description='Live ERC-8004 identity and feedback for the explicitly listed NOMEN Arc Testnet catalog. Other registry IDs are outside this index scope.';
manifest.dataSources=manifest.dataSources.filter(d=>d.name!=='NomenRegistrar').map(d=>{
 d.network='arc-testnet';d.source.startBlock=evidence.deployments.find(r=>r.address.toLowerCase()===d.source.address.toLowerCase()).startBlock;
 for(const h of d.mapping.eventHandlers){
   h[h.handler==='handleTransfer'?'topic3':['handleValidationRequest','handleValidationResponse'].includes(h.handler)?'topic2':'topic1']=topics;
 }
 return d;
});
writeFileSync('subgraph.arc.yaml',YAML.stringify(manifest,{aliasDuplicateObjects:false}));
writeFileSync('arc-scope.json',JSON.stringify({chain:'arc',chainId:5042002,scope:'listed_catalog',agentIds:ids},null,2));
console.log(`Arc manifest: ${ids.length} catalog IDs, three registries; no ENS registrar.`);
