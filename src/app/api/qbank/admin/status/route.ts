import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paperId, status } = await req.json();
    if (!paperId || !status) {
      return NextResponse.json({ error: 'Paper ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'OCR_QUEUED', 'OCR_PROCESSING', 'PENDING_Q_APPROVAL', 'APPROVED', 'REJECTED', 'OCR_FAILED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const pool = getDbPool();

    await pool.query(
      `UPDATE papers_archive SET approval_status = $1 WHERE source_id = $2`,
      [status, paperId]
    );

    return NextResponse.json({ success: true, message: `Status updated to ${status}` });
  } catch (error: any) {
    console.error('Status Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
