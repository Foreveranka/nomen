import test from 'node:test';
import assert from 'node:assert/strict';
import { neon } from '@neondatabase/serverless';
import { REVIEW_LIST_QUERY } from '../lib/review-list-query.ts';
// All fixtures live in a transaction-local temporary table. Public reviews are untouched.
test('database keeps latest wallet review, excludes demos, sorts and scopes agents/networks', {skip:!process.env.DATABASE_URL}, async()=>{
 const sql=neon(process.env.DATABASE_URL);
 const results=await sql.transaction([
 sql.query('CREATE TEMP TABLE nomen_reviews (chain text, agent_id bigint, reviewer text, demo boolean, rating integer, block_number bigint, log_index integer, evaluation_id text) ON COMMIT DROP'),
 sql.query(`INSERT INTO nomen_reviews VALUES
 ('sepolia',1,'a',false,10,100,0,'old-a'),
 ('sepolia',1,'a',false,4,101,0,'latest-a'),
 ('sepolia',1,'b',false,8,101,1,'latest-b'),
 ('sepolia',1,'demo',true,10,200,0,'demo'),
 ('sepolia',1,'c',false,9,90,0,'old-c'),
 ('sepolia',1,'c',false,null,102,0,'unrated-c'),
 ('arc',1,'other-chain',false,1,500,0,'arc'),
 ('sepolia',2,'other-agent',false,1,500,0,'other')`),
 sql.query(REVIEW_LIST_QUERY,['sepolia',1,'highest',0]),
 sql.query(REVIEW_LIST_QUERY,['sepolia',1,'lowest',0]),
 sql.query(REVIEW_LIST_QUERY,['sepolia',1,'newest',0]),
 sql.query(REVIEW_LIST_QUERY,['sepolia',1,'newest',20]),
 sql.query(REVIEW_LIST_QUERY,['sepolia',99,'newest',0]),
 ]);
 const highest=results[2][0];assert.equal(Number(highest.average),6);assert.equal(Number(highest.count),2);assert.equal(Number(highest.total),3);
 assert.deepEqual(highest.reviews.map(x=>x.evaluation_id),['latest-b','latest-a','unrated-c']);
 assert.equal(highest.demos.length,1);
 assert.deepEqual(results[3][0].reviews.map(x=>x.evaluation_id),['latest-a','latest-b','unrated-c']);
 assert.deepEqual(results[4][0].reviews.map(x=>x.evaluation_id),['unrated-c','latest-b','latest-a']);
 assert.equal(results[5][0].reviews.length,0);assert.equal(Number(results[5][0].count),2);
 assert.equal(results[6][0].average,null);assert.equal(Number(results[6][0].count),0);
});
