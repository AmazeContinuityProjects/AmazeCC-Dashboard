import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { processPaper } from './processor';

// Use absolute path to ensure .env is loaded regardless of where the process is started
const rootEnv = path.resolve(__dirname, '../../.env');
const localEnv = path.resolve(__dirname, '../../.env.local');

if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
}

const POLL_INTERVAL = 5000; // 5 seconds for faster polling

async function startWorker() {
  console.log('🚀 OCR Worker started...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('localhost') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    // Extract host/db name for transparency without showing password
    const dbInfo = process.env.DATABASE_URL.split('@')[1] || 'local-db';
    console.log(`✅ Connected to database: ${dbInfo}`);

    // Ensure schema is up to date for OCR worker
    await client.query(`ALTER TABLE qbank_questions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'DRAFT'`);
    await client.query(`ALTER TABLE qbank_questions ADD COLUMN IF NOT EXISTS metadata JSONB`);
    console.log(`✅ Database schema verified`);

    let lastCheck = 0;

    while (true) {
      try {
        const { rows } = await client.query(
          `SELECT source_id, title FROM papers_archive 
           WHERE approval_status = 'OCR_QUEUED' 
           ORDER BY created_at ASC`
        );

        if (rows.length > 0) {
          console.log(`\n🔍 Found ${rows.length} paper(s) in queue. Starting now...`);
          
          const { rows: singleRow } = await client.query(
            `SELECT source_id, file_url, title FROM papers_archive 
             WHERE approval_status = 'OCR_QUEUED' 
             ORDER BY created_at ASC LIMIT 1`
          );

          if (singleRow.length > 0) {
            const { source_id, file_url, title } = singleRow[0];
            console.log(`--------------------------------------------------`);
            console.log(`📄 [TASK START] ${title}`);
            console.log(`🆔 ID: ${source_id}`);
            
            await client.query(
              `UPDATE papers_archive SET approval_status = 'OCR_PROCESSING' WHERE source_id = $1`,
              [source_id]
            );

            try {
              const start = Date.now();
              await processPaper(source_id, file_url, client);
              const duration = ((Date.now() - start) / 1000).toFixed(1);
              
              await client.query(
                `UPDATE papers_archive SET approval_status = 'PENDING_Q_APPROVAL' WHERE source_id = $1`,
                [source_id]
              );
              console.log(`\n✅ [TASK SUCCESS] Finished in ${duration}s`);
              console.log(`--------------------------------------------------`);
            } catch (error: any) {
              console.error(`\n❌ [TASK ERROR] ${title}:`, error.message);
              await client.query(
                `UPDATE papers_archive SET approval_status = 'OCR_FAILED' WHERE source_id = $1`,
                [source_id]
              );
            }
          }
        } else {
          // Periodic heartbeat log (every 30s)
          const now = Date.now();
          if (now - lastCheck > 30000) {
            const time = new Date().toLocaleTimeString();
            console.log(`[${time}] Scanning for queued papers... (Queue empty)`);
            lastCheck = now;
          }
          process.stdout.write('.'); 
        }
      } catch (err) {
        console.error('\nWorker loop error:', err);
      }
      
      await new Promise(res => setTimeout(res, POLL_INTERVAL));
    }
  } catch (error) {
    console.error('Fatal worker error:', error);
    process.exit(1);
  }
}

startWorker();
