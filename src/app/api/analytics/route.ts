import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const analytics = await prisma.contactAnalytics.findMany();
        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Failed to fetch analytics', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
