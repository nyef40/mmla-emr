import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { icdCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { logAudit } from "@/lib/audit";
import { auditContext } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const { id } = await params;
  const recordId = parseInt(id, 10);
  const body = await request.json();

  const setClause: Partial<typeof icdCodes.$inferInsert> = {};
  if (body.isActive !== undefined) setClause.isActive = Boolean(body.isActive);
  if (body.displayOrder !== undefined) setClause.displayOrder = parseInt(body.displayOrder, 10);
  if (body.description !== undefined) setClause.description = body.description?.trim() || undefined;
  if (body.category !== undefined) setClause.category = body.category?.trim() || "Other";

  const [updated] = await db
    .update(icdCodes)
    .set(setClause)
    .where(eq(icdCodes.id, recordId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "icd_codes",
    recordId,
    details: { changes: body },
    ip,
    userAgent,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const { id } = await params;
  const recordId = parseInt(id, 10);

  await db.update(icdCodes).set({ isActive: false }).where(eq(icdCodes.id, recordId));

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "icd_codes",
    recordId,
    details: { reason: "soft delete" },
    ip,
    userAgent,
  });

  return NextResponse.json({ message: "ICD code deactivated" });
}
