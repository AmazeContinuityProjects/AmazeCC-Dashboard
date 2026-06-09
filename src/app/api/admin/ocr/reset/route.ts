import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paperId } = await req.json();
    if (!paperId) return NextResponse.json({ error: 'Paper ID is required' }, { status: 400 });

    const pool = getDbPool();

    // Reset status to PENDING so it can be "Started" again or manually reviewed
    await pool.query(
      `UPDATE papers_archive SET approval_status = 'PENDING' WHERE source_id = $1`,
      [paperId]
    );

    return NextResponse.json({ success: true, message: 'Paper status reset to PENDING' });
  } catch (error: any) {
    console.error('OCR Reset Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
