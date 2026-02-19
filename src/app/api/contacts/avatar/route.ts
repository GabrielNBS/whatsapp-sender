import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const avatarUrl = await whatsappService.getProfilePicUrl(phone);

    return NextResponse.json({ url: avatarUrl });
  } catch (error) {
    console.error('Error fetching avatar:', error);
    return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 });
  }
}
