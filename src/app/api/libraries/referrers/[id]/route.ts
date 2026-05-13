import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { referrers } from "@/db/schema";
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
  const b = await request.json();

  const setClause: Partial<typeof referrers.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() };

  if (b.firstName !== undefined)   setClause.firstName   = b.firstName?.trim() || undefined;
  if (b.lastName !== undefined)    setClause.lastName    = b.lastName?.trim() || undefined;
  if (b.companyName !== undefined) setClause.companyName = b.companyName?.trim() || null;
  if (b.title !== undefined)       setClause.title       = b.title?.trim() || null;
  if (b.street !== undefined)      setClause.street      = b.street?.trim() || null;
  if (b.suite !== undefined)       setClause.suite       = b.suite?.trim() || null;
  if (b.city !== undefined)        setClause.city        = b.city?.trim() || null;
  if (b.state !== undefined)       setClause.state       = b.state?.trim() || "CA";
  if (b.zipCode !== undefined)     setClause.zipCode     = b.zipCode?.trim() || null;
  if (b.phone !== undefined)       setClause.phone       = b.phone?.trim() || null;
  if (b.fax !== undefined)         setClause.fax         = b.fax?.trim() || null;
  if (b.email !== undefined)       setClause.email       = b.email?.trim() || null;
  if (b.externalId !== undefined)  setClause.externalId  = b.externalId?.trim() || null;
  if (b.protocol !== undefined)    setClause.protocol    = b.protocol?.trim() || null;
  if (b.isActive !== undefined)    setClause.isActive    = Boolean(b.isActive);

  const [updated] = await db
    .update(referrers)
    .set(setClause)
    .where(eq(referrers.id, recordId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "referrers",
    recordId,
    details: { changes: b },
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

  await db
    .update(referrers)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(referrers.id, recordId));

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "referrers",
    recordId,
    details: { reason: "soft delete" },
    ip,
    userAgent,
  });

  return NextResponse.json({ message: "Referrer deactivated" });
}
