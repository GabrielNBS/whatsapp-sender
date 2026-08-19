import type { PrismaClient } from '@prisma/client';
import { DEFAULT_CONFIG_ID } from '@/constants/domain';
import {
  DEFAULT_OPT_OUT_FOOTER_ID,
  isOptOutFooterId,
  type OptOutFooterId,
} from '@/domain/opt-out-footer';
import { getWorkspaceScopedId } from '@/server/workspace';

export interface SettingsUpdate {
  defaultLink: string;
  defaultCTA: string;
  optOutFooterId: OptOutFooterId;
}

export class SettingsService {
  constructor(private readonly database: PrismaClient) {}

  async get(workspaceId: string) {
    const settings = await this.database.settings.findUnique({ where: { workspaceId } });
    return settings ?? {
      defaultLink: '',
      defaultCTA: '',
      optOutFooterId: DEFAULT_OPT_OUT_FOOTER_ID,
    };
  }

  async getOptOutFooterId(workspaceId: string): Promise<OptOutFooterId> {
    const settings = await this.database.settings.findUnique({
      where: { workspaceId },
      select: { optOutFooterId: true },
    });
    return isOptOutFooterId(settings?.optOutFooterId)
      ? settings.optOutFooterId
      : DEFAULT_OPT_OUT_FOOTER_ID;
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
