// Sepolia deployment verification and an actual claim using the NOMEN-owned demo agent.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createPublicClient, createWalletClient, http, namehash, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const secrets = parseEnv(readFileSync(process.env.TESTNET_OPERATOR_ENV, 'utf8'));
const account = privateKeyToAccount(secrets.DEPLOYER_PRIVATE_KEY);
assert.equal(account.address.toLowerCase(), '0xd7256e7a20368bac505a738cc1c2cbc8d0648849');
const rpc = process.env.SEPOLIA_RPC;
assert(rpc, 'SEPOLIA_RPC required');
const client = createPublicClient({ chain: sepolia, transport: http(rpc) });
const wallet = createWalletClient({ account, chain: sepolia, transport: http(rpc) });
assert.equal(await client.getChainId(), 11155111);
const registrar = '0x481d5fbd6f7B955D34Dbe3069B30dFFd3C15E81C';
const resolver = '0x8443a2C263e770C5180E533B7B571BA6eED029f7';
const registry = '0x01F0e0F27F30C445C3F5e48Fc9873849e06B76c8';
const identity = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
const parent = 'nomen-demo.eth';
const demo = JSON.parse(readFileSync('../inceleme/test-agent-registration.json', 'utf8'));
const merkle = JSON.parse(readFileSync('public/veri/sepolia/merkle.json', 'utf8'));
const aid = BigInt(demo.agentId);
const proof = merkle.kanitlar[String(aid)];
assert(proof?.length > 0);
const artifact = (name) => JSON.parse(readFileSync(`../kontratlar/out/${name}.sol/${name}.json`, 'utf8'));
const regArtifact = artifact('NomenRegistrar');
const resolverArtifact = artifact('NomenResolver');
const read = (functionName, args = []) => client.readContract({ address: registrar, abi: regArtifact.abi, functionName, args });
const transactions = [];
async function send(functionName, args) {
  const { request } = await client.simulateContract({ account, address: registrar, abi: regArtifact.abi, functionName, args });
  const hash = await wallet.writeContract(request);
  const receipt = await client.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, 'success');
  transactions.push({ function: functionName, hash, block: Number(receipt.blockNumber) });
  console.log(JSON.stringify(transactions.at(-1)));
}
async function codeMatches(address, compiled) {
  let local = compiled.deployedBytecode.object.replace(/^0x/, '');
  let actual = (await client.getCode({ address })).replace(/^0x/, '');
  for (const refs of Object.values(compiled.deployedBytecode.immutableReferences ?? {})) {
    for (const { start, length } of refs) {
      local = local.slice(0, start * 2) + '0'.repeat(length * 2) + local.slice((start + length) * 2);
      actual = actual.slice(0, start * 2) + '0'.repeat(length * 2) + actual.slice((start + length) * 2);
    }
  }
  assert.equal(actual, local, `Runtime bytecode differs: ${address}`);
}
await codeMatches(registrar, regArtifact);
await codeMatches(resolver, resolverArtifact);
for (const [getter, expected] of [['admin', account.address], ['REGISTRY', registry], ['IDENTITY', identity], ['resolver', resolver]]) {
  assert.equal((await read(getter)).toLowerCase(), expected.toLowerCase());
}
assert.equal(await read('PARENT_NODE'), namehash(parent));
assert.equal((await client.readContract({ address: resolver, abi: resolverArtifact.abi, functionName: 'registrar' })).toLowerCase(), registrar.toLowerCase());
const parentRegistry = '0xBDC85dD5b15D7ecb354cd7cb6f2c50b4f2c4F0E2';
assert.equal((await client.readContract({ address: parentRegistry, abi: parseAbi(['function getSubregistry(string) view returns(address)']), functionName: 'getSubregistry', args: ['nomen-demo'] })).toLowerCase(), registry.toLowerCase());
assert.equal(await client.readContract({ address: registry, abi: parseAbi(['function hasRoles(uint256,uint256,address) view returns(bool)']), functionName: 'hasRoles', args: [0n, 1n | (1n << 12n) | (1n << 16n), registrar] }), true);
assert.equal((await client.readContract({ address: identity, abi: parseAbi(['function ownerOf(uint256) view returns(address)']), functionName: 'ownerOf', args: [aid] })).toLowerCase(), account.address.toLowerCase());
const sourcePath = `/veri/sepolia/merkle-${merkle.kok.slice(2, 10)}.json`;
writeFileSync(`public${sourcePath}`, JSON.stringify(merkle));
if (await read('eligibilityRoot') !== merkle.kok) await send('publishRoot', [merkle.kok, `https://nomen-beta.vercel.app${sourcePath}`]);
assert.equal(await read('isEligible', [aid, proof]), true);
const other = '0xb422a67E72Bc398BbA7d19a558493be4DF739AF2';
await assert.rejects(client.simulateContract({ account: other, address: registrar, abi: regArtifact.abi, functionName: 'claim', args: ['reader', aid, proof] }));
await assert.rejects(client.simulateContract({ account: other, address: registrar, abi: regArtifact.abi, functionName: 'publishRoot', args: [merkle.kok, 'unauthorized'] }));
await assert.rejects(client.simulateContract({ account, address: registrar, abi: regArtifact.abi, functionName: 'claim', args: ['reader', aid, []] }));
if (!(await read('isNamed', [aid]))[0]) await send('claim', ['reader', aid, proof]);
const [live, label, expiry] = await read('isNamed', [aid]);
assert.equal(live, true);
assert.equal(label, 'reader');
const tokenId = await read('tokenIdOfAgent', [aid]);
await assert.rejects(client.simulateContract({ account, address: registry, abi: parseAbi(['function safeTransferFrom(address,address,uint256,uint256,bytes)']), functionName: 'safeTransferFrom', args: [account.address, other, tokenId, 1n, '0x'] }));
const node = namehash(`reader.${parent}`);
const text = (key) => client.readContract({ address: resolver, abi: resolverArtifact.abi, functionName: 'text', args: [node, key] });
const registrationKey = `agent-registration[0x0001000003aa36a7148004a818bfb912233c491871b3d84c89a494bd9e][${aid}]`;
assert.equal(await text(registrationKey), '1');
const context = await text('agent-context');
assert(context.includes(String(aid)));
await assert.rejects(client.simulateContract({ account, address: resolver, abi: resolverArtifact.abi, functionName: 'setText', args: [node, 'agent-context', 'unauthorized'] }));
const evidence = { checkedAt: new Date().toISOString(), chain: 'sepolia', chainId: 11155111, registrar, resolver, registry, parent, operator: account.address, agentId: Number(aid), name: `reader.${parent}`, expiry: Number(expiry), root: merkle.kok, source: sourcePath, transactions, verified: { bytecode: true, immutableConfiguration: true, parentLink: true, roles: true, ownership: true, proof: true, claim: true, nonTransferable: true, registrationText: true, contextText: true, unauthorizedOwnerRejected: true, unauthorizedAdminRejected: true, unauthorizedResolverWriteRejected: true } };
writeFileSync('../inceleme/ens-live-evidence.json', JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
