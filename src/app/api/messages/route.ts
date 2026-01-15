import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { number, message, media, name } = body;
    
    if (!number || (!message && !media)) {
      return NextResponse.json({ error: 'Número ou conteúdo ausente' }, { status: 400 });
    }

    const response = await whatsappService.sendMessage(number, message || '', media, { fallbackName: name });
    
    if (!response.success) {
        return NextResponse.json({ error: 'Falha ao enviar mensagem pelo WhatsApp' }, { status: 422 });
    }

    const stats = whatsappService.getStatus().stats;

    return NextResponse.json({ success: true, response, stats });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao enviar';
    console.error('Send Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
