
import { prisma } from '@/lib/db';

async function seed() {
    console.log('Seeding test contact...');
    try {
        const phone = '11999999999';
        // Create or update contact
        const contact = await prisma.contact.upsert({
            where: { number: phone },
            update: {},
            create: {
                name: 'Test User',
                number: phone,
                groupIds: ['default']
            }
        });
        
        // Ensure initial analytics state
        await prisma.contactAnalytics.upsert({
            where: { phone },
            create: { phone, sentCount: 1, readCount: 0, lastSentAt: new Date() },
            update: { sentCount: 1, readCount: 0 } // Reset read count for testing
        });

        console.log('Contact created/reset:', contact);
    } catch (e) {
        console.error('Seed failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
