# Complaint payments on three testnets — 2026-09-13

New signed drafts use paymentVersion 2. Payment follows the agent network:

| Network | Publication fee | Gas | Explorer |
|---|---|---|---|
| Sepolia | 5 Circle test USDC (ERC-20, 6 decimals) | test ETH | Sepolia Etherscan |
| Arbitrum Sepolia | 5 Circle test USDC (ERC-20, 6 decimals) | test ETH | Sepolia Arbiscan |
| Arc Testnet | 5 native test USDC (18 decimals) | test USDC | ArcScan |

Token addresses come from https://developers.circle.com/stablecoins/usdc-contract-addresses and are fixed in lib/complaints.ts. ERC-20 payments transfer directly to the treasury with the original draft commitment appended to calldata; no token allowance is requested. Verification requires exact network, sender, token/destination, value/calldata, canonical successful receipt and matching Transfer event. Signatures, versioned edits, owner replies and author-only resolution use the same workflow on all three networks.

Legacy drafts without paymentVersion, including unpaid reservations, retain their original Arc policy and v1 commitment. No database migration or record rewrite was performed. New records must not reinterpret an old transaction as a new-network payment. Existing API clients may still reserve legacy v1 drafts; the current UI always creates v2 drafts.

## Verification

- TypeScript and ESLint passed.
- 47 regular Node tests passed, plus both Neon database fixture tests (49 total).
- Negative tests cover wrong chain, wrong sender/token/recipient/value, changed commitment, missing/spoofed Transfer logs, wrong token amount, reverted receipt and canonical block mismatch.
- Read-only eth_call of the complete 5-USDC transaction returned true against real Circle contracts: Sepolia block 11691717 and Arbitrum Sepolia block 308247831. This used public funded token recipients as simulation senders; no keys, signatures or transactions were used. Script: site/scripts/complaints-rpc-smoke.mjs.
- Existing user record 7cf75f6c-45b0-49dd-9758-5a831053c145 and Arc tx 0x9c77932e458387476c8b79cada52a71e8fc61441a8ae3a7cf032e76e50265605 still pass the new verifier; its original commitment is unchanged.
- Production signed prepare requests returned 200 and persisted v2 reservations on both new networks. IDs are in multichain-reservations-2026-09-13.json. These are private, unpaid synthetic drafts.
- Browser checks confirm the new payment message changes with Sepolia, Arbitrum Sepolia and Arc selection; existing records still render with their actual Arc payment network.
- Production deployment dpl_A6yBssE5mQ9NJ7NYDG7kWJi6RN1Y is READY and aliased to https://nomen-beta.vercel.app. Build passed with the pre-existing ox/viem dynamic-dependency warning.

## Remaining real-transfer check

No funded 5-USDC transfer has been broadcast on the two newly added networks in this change. The operator has 0 Circle USDC on both, and 0 Arbitrum Sepolia ETH as of the check. The user has been asked for test tokens. RPC simulation and signed reservation success do not prove the full payment-to-publication path. Complete that test after funding, label synthetic records TEST, and preserve transaction hashes.

ENS naming remains on Sepolia. Graph and historical trial indexing keep their existing network-specific implementations; this change provides complaint-payment workflow parity, not a redeployment of every integration.

## Arbitrum real-transfer verification — September 13 evening

Supersedes the Arbitrum funding blocker above. A distinct test payer transferred exactly 5 Circle test USDC on chain 421614 with the original draft commitment. Production verification accepted the canonical successful receipt and token Transfer event. The TEST record was published, then resolved by an author-signed update without another payment, and read back through the public API. No provider service or purchase is claimed. Sepolia full-transfer status is unchanged.

Payment: https://sepolia.arbiscan.io/tx/0x768f77028f561e0cf4ba4790b282a5062b4a30c7ae9c5abb47e8d34c7f2561cf

Record: https://nomen-beta.vercel.app/orders?id=e9a861ae-5cc8-46db-8835-25cdebd8fd0f

Evidence: [payment smoke](../submission/arbitrum/payment-smoke.json).
