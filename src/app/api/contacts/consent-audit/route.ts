import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { ValidationError } from '@/lib/api-errors';
import { getContactConsentService } from '@/server/services/ContactConsentService';
import { consentAuditQuerySchema } from '@/server/validators/consent-audit';
import { getCurrentWorkspaceId } from '@/server/workspace';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (req: NextRequest) => {
  const parsed = consentAuditQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    throw new ValidationError('Filtros de auditoria inválidos.', parsed.error.flatten().fieldErrors);
  }

  return NextResponse.json(await getContactConsentService().listAudit(parsed.data, getCurrentWorkspaceId()));
}, { routeName: '/api/contacts/consent-audit (GET)', requireAuth: true });
