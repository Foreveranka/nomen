# NOMEN web app

Next.js App Router application. `/` introduces NOMEN. `/workbench` contains English AI discovery, catalog filters, live evidence checks, provider-side trial preparation and the browser-local shortlist. `/docs` describes the deployed behavior and current limitations.

## Run locally

```sh
npm ci
# Add DEEPSEEK_API_KEY to .env.local; use .env.example as a reference.
npm run dev
```

Keep secrets server-only. Do not overwrite an existing `.env.local` or commit it. Production uses a sensitive Vercel `DEEPSEEK_API_KEY`. Default model: `deepseek-flash`. `NOMEN_DISCOVERY_MODEL` is an optional override; alternative provider IDs use Vercel AI Gateway authentication.

## Verify

```sh
npm run lint
node --experimental-strip-types --test scripts/discovery.test.mjs scripts/evaluation.test.mjs scripts/trial.test.mjs
npm run build
npm start
```

Discovery retrieves published descriptions, requires live Graph owner/URI continuity for Sepolia and Arc candidates, and includes indexed registry history in AI ranking. Ethereum is labeled snapshot-only. Arc indexes only the 249 listed catalog IDs, refreshed September 11 at block 61552064; per-network coverage is explicit. The trial prompt is assembled locally; the selected agent runs only when the user uses its provider. Sepolia ENS naming is verified under nomen-demo.eth. Base Sepolia x402 settlement passed local and production end-to-end tests; public transaction evidence is at /x402-evidence.json. Graph Studio v0.3.0 is deployed and connected through NOMEN_SUBGRAPH_URL; configure the separate Arc deployment through NOMEN_ARC_SUBGRAPH_URL; the activity panel reports unavailable or stale data explicitly. See the repository README and `/docs` for details.
