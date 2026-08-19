import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ContactService } from "@/server/services/ContactService";
import { createContactSchema, updateContactSchema } from "@/server/validators/contacts";
import { getCurrentWorkspaceId } from '@/server/workspace';
import { ValidationError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const snapshot = await ContactService.getSnapshot(getCurrentWorkspaceId());
  return NextResponse.json(snapshot);
}, { routeName: "/api/contacts (GET)", requireAuth: true });

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const validation = createContactSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError("Contato invalido.", validation.error.flatten().fieldErrors);
  }

  const snapshot = await ContactService.createContact(validation.data, getCurrentWorkspaceId());
  return NextResponse.json(snapshot, { status: 201 });
}, { routeName: "/api/contacts (POST)", requireAuth: true });

export const PATCH = apiHandler(async (req: NextRequest) => {
  const contactId = req.nextUrl.searchParams.get('id');
  if (!contactId) throw new ValidationError('ID do contato é obrigatório.');
  const body = await req.json().catch(() => ({}));
  const validation = updateContactSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Dados do contato inválidos.', validation.error.flatten().fieldErrors);
  }
  return NextResponse.json(await ContactService.updateContact(contactId, validation.data, getCurrentWorkspaceId()));
}, { routeName: "/api/contacts (PATCH)", requireAuth: true });

export const DELETE = apiHandler(async (req: NextRequest) => {
  const contactId = req.nextUrl.searchParams.get('id');
  const snapshot = contactId
    ? await ContactService.deleteContact(contactId, getCurrentWorkspaceId())
    : await ContactService.clearContacts(getCurrentWorkspaceId());
  return NextResponse.json(snapshot);
}, { routeName: "/api/contacts (DELETE)", requireAuth: true });
