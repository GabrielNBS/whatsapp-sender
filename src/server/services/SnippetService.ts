import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '@/lib/api-errors';

export interface SnippetCreate {
  trigger: string;
  content: string;
}

export class SnippetService {
  constructor(private readonly database: PrismaClient) {}

  list(workspaceId: string) {
    return this.database.snippet.findMany({
      where: { workspaceId },
      orderBy: { trigger: 'asc' },
    });
  }

  create(data: SnippetCreate, workspaceId: string) {
    const trigger = data.trigger.startsWith('/') ? data.trigger : `/${data.trigger}`;
    return this.database.snippet.create({
      data: { workspaceId, trigger, content: data.content },
    });
  }

  async delete(id: string, workspaceId: string) {
    const result = await this.database.snippet.deleteMany({ where: { id, workspaceId } });
    if (result.count === 0) {
      throw new NotFoundError('Snippet não encontrado.');
    }
  }
}

