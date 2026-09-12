import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running migrations.');
const sql = neon(process.env.DATABASE_URL);
const migration = await readFile(new URL('../migrations/002-complaints.sql', import.meta.url), 'utf8');
await sql.transaction(migration.split(';').filter(s => s.trim()).map(s => sql.query(s)));
console.log('Complaint schema ready.');
