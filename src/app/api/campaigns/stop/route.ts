import { NextResponse } from 'next/server';
import { getQueueService } from '@/lib/QueueService';

export async function POST() {
  try {
    getQueueService().stopCampaign();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error stopping campaign:', error);
    return NextResponse.json({ error: 'Failed to stop campaign' }, { status: 500 });
  }
}
