// Script para limpar registros de analytics com readCount > sentCount
// Execute com: npx ts-node scripts/cleanup-analytics.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Buscando registros problemáticos...\n');
  
  // 1. Buscar registros onde readCount > sentCount
  const problematic = await prisma.contactAnalytics.findMany({
    where: {
      OR: [
        { sentCount: 0 },
        // Prisma doesn't support comparing columns directly, so we fetch all and filter
      ]
    }
  });
  
  const allRecords = await prisma.contactAnalytics.findMany();
  const toFix = allRecords.filter(r => r.readCount > r.sentCount);
  
  console.log(`📊 Total de registros: ${allRecords.length}`);
  console.log(`⚠️  Registros com readCount > sentCount: ${toFix.length}\n`);
  
  if (toFix.length > 0) {
    console.log('Registros problemáticos:');
    toFix.forEach(r => {
      console.log(`  - ${r.phone}: sent=${r.sentCount}, read=${r.readCount}`);
    });
    
    // 2. Opção 1: Deletar registros sem envios
    const deleted = await prisma.contactAnalytics.deleteMany({
      where: { sentCount: 0 }
    });
    console.log(`\n🗑️  Deletados ${deleted.count} registros com sentCount=0`);
    
    // 3. Opção 2: Ajustar readCount para não exceder sentCount
    for (const record of toFix) {
      if (record.sentCount > 0 && record.readCount > record.sentCount) {
        await prisma.contactAnalytics.update({
          where: { phone: record.phone },
          data: { readCount: record.sentCount }
        });
        console.log(`✅ Ajustado ${record.phone}: readCount ${record.readCount} -> ${record.sentCount}`);
      }
    }
  }
  
  console.log('\n✅ Limpeza concluída!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
