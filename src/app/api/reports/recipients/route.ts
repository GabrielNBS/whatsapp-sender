/**
 * API Route: /api/reports/recipients
 * 
 * Manage report recipients (gestores)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReportService } from '@/lib/ReportService';

// GET - List all recipients
export async function GET() {
  try {
    // Ensure default config exists
    const reportService = getReportService();
    await reportService.ensureDefaultConfig();

    const recipients = await prisma.reportRecipient.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(recipients);
  } catch (error) {
    console.error('[API] Error fetching recipients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipients' },
      { status: 500 }
    );
  }
}

// POST - Add new recipient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Normalize phone number (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');

    // Ensure default config exists
    const reportService = getReportService();
    await reportService.ensureDefaultConfig();

    const recipient = await prisma.reportRecipient.create({
      data: {
        name,
        phone: normalizedPhone,
        isActive: true,
        configId: 'default',
      },
    });

    return NextResponse.json(recipient, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating recipient:', error);
    return NextResponse.json(
      { error: 'Failed to create recipient' },
      { status: 500 }
    );
  }
}

// DELETE - Remove recipient (handled by dynamic route)
