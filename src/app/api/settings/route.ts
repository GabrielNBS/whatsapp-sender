import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // @ts-ignore: Prisma client might not be regenerated yet due to file lock
        const settings = await prisma.settings.findUnique({
            where: { id: 'default' }
        });
        return NextResponse.json(settings || { defaultLink: '', defaultCTA: '' });
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { defaultLink, defaultCTA } = body;

        // @ts-ignore: Prisma client might not be regenerated yet due to file lock
        const settings = await prisma.settings.upsert({
            where: { id: 'default' },
            update: { defaultLink, defaultCTA },
            create: { id: 'default', defaultLink, defaultCTA }
        });

        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating settings' }, { status: 500 });
    }
}
