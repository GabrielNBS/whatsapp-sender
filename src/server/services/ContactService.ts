import { prisma } from "@/lib/db";
import { DEFAULT_GROUP_ID, DEFAULT_GROUP_NAME } from "@/constants/contacts";
import { normalizePhone } from "@/services/contacts/normalizePhone";
import { normalizeGroupIds } from '@/services/contacts/normalizeGroupIds';
import type { ContactCommand, ContactGroupCommand, UpdateContactCommand } from '@/domain/contracts';
import type { ContactConsentStatus } from "@/lib/types";
import { getContactConsentService } from "@/server/services/ContactConsentService";
import { getWorkspaceScopedId } from "../workspace";

function toContactSnapshot(contact: {
  id: string;
  name: string;
  phone: string;
  consentStatus: string;
  consentAt: Date | null;
  optedOutAt: Date | null;
  groupMemberships: Array<{ groupId: string }>;
}) {
  return {
    id: contact.id,
    name: contact.name,
    number: contact.phone,
    consentStatus: contact.consentStatus as ContactConsentStatus,
    consentAt: contact.consentAt?.toISOString() ?? null,
    optedOutAt: contact.optedOutAt?.toISOString() ?? null,
    groupIds: normalizeGroupIds(contact.groupMemberships.map((membership) => membership.groupId)),
  };
}

