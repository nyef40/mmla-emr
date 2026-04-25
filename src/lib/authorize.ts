import { rolePermissions } from "@/lib/rbac";
import type { Action } from "@/lib/rbac";

export type Role = keyof typeof rolePermissions;

export function can(role: string, resource: string, action: Action): boolean {
  return rolePermissions[role as Role]?.[resource]?.includes(action) ?? false;
}

/** For pt role: record must be owned by the user. Other roles are not restricted by ownership. */
export function mustMatchOwner(
  role: string,
  resourceOwnerId: number | null,
  sessionUserId: string
): boolean {
  if (role !== "pt") return true;
  if (resourceOwnerId == null) return false;
  return resourceOwnerId === parseInt(sessionUserId, 10);
}
