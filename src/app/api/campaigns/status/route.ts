import { NextRequest, NextResponse } from 'next/server';
import { getQueueService } from '@/lib/QueueService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const logOffset = parseInt(searchParams.get('logOffset') || '0', 10);
    
    const status = await getQueueService().getStatus(logOffset);
    return NextResponse.json(status);
  } catch (error) {
    console.error('[API] Error fetching queue status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
