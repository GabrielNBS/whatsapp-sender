import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';

// GET: Fetch active schedules grouped by batchId
export async function GET() {
    try {
        // 1. Find batchIDs that have at least one PENDING message
        const pendingBatches = await prisma.scheduledMessage.findMany({
            where: {
                OR: [
                    { status: 'PENDING' },
                    { scheduledFor: { gte: new Date(Date.now() - 10 * 60 * 1000) } } // Fetch recent batches (last 10m) to detect completion/failure
                ]
            },
            select: { batchId: true },
            distinct: ['batchId']
        });

        const activeBatchIds = pendingBatches.map(b => b.batchId).filter(Boolean) as string[];

        // If no pending batches, return empty (or checks for recent failed/sent?)
        // The user wants to see "Completed" logs.
        // We might want to keep fetching batches for a short while after completion? 
        // For now, let's focus on Active (Pending > 0). 
        // Completed items will be handled by the client side "Event" or we rely on the log history.
        
        if (activeBatchIds.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Fetch ALL messages for these batches (to calculate progress)
        const messages = await prisma.scheduledMessage.findMany({
            where: {
                batchId: {
                    in: activeBatchIds
                }
            },
            include: {
                template: true
            },
            orderBy: {
                scheduledFor: 'asc'
            }
        });

        // 3. Group and Calculate Stats
        const batches: Record<string, any> = {};

        for (const msg of messages) {
            const batchId = msg.batchId || 'unknown';
            
            if (!batches[batchId]) {
                batches[batchId] = {
                    id: batchId,
                    batchId: batchId,
                    batchName: msg.batchName || 'Sem Nome',
                    scheduledFor: msg.scheduledFor,
                    count: 0, // Pending count
                    total: 0,
                    sent: 0,
                    failed: 0,
                    contacts: [],
                    sampleTemplate: msg.template?.content
                };
            }

            batches[batchId].total++;
            
            if (msg.status === 'PENDING') batches[batchId].count++;
            else if (msg.status === 'SENT') batches[batchId].sent++;
            else if (msg.status === 'FAILED') batches[batchId].failed++;

            batches[batchId].contacts.push({
                id: msg.id,
                name: msg.contactName,
                phone: msg.contactPhone,
                status: msg.status
            });
        }

        return NextResponse.json(Object.values(batches));

    } catch (error) {
        console.error('Error fetching schedules:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new schedule
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { recipients, message, media, scheduledFor, batchName, templateId: providedTemplateId } = body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json({ error: 'Recipients list is required' }, { status: 400 });
        }
        if (!scheduledFor) {
            return NextResponse.json({ error: 'Scheduled date is required' }, { status: 400 });
        }

        const scheduledDate = new Date(scheduledFor);
        if (isNaN(scheduledDate.getTime())) {
            return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
        }

        let templateId = providedTemplateId;

        // If no template provided, create a one-off template (System/Hidden ideally, but for now Standard)
        if (!templateId) {
             const template = await prisma.template.create({
                data: {
                    title: batchName || `Batch ${new Date().toISOString()}`,
                    content: message || '',
                    media: media ? JSON.stringify(media) : null
                }
            });
            templateId = template.id;
        }

        const batchId = nanoid();

        // Create ScheduledMessages
        // SQLite + Prisma createMany issues: fallback to transaction
        await prisma.$transaction(
            recipients.map((r: any) => 
                prisma.scheduledMessage.create({
                    data: {
                        scheduledFor: scheduledDate,
                        status: 'PENDING',
                        contactName: r.name,
                        contactPhone: r.number || r.phone,
                        templateId: templateId,
                        batchId: batchId,
                        batchName: batchName
                    }
                })
            )
        );

        return NextResponse.json({ success: true, batchId, count: recipients.length });

    } catch (error) {
        console.error('Error creating schedule:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Cancel a batch
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const batchId = searchParams.get('batchId');

        if (!batchId) {
            return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
        }

        const result = await prisma.scheduledMessage.deleteMany({
            where: {
                batchId: batchId,
                status: 'PENDING'
            }
        });

        return NextResponse.json({ success: true, deletedCount: result.count });

    } catch (error) {
        console.error('Error cancelling schedule:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { batchId, newDate } = body;

        if (!batchId || !newDate) {
            return NextResponse.json({ error: 'BatchId and newDate are required' }, { status: 400 });
        }

        await prisma.scheduledMessage.updateMany({
            where: {
                batchId: batchId,
                status: 'PENDING'
            },
            data: {
                scheduledFor: new Date(newDate)
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error rescheduling:', error);
        return NextResponse.json({ error: 'Failed to reschedule' }, { status: 500 });
    }
}
