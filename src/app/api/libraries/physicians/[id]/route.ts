import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { physicians } from "@/db/schema";
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

  // Explicit mapping — never spread raw request body into Drizzle set()
  // because the API response includes createdAt/updatedAt which Drizzle
  // rejects when received as ISO strings for a timestamp column.
  const setClause: Partial<typeof physicians.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };

  // isActive-only update (toggle active/inactive)
  if ("isActive" in b && Object.keys(b).length === 1) {
    setClause.isActive = Boolean(b.isActive);
  } else {
    if (b.firstName !== undefined) setClause.firstName = b.firstName?.trim() || undefined;
    if (b.middleName !== undefined) setClause.middleName = b.middleName?.trim() || null;
    if (b.lastName !== undefined)   setClause.lastName  = b.lastName?.trim() || undefined;
    if (b.title !== undefined)      setClause.title     = b.title?.trim() || null;
    if (b.street !== undefined)     setClause.street    = b.street?.trim() || null;
    if (b.suite !== undefined)      setClause.suite     = b.suite?.trim() || null;
    if (b.city !== undefined)       setClause.city      = b.city?.trim() || null;
    if (b.state !== undefined)      setClause.state     = b.state?.trim() || "CA";
    if (b.zipCode !== undefined)    setClause.zipCode   = b.zipCode?.trim() || null;
    if (b.phone !== undefined)      setClause.phone     = b.phone?.trim() || null;
    if (b.fax !== undefined)        setClause.fax       = b.fax?.trim() || null;
    if (b.email !== undefined)      setClause.email     = b.email?.trim() || null;
    if (b.upin !== undefined)       setClause.upin      = b.upin?.trim() || null;
    if (b.npi !== undefined)        setClause.npi       = b.npi?.trim() || null;
    if (b.pecosStatus !== undefined) setClause.pecosStatus = b.pecosStatus;
    if (b.partB !== undefined)      setClause.partB     = Boolean(b.partB);
    if (b.dme !== undefined)        setClause.dme       = Boolean(b.dme);
    if (b.hha !== undefined)        setClause.hha       = Boolean(b.hha);
    if (b.pmd !== undefined)        setClause.pmd       = Boolean(b.pmd);
    if (b.hospice !== undefined)    setClause.hospice   = Boolean(b.hospice);
    if (b.lastChecked !== undefined) setClause.lastChecked = b.lastChecked || null;
    if (b.protocol !== undefined)   setClause.protocol  = b.protocol?.trim() || null;
    if (b.licenseNumber !== undefined)    setClause.licenseNumber    = b.licenseNumber?.trim() || null;
    if (b.licenseState !== undefined)     setClause.licenseState     = b.licenseState?.trim() || "CA";
    if (b.licenseExpiration !== undefined) setClause.licenseExpiration = b.licenseExpiration || null;
    if (b.externalId !== undefined) setClause.externalId = b.externalId?.trim() || null;
    if (b.agencyId !== undefined)   setClause.agencyId  = b.agencyId?.trim() || null;
    if (b.physicianType !== undefined) setClause.physicianType = b.physicianType || null;
    if (b.isActive !== undefined)   setClause.isActive  = Boolean(b.isActive);
  }

  const [updated] = await db
    .update(physicians)
    .set(setClause)
    .where(eq(physicians.id, recordId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "update",
    tableName: "physicians",
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
    .update(physicians)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(physicians.id, recordId));

  const { ip, userAgent } = auditContext(request);
  await logAudit({
    userId: parseInt(session.user.id, 10),
    action: "delete",
    tableName: "physicians",
    recordId,
    details: { reason: "soft delete" },
    ip,
    userAgent,
  });

  return NextResponse.json({ message: "Physician deactivated" });
}
