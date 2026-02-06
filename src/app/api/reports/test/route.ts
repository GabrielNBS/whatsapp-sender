/**
 * API Route: /api/reports/test
 * 
 * Test endpoint to manually send a test report
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST - Send test report to all active recipients
export async function POST() {
  try {
    // Get all active recipients
    const recipients = await prisma.reportRecipient.findMany({
      where: { isActive: true },
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum gestor ativo cadastrado', recipients: [] },
        { status: 400 }
      );
    }

    console.log('[Test Report] Found', recipients.length, 'active recipients');

    // Create test report message
    const testMessage = `
📊 *TESTE DE RELATÓRIO*
━━━━━━━━━━━━━━━━━━━

✅ Sistema funcionando!
📱 Este é um teste do sistema de relatórios automáticos.

⏰ Horário: ${new Date().toLocaleString('pt-BR')}
👤 Destinatários ativos: ${recipients.length}

━━━━━━━━━━━━━━━━━━━
_Se você recebeu esta mensagem, o sistema está configurado corretamente._
`.trim();

    const results = [];

    for (const recipient of recipients) {
      console.log(`[Test Report] Sending to ${recipient.name} (${recipient.phone})`);
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: recipient.phone,
            message: testMessage,
          }),
        });

        const data = await response.json();
        
        results.push({
          name: recipient.name,
          phone: recipient.phone,
          success: response.ok,
          status: response.status,
          response: data,
        });

        console.log(`[Test Report] Result for ${recipient.name}:`, response.ok ? '✅ Success' : '❌ Failed');
        
        // Small delay between sends
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`[Test Report] Error sending to ${recipient.name}:`, error);
        results.push({
          name: recipient.name,
          phone: recipient.phone,
          success: false,
          error: String(error),
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      message: `Teste enviado para ${successCount}/${recipients.length} gestores`,
      results,
    });
  } catch (error) {
    console.error('[Test Report] Error:', error);
    return NextResponse.json(
      { error: 'Falha ao enviar teste', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - List active recipients for debugging
export async function GET() {
  try {
    const recipients = await prisma.reportRecipient.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      count: recipients.length,
      recipients,
    });
  } catch (error) {
    console.error('[Test Report] Error listing:', error);
    return NextResponse.json(
      { error: 'Falha ao listar gestores', details: String(error) },
      { status: 500 }
    );
  }
}
