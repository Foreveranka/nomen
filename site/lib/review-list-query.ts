// Parameterized SQL shared with the database integration tests.
export const REVIEW_LIST_QUERY = `WITH latest AS (
      SELECT DISTINCT ON (reviewer, demo) * FROM nomen_reviews WHERE chain=$1 AND agent_id=$2
      ORDER BY reviewer, demo, block_number DESC, log_index DESC
    ), real AS (SELECT * FROM latest WHERE NOT demo), selected AS (
      SELECT * FROM real ORDER BY
        CASE WHEN $3='highest' THEN rating END DESC NULLS LAST,
        CASE WHEN $3='lowest' THEN rating END ASC NULLS LAST,
        block_number DESC, log_index DESC, evaluation_id LIMIT 20 OFFSET $4
    ) SELECT (SELECT avg(rating) FROM real) AS average, (SELECT count(rating) FROM real) AS count,
      (SELECT count(*) FROM real) AS total,
      coalesce((SELECT jsonb_agg(to_jsonb(selected)) FROM selected), '[]'::jsonb) AS reviews,
      coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM (SELECT * FROM latest WHERE demo ORDER BY block_number DESC LIMIT 5) d), '[]'::jsonb) AS demos`;
