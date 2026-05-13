import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pharmacies } from "@/db/schema";
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

  const setClause: Partial<typeof pharmacies.$inferInsert> & { updatedAt: Date } = { updatedAt: new Date() };
  if (b.name !== undefined)       setClause.name       = b.name?.trim() || undefined;
  if (b.vendorType !== undefined)  setClause.vendorType  = b.vendorType;
  if (b.street !== undefined)     setClause.street     = b.street?.trim() || null;
  if (b.city !== undefined)       setClause.city       = b.city?.trim() || null;
  if (b.state !== undefined)      setClause.state      = b.state?.trim() || "CA";
  if (b.zipCode !== undefined)    setClause.zipCode    = b.zipCode?.trim() || null;
  if (b.phone !== undefined)      setClause.phone      = b.phone?.trim() || null;
  if (b.fax !== undefined)        setClause.fax        = b.fax?.trim() || null;
  if (b.isActive !== undefined)   setClause.isActive   = Boolean(b.isActive);

  const [updated] = await db
    .update(pharmacies)
    .set(setClause)
    .where(eq(pharmacies.id, recordId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "pharmacies",
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
    .update(pharmacies)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(pharmacies.id, recordId));

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "pharmacies",
    recordId,
    details: { reason: "soft delete" },
    ip,
    userAgent,
  });

  return NextResponse.json({ message: "Pharmacy deactivated" });
}
