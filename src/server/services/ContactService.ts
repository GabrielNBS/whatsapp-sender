import { prisma } from "@/lib/db";
import { DEFAULT_GROUP_ID, DEFAULT_GROUP_NAME } from "@/constants/contacts";
import { normalizePhone } from "@/services/contacts/normalizePhone";
import { ContactGroupInput, ContactInput } from "../validators/contacts";
import { getCurrentWorkspaceId, getWorkspaceScopedId } from "../workspace";

function normalizeGroupIds(groupIds: string[] | undefined): string[] {
  const safeGroupIds = groupIds && groupIds.length > 0 ? groupIds : [DEFAULT_GROUP_ID];
  return Array.from(new Set(safeGroupIds));
}

export const ContactService = {
  async getSnapshot(workspaceId: string = getCurrentWorkspaceId()) {
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
      contacts: contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        number: contact.phone,
        groupIds: normalizeGroupIds(contact.groupMemberships.map((membership) => membership.groupId)),
      })),
    };
  },

  async clearContacts(workspaceId: string = getCurrentWorkspaceId()) {
    await this.ensureLocalDefaults(workspaceId);
    await prisma.contact.deleteMany({ where: { workspaceId } });
    return this.getSnapshot(workspaceId);
  },

  async createContact(data: ContactInput, workspaceId = getCurrentWorkspaceId()) {
    await this.ensureLocalDefaults(workspaceId);
    const phone = normalizePhone(data.number);
    const groupIds = normalizeGroupIds(data.groupIds);
    const validGroups = await prisma.contactGroup.count({
      where: { workspaceId, id: { in: groupIds } },
    });
    if (validGroups !== groupIds.length) throw new Error('Um ou mais grupos não pertencem ao workspace atual.');

    await prisma.contact.create({
      data: {
        id: data.id,
        workspaceId,
        name: data.name,
        phone,
        groupMemberships: { create: groupIds.map((groupId) => ({ groupId })) },
      },
    });
    return this.getSnapshot(workspaceId);
  },

  async updateContactGroups(contactId: string, groupIdsInput: string[], workspaceId = getCurrentWorkspaceId()) {
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
    return this.getSnapshot(workspaceId);
  },

  async deleteContact(contactId: string, workspaceId = getCurrentWorkspaceId()) {
    const deleted = await prisma.contact.deleteMany({ where: { id: contactId, workspaceId } });
    if (deleted.count === 0) throw new Error('Contato não encontrado no workspace atual.');
    return this.getSnapshot(workspaceId);
  },

  async createGroup(group: ContactGroupInput, workspaceId = getCurrentWorkspaceId()) {
    await this.ensureLocalDefaults(workspaceId);
    await prisma.contactGroup.create({
      data: { id: group.id, workspaceId, name: group.name, description: group.description },
    });
    return this.getSnapshot(workspaceId);
  },

  async deleteGroup(groupId: string, workspaceId = getCurrentWorkspaceId()) {
    const defaultGroupId = getWorkspaceScopedId(workspaceId, DEFAULT_GROUP_ID);
    if (groupId === defaultGroupId) throw new Error('O grupo padrão não pode ser removido.');

    await prisma.$transaction(async (tx) => {
      const affectedContacts = await tx.contact.findMany({
        where: { workspaceId, groupMemberships: { some: { groupId } } },
        select: { id: true, _count: { select: { groupMemberships: true } } },
      });
      const deleted = await tx.contactGroup.deleteMany({ where: { id: groupId, workspaceId } });
      if (deleted.count === 0) throw new Error('Grupo não encontrado no workspace atual.');
      const contactsWithoutGroups = affectedContacts.filter((contact) => contact._count.groupMemberships === 1);
      if (contactsWithoutGroups.length > 0) {
        await tx.contactGroupMembership.createMany({
          data: contactsWithoutGroups.map((contact) => ({ contactId: contact.id, groupId: defaultGroupId })),
        });
      }
    });
    return this.getSnapshot(workspaceId);
  },

  async importContacts(data: { group?: ContactGroupInput; contacts: ContactInput[] }, workspaceId = getCurrentWorkspaceId()) {
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
        })),
      });
      await tx.contactGroupMembership.createMany({
        data: data.contacts.flatMap((contact) =>
          normalizeGroupIds(contact.groupIds).map((groupId) => ({ contactId: contact.id, groupId })),
        ),
      });
    });
    return this.getSnapshot(workspaceId);
  },

  async ensureLocalDefaults(workspaceId: string = getCurrentWorkspaceId()) {
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
