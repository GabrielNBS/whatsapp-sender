import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { ValidationError } from '@/lib/api-errors';
import { ContactService } from '@/server/services/ContactService';
import { createContactGroupSchema } from '@/server/validators/contacts';

export const POST = apiHandler(async (req: NextRequest) => {
  const validation = createContactGroupSchema.safeParse(await req.json().catch(() => ({})));
  if (!validation.success) {
    throw new ValidationError('Grupo inválido.', validation.error.flatten().fieldErrors);
  }
  return NextResponse.json(await ContactService.createGroup(validation.data), { status: 201 });
}, { routeName: '/api/contact-groups (POST)' });

export const DELETE = apiHandler(async (req: NextRequest) => {
  const groupId = req.nextUrl.searchParams.get('id');
  if (!groupId) throw new ValidationError('ID do grupo é obrigatório.');
  return NextResponse.json(await ContactService.deleteGroup(groupId));
}, { routeName: '/api/contact-groups (DELETE)' });
