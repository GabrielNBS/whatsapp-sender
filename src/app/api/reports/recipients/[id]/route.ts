/**
 * API Route: /api/reports/recipients/[id]
 * 
 * Manage individual report recipient
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Update recipient (toggle active, update name/phone)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const recipient = await prisma.reportRecipient.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(recipient);
  } catch (error) {
    console.error('[API] Error updating recipient:', error);
    return NextResponse.json(
      { error: 'Failed to update recipient' },
      { status: 500 }
    );
  }
}

// DELETE - Remove recipient
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.reportRecipient.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting recipient:', error);
    return NextResponse.json(
      { error: 'Failed to delete recipient' },
      { status: 500 }
    );
  }
}
