import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // @ts-ignore
        const snippets = await prisma.snippet.findMany({
            orderBy: { trigger: 'asc' }
        });
        return NextResponse.json(snippets);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching snippets' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { trigger, content } = body;

        let cleanTrigger = trigger.trim();
        if (!cleanTrigger.startsWith('/')) {
            cleanTrigger = '/' + cleanTrigger;
        }

        if (!cleanTrigger || !content) {
            return NextResponse.json({ error: 'Trigger and content required' }, { status: 400 });
        }

        // @ts-ignore
        const snippet = await prisma.snippet.create({
            data: { trigger: cleanTrigger, content }
        });

        return NextResponse.json(snippet);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating snippet' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    try {
        // @ts-ignore
        await prisma.snippet.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting snippet' }, { status: 500 });
    }
}
