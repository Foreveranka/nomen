# NOMEN web app

Next.js App Router application with English UI. The root introduces NOMEN; the app lives on separate routes.

| Route | Purpose |
| --- | --- |
| `/` | Product introduction and Open app |
| `/workbench` | English AI agent matching, manual catalog, live checks and private trial notes |
| `/orders` | Signed complaints, Arc publication payment, provider responses and resolution history |
| `/claim` | ENSv2 names under nomen-demo.eth on Sepolia |
| `/names` | Registered test names |
| `/profile` | Connected wallet’s agents |
| `/agent/arbitrum/205/trust` | Historical Arbitrum trial receipts |
| `/evaluations/evidence` | Verify an exported historical evidence file against receipt hashes |
| `/docs` | Product, API, contract and reproducibility documentation |

## Setup

Use a current Node.js version supporting native TypeScript stripping (the validation environment uses Node 25).

```sh
npm ci
# Add server-only values to .env.local using .env.example as a reference.
# Never overwrite an existing environment file or commit secrets.
npm run dev
```

DeepSeek discovery requires DEEPSEEK_API_KEY. The default model is deepseek-flash. The separate Sepolia and Arc Graph endpoints supply live owner/URI continuity checks before ranking; stale or unavailable evidence withholds candidates. Arbitrum matching uses published capabilities and live historical trial receipts. Ethereum mainnet is not selectable. Trial execution remains with the provider.

For Orders, export DATABASE_URL in the shell and initialize both schemas:

```sh
node scripts/migrate-reviews.mjs
node scripts/migrate-complaints.mjs
```

The first migration supports the historical review archive. New rating publication is retired (POST /api/reviews returns 410). New public complaints use signed /api/complaints actions and exactly 5 native test USDC on Arc Testnet (18-decimal native units). The initial payment commits the original draft. Free later updates and provider replies are signed and versioned in Neon. Only the author resolves or reopens. No purchase or task-success verification is claimed. The workbench’s 1–10 score and note remain private to the browser.

Wallet selection uses EIP-6963 discovery instead of a generic first injected provider. Full reloads require a new explicit connection; app navigation preserves the session. No QR/mobile wallet bridge is configured.

## Validation

```sh
npm run lint
node --test scripts/*.test.mjs
npm run build
npm start
```

Two database tests skip without DATABASE_URL. With it, they exercise isolated transaction fixtures. Build and test output is not a security audit or evidence of real customer use.

Sepolia naming is verified under nomen-demo.eth. The optional legacy x402 API uses Base Sepolia, separate from Arc complaint payments. See ../README.md and ../inceleme/2026-09-13-submission-readiness.md for evidence, current event fit and outstanding submission work.
