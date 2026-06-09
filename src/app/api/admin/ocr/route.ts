import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { paperId } = await req.json();
    if (!paperId) return NextResponse.json({ error: 'Paper ID is required' }, { status: 400 });

    const pool = getDbPool();

    // Check if already processing
    const { rows } = await pool.query(
      `SELECT approval_status FROM papers_archive WHERE source_id = $1`,
      [paperId]
    );

    if (rows.length === 0) return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    if (rows[0].approval_status === 'OCR_QUEUED' || rows[0].approval_status === 'OCR_PROCESSING') {
      return NextResponse.json({ error: 'Paper is already being processed' }, { status: 400 });
    }

    // Update status to QUEUED for the local worker to pick up
    await pool.query(
      `UPDATE papers_archive SET approval_status = 'OCR_QUEUED' WHERE source_id = $1`,
      [paperId]
    );

    return NextResponse.json({ success: true, message: 'Paper queued for local OCR processing' });
  } catch (error: any) {
    console.error('OCR Queue Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
