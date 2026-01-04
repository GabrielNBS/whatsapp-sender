import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';

export async function POST() {
  await whatsappService.logout();
  return NextResponse.json({ success: true, message: 'Logged out' });
}
