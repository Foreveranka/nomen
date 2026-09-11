# Arc Graph → AI rollout — September 11, 2026

## Deployed

- Production: https://nomen-beta.vercel.app
- Vercel: dpl_5JDYwUMGi9k16qM5qjdqMmx1bGvc
- Arc Studio: https://api.studio.thegraph.com/query/1760110/nomen-arc/v0.1.1
- Manifest CID: QmcHiHHJWthqA3iTquMSRMwBzaqCVrVU8fnsA9oL2EPcUJ
- Sepolia endpoint retained: https://api.studio.thegraph.com/query/1760110/nomen/v0.3.0

Arc indexes identity, reputation and validation events for the 249 explicitly listed catalog IDs. All eight event handlers filter the ABI's indexed agent-ID topic. There is no Arc ENS registrar or Arc payment integration in this change. Studio deployment is not Graph Network publication.

The 249 listed Arc records were refreshed at block 61552064, with no unresolved RPC reads and all 249 retained. The public catalog-refresh.json declares listed_catalog_refresh. Unlisted Arc observations retain legacy provenance. Shared Sepolia and Ethereum release data were preserved.

Discovery queries each supported network independently, pins current evidence and compares immutable identity checkpoints with that candidate's snapshot. No stale or unavailable supported-network record reaches AI ranking. AI receives chain-specific owner/URI continuity, feedback wallet counts, URI changes and transfers, and must cite supplied signals. Mixed results report individual network status and scope.

## Verified

- 30 Node tests pass, including separate identities for equal numeric IDs, isolated network outages and rejection of a wrongly configured Arc endpoint.
- TypeScript, lint and local/production builds pass. Existing viem/ox dynamic-import warning remains nonfatal.
- Two real DeepSeek + Sepolia Graph searches pass locally and in production, with independent Graph queries verifying every returned match and its historical checkpoint.
- Production landing, workbench, docs, public Arc refresh manifest and Arc activity API return HTTP 200.
- Browser verification on production returned Sepolia #1194 with live Graph signals, the correct activity link and Try this agent. No browser console errors were observed.
- A real Arc discovery request reports stale Graph evidence and returns zero matches while initial backfill is incomplete. This is correct failure behavior, not a successful Arc recommendation.

Evidence: arc-rollout-sepolia-regression.json, arc-rollout-production-sepolia.json, arc-rollout-production.json.

## Remaining external dependency

As of 10:44 UTC, Graph Studio is scanning historical Arc blocks (its logs progressed beyond 31 million), but the query checkpoint is still 29241339 before the first indexed catalog event. hasIndexingErrors is false. Current Arc chain height exceeds 61.55 million. Do not claim the Arc end-to-end positive path passed yet. The app checks freshness on every new search and admits Arc candidates only once real indexed evidence passes.

After the index catches up, run in site:

```sh
NOMEN_TEST_ARC=1 NOMEN_TEST_BASE_URL=https://nomen-beta.vercel.app NOMEN_TEST_EVIDENCE_FILE=../inceleme/arc-graph-ai-live-evidence.json node scripts/test-graph-ai.mjs
```

This runs both Sepolia regression cases and two real Arc cases: invoice/vendor payments (#40) and Polymarket odds API (#882138). It validates the AI's description quote and registry signals against independent pinned Graph queries. Do not change assertions merely to count stale data as success.
