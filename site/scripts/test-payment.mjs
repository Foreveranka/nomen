// Explicit testnet-only settlement check. Never accepts a mainnet requirement.
// TESTNET_BUYER_ENV points to a private env file outside the repository.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createPublicClient, http, parseAbi, parseEventLogs } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { x402Client, x402HTTPClient } from '@x402/core/client';
import { ExactEvmScheme } from '@x402/evm/exact/client';

const endpoint = new URL(process.env.PAYMENT_TEST_URL ?? 'http://localhost:3101/api/dogrula?chain=ethereum&agentId=22817');
assert(endpoint.protocol === 'https:' || (endpoint.protocol === 'http:' && endpoint.hostname === 'localhost'));
const recipient = process.env.PAYMENT_TEST_RECIPIENT;
assert.match(recipient ?? '', /^0x[0-9a-fA-F]{40}$/);
const keyFile = process.env.TESTNET_BUYER_ENV;
assert(keyFile, 'Set TESTNET_BUYER_ENV to a private file outside the repository');
const account = privateKeyToAccount(parseEnv(readFileSync(keyFile, 'utf8')).TESTNET_BUYER_PRIVATE_KEY);
assert.notEqual(account.address.toLowerCase(), recipient.toLowerCase(), 'Payer and recipient must differ');
const rpc = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') });
assert.equal(await rpc.getChainId(), 84532);
const asset = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const abi = parseAbi(['function balanceOf(address) view returns (uint256)', 'event Transfer(address indexed from, address indexed to, uint256 value)']);
const balance = (address, blockNumber) => rpc.readContract({ address: asset, abi, functionName: 'balanceOf', args: [address], blockNumber });
const client = new x402HTTPClient(new x402Client().register('eip155:84532', new ExactEvmScheme(account)));
const call = (headers) => fetch(endpoint, { headers, signal: AbortSignal.timeout(60000) });
const unpaid = await call();
assert.equal(unpaid.status, 402, 'Payment must be required');
const required = client.getPaymentRequiredResponse(n => unpaid.headers.get(n));
assert.equal(required.x402Version, 2);
assert.equal(required.accepts.length, 1);
const terms = required.accepts[0];
assert.equal(terms.network, 'eip155:84532');
assert.equal(terms.scheme, 'exact');
assert.equal(terms.asset.toLowerCase(), asset.toLowerCase());
assert.equal(terms.payTo.toLowerCase(), recipient.toLowerCase());
assert.equal(terms.amount, '1000', 'Only a 0.001 test USDC payment is allowed');
const invalid = await call({ 'PAYMENT-SIGNATURE': 'invalid' });
assert.equal(invalid.status, 402, 'Invalid payment must not unlock data');
const before = await balance(recipient, await rpc.getBlockNumber({ cacheTime: 0 }));
const payload = await client.createPaymentPayload(required);
const headers = client.encodePaymentSignatureHeader(payload);
const paid = await call(headers);
if (paid.status !== 200) {
  const raw = paid.headers.get('payment-required') ?? paid.headers.get('payment-response');
  if (raw) {
    const result = JSON.parse(Buffer.from(raw, 'base64').toString());
    console.error(JSON.stringify({ paymentError: result.error ?? result.errorReason, transaction: result.transaction }));
  }
}
assert.equal(paid.status, 200, 'Paid request must return the snapshot');
const body = await paid.json();
assert.equal(body.agentId, Number(endpoint.searchParams.get('agentId')));
const settled = client.getPaymentSettleResponse(n => paid.headers.get(n));
console.log(JSON.stringify({ settlement: settled.transaction, success: settled.success }));
assert.equal(settled.success, true);
assert.equal(settled.network, 'eip155:84532');
const receipt = await rpc.waitForTransactionReceipt({ hash: settled.transaction });
assert.equal(receipt.status, 'success');
const transfer = parseEventLogs({ abi, logs: receipt.logs, eventName: 'Transfer' }).find(l =>
  l.address.toLowerCase() === asset.toLowerCase() &&
  l.args.from.toLowerCase() === account.address.toLowerCase() &&
  l.args.to.toLowerCase() === recipient.toLowerCase() && l.args.value === 1000n);
assert(transfer, 'Receipt must prove the exact USDC transfer');
// Public testnet RPC replicas can lag the facilitator's receipt. Re-read the
// explicit settled block instead of mistaking a cached "latest" balance for failure.
let after;
for (let attempt = 0; attempt < 10; attempt++) {
  try { after = await balance(recipient, receipt.blockNumber); break; } catch {
    if (attempt === 9) throw new Error('Settlement succeeded but its balance block is not yet readable');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
assert(after >= before + 1000n);
const replay = await call(headers);
assert.equal(replay.status, 402, 'A spent authorization must not unlock a second response');
const evidence = { checkedAt: new Date().toISOString(), endpoint: endpoint.href, network: 'Base Sepolia', amountUSDC: '0.001', payer: account.address, recipient, transaction: settled.transaction, unpaid: unpaid.status, invalid: invalid.status, paid: paid.status, replay: replay.status, transferVerified: true };
if (process.env.PAYMENT_EVIDENCE_FILE) writeFileSync(process.env.PAYMENT_EVIDENCE_FILE, JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
