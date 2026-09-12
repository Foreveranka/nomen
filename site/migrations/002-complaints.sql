CREATE TABLE IF NOT EXISTS nomen_complaints (
 id uuid PRIMARY KEY,
 chain text NOT NULL CHECK(chain IN ('sepolia','arbitrum','arc')),
 agent_id bigint NOT NULL CHECK(agent_id > 0),
 author text NOT NULL,
 demo boolean NOT NULL,
 initial_draft jsonb NOT NULL,
 fields jsonb NOT NULL,
 commitment text NOT NULL,
 text_hash text NOT NULL,
 payment_tx text UNIQUE,
 payment_block bigint,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','open','resolved')),
 version integer NOT NULL DEFAULT 0,
 flags text[] NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(chain,agent_id,author)
);
CREATE INDEX IF NOT EXISTS nomen_complaints_agent ON nomen_complaints(chain,agent_id,published_at DESC) WHERE payment_tx IS NOT NULL;
CREATE INDEX IF NOT EXISTS nomen_complaints_author ON nomen_complaints(author,published_at DESC);
CREATE TABLE IF NOT EXISTS nomen_complaint_events (
 complaint_id uuid NOT NULL REFERENCES nomen_complaints(id),
 version integer NOT NULL,
 actor text NOT NULL,
 kind text NOT NULL,
 payload jsonb NOT NULL,
 signature text NOT NULL,
 owner_block bigint,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(complaint_id,version)
);
