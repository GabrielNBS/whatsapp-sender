import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { ValidationError } from '@/lib/api-errors';
import { ContactService } from '@/server/services/ContactService';
import { importContactsSchema } from '@/server/validators/contacts';
import { getCurrentWorkspaceId } from '@/server/workspace';

export const POST = apiHandler(async (req: NextRequest) => {
  const validation = importContactsSchema.safeParse(await req.json().catch(() => ({})));
  if (!validation.success) {
    throw new ValidationError('Importação de contatos inválida.', validation.error.flatten().fieldErrors);
  }
  return NextResponse.json(await ContactService.importContacts(validation.data, getCurrentWorkspaceId()), { status: 201 });
}, { routeName: '/api/contacts/import (POST)' });
