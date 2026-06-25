import { Contact, Group } from "./types";

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export const GroupService = {
  getContactsInGroup(contacts: Contact[], groupId: string): Contact[] {
    return contacts.filter((contact) => contact.groupIds.includes(groupId));
  },

  getOtherGroups(groups: Group[], excludeGroupId: string): Group[] {
    return groups.filter((group) => group.id !== excludeGroupId);
  },

  validateRemoveFromGroup(contact: Contact, groupId: string): ValidationResult {
    if (groupId === "default") {
      return {
        valid: false,
        message: "Nao e possivel remover contatos do grupo Geral",
      };
    }

    if (!contact.groupIds.includes(groupId)) {
      return {
        valid: false,
        message: "Contato nao pertence ao grupo informado",
      };
    }

    return { valid: true };
  },

  validateMoveToGroup(
    contact: Contact,
    fromGroupId: string,
    toGroupId: string,
    availableGroups: Group[]
  ): ValidationResult {
    if (fromGroupId === toGroupId) {
      return {
        valid: false,
        message: "Grupo de origem e destino nao podem ser iguais",
      };
    }

    if (!contact.groupIds.includes(fromGroupId)) {
      return {
        valid: false,
        message: "Contato nao pertence ao grupo de origem",
      };
    }

    const targetExists = availableGroups.some((group) => group.id === toGroupId);
    if (!targetExists) {
      return {
        valid: false,
        message: "Grupo de destino nao existe",
      };
    }

    if (contact.groupIds.includes(toGroupId)) {
      return {
        valid: false,
        message: "Contato ja esta no grupo de destino",
      };
    }

    return { valid: true };
  },

  calculateGroupIdsAfterRemove(contact: Contact, groupIdToRemove: string): string[] {
    const newGroupIds = contact.groupIds.filter((id) => id !== groupIdToRemove);
    return newGroupIds.length > 0 ? newGroupIds : ["default"];
  },

  calculateGroupIdsAfterMove(contact: Contact, fromGroupId: string, toGroupId: string): string[] {
    const newGroupIds = contact.groupIds
      .filter((id) => id !== fromGroupId)
      .concat(toGroupId);

    return Array.from(new Set(newGroupIds));
  },

  willFallbackToDefault(contact: Contact, groupIdToRemove: string): boolean {
    const remainingGroups = contact.groupIds.filter((id) => id !== groupIdToRemove);
    return remainingGroups.length === 0;
  },

  canMoveToOtherGroup(groups: Group[], currentGroupId: string): boolean {
    return groups.some((group) => group.id !== currentGroupId);
  },
};

export default GroupService;
