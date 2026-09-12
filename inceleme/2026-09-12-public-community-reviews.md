# Public community reviews

NOMEN now stores explicitly published reviews in Neon Postgres, connected to the Vercel production project. Agent pages show numeric averages, review counts, individual comments, wallet addresses, dates, outcomes and sorting. Publishing requires the original receipt reviewer's separate signature consenting to public storage of the full evidence bundle. Saving on the device remains private.

The contract continues to commit hashes, not readable scores or text. The server reads the configured chain registry, confirms successful canonical receipt inclusion, verifies both evidence hashes, and verifies publication consent. Duplicate publication is idempotent. The immutable receipt identifies each stored review. Public evidence can be downloaded from the review listing.

Only the latest published non-demo review per wallet and agent counts. Latest means chain block and event index, not upload time. An unrated latest review removes that wallet's previous numeric score. Demo reviews are partitioned separately; the known synthetic Sepolia and Arc smoke transactions are always excluded from averages. This is authorship verification, not proof that tasks were completed or that wallets represent distinct people. Chain inclusion is checked at publication time, not continuously re-audited for later reorganizations.

## Setup

Set server-only DATABASE_URL through Neon/Vercel. Run `node scripts/migrate-reviews.mjs` from site with DATABASE_URL in the environment. Missing/unavailable storage returns HTTP 503 rather than zero reviews. Never commit credentials. The integration uses Neon's free plan.

## Validation

- 44 tests pass, including a real Postgres transaction with temporary fixtures testing averages, superseded reviews, null ratings, chain/agent isolation, demo exclusions, all sort modes and pagination. Temporary fixtures never enter the public table.
- Publication signatures reject changed report, note, score, network, transaction, demo flag and wrong authors.
- Real Sepolia and Arc signed receipts published with the dedicated test operator's publication consent. Both 8/10 samples are clearly marked as demos.
- API round trip: repeat submission creates no duplicate; tampered score and consent rejected; downloaded evidence exactly matches the source.
- TypeScript and ESLint pass. Browser checked agent review loading, demo display and sorting.

## Production verification

Production deployment: dpl_7FvYXSKw6EYQGnBcv1c3XdyWmxUo, https://nomen-beta.vercel.app. Build completed successfully. Both Sepolia and Arc passed live publication, idempotent replay, forged-score rejection, altered-consent rejection, demo exclusion and evidence-download integrity checks. Arbitrum's empty public review list returns a truthful empty state; Ethereum and invalid sort modes return 400. The API documentation is live.

A production-only RPC verification failure was caught before sign-off. Receipt reads now use explicit network RPC URLs (with a Sepolia fallback); ordinary EOA publication signatures are recovered without an unnecessary contract call, while smart contract wallets retain network-based verification. Infrastructure failures return 503 separately from invalid evidence (422).
