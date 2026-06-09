import axios from 'axios';
import { Client as PgClient } from 'pg';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = 'qwen2.5vl:3b';

function getDirectDownloadUrl(url: string): string {
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/(.+?)\/(view|edit|usp=sharing)/) || url.match(/id=(.+?)(&|$)/);
    if (match && match[1]) return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  if (url.includes('dropbox.com')) return url.replace('?dl=0', '?dl=1').replace('&dl=0', '&dl=1');
  if (url.includes('onedrive.live.com') || url.includes('sharepoint.com') || url.includes('1drv.ms')) {
    if (url.includes('view.aspx')) return url.replace('view.aspx', 'download.aspx');
    if (url.includes('/redir')) return url.replace('/redir', '/download');
    if (url.includes('/embed')) return url.replace('/embed', '/download');
    if (!url.includes('download=1')) return url.includes('?') ? `${url}&download=1` : `${url}?download=1`;
  }
  return url;
}

export async function processPaper(paperId: string, fileUrl: string, db: PgClient) {
  await db.query(`DELETE FROM qbank_questions WHERE source_id = $1`, [paperId]);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-'));
  const pdfPath = path.join(tempDir, 'input.pdf');
  
  const directUrl = getDirectDownloadUrl(fileUrl);
  console.log(`[1/3] Downloading PDF from: ${directUrl}`);
  const response = await axios.get(directUrl, { 
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
  });
  const buffer = Buffer.from(response.data);

  if (buffer.length < 4 || buffer.toString('utf8', 0, 4) !== '%PDF') {
    const snippet = buffer.toString('utf8', 0, 100);
    let hint = "";
    if (snippet.includes('Microsoft') || snippet.includes('login')) {
      hint = " (HINT: This looks like a private Microsoft login page. Ensure the link is set to 'Anyone with the link can view'.)";
    }
    throw new Error(`Downloaded file is not a PDF.${hint} Starts with: ${snippet.substring(0, 40)}...`);
  }

  fs.writeFileSync(pdfPath, buffer);

  try {
    console.log(`[2/3] Converting PDF to images (90 DPI)...`);
    const outputPrefix = path.join(tempDir, 'page');
    execSync(`pdftocairo -png -r 90 "${pdfPath}" "${outputPrefix}"`);

    const files = fs.readdirSync(tempDir)
      .filter(f => f.startsWith('page-') && f.endsWith('.png'))
      .sort((a, b) => parseInt(a.match(/\d+/)?.[0] || '0') - parseInt(b.match(/\d+/)?.[0] || '0'));

    console.log(`[3/3] Found ${files.length} pages. Starting AI extraction...`);

    for (let i = 0; i < files.length; i++) {
      const pageImagePath = path.join(tempDir, files[i]);
      const pageImageBase64 = fs.readFileSync(pageImagePath).toString('base64');

      const prompt = `Extract all exam questions from this page.
Return ONLY a JSON object with this structure:
{
  "questions": [
    {"question_number": "1", "text": "...", "marks": 5, "type": "DESCRIPTIVE"}
  ]
}
No intro, no markdown, no internal tokens.`;

      try {
        if (i > 0) {
          console.log(`   ⏱️  Cooldown (5s)...`);
          await new Promise(res => setTimeout(res, 5000));
        }

        process.stdout.write(`   → Page ${i + 1}/${files.length}: Calling Ollama... `);
        const pageStart = Date.now();
        const ollamaResponse = await axios.post(OLLAMA_URL, {
          model: OLLAMA_MODEL,
          messages: [{ role: 'user', content: prompt, images: [pageImageBase64] }],
          stream: false,
          options: {
            temperature: 0,
            num_ctx: 1536, // 'Safe Mode' context for 4GB GPUs
            num_predict: 1024
          }
        });

        const pageDuration = ((Date.now() - pageStart) / 1000).toFixed(1);
        const rawOutput = ollamaResponse.data.message.content;

        // Aggressive JSON extraction
        let cleanJson = rawOutput.replace(/<\|.*?\|>/g, '').trim();
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        let data;
        try {
          data = JSON.parse(cleanJson);
        } catch (parseErr) {
          console.log(`❌ Parse Failed. Raw Output saved to console.`);
          console.log(`--- RAW START ---\n${rawOutput}\n--- RAW END ---`);
          continue;
        }

        if (data.questions && Array.isArray(data.questions)) {
          console.log(`✅ ${data.questions.length} found (${pageDuration}s)`);
          for (const q of data.questions) {
            let parsedMarks: number | null = null;
            if (q.marks !== undefined && q.marks !== null) {
              const match = String(q.marks).match(/\d+/);
              if (match) parsedMarks = parseInt(match[0], 10);
            }

            await db.query(
              `INSERT INTO qbank_questions (source_id, question_number, question_text, marks, question_type, status, metadata)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [paperId, q.question_number || '?', q.text || 'Empty', parsedMarks, q.type || 'DESCRIPTIVE', 'DRAFT', JSON.stringify({ raw_output: q })]
            );
          }
        } else {
          console.log(`⚠️ No questions (${pageDuration}s)`);
        }
      } catch (pageErr: any) {
        console.log(`❌ Failed: ${pageErr.response?.data?.error || pageErr.message}`);
      }
    }
  } catch (err: any) {
    console.error(`❌ Error:`, err.message);
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
  }
}
