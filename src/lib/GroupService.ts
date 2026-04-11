import { Contact, Group } from './types';

/**
 * Validation result for group operations
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * GroupService - Centralized operations for group management
 * 
 * This service encapsulates all business logic related to group operations,
 * separating concerns from UI components.
 */
export const GroupService = {
  /**
   * Get all contacts that belong to a specific group
   */
  getContactsInGroup(contacts: Contact[], groupId: string): Contact[] {
    return contacts.filter(c => c.groupIds.includes(groupId));
  },

  /**
   * Get all groups except the specified one (for "move to" operations)
   */
  getOtherGroups(groups: Group[], excludeGroupId: string): Group[] {
    return groups.filter(g => g.id !== excludeGroupId);
  },

  /**
   * Validate if a contact can be removed from a group
   */
  validateRemoveFromGroup(contact: Contact, groupId: string): ValidationResult {
    // Cannot remove from default group
    if (groupId === 'default') {
      return {
        valid: false,
        message: 'Não é possível remover contatos do grupo Geral',
      };
    }

    return { valid: true };
  },

  /**
   * Validate if a contact can be moved to another group
   */
  validateMoveToGroup(
    contact: Contact,
    fromGroupId: string,
    toGroupId: string,
    availableGroups: Group[]
  ): ValidationResult {
    // Check if target group exists
    const targetExists = availableGroups.some(g => g.id === toGroupId);
    if (!targetExists) {
      return {
        valid: false,
        message: 'Grupo de destino não existe',
      };
    }

    // Check if contact is already in target group
    if (contact.groupIds.includes(toGroupId) && !contact.groupIds.includes(fromGroupId)) {
      return {
        valid: false,
        message: 'Contato já está no grupo de destino',
      };
    }

    return { valid: true };
  },

  /**
   * Calculate new group IDs after removing from a group
   * If no groups remain, returns ['default']
   */
  calculateGroupIdsAfterRemove(contact: Contact, groupIdToRemove: string): string[] {
    const newGroupIds = contact.groupIds.filter(id => id !== groupIdToRemove);
    return newGroupIds.length > 0 ? newGroupIds : ['default'];
  },

  /**
   * Calculate new group IDs after moving to a new group
   * Removes from source group and adds to target group
   */
  calculateGroupIdsAfterMove(
    contact: Contact,
    fromGroupId: string,
    toGroupId: string
  ): string[] {
    const newGroupIds = contact.groupIds
      .filter(id => id !== fromGroupId)
      .concat(toGroupId);
    
    // Deduplicate
    return Array.from(new Set(newGroupIds));
  },

  /**
   * Check if contact will be moved to default after removal
   */
  willFallbackToDefault(contact: Contact, groupIdToRemove: string): boolean {
    const remainingGroups = contact.groupIds.filter(id => id !== groupIdToRemove);
    return remainingGroups.length === 0;
  },

  /**
   * Check if there are other groups available for moving
   */
  canMoveToOtherGroup(groups: Group[], currentGroupId: string): boolean {
    return groups.filter(g => g.id !== currentGroupId).length > 0;
  },
};

export default GroupService;
