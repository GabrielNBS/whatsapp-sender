import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const templates = await prisma.template.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching templates' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, content, media } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const template = await prisma.template.create({
            data: {
                title,
                content,
                media: media ? JSON.stringify(media) : undefined,
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating template' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, title, content, media } = body;

        if (!id || !title || !content) {
            return NextResponse.json({ error: 'ID, Title and content are required' }, { status: 400 });
        }

        const template = await prisma.template.update({
            where: { id },
            data: {
                title,
                content,
                media: media ? JSON.stringify(media) : media === null ? null : undefined, // null to remove, undefined to keep
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating template' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    // Basic delete via query param ID or we can make a dynamic route [id]
    // For simplicity, let's look for ?id=...
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    try {
        await prisma.template.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting template' }, { status: 500 });
    }
}
