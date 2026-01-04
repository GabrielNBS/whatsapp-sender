import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { number, message, media } = body;
    
    if (!number || (!message && !media)) {
      return NextResponse.json({ error: 'Número ou conteúdo ausente' }, { status: 400 });
    }

    const response = await whatsappService.sendMessage(number, message || '', media);
    const stats = whatsappService.getStatus().stats;

    return NextResponse.json({ success: true, response, stats });
  } catch (error: any) {
    console.error('Send Error:', error);
    return NextResponse.json({ error: error.message || 'Falha ao enviar' }, { status: 500 });
  }
}
