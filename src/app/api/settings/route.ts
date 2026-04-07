import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const settings = await prisma.settings.findUnique({
            where: { id: 'default' }
        });
        return NextResponse.json(settings || { defaultLink: '', defaultCTA: '' });
    } catch {
        return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { defaultLink, defaultCTA } = body;

        const settings = await prisma.settings.upsert({
            where: { id: 'default' },
            update: { defaultLink, defaultCTA },
            create: { id: 'default', defaultLink, defaultCTA }
        });

        return NextResponse.json(settings);
    } catch {
        return NextResponse.json({ error: 'Error updating settings' }, { status: 500 });
    }
}
