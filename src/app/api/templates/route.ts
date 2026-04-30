import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const templates = await prisma.template.findMany({
            where: {
                OR: [
                    { category: null },
                    { category: { not: 'SYSTEM' } }
                ]
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`[API] GET /api/templates - Found ${templates.length} templates. Latest: ${templates[0]?.title || 'None'}`);

        return NextResponse.json(templates, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error('[templates/route] Error fetching templates:', error);
        return NextResponse.json({ error: 'Error fetching templates' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, content, media, category } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const template = await prisma.template.create({
            data: {
                title,
                content,
                category,
                media: media ? JSON.stringify(media) : undefined,
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error('[templates/route] Error creating template:', error);
        return NextResponse.json({ error: 'Error creating template' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        const body = await request.json();
        const { title, content, media, category } = body;

        if (!id || !title || !content) {
            return NextResponse.json({ error: 'ID, Title and content are required' }, { status: 400 });
        }

        const template = await prisma.template.update({
            where: { id },
            data: {
                title,
                content,
                category,
                media: media ? JSON.stringify(media) : media === null ? null : undefined, // null to remove, undefined to keep
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        console.error('[templates/route] Error updating template:', error);
        return NextResponse.json({ error: 'Error updating template' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    try {
        await prisma.template.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        console.error('[templates/route] Error deleting template:', error);
        return NextResponse.json({ error: 'Error deleting template' }, { status: 500 });
    }
}
