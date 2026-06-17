import axios from 'axios';
import { Client as PgClient } from 'pg';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5vl:3b';

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

function relaxedJsonParse(str: string): any {
  const clean = str.trim();
  const fn = new Function('None', 'True', 'False', 'return ' + clean);
  return fn(null, true, false);
}

function tryRepairTruncatedJson(str: string, isArray: boolean = false): string {
  try {
    relaxedJsonParse(str);
    return str;
  } catch (e) {}

  const lastBrace = str.lastIndexOf('}');
  if (lastBrace === -1) return str;

  const sub = str.substring(0, lastBrace + 1);
  const closingSuffix = isArray ? ']' : ']}';
  
  const candidate1 = sub + closingSuffix;
  try {
    relaxedJsonParse(candidate1);
    return candidate1;
  } catch (e) {}

  let index = lastBrace;
  while (index > 0) {
    const prevBrace = str.lastIndexOf('}', index - 1);
    if (prevBrace === -1) break;
    const candidate = str.substring(0, prevBrace + 1) + closingSuffix;
    try {
      relaxedJsonParse(candidate);
      return candidate;
    } catch (e) {}
    index = prevBrace;
  }

  return str;
}

async function updateOcrStatus(db: PgClient, paperId: string, progress: number, logLine: string, append: boolean = true) {
  console.log(`[Progress ${progress}%] ${logLine}`);
  const formattedLog = `[${new Date().toLocaleTimeString()}] ${logLine}`;
  if (append) {
    await db.query(
      `UPDATE papers_archive 
       SET ocr_progress = $1, ocr_logs = COALESCE(ocr_logs, '') || $2 || '\n' 
       WHERE source_id = $3`,
      [progress, formattedLog, paperId]
    );
  } else {
    await db.query(
      `UPDATE papers_archive 
       SET ocr_progress = $1, ocr_logs = $2 || '\n' 
       WHERE source_id = $3`,
      [progress, formattedLog, paperId]
    );
  }
}