export const ContactService = {
  async getSnapshot(workspaceId: string) {
    await this.ensureLocalDefaults(workspaceId);

    const [groups, contacts] = await Promise.all([
      prisma.contactGroup.findMany({
        where: { workspaceId },
        orderBy: [{ id: "asc" }],
      }),
      prisma.contact.findMany({
        where: { workspaceId },
        include: {
          groupMemberships: {
            select: { groupId: true },
          },
        },
        orderBy: [{ name: "asc" }],
      }),
    ]);

    return {
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description ?? undefined,
      })),
      contacts: contacts.map(toContactSnapshot),
    };
  },

  async clearContacts(workspaceId: string) {
    await this.ensureLocalDefaults(workspaceId);
    await prisma.contact.deleteMany({ where: { workspaceId } });
    return { success: true };
  },

  async createContact(data: ContactCommand, workspaceId: string) {
    await this.ensureLocalDefaults(workspaceId);
    const phone = normalizePhone(data.number);
    const groupIds = normalizeGroupIds(data.groupIds);
    const validGroups = await prisma.contactGroup.count({
      where: { workspaceId, id: { in: groupIds } },
    });
    if (validGroups !== groupIds.length) throw new Error('Um ou mais grupos não pertencem ao workspace atual.');

    const contact = await prisma.contact.create({
      data: {
        id: data.id,
        workspaceId,
        name: data.name,
        phone,
        consentStatus: 'UNKNOWN',
        groupMemberships: { create: groupIds.map((groupId) => ({ groupId })) },
      },
      include: { groupMemberships: { select: { groupId: true } } },
    });
    if (data.consentStatus && data.consentStatus !== 'UNKNOWN') {
      await getContactConsentService().setStatus(contact.id, data.consentStatus, { source: 'MANUAL' }, workspaceId);
    }
    const currentContact = await prisma.contact.findFirst({
      where: { id: contact.id, workspaceId },
      include: { groupMemberships: { select: { groupId: true } } },
    });
    if (!currentContact) throw new Error('Contato não encontrado no workspace atual.');
    return { contact: toContactSnapshot(currentContact) };
  },

  async updateContact(contactId: string, data: UpdateContactCommand, workspaceId: string) {
    await this.ensureLocalDefaults(workspaceId);
    const existing = await prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
      select: { id: true },
    });
    if (!existing) throw new Error('Contato não encontrado no workspace atual.');

    if (data.groupIds) {
      const groupIds = normalizeGroupIds(data.groupIds);
      const validGroups = await prisma.contactGroup.count({ where: { workspaceId, id: { in: groupIds } } });
      if (validGroups !== groupIds.length) throw new Error('Um ou mais grupos não pertencem ao workspace atual.');
      await prisma.$transaction(async (tx) => {
        await tx.contactGroupMembership.deleteMany({ where: { contactId } });
        await tx.contactGroupMembership.createMany({ data: groupIds.map((groupId) => ({ contactId, groupId })) });
      });
    }

    if (data.consentStatus) {
      await getContactConsentService().setStatus(contactId, data.consentStatus, { source: 'MANUAL' }, workspaceId);
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
      include: { groupMemberships: { select: { groupId: true } } },
    });
    if (!contact) throw new Error('Contato não encontrado no workspace atual.');
    return { contact: toContactSnapshot(contact) };
  },

  async updateContactGroups(contactId: string, groupIdsInput: string[], workspaceId: string) {
    await this.ensureLocalDefaults(workspaceId);
    const groupIds = normalizeGroupIds(groupIdsInput);
    await prisma.$transaction(async (tx) => {
      const [contact, validGroups] = await Promise.all([
        tx.contact.findFirst({ where: { id: contactId, workspaceId }, select: { id: true } }),
        tx.contactGroup.count({ where: { workspaceId, id: { in: groupIds } } }),
      ]);
      if (!contact) throw new Error('Contato não encontrado no workspace atual.');
      if (validGroups !== groupIds.length) throw new Error('Um ou mais grupos não pertencem ao workspace atual.');
      await tx.contactGroupMembership.deleteMany({ where: { contactId } });
      await tx.contactGroupMembership.createMany({
        data: groupIds.map((groupId) => ({ contactId, groupId })),
      });
    });
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
      include: { groupMemberships: { select: { groupId: true } } },
    });
    if (!contact) throw new Error('Contato não encontrado no workspace atual.');
    return { contact: toContactSnapshot(contact) };
  },

  async deleteContact(contactId: string, workspaceId: string) {
    const deleted = await prisma.contact.deleteMany({ where: { id: contactId, workspaceId } });
    if (deleted.count === 0) throw new Error('Contato não encontrado no workspace atual.');
    return { deletedContactId: contactId };
  },

  async createGroup(data: ContactGroupCommand, workspaceId: string) {
    await this.ensureLocalDefaults(workspaceId);
    const group = await prisma.contactGroup.create({
      data: { id: data.id, workspaceId, name: data.name, description: data.description },
    });
    return { group: { id: group.id, name: group.name, description: group.description ?? undefined } };
  },

  async deleteGroup(groupId: string, workspaceId: string) {
    const defaultGroupId = getWorkspaceScopedId(workspaceId, DEFAULT_GROUP_ID);
    if (groupId === defaultGroupId) throw new Error('O grupo padrão não pode ser removido.');

    let affectedContactIds: string[] = [];
    await prisma.$transaction(async (tx) => {
      const affectedContacts = await tx.contact.findMany({
        where: { workspaceId, groupMemberships: { some: { groupId } } },
        select: { id: true, _count: { select: { groupMemberships: true } } },
      });
      affectedContactIds = affectedContacts.map((contact) => contact.id);
      const deleted = await tx.contactGroup.deleteMany({ where: { id: groupId, workspaceId } });
      if (deleted.count === 0) throw new Error('Grupo não encontrado no workspace atual.');
      const contactsWithoutGroups = affectedContacts.filter((contact) => contact._count.groupMemberships === 1);
      if (contactsWithoutGroups.length > 0) {
        await tx.contactGroupMembership.createMany({
          data: contactsWithoutGroups.map((contact) => ({ contactId: contact.id, groupId: defaultGroupId })),
        });
      }
    });
    const affectedContacts = affectedContactIds.length === 0 ? [] : await prisma.contact.findMany({
      where: { workspaceId, id: { in: affectedContactIds } },
      include: { groupMemberships: { select: { groupId: true } } },
    });
    return {
      deletedGroupId: groupId,
      contacts: affectedContacts.map(toContactSnapshot),
    };
  },

  async importContacts(data: { group?: ContactGroupCommand; contacts: ContactCommand[] }, workspaceId: string) {
    await this.ensureLocalDefaults(workspaceId);
    await prisma.$transaction(async (tx) => {
      if (data.group) {
        await tx.contactGroup.create({
          data: { id: data.group.id, workspaceId, name: data.group.name, description: data.group.description },
        });
      }
      const groupIds = Array.from(new Set(data.contacts.flatMap((contact) => normalizeGroupIds(contact.groupIds))));
      const validGroups = await tx.contactGroup.count({ where: { workspaceId, id: { in: groupIds } } });
      if (validGroups !== groupIds.length) throw new Error('Um ou mais grupos não pertencem ao workspace atual.');
      await tx.contact.createMany({
        data: data.contacts.map((contact) => ({
          id: contact.id,
          workspaceId,
          name: contact.name,
          phone: normalizePhone(contact.number),
          consentStatus: 'UNKNOWN',
        })),
      });
      await tx.contactGroupMembership.createMany({
        data: data.contacts.flatMap((contact) =>
          normalizeGroupIds(contact.groupIds).map((groupId) => ({ contactId: contact.id, groupId })),
        ),
      });
    });
    const contactIds = data.contacts.map((contact) => contact.id);
    for (const importedContact of data.contacts) {
      if (importedContact.consentStatus && importedContact.consentStatus !== 'UNKNOWN') {
        await getContactConsentService().setStatus(importedContact.id, importedContact.consentStatus, { source: 'IMPORT' }, workspaceId);
      }
    }
    const currentContacts = contactIds.length === 0 ? [] : await prisma.contact.findMany({
      where: { workspaceId, id: { in: contactIds } },
      include: { groupMemberships: { select: { groupId: true } } },
    });
    return {
      group: data.group ? {
        id: data.group.id,
        name: data.group.name,
        description: data.group.description ?? undefined,
      } : undefined,
      contacts: currentContacts.map(toContactSnapshot),
    };
  },

  async ensureLocalDefaults(workspaceId: string) {
    await prisma.workspace.upsert({
      where: { id: workspaceId },
      update: {},
      create: {
        id: workspaceId,
        name: "Local Workspace",
      },
    });

    await prisma.plan.upsert({
      where: { id: "local-free" },
      update: {},
      create: {
        id: "local-free",
        name: "Local Free",
        monthlyMessageLimit: 5000,
        activeCampaignLimit: 1,
      },
    });

    await prisma.subscription.upsert({
      where: { workspaceId },
      update: {},
      create: {
        id: getWorkspaceScopedId(workspaceId, "local-subscription"),
        workspaceId,
        planId: "local-free",
        status: "ACTIVE",
      },
    });

    await prisma.contactGroup.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name: DEFAULT_GROUP_NAME,
        },
      },
      update: {
        id: getWorkspaceScopedId(workspaceId, DEFAULT_GROUP_ID),
        description: "Lista Padrao",
      },
      create: {
        id: getWorkspaceScopedId(workspaceId, DEFAULT_GROUP_ID),
        workspaceId,
        name: DEFAULT_GROUP_NAME,
        description: "Lista Padrao",
      },
    });
  },
};

export default ContactService;
