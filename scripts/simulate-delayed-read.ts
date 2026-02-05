
import { prisma } from '@/lib/db';

const targetPhone = process.argv[2];
const delayMs = parseInt(process.argv[3] || '5000', 10);

if (!targetPhone) {
  console.error('Usage: npx tsx scripts/simulate-delayed-read.ts <phone> <delayMs>');
  process.exit(1);
}

console.log(`Waiting ${delayMs}ms before simulating read for ${targetPhone}...`);

setTimeout(async () => {
  try {
    console.log(`Simulating READ update for ${targetPhone}...`);
    // Ensure analytics record exists
    await prisma.contactAnalytics.upsert({
        where: { phone: targetPhone },
        create: { phone: targetPhone, sentCount: 1, readCount: 0, lastSentAt: new Date() },
        update: {}
    });

    const result = await prisma.contactAnalytics.update({
      where: { phone: targetPhone },
      data: {
        readCount: { increment: 1 },
        lastReadAt: new Date(),
        // Increment sent count if 0 to avoid division by zero or 100% logic glitches if needed
        // but for now just readCount is enough to toggle status if sentCount > 0
      }
    });
    console.log('Update success:', result);
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}, delayMs);
