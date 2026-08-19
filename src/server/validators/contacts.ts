import { z } from "zod";
import { DEFAULT_GROUP_ID } from "@/constants/contacts";

export const contactGroupSnapshotSchema = z.object({
  id: z.string().min(1, "ID do grupo e obrigatorio").trim(),
  name: z.string().min(1, "Nome do grupo e obrigatorio").max(30).trim(),
  description: z.string().max(120).optional().nullable(),
});

export const contactSnapshotItemSchema = z.object({
  id: z.string().min(1, "ID do contato e obrigatorio").trim(),
  name: z.string().min(1, "Nome do contato e obrigatorio").max(100).trim(),
  number: z.string().min(10, "Numero invalido").max(15).trim(),
  groupIds: z.array(z.string().min(1).trim()).default([DEFAULT_GROUP_ID]),
  consentStatus: z.enum(['UNKNOWN', 'OPTED_IN', 'OPTED_OUT']).optional().default('UNKNOWN'),
});

export const createContactSchema = contactSnapshotItemSchema;

export const updateContactGroupsSchema = z.object({
  groupIds: z.array(z.string().min(1).trim()).min(1),
}).strict();

export const updateContactSchema = z.object({
  groupIds: z.array(z.string().min(1).trim()).min(1).optional(),
  consentStatus: z.enum(['UNKNOWN', 'OPTED_IN', 'OPTED_OUT']).optional(),
}).strict().refine((data) => data.groupIds !== undefined || data.consentStatus !== undefined, {
  message: 'Informe os grupos ou o status de consentimento.',
});

export const createContactGroupSchema = contactGroupSnapshotSchema;

export const importContactsSchema = z.object({
  group: contactGroupSnapshotSchema.optional(),
  contacts: z.array(contactSnapshotItemSchema).min(1).max(5000),
}).strict();

export type ContactInput = z.infer<typeof contactSnapshotItemSchema>;
export type ContactGroupInput = z.infer<typeof contactGroupSnapshotSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
