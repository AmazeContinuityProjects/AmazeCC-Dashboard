import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { processPaper } from './processor';

// Use absolute path to ensure env is loaded regardless of where the process is started
const envPaths = [
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../env.local'),
  path.resolve(__dirname, '../../env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const POLL_INTERVAL = 5000; // 5 seconds for faster polling

async function startWorker() {
  console.log('🚀 OCR Worker started...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  while (true) {
    let client: Client | null = null;
    try {
      client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('localhost') ? { rejectUnauthorized: false } : false,
      });

      client.on('error', (err) => {
        console.error('Database client error:', err.message);
      });

      await client.connect();
      const dbInfo = process.env.DATABASE_URL.split('@')[1] || 'local-db';
      console.log(`✅ Connected to database: ${dbInfo}`);

      // Ensure schema is up to date for OCR worker
      await client.query(`ALTER TABLE qbank_questions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'DRAFT'`);
      await client.query(`ALTER TABLE qbank_questions ADD COLUMN IF NOT EXISTS metadata JSONB`);
      await client.query(`ALTER TABLE qbank_questions ADD COLUMN IF NOT EXISTS topic_name TEXT`);
      await client.query(`ALTER TABLE qbank_questions ADD COLUMN IF NOT EXISTS has_diagram BOOLEAN DEFAULT FALSE`);
      await client.query(`ALTER TABLE qbank_questions ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}'`);
      await client.query(`ALTER TABLE papers_archive ADD COLUMN IF NOT EXISTS ocr_logs TEXT`);
      await client.query(`ALTER TABLE papers_archive ADD COLUMN IF NOT EXISTS ocr_progress INT DEFAULT 0`);
      await client.query(`ALTER TABLE papers_archive ADD COLUMN IF NOT EXISTS ocr_model TEXT`);
      await client.query(`ALTER TABLE papers_archive ADD COLUMN IF NOT EXISTS file_size BIGINT`);
      await client.query(`ALTER TABLE papers_archive ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'R2'`);
      await client.query(`ALTER TABLE papers_archive ALTER COLUMN source_type SET DEFAULT 'UPLOAD'`);
      await client.query(`ALTER TABLE papers_archive ADD COLUMN IF NOT EXISTS source_url TEXT`);
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
              `SELECT source_id, file_url, title, ocr_model FROM papers_archive 
               WHERE approval_status = 'OCR_QUEUED' 
               ORDER BY created_at ASC LIMIT 1`
            );

            if (singleRow.length > 0) {
              const { source_id, file_url, title, ocr_model } = singleRow[0];
              console.log(`--------------------------------------------------`);
              console.log(`📄 [TASK START] ${title}`);
              console.log(`🆔 ID: ${source_id}`);
              if (ocr_model) console.log(`🤖 Selected Model: ${ocr_model}`);
              
              await client.query(
                `UPDATE papers_archive SET approval_status = 'OCR_PROCESSING', ocr_progress = 0, ocr_logs = '' WHERE source_id = $1`,
                [source_id]
              );

              try {
                const start = Date.now();
                await processPaper(source_id, file_url, client, ocr_model);
                const duration = ((Date.now() - start) / 1000).toFixed(1);
                
                await client.query(
                  `UPDATE papers_archive 
                   SET approval_status = 'PENDING_Q_APPROVAL', 
                       ocr_progress = 100, 
                       ocr_logs = COALESCE(ocr_logs, '') || '[' || TO_CHAR(NOW(), 'HH24:MI:SS') || '] OCR finished successfully in ' || $2 || 's.\n'
                   WHERE source_id = $1`,
                  [source_id, duration]
                );
                console.log(`\n✅ [TASK SUCCESS] Finished in ${duration}s`);
                console.log(`--------------------------------------------------`);
              } catch (error: any) {
                console.error(`\n❌ [TASK ERROR] ${title}:`, error.message);
                await client.query(
                  `UPDATE papers_archive 
                   SET approval_status = 'OCR_FAILED', 
                       ocr_progress = 100, 
                       ocr_logs = COALESCE(ocr_logs, '') || '[' || TO_CHAR(NOW(), 'HH24:MI:SS') || '] OCR Failed: ' || $2 || '\n'
                   WHERE source_id = $1`,
                  [source_id, error.message]
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
        } catch (err: any) {
          console.error('\nWorker loop query error:', err.message);
          break; // break inner loop to reconnect client
        }
        
        await new Promise(res => setTimeout(res, POLL_INTERVAL));
      }
    } catch (loopErr: any) {
      console.error('\nDatabase connection/loop error. Reconnecting in 10s...', loopErr.message);
      if (client) {
        try { await client.end(); } catch (e) {}
      }
      await new Promise(res => setTimeout(res, 10000));
    }
  }
}

startWorker();
