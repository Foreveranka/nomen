# Paid complaint publication records

Production: https://nomen-beta.vercel.app/orders
Deployment: dpl_7zPeYwXxyy6VpESCGHSg2YnMJ9Na

## Implemented

- Structured complaints: requested service, observed outcome, specific problem, optional unverified evidence reference.
- One record per normalized wallet, agent ID and agent network. Signed draft reservation is private until publication; an existing draft is restored instead of allocating a second order.
- One-time fee: exactly 5 native **test USDC** on Arc Testnet, plus gas, paid to the existing safe NOMEN test treasury. No real USD or mainnet payments are enabled. This is a publication fee, not a donation, purchase verification or a correctness endorsement.
- The fee transaction commits the normalized original draft, including author, chain-qualified agent, ID, text and demo flag. Server checks the real Arc chain, success, canonical inclusion, sender, recipient, exact 18-decimal native amount and input commitment. A unique payment hash prevents reuse. Failed persistence is retried with the same payment.
- Free signed author edits, resolution and reopening. Free provider replies require a fresh ownerOf read from the configured agent registry. Ownership check block is retained with each response. Only the author can resolve; no provider self-resolution.
- Versioned append-only event history stores signed actions. Optimistic versions reject stale/replayed mutations. Database advisory locks serialize per-actor update limits and per-agent publication pattern checks.
- Five publications per agent/hour or identical normalized complaint text from another wallet flag a record. Demos are excluded. Flags remain visible in a review filter; they are not abuse findings, automatic removals, staff notifications or human adjudication.
- Agent pages show open/resolved records and explicitly say that no complaints does not imply good performance. No complaint-based ranking or trust score was added.
- Legacy public reviews and stars remain archived and read-only; POST /api/reviews returns 410. Private trial notes remain in the shortlist. Main navigation includes Orders. Landing page remains at /. ENS /claim and /names remain intact.
- API, overview, trial documentation and llms.txt updated.

## Validation

48 tests passed, including real Postgres transaction-local fixtures exercising production pattern detection SQL, demo exclusion and single-event publication. TypeScript, ESLint and production build passed. Tests reject wrong fee units/amount, recipient, payer, original draft and block hash; altered signatures, invalid networks, expired authorization and stale versions.

Real payment and role tests used dedicated test wallets, not browser extension key extraction. Original test payment:
https://testnet.arcscan.app/tx/0x054a97230f0ae352ad8237df0b0cc7e6d406e75de6c7b341bcd87d3c30f73556

Production-only fresh payment:
https://testnet.arcscan.app/tx/0x4638230c802a75c57a95c2004e6835edf9fb274158954fee9295ff7940585b2d

Both are explicitly synthetic complaint records. Live API verification passed paid creation, duplicate payment idempotency, registered-owner reply, free author resolution, unauthorized provider resolution rejection and exclusion of demos from all summary counts. Public /orders, /claim, /names and /docs returned 200; invalid complaint queries returned 400 and legacy rating writes 410.

Browser checks covered form copy, records, resolved history, provider reply, open filtering, visual layout and preserved ENS links. Automated browser wallet signing was not exercised; an unrelated injected MetaMask extension reported a connection error during local testing. Signed end-to-end operations were exercised with the dedicated test operator and test complainant.

## Operational notes

Apply site/migrations/002-complaints.sql using site/scripts/migrate-complaints.mjs with server-only DATABASE_URL. No private key is required by the application server. Direct native wallet payments require transaction.from to match the author; ERC-4337 bundler payments are not supported by this receipt check. Never interpret an unverified evidence reference as a purchase receipt. Payment commits the initial draft; subsequent statements are authenticated by their stored signatures and history, not additional onchain transfers. Canonical inclusion is checked at publication time, not continuously re-audited. Do not submit two independent payments for the same reserved draft. Keep payment hashes for recovery across devices.

Native denomination reference: https://docs.arc.io/arc/concepts/stablecoin-native-model (18-decimal native USDC; separate 6-decimal ERC-20 interface).