export async function processPaper(paperId: string, fileUrl: string, db: PgClient, customModel?: string | null) {
  let selectedModel = customModel || OLLAMA_MODEL;
  if (selectedModel === 'moondream' || selectedModel === 'moondream:latest') {
    selectedModel = 'qwen2.5vl:3b';
  }
  const isQwen = selectedModel.includes('qwen');
  const dpi = isQwen ? 50 : 90;
  const numCtx = isQwen ? 2048 : 8192;
  const numPredict = isQwen ? 1536 : 4096;

  await updateOcrStatus(db, paperId, 5, `Clearing previous questions and starting OCR with model: ${selectedModel} (DPI: ${dpi}, context: ${numCtx})...`, false);
  await db.query(`DELETE FROM qbank_questions WHERE source_id = $1`, [paperId]);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-'));
  const pdfPath = path.join(tempDir, 'input.pdf');
  
  const directUrl = getDirectDownloadUrl(fileUrl);
  await updateOcrStatus(db, paperId, 10, `Downloading PDF from: ${directUrl}`);
  
  let buffer: Buffer;
  try {
    const response = await axios.get(directUrl, { 
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    buffer = Buffer.from(response.data);
  } catch (downloadErr: any) {
    await updateOcrStatus(db, paperId, 100, `Failed to download PDF: ${downloadErr.message}`);
    throw downloadErr;
  }

  if (buffer.length < 4 || buffer.toString('utf8', 0, 4) !== '%PDF') {
    const snippet = buffer.toString('utf8', 0, 100);
    let hint = "";
    if (snippet.includes('Microsoft') || snippet.includes('login')) {
      hint = " (HINT: This looks like a private Microsoft login page. Ensure the link is set to 'Anyone with the link can view'.)";
    }
    const errText = `Downloaded file is not a PDF.${hint} Starts with: ${snippet.substring(0, 40)}...`;
    await updateOcrStatus(db, paperId, 100, `Error: ${errText}`);
    throw new Error(errText);
  }

  fs.writeFileSync(pdfPath, buffer);

  try {
    await updateOcrStatus(db, paperId, 25, `PDF downloaded. Converting PDF to images (${dpi} DPI) using pdftocairo...`);
    const outputPrefix = path.join(tempDir, 'page');
    execSync(`pdftocairo -png -r ${dpi} "${pdfPath}" "${outputPrefix}"`);

    const files = fs.readdirSync(tempDir)
      .filter(f => f.startsWith('page-') && f.endsWith('.png'))
      .sort((a, b) => parseInt(a.match(/\d+/)?.[0] || '0') - parseInt(b.match(/\d+/)?.[0] || '0'));

    await updateOcrStatus(db, paperId, 40, `Conversion complete. Found ${files.length} pages. Starting AI extraction with local Ollama (${selectedModel})...`);

    for (let i = 0; i < files.length; i++) {
      const pageImagePath = path.join(tempDir, files[i]);
      const pageImageBase64 = fs.readFileSync(pageImagePath).toString('base64');
      const progress = Math.min(40 + Math.floor((i / files.length) * 55), 95);

      const prompt = `Analyze this exam paper page image.
Extract all questions visible on the page.
Return ONLY valid JSON.

Schema:
{
  "questions": [
    {
      "question_number": "string",
      "question_text": "string",
      "marks": number | null,
      "question_type": "MCQ" | "DESCRIPTIVE",
      "options": {
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      } | null,
      "has_diagram": boolean
    }
  ]
}

Rules:
- Return JSON only.
- No markdown.
- No code fences.
- No explanations.
- Extract marks if present.
- Detect MCQ options.
- Set has_diagram=true if the question references a circuit, graph, figure, image, diagram, waveform, table, or drawing.
- Preserve mathematical notation as text.
- Ignore page headers and footers.`;

      try {
        if (i > 0) {
          await updateOcrStatus(db, paperId, progress, `Waiting 5s cooldown before starting Page ${i + 1}/${files.length}...`);
          await new Promise(res => setTimeout(res, 5000));
        }

        await updateOcrStatus(db, paperId, progress, `Page ${i + 1}/${files.length}: Calling local Ollama vision model...`);
        const pageStart = Date.now();
        const ollamaResponse = await axios.post(OLLAMA_URL, {
          model: selectedModel,
          messages: [{ role: 'user', content: prompt, images: [pageImageBase64] }],
          stream: false,
          format: 'json',
          options: {
            temperature: 0,
            num_ctx: numCtx,
            num_predict: numPredict
          }
        });

        const pageDuration = ((Date.now() - pageStart) / 1000).toFixed(1);
        const rawOutput = ollamaResponse.data.message.content;

        // JSON repair and parsing
        let parsedQuestions: any[] = [];
        try {
          const repaired = tryRepairTruncatedJson(rawOutput.trim(), false);
          const parsed = relaxedJsonParse(repaired);
          
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.questions)) {
              parsedQuestions = parsed.questions;
            } else if (Array.isArray(parsed)) {
              parsedQuestions = parsed;
            } else if (parsed.questions && typeof parsed.questions === 'object') {
              parsedQuestions = [parsed.questions];
            } else {
              parsedQuestions = [parsed];
            }
          }
        } catch (jsonErr: any) {
          console.error("Failed to parse JSON response:", rawOutput);
          await updateOcrStatus(db, paperId, progress, `❌ Page ${i + 1}/${files.length} JSON parsing failed. Output sample: ${rawOutput.substring(0, 200)}`);
          throw new Error(`JSON Parse Error: ${jsonErr.message}. Raw output: ${rawOutput}`);
        }

        if (parsedQuestions.length > 0) {
          let insertCount = 0;
          for (const q of parsedQuestions) {
            // Validation & Fallbacks
            const questionNumber = String(q.question_number || '').trim();
            const questionText = String(q.question_text || '').trim();

            if (!questionNumber || !questionText) {
              console.warn("Skipping invalid question object due to missing fields:", q);
              continue;
            }

            const marks = typeof q.marks === 'number' ? Math.floor(q.marks) : null;
            const questionType = q.question_type === 'MCQ' ? 'MCQ' : 'DESCRIPTIVE';
            
            let optionsObj = null;
            if (questionType === 'MCQ' && q.options && typeof q.options === 'object') {
              optionsObj = q.options;
            }

            const hasDiagram = typeof q.has_diagram === 'boolean' ? q.has_diagram : false;

            await db.query(
              `INSERT INTO qbank_questions (source_id, question_number, question_text, marks, question_type, options, correct_answer, topic_name, status, metadata, has_diagram, page_number, source_pdf_page)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
              [
                paperId,
                questionNumber,
                questionText,
                marks,
                questionType,
                optionsObj ? JSON.stringify(optionsObj) : null,
                null, // correct_answer
                null, // topic_name
                'DRAFT',
                JSON.stringify({ raw_output: q }),
                hasDiagram,
                i + 1, // page_number (1-indexed)
                i + 1  // source_pdf_page (1-indexed)
              ]
            );
            insertCount++;
          }

          const successText = `Page ${i + 1}/${files.length}: Successfully extracted ${insertCount} questions in ${pageDuration}s.`;
          await updateOcrStatus(db, paperId, progress, `✅ ${successText}`);
        } else {
          await updateOcrStatus(db, paperId, progress, `⚠️ Page ${i + 1}/${files.length}: No valid questions found in JSON.`);
        }
      } catch (pageErr: any) {
        await updateOcrStatus(db, paperId, progress, `❌ Page ${i + 1}/${files.length} processing failed: ${pageErr.message}`);
        throw pageErr;
      }
    }
  } catch (err: any) {
    await updateOcrStatus(db, paperId, 100, `Fatal Error in OCR Worker: ${err.message}`);
    throw err;
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
  }
}

