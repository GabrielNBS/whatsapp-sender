import type { PrismaClient } from '@prisma/client';
import { DEFAULT_CONFIG_ID } from '@/constants/domain';
import { getWorkspaceScopedId } from '@/server/workspace';

export interface SettingsUpdate {
  defaultLink: string;
  defaultCTA: string;
}

export class SettingsService {
  constructor(private readonly database: PrismaClient) {}

  async get(workspaceId: string) {
    const settings = await this.database.settings.findUnique({ where: { workspaceId } });
    return settings ?? { defaultLink: '', defaultCTA: '' };
  }

  async update(data: SettingsUpdate, workspaceId: string) {
    return this.database.settings.upsert({
      where: { workspaceId },
      update: data,
      create: {
        id: getWorkspaceScopedId(workspaceId, DEFAULT_CONFIG_ID),
        workspaceId,
        ...data,
      },
    });
  }
}

