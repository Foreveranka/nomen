CREATE TABLE IF NOT EXISTS nomen_reviews (
 chain text NOT NULL CHECK (chain IN ('sepolia','arbitrum','arc')),
 evaluation_id text NOT NULL,
 agent_id bigint NOT NULL CHECK (agent_id > 0),
 reviewer text NOT NULL,
 transaction_hash text NOT NULL,
 block_number bigint NOT NULL,
 log_index integer NOT NULL,
 recorded_at bigint NOT NULL,
 rating smallint CHECK (rating BETWEEN 1 AND 10),
 outcome text NOT NULL CHECK (outcome IN ('inconclusive','passed','failed')),
 note text NOT NULL,
 bundle jsonb NOT NULL,
 demo boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (chain, evaluation_id)
);
CREATE INDEX IF NOT EXISTS nomen_reviews_agent_latest ON nomen_reviews (chain, agent_id, reviewer, demo, block_number DESC, log_index DESC);
