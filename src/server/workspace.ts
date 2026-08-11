export const LOCAL_WORKSPACE_ID = "local";

/**
 * Single replacement point for the future authenticated workspace resolver.
 * Domain services must not hard-code a workspace outside this module.
 */
export function getCurrentWorkspaceId(): string {
  return LOCAL_WORKSPACE_ID;
}

export function getWorkspaceScopedId(workspaceId: string, localId: string): string {
  return workspaceId === LOCAL_WORKSPACE_ID ? localId : `${workspaceId}:${localId}`;
}
