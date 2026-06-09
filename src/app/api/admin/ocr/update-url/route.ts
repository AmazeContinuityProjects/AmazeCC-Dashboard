import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paperId, fileUrl } = await req.json();
    if (!paperId || !fileUrl) {
      return NextResponse.json({ error: 'Paper ID and File URL are required' }, { status: 400 });
    }

    const pool = getDbPool();

    await pool.query(
      `UPDATE papers_archive SET file_url = $1, approval_status = 'PENDING' WHERE source_id = $2`,
      [fileUrl, paperId]
    );

    return NextResponse.json({ success: true, message: 'URL updated and status reset to PENDING' });
  } catch (error: any) {
    console.error('URL Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
