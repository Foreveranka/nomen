import test from 'node:test';import assert from 'node:assert/strict';import {neon} from '@neondatabase/serverless';
import {COMPLAINT_PUBLISH_QUERY} from '../lib/complaint-publish-query.ts';
test('publication flags bursts/repeated text, excludes demos, and records exactly one payment event',{skip:!process.env.DATABASE_URL},async()=>{
 const sql=neon(process.env.DATABASE_URL);
 const ids=Array.from({length:8},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
 const rows=await sql.transaction([
 sql.query('CREATE TEMP TABLE nomen_complaints (LIKE public.nomen_complaints INCLUDING DEFAULTS INCLUDING CONSTRAINTS) ON COMMIT DROP'),
 sql.query('CREATE TEMP TABLE nomen_complaint_events (LIKE public.nomen_complaint_events INCLUDING DEFAULTS) ON COMMIT DROP'),
 ...ids.map((id,i)=>sql.query(`INSERT INTO nomen_complaints(id,chain,agent_id,author,demo,initial_draft,fields,commitment,text_hash,payment_tx,published_at,status,version) VALUES ($1,'arc',$2,$3,$4,'{}','{}','test',$5,$6,CASE WHEN $6::text IS NOT NULL THEN now() ELSE NULL END,CASE WHEN $6::text IS NOT NULL THEN 'open' ELSE 'pending' END,CASE WHEN $6::text IS NOT NULL THEN 1 ELSE 0 END)`,[id,i===6?2:1,'wallet-'+i,i===5,i===4||i===6?'same-text':'text-'+i,i<4?'old-tx-'+i:null])),
 sql.query(COMPLAINT_PUBLISH_QUERY,['paid-4','99',ids[4],'wallet-4','{"type":"publish"}','0x11']),
 sql.query(COMPLAINT_PUBLISH_QUERY,['paid-demo','99',ids[5],'wallet-5','{"type":"publish"}','0x11']),
 sql.query(COMPLAINT_PUBLISH_QUERY,['paid-repeat','99',ids[6],'wallet-6','{"type":"publish"}','0x11']),
 sql.query(COMPLAINT_PUBLISH_QUERY,['paid-4','99',ids[4],'wallet-4','{"type":"publish"}','0x11']),
 sql.query('SELECT count(*) AS n FROM nomen_complaint_events'),
 ]);
 assert.deepEqual(rows[10][0].flags,['activity_spike']);
 assert.deepEqual(rows[11][0].flags,[]);
 assert.deepEqual(rows[12][0].flags,['repeated_text']);
 assert.equal(rows[13].length,0);assert.equal(Number(rows[14][0].n),3);
});
