// src/lib/audit.ts
import { db } from "@/db";
import { auditLog } from "@/db/schema";

/**
 * All DB mutations (insert/update/delete) must be followed by a logAudit call
 * with: userId, action ("create"|"update"|"delete"), tableName, recordId, details.
 */

export interface AuditLogParams {
  userId?: number | null;
  action: string;
  tableName?: string | null;
  recordId?: number | null;
  details?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}

/** Log an audit event (non-blocking). Call after every DB mutation. */
export async function logAudit({
  userId,
  action,
  tableName,
  recordId,
  details,
  ip,
  userAgent,
}: AuditLogParams) {
  try {
    await db.insert(auditLog).values({
      userId: userId ?? undefined,
      action,
      tableName: tableName ?? undefined,
      recordId: recordId ?? undefined,
      details: details != null ? (typeof details === "object" ? details : { value: details }) : undefined,
      ipAddress: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
    // Non-blocking - don't throw
  }
}