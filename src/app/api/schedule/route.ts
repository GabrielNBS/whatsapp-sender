import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const schedules = await prisma.scheduledMessage.findMany({
            include: { template: true },
            orderBy: { scheduledFor: 'asc' },
        });
        return NextResponse.json(schedules);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching schedules' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { recipients, contactName, contactPhone, templateId, scheduledFor } = body;

        if (!templateId || !scheduledFor) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Normalize recipients
        let targetRecipients = [];
        if (recipients && Array.isArray(recipients)) {
            targetRecipients = recipients;
        } else if (contactName && contactPhone) {
            targetRecipients = [{ name: contactName, phone: contactPhone }];
        }

        if (targetRecipients.length === 0) {
            return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
        }

        const scheduledDate = new Date(scheduledFor);

        // Transactional create
        // Prisma doesn't support createMany with relations well in all DBs or returns created items, 
        // but for SQLite createMany is fine but doesn't return items. 
        // Let's use a transaction of creates to be safe and simple or just createMany.
        // For simplicity and to allow future expansion (like individual contact relation), let's loop. 
        // Ideally define a loop of promises.

        await prisma.$transaction(
            targetRecipients.map((r: any) =>
                prisma.scheduledMessage.create({
                    data: {
                        contactName: r.name,
                        contactPhone: r.phone,
                        templateId,
                        scheduledFor: scheduledDate,
                        status: 'PENDING',
                    }
                })
            )
        );

        return NextResponse.json({ success: true, count: targetRecipients.length });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error creating schedule' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await prisma.scheduledMessage.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting schedule' }, { status: 500 });
    }
}
