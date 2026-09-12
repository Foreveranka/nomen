// Shared production query, exercised against isolated database fixtures.
export const COMPLAINT_PUBLISH_QUERY = `WITH changed AS (
          UPDATE nomen_complaints SET payment_tx=$1,payment_block=$2,status='open',version=1,published_at=now(),updated_at=now(),
          flags=ARRAY_REMOVE(ARRAY[
            CASE WHEN NOT demo AND (SELECT count(*) FROM nomen_complaints c WHERE c.chain=nomen_complaints.chain AND c.agent_id=nomen_complaints.agent_id AND NOT c.demo AND c.published_at>now()-interval '1 hour') >= 4 THEN 'activity_spike' END,
            CASE WHEN NOT demo AND EXISTS(SELECT 1 FROM nomen_complaints c WHERE c.id<>nomen_complaints.id AND c.text_hash=nomen_complaints.text_hash AND c.author<>nomen_complaints.author AND NOT c.demo AND c.payment_tx IS NOT NULL) THEN 'repeated_text' END
          ],NULL)
          WHERE id=$3 AND payment_tx IS NULL RETURNING *
        ), event AS (
          INSERT INTO nomen_complaint_events (complaint_id,version,actor,kind,payload,signature) SELECT id,1,$4,'publish',$5::jsonb,$6 FROM changed
        ) SELECT * FROM changed`;
