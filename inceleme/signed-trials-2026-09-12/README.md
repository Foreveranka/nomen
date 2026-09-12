# Signed publication tests — 2026-09-12

Dedicated test signer: 0xD7256e7a20368bAc505A738CC1C2cbc8d0648849. No browser wallet keys were accessed. The old deployer was not used.

The score 8/10 is explicitly labelled synthetic input in each evidence file. Outcomes are inconclusive. These are publication and integrity tests, not evidence of agent task performance.

- Sepolia: new transaction confirmed and Etherscan displayed Success. Production receipt API returned 200 and both hashes matched sepolia.json.
- Arc: new transaction confirmed and ArcScan displayed Success. Production receipt API returned 200 and both hashes matched arc.json.
- Arbitrum Sepolia: no new transaction sent; the dedicated signer has zero gas balance. Funding requested. Existing historical receipt 0x363f1eada0965113596960b3551d4678d38df76bac6776ae89be436b78e2307c was checked on Arbiscan and displayed Success; it belongs to the older signer and is not a new test.

Browser extension access to Rabby was blocked. Signing used the separately provisioned local test account via viem, with chain/address assertions, contract simulation and per-transaction test fee caps (0.002 test ETH or 0.1 test USDC). Browser file upload was blocked by missing file-URL access, so evidence integrity was checked using the production API and the same verifier used by the UI.

The unavailable-service review guard was corrected: a fresh confirmed ownership record permits failed/inconclusive attempts even without a reachable service; passing reviews still require trial access and all checklist items. 42 tests, lint and TypeScript passed. Deployed in dpl_7b2rU4tTPr9uQ8S7HsdPZGkDQqQ6.
