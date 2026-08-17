/**
 * Esta instancia e deliberadamente de uso pessoal e opera em um unico tenant.
 * A migracao para multi-tenant deve substituir este resolvedor por identidade autenticada.
 */
export const LOCAL_WORKSPACE_ID = "local";

/**
 * Ponto unico para o tenant pessoal atual. Servicos de dominio nao devem
 * codificar um workspace fora deste modulo.
 */
export function getCurrentWorkspaceId(): string {
  return LOCAL_WORKSPACE_ID;
}

export function getWorkspaceScopedId(workspaceId: string, localId: string): string {
  return workspaceId === LOCAL_WORKSPACE_ID ? localId : `${workspaceId}:${localId}`;
}
